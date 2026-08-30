import os
import re
import time
import cv2
import requests

from ultralytics import YOLO


# =========================================================
# Configuration
# =========================================================

CAMERA_ID = os.getenv(
    "TRAFFIC_CAMERA_ID",
    "CAM-001"
)

LIVE_UPDATE_URL = os.getenv(
    "LIVE_UPDATE_URL",
    "http://localhost:5000/api/live-update"
)

HEADLESS = (
    os.getenv(
        "TRAFFIC_HEADLESS",
        "false"
    ).lower()
    == "true"
)

FRAME_SKIP = int(
    os.getenv(
        "TRAFFIC_FRAME_SKIP",
        "1"
    )
)

ANNOTATED_FRAME_INTERVAL = int(
    os.getenv(
        "ANNOTATED_FRAME_INTERVAL",
        "5"
    )
)

LIVE_UPDATE_INTERVAL = float(
    os.getenv(
        "LIVE_UPDATE_INTERVAL",
        "1.0"
    )
)


# =========================================================
# Base Paths
# =========================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

BACKEND_DIR = os.path.dirname(
    BASE_DIR
)

PROJECT_DIR = os.path.dirname(
    BACKEND_DIR
)


# =========================================================
# Annotated Output
# =========================================================

safe_camera_id = re.sub(
    r"[^a-zA-Z0-9_-]",
    "_",
    CAMERA_ID
)

ANNOTATED_FRAME_PATH = os.path.join(
    BASE_DIR,
    f"live_camera_{safe_camera_id}.jpg"
)

ANNOTATED_TEMP_PATH = os.path.join(
    BASE_DIR,
    f".live_camera_{safe_camera_id}.tmp.jpg"
)


# =========================================================
# Load AI Models
# =========================================================

vehicle_model = YOLO(
    os.path.join(
        BASE_DIR,
        "ai_models",
        "yolov8n.pt"
    )
)

accident_model = YOLO(
    os.path.join(
        BASE_DIR,
        "ai_models",
        "accident_detector.pt"
    )
)


# =========================================================
# Camera Source
# =========================================================

raw_source = os.getenv(
    "TRAFFIC_CAMERA_SOURCE",
    "0"
)


def resolve_camera_source(source):
    """
    Resolve:
      0
      1
      video paths
      absolute paths
      RTSP/HTTP URLs
    """

    source = str(source).strip()

    # Numeric webcam
    if source.isdigit():
        return int(source)

    # Absolute path
    if os.path.isabs(source):
        return source

    # Project-relative path
    project_path = os.path.join(
        PROJECT_DIR,
        source
    )

    if os.path.exists(project_path):
        return project_path

    # Backend-relative path
    backend_path = os.path.join(
        BACKEND_DIR,
        source
    )

    if os.path.exists(backend_path):
        return backend_path

    # URL / RTSP / fallback
    return source


camera_source = resolve_camera_source(
    raw_source
)


# =========================================================
# Detect Source Type
# =========================================================

IS_FILE_SOURCE = (
    isinstance(
        camera_source,
        str
    )
    and not camera_source.lower().startswith(
        (
            "rtsp://",
            "rtmp://",
            "http://",
            "https://"
        )
    )
    and os.path.isfile(
        camera_source
    )
)

IS_WEBCAM_SOURCE = isinstance(
    camera_source,
    int
)


# =========================================================
# Startup Information
# =========================================================

print(
    "========================================"
)

print(
    "🚦 TrafficMind AI Live Detector"
)

print(
    f"Camera ID              : {CAMERA_ID}"
)

print(
    f"Source                 : {camera_source}"
)

print(
    f"Source Type            : "
    f"{'VIDEO FILE' if IS_FILE_SOURCE else 'WEBCAM/STREAM'}"
)

print(
    f"Headless Mode          : {HEADLESS}"
)

print(
    f"Frame Skip             : {FRAME_SKIP}"
)

print(
    f"Backend Update Interval: "
    f"{LIVE_UPDATE_INTERVAL}s"
)

print(
    f"Annotated Output       : "
    f"{ANNOTATED_FRAME_PATH}"
)

print(
    f"Backend                : "
    f"{LIVE_UPDATE_URL}"
)

print(
    "========================================"
)


# =========================================================
# Open Camera / Video
# =========================================================

def open_capture():

    capture = cv2.VideoCapture(
        camera_source,
        cv2.CAP_DSHOW
        if IS_WEBCAM_SOURCE
        else 0
    )

    return capture


cap = open_capture()

print(
    f"Camera opened: {cap.isOpened()}"
)

if not cap.isOpened():

    print(
        f"❌ Unable to open source: "
        f"{camera_source}"
    )

    cap.release()

    raise SystemExit(1)


# =========================================================
# Camera Warm-up
# =========================================================

print(
    "🔄 Warming up camera..."
)

warmup_success = False

for attempt in range(10):

    success, frame = cap.read()

    if (
        success
        and frame is not None
    ):

        warmup_success = True

        print(
            f"✅ Camera frame ready "
            f"(attempt {attempt + 1})"
        )

        break

    print(
        f"⚠️ Camera frame retry "
        f"{attempt + 1}/10"
    )


# =========================================================
# If Warm-up Failed
# =========================================================

if not warmup_success:

    if IS_FILE_SOURCE:

        print(
            "🔄 Demo video could not "
            "provide a frame. Restarting..."
        )

        cap.release()

        cap = open_capture()

        success, frame = cap.read()

        if not success:

            print(
                "❌ Demo video could not be started."
            )

            cap.release()

            raise SystemExit(1)

        warmup_success = True

        print(
            "✅ Demo video restarted."
        )

    else:

        print(
            "❌ Camera could not provide "
            "a valid frame."
        )

        cap.release()

        if not HEADLESS:
            cv2.destroyAllWindows()

        raise SystemExit(1)


# =========================================================
# Vehicle Classes
# =========================================================

vehicle_classes = [
    "car",
    "truck",
    "bus",
    "motorcycle",
]


print(
    f"🟢 TrafficMind AI started | "
    f"Camera: {CAMERA_ID}"
)


# =========================================================
# Runtime State
# =========================================================

frame_counter = 0

consecutive_read_failures = 0

last_backend_update = 0.0


# =========================================================
# Main Loop
# =========================================================

while True:

    # -----------------------------------------------------
    # Read Frame
    # -----------------------------------------------------

    success, frame = cap.read()

    # -----------------------------------------------------
    # Demo video reached EOF
    # -----------------------------------------------------

    if (
        not success
        or frame is None
    ):

        # ================================================
        # VIDEO FILE → RESTART
        # ================================================

        if IS_FILE_SOURCE:

            print(
                "🔄 Demo video reached the end."
            )

            cap.release()

            time.sleep(0.5)

            cap = open_capture()

            if not cap.isOpened():

                print(
                    "❌ Failed to reopen "
                    "demo video."
                )

                break

            # Warm-up after restart
            restart_success = False

            for attempt in range(10):

                restart_ok, restart_frame = (
                    cap.read()
                )

                if (
                    restart_ok
                    and restart_frame is not None
                ):

                    frame = restart_frame

                    restart_success = True

                    print(
                        "🔁 Demo video "
                        "restarted successfully."
                    )

                    break

                time.sleep(0.1)

            if not restart_success:

                print(
                    "❌ Demo video could not "
                    "restart."
                )

                break

            consecutive_read_failures = 0

            # Continue processing the
            # first restarted frame.
            success = True

        # ================================================
        # WEBCAM / STREAM → normal retry
        # ================================================

        else:

            consecutive_read_failures += 1

            print(
                f"⚠️ Camera frame read failed "
                f"({consecutive_read_failures}/10)"
            )

            if (
                consecutive_read_failures
                >= 10
            ):

                print(
                    "❌ Camera frame unavailable "
                    "for too long."
                )

                break

            continue


    consecutive_read_failures = 0

    frame_counter += 1


    # -----------------------------------------------------
    # Optional Frame Skip
    # -----------------------------------------------------

    if (
        FRAME_SKIP > 1
        and (
            frame_counter
            % FRAME_SKIP
            != 0
        )
    ):

        continue


    # =====================================================
    # Vehicle Detection
    # =====================================================

    vehicle_results = vehicle_model(
        frame,
        verbose=False
    )


    # =====================================================
    # Accident Detection
    # =====================================================

    accident_results = accident_model(
        frame,
        verbose=False
    )


    # =====================================================
    # Detection State
    # =====================================================

    annotated_frame = frame.copy()

    vehicle_count = 0

    confidence_values = []

    accident_detected = False

    accident_severity = "NONE"

    emergency_detected = False


    # =====================================================
    # Vehicle Processing
    # =====================================================

    for result in vehicle_results:

        annotated_frame = result.plot()

        for box in result.boxes:

            cls_id = int(
                box.cls[0]
            )

            class_name = (
                vehicle_model.names[
                    cls_id
                ]
            )

            confidence = float(
                box.conf[0]
            )

            if (
                class_name
                in vehicle_classes
            ):

                vehicle_count += 1

                confidence_values.append(
                    confidence
                )


    # =====================================================
    # Confidence Metrics
    # =====================================================

    if confidence_values:

        average_confidence = (
            sum(
                confidence_values
            )
            / len(
                confidence_values
            )
        )

        max_confidence = max(
            confidence_values
        )

    else:

        average_confidence = 0.0

        max_confidence = 0.0


    # =====================================================
    # Accident Processing
    # =====================================================

    for result in accident_results:

        for box in result.boxes:

            cls_id = int(
                box.cls[0]
            )

            class_name = (
                accident_model.names[
                    cls_id
                ]
            )

            confidence = float(
                box.conf[0]
            )

            if (
                class_name == "Accident"
                and confidence >= 0.90
            ):

                accident_detected = True

                accident_severity = "HIGH"

                x1, y1, x2, y2 = map(
                    int,
                    box.xyxy[0]
                )

                cv2.rectangle(
                    annotated_frame,
                    (x1, y1),
                    (x2, y2),
                    (0, 0, 255),
                    3
                )

                cv2.putText(
                    annotated_frame,
                    (
                        f"ACCIDENT "
                        f"{confidence * 100:.1f}%"
                    ),
                    (
                        x1,
                        max(
                            y1 - 10,
                            25
                        )
                    ),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.8,
                    (0, 0, 255),
                    2
                )


    # =====================================================
    # Traffic Logic
    # =====================================================

    if vehicle_count < 5:

        congestion = "LOW"

        recommendation = (
            "Traffic Flow Normal"
        )

        signal_time = 15

    elif vehicle_count < 15:

        congestion = "MEDIUM"

        recommendation = (
            "Monitor Traffic"
        )

        signal_time = 30

    else:

        congestion = "HIGH"

        recommendation = (
            "Deploy Traffic Officers"
        )

        signal_time = 60


    # =====================================================
    # Emergency Priority
    # =====================================================

    if accident_detected:

        emergency_detected = True

        recommendation = (
            "Activate Emergency Response"
        )

        signal_time = 90


    # =====================================================
    # Draw AI Overlay
    # =====================================================

    cv2.putText(
        annotated_frame,
        f"Camera : {CAMERA_ID}",
        (20, 35),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (255, 255, 255),
        2
    )

    cv2.putText(
        annotated_frame,
        (
            f"Vehicles : "
            f"{vehicle_count}"
        ),
        (20, 70),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (0, 255, 0),
        2
    )

    cv2.putText(
        annotated_frame,
        (
            f"Congestion : "
            f"{congestion}"
        ),
        (20, 110),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (0, 255, 255),
        2
    )

    cv2.putText(
        annotated_frame,
        (
            f"Confidence : "
            f"{average_confidence * 100:.1f}%"
        ),
        (20, 150),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (255, 255, 0),
        2
    )

    cv2.putText(
        annotated_frame,
        recommendation,
        (20, 185),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (255, 255, 0),
        2
    )

    cv2.putText(
        annotated_frame,
        (
            f"Signal Time : "
            f"{signal_time}s"
        ),
        (20, 220),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (0, 255, 0),
        2
    )


    # =====================================================
    # Accident Banner
    # =====================================================

    if accident_detected:

        cv2.rectangle(
            annotated_frame,
            (10, 250),
            (620, 320),
            (0, 0, 255),
            -1
        )

        cv2.putText(
            annotated_frame,
            "ACCIDENT DETECTED",
            (25, 285),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (255, 255, 255),
            3
        )

        cv2.putText(
            annotated_frame,
            (
                f"Severity : "
                f"{accident_severity}"
            ),
            (25, 310),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (255, 255, 255),
            2
        )


    # =====================================================
    # Save Latest Annotated Frame
    # =====================================================

    if (
        frame_counter
        % ANNOTATED_FRAME_INTERVAL
        == 0
    ):

        try:

            saved = cv2.imwrite(
                ANNOTATED_TEMP_PATH,
                annotated_frame,
                [
                    cv2.IMWRITE_JPEG_QUALITY,
                    85,
                ]
            )

            if saved:

                os.replace(
                    ANNOTATED_TEMP_PATH,
                    ANNOTATED_FRAME_PATH
                )

            else:

                print(
                    "⚠️ Failed to write "
                    "annotated frame"
                )

        except OSError as error:

            print(
                "⚠️ Annotated frame save error:",
                error
            )


    # =====================================================
    # Backend Payload
    # =====================================================

    payload = {
        "cameraId":
            CAMERA_ID,

        "vehicleCount":
            vehicle_count,

        "congestion":
            congestion,

        "averageConfidence":
            average_confidence,

        "maxConfidence":
            max_confidence,

        "recommendation":
            recommendation,

        "emergencyDetected":
            emergency_detected,

        "accidentDetected":
            accident_detected,

        "accidentSeverity":
            accident_severity,
    }


    # =====================================================
    # Throttled Backend Update
    # =====================================================

    current_time = time.monotonic()

    if (
        current_time
        - last_backend_update
        >= LIVE_UPDATE_INTERVAL
    ):

        try:

            response = requests.post(
                LIVE_UPDATE_URL,
                json=payload,
                timeout=3
            )

            last_backend_update = (
                current_time
            )

            if response.status_code == 200:

                print(
                    "✅ Live update | "
                    f"Camera={CAMERA_ID} | "
                    f"Vehicles={vehicle_count} | "
                    f"Congestion={congestion} | "
                    f"Accident={accident_detected}"
                )

            else:

                print(
                    "⚠️ Live update failed:",
                    response.status_code,
                    response.text
                )

        except requests.RequestException as error:

            last_backend_update = (
                current_time
            )

            print(
                "⚠️ Live update error:",
                error
            )


    # =====================================================
    # Browser / Local OpenCV View
    # =====================================================

    if not HEADLESS:

        cv2.imshow(
            "TrafficMind AI - Live CCTV",
            annotated_frame
        )

        key = (
            cv2.waitKey(1)
            & 0xFF
        )

        if key == ord("q"):

            print(
                "🛑 Stop requested by user"
            )

            break


# =========================================================
# Cleanup
# =========================================================

cap.release()

if not HEADLESS:

    cv2.destroyAllWindows()

print(
    f"🔴 Camera {CAMERA_ID} stopped"
)