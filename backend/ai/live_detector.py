import os
import cv2
import requests
from ultralytics import YOLO

# ==============================
# Load AI Models
# ==============================

vehicle_model = YOLO(
    os.path.join(
        os.path.dirname(__file__),
        "ai_models",
        "yolov8n.pt"
    )
)

accident_model = YOLO(
    os.path.join(
        os.path.dirname(__file__),
        "ai_models",
        "accident_detector.pt"
    )
)

# ==============================
# Webcam
# ==============================

cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)

vehicle_classes = [
    "car",
    "truck",
    "bus",
    "motorcycle"
]

while True:

    success, frame = cap.read()

    if not success:
        break

    # ------------------------------
    # Run both AI models
    # ------------------------------

    vehicle_results = vehicle_model(
        frame,
        verbose=False
    )

    accident_results = accident_model(
        frame,
        verbose=False
    )

    annotated_frame = frame.copy()

    vehicle_count = 0
    accident_detected = False
    accident_severity = "NONE"

    # ------------------------------
    # Vehicle Detection
    # ------------------------------

    for result in vehicle_results:

        annotated_frame = result.plot()

        for box in result.boxes:

            cls_id = int(box.cls[0])

            class_name = vehicle_model.names[cls_id]

            if class_name in vehicle_classes:
                vehicle_count += 1

    # ------------------------------
    # Accident Detection
    # ------------------------------

    for result in accident_results:

        for box in result.boxes:

            cls_id = int(box.cls[0])

            class_name = accident_model.names[cls_id]

            confidence = float(box.conf[0])

            if class_name == "Accident" and confidence > 0.90:

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
                    "ACCIDENT",
                    (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.8,
                    (0, 0, 255),
                    2
                )

    # ------------------------------
    # Smart Signal Logic
    # ------------------------------

    if vehicle_count < 5:

        congestion = "LOW"
        recommendation = "Traffic Flow Normal"
        signal_time = 15

    elif vehicle_count < 15:

        congestion = "MEDIUM"
        recommendation = "Monitor Traffic"
        signal_time = 30

    else:

        congestion = "HIGH"
        recommendation = "Deploy Traffic Officers"
        signal_time = 60

    # ------------------------------
    # Send Live Data
    # ------------------------------

    try:

        requests.post(
            "http://localhost:5000/api/live-update",
            json={
                "vehicleCount": vehicle_count,
                "congestion": congestion,
                "recommendation": recommendation,
                "accidentDetected": accident_detected,
                "accidentSeverity": accident_severity
            },
            timeout=2
        )

    except Exception:
        pass

    # ------------------------------
    # Draw Information
    # ------------------------------

    cv2.putText(
        annotated_frame,
        f"Vehicles : {vehicle_count}",
        (20, 40),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (0, 255, 0),
        2
    )

    cv2.putText(
        annotated_frame,
        f"Congestion : {congestion}",
        (20, 80),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (0, 255, 255),
        2
    )

    cv2.putText(
        annotated_frame,
        recommendation,
        (20, 120),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (255, 255, 0),
        2
    )

    cv2.putText(
        annotated_frame,
        f"Signal Time : {signal_time}s",
        (20, 160),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (0, 255, 0),
        2
    )

    # ------------------------------
    # Accident Banner
    # ------------------------------

    if accident_detected:

        cv2.rectangle(
            annotated_frame,
            (10, 190),
            (620, 260),
            (0, 0, 255),
            -1
        )

        cv2.putText(
            annotated_frame,
            "ACCIDENT DETECTED",
            (25, 225),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (255, 255, 255),
            3
        )

        cv2.putText(
            annotated_frame,
            f"Severity : {accident_severity}",
            (25, 250),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (255, 255, 255),
            2
        )

    # ------------------------------
    # Show Window
    # ------------------------------

    cv2.imshow(
        "TrafficMind AI - Live CCTV",
        annotated_frame
    )

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()