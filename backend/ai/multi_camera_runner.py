

import numpy as np
import os
import re
import base64
import json
import time
import threading
import subprocess
from dataclasses import dataclass
from typing import Optional, Union
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from concurrent.futures import ThreadPoolExecutor

import cv2
import requests
from ultralytics import YOLO

from dotenv import load_dotenv, dotenv_values

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

BACKEND_DIR = os.path.dirname(
    BASE_DIR
)

PERFORMANCE_ENV_PATH = os.path.join(BACKEND_DIR, ".env")
load_dotenv(PERFORMANCE_ENV_PATH)

# The backend/.env file is the source of truth for these local performance
# settings. This avoids an old inherited PowerShell environment variable
# silently overriding the values the operator has just configured.
_PERFORMANCE_ENV = dotenv_values(PERFORMANCE_ENV_PATH)
for _performance_key in (
    "TRAFFIC_AI_NORMAL_INTERVAL",
    "TRAFFIC_AI_HIGH_CONGESTION_INTERVAL",
    "TRAFFIC_AI_HIGH_RISK_INTERVAL",
):
    _performance_value = _PERFORMANCE_ENV.get(_performance_key)
    if _performance_value is not None and str(_performance_value).strip():
        os.environ[_performance_key] = str(_performance_value).strip()


# =========================================================
# TrafficMind AI - Single Process Multi-Camera AI
# + Live MJPEG YOLO Streaming
# =========================================================


# =========================================================
# Configuration
# =========================================================

BACKEND_URL = os.getenv(
    "LIVE_UPDATE_URL",
    "http://localhost:5000/api/live-update",
)

BACKEND_API_ROOT = (
    BACKEND_URL.split("/api/", 1)[0]
    + "/api"
)

HEADLESS = (
    os.getenv(
        "TRAFFIC_HEADLESS",
        "true",
    ).lower()
    == "true"
)

FRAME_SKIP = max(
    1,
    int(
        os.getenv(
            "TRAFFIC_FRAME_SKIP",
            "2",
        )
    ),
)

LIVE_UPDATE_INTERVAL = max(
    1.0,
    float(
        os.getenv(
            "LIVE_UPDATE_INTERVAL",
            "2.0",
        )
    ),
)

# =========================================================
# Phase 27 — Adaptive AI Inference
# =========================================================
#
# The camera stream remains continuous. Only expensive AI
# inference is scheduled adaptively so CPU-only systems remain
# responsive when many cameras are active.
#
PHASE27_ADAPTIVE_AI_ENABLED = (
    os.getenv(
        "TRAFFIC_ADAPTIVE_AI_ENABLED",
        "true",
    ).lower()
    == "true"
)

PHASE27_EMERGENCY_INTERVAL = max(
    0.5,
    float(
        os.getenv(
            "TRAFFIC_AI_EMERGENCY_INTERVAL",
            "0.75",
        )
    ),
)

PHASE27_HIGH_RISK_INTERVAL = max(
    0.75,
    float(
        os.getenv(
            "TRAFFIC_AI_HIGH_RISK_INTERVAL",
            "1.0",
        )
    ),
)

PHASE27_HIGH_CONGESTION_INTERVAL = max(
    1.0,
    float(
        os.getenv(
            "TRAFFIC_AI_HIGH_CONGESTION_INTERVAL",
            "1.5",
        )
    ),
)

PHASE27_NORMAL_INTERVAL = max(
    2.0,
    float(
        os.getenv(
            "TRAFFIC_AI_NORMAL_INTERVAL",
            "2.5",
        )
    ),
)

# Keep heavier specialist models alive on normal cameras, but
# make them more responsive when the camera becomes important.
PHASE27_EMERGENCY_AI_ACTIVE_INTERVAL = max(
    0.5,
    float(
        os.getenv(
            "TRAFFIC_EMERGENCY_AI_ACTIVE_INTERVAL",
            "0.75",
        )
    ),
)

PHASE27_EMERGENCY_AI_HIGH_RISK_INTERVAL = max(
    0.75,
    float(
        os.getenv(
            "TRAFFIC_EMERGENCY_AI_HIGH_RISK_INTERVAL",
            "1.5",
        )
    ),
)

PHASE27_EMERGENCY_AI_HIGH_CONGESTION_INTERVAL = max(
    1.0,
    float(
        os.getenv(
            "TRAFFIC_EMERGENCY_AI_HIGH_CONGESTION_INTERVAL",
            "2.25",
        )
    ),
)

PHASE27_EMERGENCY_AI_NORMAL_INTERVAL = max(
    1.0,
    float(
        os.getenv(
            "TRAFFIC_EMERGENCY_AI_NORMAL_INTERVAL",
            "3.0",
        )
    ),
)

PHASE27_ACCIDENT_AI_ACTIVE_INTERVAL = max(
    0.75,
    float(
        os.getenv(
            "TRAFFIC_ACCIDENT_AI_ACTIVE_INTERVAL",
            "1.0",
        )
    ),
)

PHASE27_ACCIDENT_AI_HIGH_RISK_INTERVAL = max(
    0.75,
    float(
        os.getenv(
            "TRAFFIC_ACCIDENT_AI_HIGH_RISK_INTERVAL",
            "1.25",
        )
    ),
)

PHASE27_ACCIDENT_AI_HIGH_CONGESTION_INTERVAL = max(
    1.0,
    float(
        os.getenv(
            "TRAFFIC_ACCIDENT_AI_HIGH_CONGESTION_INTERVAL",
            "1.75",
        )
    ),
)

PHASE27_ACCIDENT_AI_NORMAL_INTERVAL = max(
    1.0,
    float(
        os.getenv(
            "TRAFFIC_ACCIDENT_AI_NORMAL_INTERVAL",
            "2.5",
        )
    ),
)

IMG_SIZE = max(
    320,
    int(
        os.getenv(
            "TRAFFIC_IMG_SIZE",
            "640",
        )
    ),
)

VEHICLE_CONFIDENCE = float(
    os.getenv(
        "TRAFFIC_VEHICLE_CONFIDENCE",
        "0.25",
    )
)

ACCIDENT_CONFIDENCE = float(
    os.getenv(
        "TRAFFIC_ACCIDENT_CONFIDENCE",
        "0.50",
    )
)

# Accident persistence / temporal smoothing.
# Keep a confirmed accident alive briefly when a later analysis misses it.
ACCIDENT_MAX_MISSES = max(
    0,
    int(
        os.getenv(
            "TRAFFIC_ACCIDENT_MAX_MISSES",
            "2",
        )
    ),
)

# Accident AI is heavier than vehicle detection.
# Run it periodically so the live YOLO stream stays responsive.
ACCIDENT_ANALYSIS_INTERVAL = max(
    1.0,
    float(
        os.getenv(
            "TRAFFIC_ACCIDENT_ANALYSIS_INTERVAL",
            "2.0",
        )
    ),
)

EMERGENCY_ANALYSIS_INTERVAL = max(
    1.0,
    float(
        os.getenv(
            "TRAFFIC_EMERGENCY_ANALYSIS_INTERVAL",
            "3.0",
        )
    ),
)

EMERGENCY_CONFIDENCE = max(
    0.0,
    min(
        1.0,
        float(
            os.getenv(
                "TRAFFIC_EMERGENCY_CONFIDENCE",
                "0.55",
            )
        ),
    ),
)

EMERGENCY_HANDOFF_LOOKUP_INTERVAL = max(
    1.0,
    float(
        os.getenv(
            "TRAFFIC_EMERGENCY_HANDOFF_LOOKUP_INTERVAL",
            "2.0",
        )
    ),
)

EMERGENCY_PROPAGATION_INTERVAL = max(
    1.0,
    float(
        os.getenv(
            "TRAFFIC_EMERGENCY_PROPAGATION_INTERVAL",
            "5.0",
        )
    ),
)

EMERGENCY_REID_MIN_SCORE = max(
    0.0,
    min(
        1.0,
        float(
            os.getenv(
                "TRAFFIC_EMERGENCY_REID_MIN_SCORE",
                "0.72",
            )
        ),
    ),
)

# Phase 20 — lost-vehicle recovery polling.
# Keep this lightweight because the AI runner is CPU-only.
EMERGENCY_RECOVERY_POLL_INTERVAL = max(
    1.0,
    float(
        os.getenv(
            "TRAFFIC_EMERGENCY_RECOVERY_POLL_INTERVAL",
            "3.0",
        )
    ),
)

# The edge MJPEG preview is unauthenticated in this legacy runner. Keep it
# loopback-only by default; do not expose port 5050 to the LAN or internet.
STREAM_HOST = os.getenv(
    "TRAFFIC_STREAM_HOST",
    "127.0.0.1",
)

STREAM_PORT = int(
    os.getenv(
        "TRAFFIC_STREAM_PORT",
        "5050",
    )
)


# =========================================================
# Paths
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

VEHICLE_MODEL_PATH = os.path.join(
    BASE_DIR,
    "ai_models",
    "yolov8n.pt",
)

ACCIDENT_MODEL_PATH = os.path.join(
    BASE_DIR,
    "ai_models",
    "accident_detector.pt",
)


EMERGENCY_MODEL_PATH = os.path.join(
    BASE_DIR,
    "ai_models",
    "emergency.pt",
)


# =========================================================
# Camera Configuration
# =========================================================
# Camera sources are now loaded from MongoDB through the
# protected backend camera-config endpoint.
#
# The backend returns active + AI-enabled cameras, so adding
# a new camera in Admin / Main Officer camera management will
# make it available to the AI runner without hardcoding it here.

AI_CAMERA_CONFIG_URL = os.getenv(
    "AI_CAMERA_CONFIG_URL",
    "http://localhost:5000/api/ai-camera-config",
)

INTERNAL_AI_KEY = os.getenv(
    "INTERNAL_AI_KEY",
    "",
)

# =========================================================
# Phase 28 — Dynamic Real Camera Integration
# =========================================================
#
# The AI runner re-reads the backend camera registry while
# running. This means a newly registered real CCTV can enter
# the AI runner without hardcoding its source here.
#
PHASE28_CAMERA_REFRESH_ENABLED = (
    os.getenv(
        "TRAFFIC_PHASE28_CAMERA_REFRESH_ENABLED",
        "true",
    ).lower()
    == "true"
)

PHASE28_CAMERA_REFRESH_INTERVAL = max(
    5.0,
    float(
        os.getenv(
            "TRAFFIC_PHASE28_CAMERA_REFRESH_INTERVAL",
            "30.0",
        )
    ),
)

last_camera_config_refresh = 0.0

# =========================================================
# Phase 27/28 — RTSP Reliability
# =========================================================
#
# Real CCTV/RTSP streams can occasionally drop or the FFmpeg
# reader can terminate. The watchdog below reconnects without
# stopping the whole multi-camera AI process.
#
RTSP_RECONNECT_COOLDOWN = max(
    2.0,
    float(
        os.getenv(
            "TRAFFIC_RTSP_RECONNECT_COOLDOWN",
            "5.0",
        )
    ),
)

RTSP_STALE_FRAME_TIMEOUT = max(
    5.0,
    float(
        os.getenv(
            "TRAFFIC_RTSP_STALE_FRAME_TIMEOUT",
            "8.0",
        )
    ),
)

# Allow a freshly started FFmpeg process time to establish an RTSP session
# before the watchdog treats an empty stream as failed.
RTSP_CONNECT_GRACE_PERIOD = max(
    RTSP_RECONNECT_COOLDOWN,
    float(
        os.getenv(
            "TRAFFIC_RTSP_CONNECT_GRACE_PERIOD",
            "20.0",
        )
    ),
)


def load_camera_configs():
    if not INTERNAL_AI_KEY:
        raise RuntimeError(
            "INTERNAL_AI_KEY is not configured in backend/.env"
        )

    try:
        response = requests.get(
            AI_CAMERA_CONFIG_URL,
            headers={
                "x-internal-ai-key": INTERNAL_AI_KEY,
            },
            timeout=10,
        )
    except requests.RequestException as error:
        raise RuntimeError(
            f"Failed to load camera configuration: {error}"
        ) from error

    if response.status_code != 200:
        raise RuntimeError(
            "Camera configuration request failed "
            f"({response.status_code}): {response.text}"
        )

    try:
        data = response.json()
    except ValueError as error:
        raise RuntimeError(
            "Camera configuration endpoint returned invalid JSON"
        ) from error

    if not data.get("success"):
        raise RuntimeError(
            data.get(
                "error",
                "Camera configuration request was unsuccessful",
            )
        )

    raw_cameras = data.get("cameras")

    if not isinstance(raw_cameras, list):
        raise RuntimeError(
            "Camera configuration response does not contain a valid cameras list"
        )

    camera_configs = []

    for camera in raw_cameras:
        camera_id = str(
            camera.get("cameraId", "")
        ).strip()

        source = str(
            camera.get("source", "")
        ).strip()

        if not camera_id:
            print(
                "⚠️ Skipping camera with missing cameraId"
            )
            continue

        if not source:
            print(
                f"⚠️ Skipping {camera_id}: source is empty"
            )
            continue

        camera_configs.append(
            {
                "cameraId": camera_id,
                "source": source,
                "name": camera.get("name", ""),
                "location": camera.get("location", ""),
                "city": camera.get("city", ""),
                "district": camera.get("district", ""),
                "area": camera.get("area", ""),
                "latitude": camera.get("latitude"),
                "longitude": camera.get("longitude"),
            }
        )

    if not camera_configs:
        print(
            "⚠️ Backend returned no active AI-enabled cameras. "
            "The edge runner will keep running and retry the registry."
        )
        return []

    print(
        f"✅ Loaded {len(camera_configs)} camera configuration(s) from backend."
    )

    for config in camera_configs:
        print(
            f"   {config['cameraId']} → "
            f"{display_source(config['source'])}"
        )

    return camera_configs



def build_camera_runtime(config):
    """Create one runtime object from backend camera config."""
    source = resolve_source(
        config["source"]
    )

    camera = CameraRuntime(
        camera_id=config["cameraId"],
        source_raw=str(
            config["source"]
        ),
        source=source,
        frame_lock=threading.Lock(),
        accident_boxes=[],
        emergency_candidate_camera_ids=set(),
        emergency_signature=[],
    )

    camera.latitude = config.get("latitude")
    camera.longitude = config.get("longitude")
    camera.location = config.get(
        "location",
        "",
    )

    camera.name = config.get(
        "name",
        "",
    )
    camera.city = config.get(
        "city",
        "",
    )
    camera.district = config.get(
        "district",
        "",
    )
    camera.area = config.get(
        "area",
        "",
    )

    return camera


def close_camera_runtime(camera):
    """Stop streams associated with one runtime."""
    try:
        if camera.capture is not None:
            camera.capture.release()
    except Exception:
        pass

    try:
        _stop_ffmpeg(camera)
    except Exception:
        pass


def refresh_camera_registry(
    cameras,
    active,
):
    """
    Phase 28:
    Detect additions, removals and source changes in the
    backend real-camera registry.

    Existing runtime state is preserved for unchanged cameras.
    """
    global CAMERA_CONFIGS

    try:
        fresh_configs = load_camera_configs()
    except Exception as error:
        print(
            "⚠️ Phase 28 camera refresh failed: "
            f"{error}"
        )
        return

    config_map = {
        config["cameraId"]: config
        for config in fresh_configs
    }

    runtime_map = {
        camera.camera_id: camera
        for camera in cameras
    }

    # -----------------------------------------------------
    # Add or update cameras
    # -----------------------------------------------------
    for camera_id, config in config_map.items():
        existing = runtime_map.get(
            camera_id
        )

        if existing is None:
            print(
                f"➕ Phase 28 new camera: "
                f"{camera_id}"
            )

            camera = build_camera_runtime(
                config
            )

            cameras.append(camera)
            cameras_by_id[
                camera_id
            ] = camera

            if open_capture(camera):
                if warmup_capture(camera):
                    active.append(camera)
                    print(
                        f"🟢 Phase 28 camera active: "
                        f"{camera_id}"
                    )
                else:
                    close_camera_runtime(
                        camera
                    )
            else:
                print(
                    f"⚠️ Phase 28 camera could not open: "
                    f"{camera_id}"
                )

            continue

        new_source = str(
            config["source"]
        ).strip()

        if (
            existing.source_raw !=
            new_source
        ):
            print(
                f"🔄 Phase 28 source changed: "
                f"{camera_id}"
            )

            was_active = (
                existing in active
            )

            if was_active:
                close_camera_runtime(
                    existing
                )
                active.remove(existing)

            existing.source_raw = (
                new_source
            )
            existing.source = (
                resolve_source(
                    new_source
                )
            )

            existing.latitude = config.get(
                "latitude"
            )
            existing.longitude = config.get(
                "longitude"
            )
            existing.location = config.get(
                "location",
                "",
            )
            existing.name = config.get(
                "name",
                "",
            )
            existing.city = config.get(
                "city",
                "",
            )
            existing.district = config.get(
                "district",
                "",
            )
            existing.area = config.get(
                "area",
                "",
            )

            if open_capture(existing):
                if warmup_capture(existing):
                    if existing not in active:
                        active.append(
                            existing
                        )
            continue

        # Update non-source metadata in place.
        existing.latitude = config.get(
            "latitude"
        )
        existing.longitude = config.get(
            "longitude"
        )
        existing.location = config.get(
            "location",
            "",
        )
        existing.name = config.get(
            "name",
            "",
        )
        existing.city = config.get(
            "city",
            "",
        )
        existing.district = config.get(
            "district",
            "",
        )
        existing.area = config.get(
            "area",
            "",
        )

    # -----------------------------------------------------
    # Remove cameras that no longer exist / are AI disabled
    # -----------------------------------------------------
    current_ids = set(
        config_map.keys()
    )

    for camera in list(cameras):
        if camera.camera_id in current_ids:
            continue

        print(
            f"➖ Phase 28 removed camera: "
            f"{camera.camera_id}"
        )

        close_camera_runtime(
            camera
        )

        if camera in active:
            active.remove(camera)

        cameras.remove(camera)
        cameras_by_id.pop(
            camera.camera_id,
            None
        )

    CAMERA_CONFIGS = fresh_configs


def maybe_refresh_camera_registry(
    cameras,
    active,
):
    global last_camera_config_refresh

    if not PHASE28_CAMERA_REFRESH_ENABLED:
        return

    now = time.monotonic()

    if (
        last_camera_config_refresh > 0
        and now - last_camera_config_refresh < PHASE28_CAMERA_REFRESH_INTERVAL
    ):
        return

    last_camera_config_refresh = now

    refresh_camera_registry(
        cameras,
        active,
    )

# Populated by main() after the local stream server has started. Avoid
# failing module import when the backend is temporarily unavailable.
CAMERA_CONFIGS = []


# =========================================================
# Runtime
# =========================================================

@dataclass
class CameraRuntime:

    camera_id: str
    source_raw: str
    source: Union[int, str]

    capture: Optional[cv2.VideoCapture] = None

    # FFmpeg-backed network stream support.
    # Used for RTSP sources because VLC/FFmpeg can decode
    # streams that OpenCV's direct RTSP capture may not open.
    ffmpeg_process: Optional[subprocess.Popen] = None
    ffmpeg_reader_thread: Optional[threading.Thread] = None
    ffmpeg_stop_event: Optional[threading.Event] = None
    ffmpeg_frame_lock: Optional[threading.Lock] = None
    latest_ffmpeg_frame: Optional[object] = None
    ffmpeg_stream_ready: bool = False

    frame_counter: int = 0

    consecutive_failures: int = 0

    # =====================================================
    # Phase 27 — Adaptive AI state
    # =====================================================
    last_vehicle_inference: float = 0.0

    last_vehicle_count: int = 0

    last_vehicle_breakdown: dict = None

    last_vehicle_average_confidence: float = 0.0

    last_vehicle_max_confidence: float = 0.0

    last_vehicle_congestion: str = "LOW"

    inference_priority: str = "NORMAL"

    inference_interval: float = PHASE27_NORMAL_INTERVAL

    last_inference_reason: str = "startup"

    # Lightweight optical-flow tracks keep vehicle boxes aligned between
    # slower YOLO inference cycles. Fresh YOLO detections reset these tracks.
    vehicle_tracks: list = None
    vehicle_previous_gray: object = None
    vehicle_track_frame_count: int = 0
    vehicle_tracks_last_detection: float = 0.0

    # =====================================================
    # Phase 27/28 — RTSP reliability state
    # =====================================================
    last_ffmpeg_reconnect: float = 0.0
    ffmpeg_reconnect_attempts: int = 0
    last_ffmpeg_frame_time: float = 0.0
    ffmpeg_started_at: float = 0.0

    last_backend_update: float = 0.0

    latest_jpeg: bytes = b""

    # Original source frame, before YOLO annotations.
    # Used by the Normal Live Camera browser stream.
    latest_source_jpeg: bytes = b""

    frame_lock: threading.Lock = None

    # Cached accident result so the heavier accident model
    # does not have to run on every processed frame.
    last_accident_analysis: float = 0.0
    accident_detected: bool = False
    accident_severity: str = "NONE"
    accident_boxes: list = None

    # Temporal accident state.
    accident_missed_analyses: int = 0
    accident_candidate_confidence: float = 0.0

    last_emergency_analysis: float = 0.0
    emergency_detected: bool = False
    emergency_vehicle_type: str = ""
    emergency_confidence: float = 0.0
    emergency_boxes: list = None
    emergency_event_id: str = ""
    emergency_candidate_camera_ids: set = None
    emergency_signature: list = None


# =========================================================
# Helpers
# =========================================================

def safe_camera_id(camera_id):

    return re.sub(
        r"[^a-zA-Z0-9_-]",
        "_",
        camera_id,
    )


def display_source(source):
    """
    Avoid printing RTSP credentials in terminal logs.
    """
    source = str(source)

    if source.lower().startswith("rtsp://"):
        return re.sub(
            r"(rtsp://)([^/@]+):([^/@]+)@",
            r"\1***:***@",
            source,
        )

    return source


def resolve_source(source):

    source = str(source).strip()

    if source.isdigit():
        return int(source)

    if os.path.isabs(source):
        return source

    project_path = os.path.join(
        PROJECT_DIR,
        source,
    )

    if os.path.exists(project_path):
        return project_path

    backend_path = os.path.join(
        BACKEND_DIR,
        source,
    )

    if os.path.exists(backend_path):
        return backend_path

    return source


def is_video_file(source):

    if not isinstance(source, str):
        return False

    lower = source.lower()

    if lower.startswith(
        (
            "rtsp://",
            "rtmp://",
            "http://",
            "https://",
        )
    ):
        return False

    return os.path.isfile(source)


def is_rtsp_source(source):
    return str(source).strip().lower().startswith("rtsp://")


def is_network_stream(source):
    return str(source).strip().lower().startswith(
        (
            "rtsp://",
            "rtmp://",
            "http://",
            "https://",
        )
    )


EMERGENCY_CLASS_MAP = {
    "ambulance": "ambulance",
    "fire_truck": "fire_truck",
    "firetruck": "fire_truck",
    "police": "police_vehicle",
    "police_vehicle": "police_vehicle",
}


def normalize_emergency_type(class_name):
    """Return a canonical emergency type for a model class label.

    Class labels are normalized so capitalization, spaces and hyphens do not
    cause valid emergency detections to be discarded. Generic vehicles and
    unknown classes intentionally return None.
    """
    if class_name is None:
        return None

    normalized_name = (
        str(class_name)
        .strip()
        .lower()
        .replace("-", "_")
        .replace(" ", "_")
    )

    return EMERGENCY_CLASS_MAP.get(normalized_name)


# RTSP_READER_STABILITY_PATCH_V1
def _stop_ffmpeg(camera):
    """Stop one RTSP reader cleanly before another session is started.

    Keep local references to the old process/thread/event. The reader must
    never observe a replacement stop event or clear state belonging to a
    newer FFmpeg process.
    """
    stop_event = camera.ffmpeg_stop_event
    process = camera.ffmpeg_process
    reader_thread = camera.ffmpeg_reader_thread

    if stop_event is not None:
        stop_event.set()

    if process is not None:
        try:
            if process.poll() is None:
                process.terminate()

                try:
                    process.wait(timeout=3)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait(timeout=3)
        except Exception as error:
            print(
                f"⚠️ FFmpeg stop warning {camera.camera_id}: {error}"
            )

        try:
            if process.stdout is not None and not process.stdout.closed:
                process.stdout.close()
        except Exception:
            pass

    if (
        reader_thread is not None
        and reader_thread is not threading.current_thread()
        and reader_thread.is_alive()
    ):
        reader_thread.join(timeout=4)

        if reader_thread.is_alive():
            try:
                if process is not None and process.stdout is not None:
                    process.stdout.close()
            except Exception:
                pass
            reader_thread.join(timeout=2)

        if reader_thread.is_alive():
            print(
                f"⚠️ FFmpeg reader did not exit promptly: {camera.camera_id}"
            )

    if camera.ffmpeg_process is process:
        camera.ffmpeg_process = None

    if camera.ffmpeg_reader_thread is reader_thread:
        camera.ffmpeg_reader_thread = None

    if camera.ffmpeg_stop_event is stop_event:
        camera.ffmpeg_stop_event = None

    camera.ffmpeg_stream_ready = False
    camera.last_ffmpeg_frame_time = 0.0
    camera.ffmpeg_started_at = 0.0

    if camera.ffmpeg_frame_lock is None:
        camera.ffmpeg_frame_lock = threading.Lock()

    with camera.ffmpeg_frame_lock:
        camera.latest_ffmpeg_frame = None

def _ffmpeg_reader(camera):
    """Drain FFmpeg MJPEG output and publish only the newest decoded frame.

    Process, stop-event and lock references are captured once. Reconnects
    create a new generation, so an old reader can never update/clear the new
    generation's camera state.
    """
    process = camera.ffmpeg_process
    stop_event = camera.ffmpeg_stop_event
    frame_lock = camera.ffmpeg_frame_lock

    if (
        process is None
        or process.stdout is None
        or stop_event is None
    ):
        return

    if frame_lock is None:
        frame_lock = threading.Lock()
        camera.ffmpeg_frame_lock = frame_lock

    buffer = bytearray()

    try:
        while not stop_event.is_set():
            try:
                chunk = process.stdout.read(16384)
            except (OSError, ValueError) as error:
                if not stop_event.is_set():
                    print(
                        f"⚠️ FFmpeg reader error "
                        f"{camera.camera_id}: {error}"
                    )
                break

            if not chunk:
                break

            buffer.extend(chunk)
            newest_jpeg = None

            # Extract every complete JPEG in this chunk, but decode only the
            # newest one. This drops stale buffered frames instead of building
            # latency while preserving any incomplete trailing JPEG.
            while True:
                start = buffer.find(b"\xff\xd8")

                if start == -1:
                    if len(buffer) > 2 * 1024 * 1024:
                        del buffer[:-1]
                    break

                if start > 0:
                    del buffer[:start]

                end = buffer.find(b"\xff\xd9", 2)

                if end == -1:
                    if len(buffer) > 4 * 1024 * 1024:
                        buffer.clear()
                    break

                newest_jpeg = bytes(buffer[:end + 2])
                del buffer[:end + 2]

            if newest_jpeg is None:
                continue

            array = np.frombuffer(
                newest_jpeg,
                dtype=np.uint8,
            )
            frame = cv2.imdecode(
                array,
                cv2.IMREAD_COLOR,
            )

            if frame is None:
                continue

            if camera.ffmpeg_process is not process:
                break

            with frame_lock:
                if camera.ffmpeg_process is not process:
                    break
                camera.latest_ffmpeg_frame = frame

            camera.ffmpeg_stream_ready = True
            camera.last_ffmpeg_frame_time = time.monotonic()
            camera.ffmpeg_reconnect_attempts = 0

    except Exception as error:  # noqa: BLE001
        if not stop_event.is_set():
            print(
                f"⚠️ FFmpeg reader error "
                f"{camera.camera_id}: {error}"
            )

    finally:
        if camera.ffmpeg_process is process:
            camera.ffmpeg_stream_ready = False

def _start_ffmpeg_rtsp(camera):
    source = str(camera.source).strip()

    camera.last_ffmpeg_frame_time = 0.0

    if camera.ffmpeg_frame_lock is None:
        camera.ffmpeg_frame_lock = threading.Lock()

    camera.ffmpeg_stop_event = (
        threading.Event()
    )

    command = [
        "ffmpeg",

        "-hide_banner",
        "-loglevel",
        "error",

        "-rtsp_transport",
        "tcp",

        "-fflags",
        "nobuffer",

        "-flags",
        "low_delay",

        "-i",
        source,

        "-an",

        "-f",
        "image2pipe",

        "-vcodec",
        "mjpeg",

        "-q:v",
        "5",

        "pipe:1",
    ]

    print(
        f"🎥 Starting FFmpeg RTSP reader: "
        f"{camera.camera_id}"
    )

    try:
        camera.ffmpeg_process = (
            subprocess.Popen(
                command,
                stdout=subprocess.PIPE,
                stderr=subprocess.DEVNULL,
                bufsize=0,
            )
        )
    except FileNotFoundError as error:
        camera.ffmpeg_process = None
        camera.ffmpeg_stop_event = None
        camera.ffmpeg_started_at = 0.0

        raise RuntimeError(
            "FFmpeg executable was not found. "
            "Install FFmpeg and make sure "
            "the ffmpeg command works in PowerShell."
        ) from error

    camera.ffmpeg_started_at = time.monotonic()

    camera.ffmpeg_reader_thread = (
        threading.Thread(
            target=_ffmpeg_reader,
            args=(camera,),
            daemon=True,
            name=(
                f"ffmpeg-{camera.camera_id}"
            ),
        )
    )

    camera.ffmpeg_reader_thread.start()

    return True


def recover_rtsp_camera(camera):
    """
    Phase 27/28 — Automatically recover a dropped RTSP stream.

    The stream reader runs in its own thread. If FFmpeg exits,
    the reader stops producing frames, or the last frame becomes
    stale for too long, restart FFmpeg for this camera.

    This function does not affect local webcams or local video
    files.
    """

    if not is_rtsp_source(
        camera.source
    ):
        return False

    now = time.monotonic()

    if (
        now
        - camera.last_ffmpeg_reconnect
        < RTSP_RECONNECT_COOLDOWN
    ):
        return False

    process = camera.ffmpeg_process

    process_dead = (
        process is None
        or process.poll() is not None
    )

    reader_thread = (
        camera.ffmpeg_reader_thread
    )

    reader_dead = (
        reader_thread is not None
        and not reader_thread.is_alive()
    )

    frame_stale = False

    if camera.last_ffmpeg_frame_time > 0:
        frame_stale = (
            now
            - camera.last_ffmpeg_frame_time
            >= RTSP_STALE_FRAME_TIMEOUT
        )

    stream_not_ready = (
        not camera.ffmpeg_stream_ready
    )

    # A new RTSP/FFmpeg process can take several seconds to negotiate the
    # stream and deliver its first JPEG frame. Do not kill it during that window.
    if (
        not process_dead
        and not reader_dead
        and stream_not_ready
        and camera.ffmpeg_started_at > 0
        and now - camera.ffmpeg_started_at < RTSP_CONNECT_GRACE_PERIOD
    ):
        return False

    if not (
        process_dead
        or reader_dead
        or frame_stale
        or stream_not_ready
    ):
        return False

    camera.last_ffmpeg_reconnect = now
    camera.ffmpeg_reconnect_attempts += 1

    print(
        "🔄 RTSP recovery | "
        f"{camera.camera_id} | "
        f"attempt="
        f"{camera.ffmpeg_reconnect_attempts}"
    )

    try:
        _stop_ffmpeg(camera)
    except Exception as error:
        print(
            "⚠️ RTSP cleanup error | "
            f"{camera.camera_id} | "
            f"{error}"
        )

    try:
        started = _start_ffmpeg_rtsp(
            camera
        )

        if not started:
            print(
                "⚠️ RTSP reconnect did not start | "
                f"{camera.camera_id}"
            )
            return False

        print(
            "🟢 RTSP reconnect started | "
            f"{camera.camera_id}"
        )

        return True

    except Exception as error:
        print(
            "⚠️ RTSP reconnect failed | "
            f"{camera.camera_id} | "
            f"{error}"
        )

        return False


def open_capture(camera):
    if camera.capture is not None:
        try:
            camera.capture.release()
        except Exception:
            pass

    _stop_ffmpeg(camera)

    # ---------------------------------------------------------
    # Local webcam
    # ---------------------------------------------------------
    if isinstance(camera.source, int):
        camera.capture = cv2.VideoCapture(
            camera.source,
            cv2.CAP_DSHOW,
        )

        return camera.capture.isOpened()

    # ---------------------------------------------------------
    # RTSP network camera
    # ---------------------------------------------------------
    if is_rtsp_source(
        camera.source
    ):
        try:
            return _start_ffmpeg_rtsp(
                camera
            )
        except RuntimeError as error:
            print(
                f"❌ {camera.camera_id} "
                f"FFmpeg start failed: {error}"
            )
            return False

    # ---------------------------------------------------------
    # Other HTTP/RTMP network streams
    # ---------------------------------------------------------
    if is_network_stream(
        camera.source
    ):
        print(
            f"🌐 Opening network stream: "
            f"{camera.camera_id}"
        )

        os.environ[
            "OPENCV_FFMPEG_CAPTURE_OPTIONS"
        ] = "rtsp_transport;tcp"

        camera.capture = cv2.VideoCapture(
            str(camera.source),
            cv2.CAP_FFMPEG,
        )

        return camera.capture.isOpened()

    # ---------------------------------------------------------
    # Local video file
    # ---------------------------------------------------------
    camera.capture = cv2.VideoCapture(
        camera.source,
    )

    return camera.capture.isOpened()


def read_camera_frame(camera):
    """
    Read one frame without blocking the main AI loop.

    Local cameras/files use OpenCV directly.
    RTSP cameras use the latest JPEG frame decoded
    by the background FFmpeg reader.
    """
    if camera.ffmpeg_process is not None:
        if (
            camera.ffmpeg_frame_lock is None
        ):
            return False, None

        with camera.ffmpeg_frame_lock:
            frame = camera.latest_ffmpeg_frame

            if frame is None:
                return False, None

            return True, frame.copy()

    if camera.capture is None:
        return False, None

    return camera.capture.read()


def reactivate_inactive_rtsp_cameras(cameras, active):
    """Retry RTSP cameras that failed startup or were removed from active.

    A camera is returned to the processing list only after FFmpeg is alive,
    the reader has produced a recent frame, and that frame can be read.
    Other cameras continue processing independently.
    """
    now = time.monotonic()

    for camera in list(cameras):
        if camera in active or not is_rtsp_source(camera.source):
            continue

        process = camera.ffmpeg_process
        reader = camera.ffmpeg_reader_thread
        process_alive = process is not None and process.poll() is None
        reader_alive = reader is not None and reader.is_alive()
        frame_is_fresh = (
            camera.last_ffmpeg_frame_time > 0
            and now - camera.last_ffmpeg_frame_time < RTSP_STALE_FRAME_TIMEOUT
        )

        if (
            process_alive
            and reader_alive
            and camera.ffmpeg_stream_ready
            and frame_is_fresh
        ):
            success, frame = read_camera_frame(camera)
            if success and frame is not None:
                camera.consecutive_failures = 0
                active.append(camera)
                print(
                    "🟢 RTSP camera reactivated | "
                    f"{camera.camera_id}"
                )
                continue

        # Starts a missing/dead stream or restarts one whose reader/frame is stale.
        recover_rtsp_camera(camera)


def warmup_capture(camera):
    if camera.ffmpeg_process is not None:
        print(
            f"🔄 Waiting for RTSP frames: "
            f"{camera.camera_id}"
        )

        deadline = (
            time.monotonic()
            + 20
        )

        while (
            time.monotonic()
            < deadline
        ):
            success, frame = (
                read_camera_frame(
                    camera
                )
            )

            if (
                success
                and frame is not None
            ):
                camera.consecutive_failures = 0

                print(
                    f"✅ {camera.camera_id} "
                    "RTSP frame ready"
                )

                return True

            time.sleep(0.1)

        print(
            f"❌ {camera.camera_id} "
            "RTSP frame timeout"
        )

        return False

    for attempt in range(10):
        success, frame = (
            read_camera_frame(
                camera
            )
        )

        if (
            success
            and frame is not None
        ):
            camera.consecutive_failures = 0

            print(
                f"✅ {camera.camera_id} "
                f"frame ready "
                f"(attempt {attempt + 1})"
            )

            return True

        time.sleep(0.05)

    return False


def restart_video(camera):

    print(
        f"🔄 {camera.camera_id} "
        "demo video reached the end."
    )

    if not open_capture(camera):

        print(
            f"❌ {camera.camera_id} "
            "failed to reopen."
        )

        return False

    if not warmup_capture(camera):

        print(
            f"❌ {camera.camera_id} "
            "restart failed."
        )

        return False

    print(
        f"🔁 {camera.camera_id} "
        "demo video restarted."
    )

    return True


def update_source_live_frame(
    camera,
    frame,
):
    """Store the original camera frame for the normal live stream."""

    success, encoded = cv2.imencode(
        ".jpg",
        frame,
        [
            cv2.IMWRITE_JPEG_QUALITY,
            80,
        ],
    )

    if not success:
        return

    jpeg_bytes = encoded.tobytes()

    with camera.frame_lock:
        camera.latest_source_jpeg = jpeg_bytes


def update_live_frame(
    camera,
    frame,
):
    """Store the YOLO-annotated frame for the AI stream."""

    success, encoded = cv2.imencode(
        ".jpg",
        frame,
        [
            cv2.IMWRITE_JPEG_QUALITY,
            75,
        ],
    )

    if not success:
        return

    jpeg_bytes = encoded.tobytes()

    with camera.frame_lock:
        camera.latest_jpeg = jpeg_bytes


# =========================================================
# MJPEG Stream Server
# =========================================================

cameras_by_id = {}
# Shared YOLO models for camera and uploaded-image inference.
AI_MODELS = {
    "vehicle": None,
    "accident": None,
    "emergency": None,
}

# Indicates when all YOLO models have finished loading.
AI_MODELS_READY = threading.Event()

# Prevents simultaneous GPU inference from competing requests.
AI_INFERENCE_LOCK = threading.RLock()

emergency_tracking_lock = threading.Lock()

# vehicle_type -> {
#     emergencyId,
#     currentCameraId,
#     candidateCameraIds,
#     lastCandidateLookup
# }
active_ai_emergencies = {}
last_emergency_propagation_sync = {}

# Phase 20 — throttle backend recovery-state checks.
last_emergency_recovery_poll = 0.0


class LiveStreamHandler(
    BaseHTTPRequestHandler
):

    def log_message(
        self,
        format,
        *args,
    ):
        return


    def do_POST(self):
        path = self.path.split("?", 1)[0]

        if path != "/analyze-image":
            self.send_error(404, "Endpoint not found")
            return

        def send_json(status, payload):
            body = json.dumps(payload).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)

        if not AI_MODELS_READY.is_set():
            send_json(503, {
                "success": False,
                "error": "YOLO models are not ready."
            })
            return

        content_type = (
            self.headers.get("Content-Type", "")
            .split(";", 1)[0]
            .strip()
            .lower()
        )

        allowed_content_types = {
            "image/jpeg",
            "image/png",
            "image/webp",
        }

        if content_type not in allowed_content_types:
            send_json(415, {
                "success": False,
                "error": "Only JPEG, PNG, and WebP images are accepted."
            })
            return

        try:
            content_length = int(
                self.headers.get("Content-Length", "0")
            )
        except ValueError:
            content_length = 0

        MAX_IMAGE_BYTES = 10 * 1024 * 1024

        if content_length <= 0 or content_length > MAX_IMAGE_BYTES:
            send_json(413, {
                "success": False,
                "error": "Invalid image size. Maximum is 10 MB."
            })
            return

        try:
            image_bytes = self.rfile.read(content_length)

            if len(image_bytes) != content_length:
                send_json(400, {
                    "success": False,
                    "error": "Incomplete image upload."
                })
                return

            image_array = np.frombuffer(
                image_bytes,
                dtype=np.uint8
            )

            frame = cv2.imdecode(
                image_array,
                cv2.IMREAD_COLOR
            )

            if frame is None:
                send_json(400, {
                    "success": False,
                    "error": "Unable to decode the uploaded image."
                })
                return

            # Serialize uploaded-image inference with live-camera
            # inference so the shared GPU models are never used
            # simultaneously by competing requests.
            with AI_INFERENCE_LOCK:

                vehicle_model = AI_MODELS["vehicle"]
                accident_model = AI_MODELS["accident"]

                if vehicle_model is None or accident_model is None:
                    send_json(503, {
                        "success": False,
                        "error": "Vehicle or accident model is unavailable."
                    })
                    return

                vehicle_results = vehicle_model(
                    frame,
                    imgsz=IMG_SIZE,
                    conf=VEHICLE_CONFIDENCE,
                    device=0,
                    verbose=False,
                )

                accident_results = accident_model(
                    frame,
                    imgsz=IMG_SIZE,
                    conf=ACCIDENT_CONFIDENCE,
                    device=0,
                    verbose=False,
                )

                # Annotate the image with vehicle detections.
                annotated_image = vehicle_results[0].plot()

                vehicle_breakdown = {
                    "car": 0,
                    "truck": 0,
                    "bus": 0,
                    "motorcycle": 0,
                    "person": 0,
                }

                vehicle_count = 0
                vehicle_names = vehicle_model.names

                for result in vehicle_results:
                    if result.boxes is None:
                        continue

                    for box in result.boxes:
                        class_id = int(box.cls[0])

                        if isinstance(vehicle_names, dict):
                            class_name = vehicle_names.get(
                                class_id, ""
                            )
                        else:
                            class_name = (
                                vehicle_names[class_id]
                                if class_id < len(vehicle_names)
                                else ""
                            )

                        class_name = str(class_name).strip().lower()

                        if class_name in vehicle_breakdown:
                            vehicle_breakdown[class_name] += 1

                            if class_name != "person":
                                vehicle_count += 1

                # Calculate traffic density.
                if vehicle_count <= 10:
                    traffic_density = "LOW"
                elif vehicle_count <= 25:
                    traffic_density = "MEDIUM"
                else:
                    traffic_density = "HIGH"

                # Accident detection.
                accident_detected = False
                accident_confidence = 0.0

                for result in accident_results:
                    if result.boxes is None:
                        continue

                    for box in result.boxes:
                        class_id = int(box.cls[0])

                        accident_names = accident_model.names

                        if isinstance(accident_names, dict):
                            class_name = accident_names.get(
                                class_id, ""
                            )
                        else:
                            class_name = (
                                accident_names[class_id]
                                if class_id < len(accident_names)
                                else ""
                            )

                        if str(class_name).strip().lower() == "accident":
                            accident_detected = True
                            accident_confidence = max(
                                accident_confidence,
                                float(box.conf[0]) * 100
                            )

                accident_confidence = round(
                    accident_confidence, 2
                )

                if accident_detected:
                    if accident_confidence >= 90:
                        severity = "HIGH"
                    elif accident_confidence >= 70:
                        severity = "MEDIUM"
                    else:
                        severity = "LOW"
                else:
                    severity = "NONE"

                # Recommendations.
                if accident_detected:
                    recommendations = [
                        "Dispatch Ambulance",
                        "Alert Police",
                        "Create Green Corridor",
                    ]
                elif traffic_density == "HIGH":
                    recommendations = [
                        "Increase Green Signal Time",
                        "Deploy Traffic Officers",
                    ]
                elif traffic_density == "MEDIUM":
                    recommendations = [
                        "Monitor Traffic",
                    ]
                else:
                    recommendations = [
                        "Traffic Flow Normal",
                    ]

                success, encoded_image = cv2.imencode(
                    ".jpg",
                    annotated_image,
                    [
                        cv2.IMWRITE_JPEG_QUALITY,
                        90,
                    ],
                )

                if not success:
                    raise RuntimeError(
                        "Could not encode the annotated image."
                    )

            # Return the annotated image as a data URL.
            # This avoids exposing the laptop's local filesystem path.
            image_base64 = base64.b64encode(
                encoded_image.tobytes()
            ).decode("ascii")

            image_data_url = (
                "data:image/jpeg;base64,"
                + image_base64
            )

            send_json(200, {
                "success": True,

                "vehicleCount": vehicle_count,
                "vehicleBreakdown": vehicle_breakdown,

                "trafficDensity": traffic_density,
                "congestion": traffic_density,

                "accident": {
                    "detected": accident_detected,
                    "confidence": accident_confidence,
                    "severity": severity,
                },

                # Compatibility with the existing React frontend.
                "accidentDetected": accident_detected,
                "accidentSeverity": severity,

                "recommendations": recommendations,
                "recommendation": recommendations[0],

                # The existing UI can use this as an image source.
                "jpg": image_data_url,
                "annotatedImage": image_data_url,
                "annotatedImageMimeType": "image/jpeg",
            })

        except Exception as error:
            print(
                f"Uploaded-image inference error: {error}",
                flush=True,
            )

            send_json(500, {
                "success": False,
                "error": "Uploaded-image inference failed.",
            })

    def do_GET(self):

        path = self.path.split(
            "?",
            1,
        )[0]

        if path == "/health":

            body = (
                b'{"success":true,'
                b'"service":"trafficmind-ai-stream"}'
            )

            self.send_response(200)

            self.send_header(
                "Content-Type",
                "application/json",
            )

            self.send_header(
                "Content-Length",
                str(len(body)),
            )

            self.send_header(
                "Access-Control-Allow-Origin",
                "*",
            )

            self.end_headers()

            self.wfile.write(body)

            return

        normal_prefix = "/normal-stream/"
        yolo_prefix = "/stream/"

        if path.startswith(normal_prefix):
            stream_type = "normal"
            prefix = normal_prefix
        elif path.startswith(yolo_prefix):
            stream_type = "yolo"
            prefix = yolo_prefix
        else:
            self.send_response(404)
            self.end_headers()
            return

        camera_id = path[
            len(prefix):
        ]

        camera = cameras_by_id.get(
            camera_id
        )

        if camera is None:

            self.send_response(404)

            self.end_headers()

            return

        self.send_response(200)

        self.send_header(
            "Content-Type",
            "multipart/x-mixed-replace; boundary=frame",
        )

        self.send_header(
            "Cache-Control",
            "no-cache, no-store, must-revalidate",
        )

        self.send_header(
            "Pragma",
            "no-cache",
        )

        self.send_header(
            "Access-Control-Allow-Origin",
            "*",
        )

        self.end_headers()

        try:

            while True:

                with camera.frame_lock:
                    frame_bytes = (
                        camera.latest_source_jpeg
                        if stream_type == "normal"
                        else camera.latest_jpeg
                    )

                if frame_bytes:

                    self.wfile.write(
                        b"--frame\r\n"
                    )

                    self.wfile.write(
                        b"Content-Type: image/jpeg\r\n"
                    )

                    self.wfile.write(
                        (
                            b"Content-Length: "
                            + str(
                                len(
                                    frame_bytes
                                )
                            ).encode()
                            + b"\r\n\r\n"
                        )
                    )

                    self.wfile.write(
                        frame_bytes
                    )

                    self.wfile.write(
                        b"\r\n"
                    )

                    self.wfile.flush()

                time.sleep(
                    0.06
                )

        except (
            BrokenPipeError,
            ConnectionResetError,
        ):

            pass

        except Exception as error:

            print(
                f"⚠️ Stream error "
                f"{camera_id}: {error}"
            )


def start_stream_server():

    server = ThreadingHTTPServer(
        (
            STREAM_HOST,
            STREAM_PORT,
        ),
        LiveStreamHandler,
    )

    thread = threading.Thread(
        target=server.serve_forever,
        daemon=True,
    )

    thread.start()

    print(
        "========================================"
    )

    print(
        "📡 Live Camera + YOLO Stream Server"
    )

    print(
        f"Host : {STREAM_HOST}"
    )

    print(
        f"Port : {STREAM_PORT}"
    )

    print(
        "Streams:"
    )

    for camera_id in cameras_by_id:

        print(
            f"  {camera_id} → normal: "
            f"http://localhost:{STREAM_PORT}"
            f"/normal-stream/{camera_id}"
        )

        print(
            f"  {camera_id} → YOLO:   "
            f"http://localhost:{STREAM_PORT}"
            f"/stream/{camera_id}"
        )

    print(
        "========================================"
    )

    return server


# =========================================================
# Traffic Logic
# =========================================================

def calculate_state(
    vehicle_count,
    accident_detected,
):

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

    emergency_detected = False

    accident_severity = "NONE"

    if accident_detected:

        emergency_detected = True

        accident_severity = "HIGH"

        recommendation = (
            "Activate Emergency Response"
        )

        signal_time = 90

    return (
        congestion,
        recommendation,
        signal_time,
        emergency_detected,
        accident_severity,
    )


# =========================================================
# Draw Overlay
# =========================================================

def draw_overlay(
    frame,
    camera_id,
    vehicle_count,
    congestion,
    average_confidence,
    recommendation,
    signal_time,
    accident_detected,
    accident_severity,
):

    annotated = frame.copy()

    cv2.putText(
        annotated,
        f"Camera : {camera_id}",
        (20, 35),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (255, 255, 255),
        2,
    )

    cv2.putText(
        annotated,
        f"Vehicles : {vehicle_count}",
        (20, 70),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (0, 255, 0),
        2,
    )

    cv2.putText(
        annotated,
        f"Congestion : {congestion}",
        (20, 110),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (0, 255, 255),
        2,
    )

    cv2.putText(
        annotated,
        (
            f"Confidence : "
            f"{average_confidence * 100:.1f}%"
        ),
        (20, 150),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (255, 255, 0),
        2,
    )

    cv2.putText(
        annotated,
        recommendation,
        (20, 185),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (255, 255, 0),
        2,
    )

    cv2.putText(
        annotated,
        f"Signal Time : {signal_time}s",
        (20, 220),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (0, 255, 0),
        2,
    )

    if accident_detected:

        cv2.rectangle(
            annotated,
            (10, 250),
            (620, 320),
            (0, 0, 255),
            -1,
        )

        cv2.putText(
            annotated,
            "ACCIDENT DETECTED",
            (25, 285),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (255, 255, 255),
            3,
        )

        cv2.putText(
            annotated,
            (
                f"Severity : "
                f"{accident_severity}"
            ),
            (25, 310),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (255, 255, 255),
            2,
        )

    return annotated


# =========================================================
# Background Backend Update
# =========================================================

def build_emergency_signature(
    frame,
    bbox,
):
    """
    Phase 17 lightweight visual re-identification signature.

    Uses normalized HSV histograms from the detected emergency
    vehicle crop. This is an appearance similarity signal,
    not guaranteed identity recognition.
    """
    try:
        x1, y1, x2, y2 = bbox

        height, width = frame.shape[:2]

        x1 = max(0, min(width - 1, int(x1)))
        y1 = max(0, min(height - 1, int(y1)))
        x2 = max(x1 + 1, min(width, int(x2)))
        y2 = max(y1 + 1, min(height, int(y2)))

        crop = frame[y1:y2, x1:x2]

        if crop.size == 0:
            return []

        hsv = cv2.cvtColor(
            crop,
            cv2.COLOR_BGR2HSV,
        )

        h_hist = cv2.calcHist(
            [hsv], [0], None, [16], [0, 180]
        )
        s_hist = cv2.calcHist(
            [hsv], [1], None, [8], [0, 256]
        )
        v_hist = cv2.calcHist(
            [hsv], [2], None, [8], [0, 256]
        )

        signature = np.concatenate(
            [
                h_hist.flatten(),
                s_hist.flatten(),
                v_hist.flatten(),
            ]
        ).astype(np.float32)

        norm = float(np.linalg.norm(signature))

        if norm <= 0:
            return []

        signature /= norm

        return [float(x) for x in signature]

    except Exception as error:
        print(
            "⚠️ Emergency signature error | "
            f"{error}"
        )
        return []


def get_active_ai_emergency(vehicle_type):
    with emergency_tracking_lock:
        record = active_ai_emergencies.get(
            vehicle_type
        )

        if record is None:
            return None

        return {
            "emergencyId": record["emergencyId"],
            "currentCameraId": record["currentCameraId"],
            "candidateCameraIds": set(
                record["candidateCameraIds"]
            ),
            "lastCandidateLookup":
                record["lastCandidateLookup"],
        }


def set_active_ai_emergency(
    vehicle_type,
    event_id,
    current_camera_id,
):
    with emergency_tracking_lock:
        active_ai_emergencies[
            vehicle_type
        ] = {
            "emergencyId": event_id,
            "currentCameraId": current_camera_id,
            "candidateCameraIds": set(),
            "lastCandidateLookup": 0.0,
        }


def update_active_ai_emergency(
    vehicle_type,
    current_camera_id=None,
    candidate_camera_ids=None,
):
    with emergency_tracking_lock:
        record = active_ai_emergencies.get(
            vehicle_type
        )

        if record is None:
            return

        if current_camera_id:
            record["currentCameraId"] = (
                current_camera_id
            )

        if candidate_camera_ids is not None:
            record["candidateCameraIds"] = set(
                candidate_camera_ids
            )


def clear_active_ai_emergency(
    vehicle_type
):
    with emergency_tracking_lock:
        active_ai_emergencies.pop(
            vehicle_type,
            None
        )


def fetch_ai_emergency_candidates(
    event_id,
    vehicle_type,
):
    """
    Ask the backend camera graph for the explicit
    downstream cameras of the emergency's current camera.
    """
    record = get_active_ai_emergency(
        vehicle_type
    )

    if record is None:
        return set()

    now = time.monotonic()

    if (
        now
        - record["lastCandidateLookup"]
        < EMERGENCY_HANDOFF_LOOKUP_INTERVAL
    ):
        return set(
            record["candidateCameraIds"]
        )

    url = (
        f"{BACKEND_API_ROOT}"
        f"/emergency/events/{event_id}"
        "/next-cameras/ai"
    )

    try:
        response = requests.get(
            url,
            headers={
                "x-internal-ai-key":
                    INTERNAL_AI_KEY,
            },
            timeout=2,
        )

        with emergency_tracking_lock:
            current = active_ai_emergencies.get(
                vehicle_type
            )
            if current is not None:
                current["lastCandidateLookup"] = (
                    now
                )

        if response.status_code != 200:
            print(
                "⚠️ Emergency graph lookup | "
                f"{vehicle_type} | "
                f"{response.status_code}"
            )

            return set(
                record["candidateCameraIds"]
            )

        data = response.json()

        candidates = data.get(
            "cameras",
            []
        )

        candidate_ids = set()

        for item in candidates:
            camera_id = (
                item.get("toCameraId")
                or item.get("cameraId")
            )

            if camera_id:
                candidate_ids.add(
                    str(camera_id).strip()
                )

        update_active_ai_emergency(
            vehicle_type,
            candidate_camera_ids=
                candidate_ids,
        )

        return candidate_ids

    except requests.RequestException as error:
        print(
            "⚠️ Emergency graph lookup error | "
            f"{vehicle_type} | {error}"
        )

        return set(
            record["candidateCameraIds"]
        )


def sync_ai_emergency_propagation(
    event_id,
    vehicle_type,
):
    """
    Phase 18:
    Sync the active emergency's 5 km geographic
    awareness zone to the backend.
    """
    if not event_id:
        return None

    now = time.monotonic()

    with emergency_tracking_lock:
        last_sync = last_emergency_propagation_sync.get(
            event_id,
            0.0,
        )

    if (
        now - last_sync
        < EMERGENCY_PROPAGATION_INTERVAL
    ):
        return None

    url = (
        f"{BACKEND_API_ROOT}"
        f"/emergency/events/{event_id}"
        "/propagation/sync"
    )

    try:
        response = requests.post(
            url,
            headers={
                "x-internal-ai-key":
                    INTERNAL_AI_KEY,
            },
            timeout=2,
        )

        with emergency_tracking_lock:
            last_emergency_propagation_sync[
                event_id
            ] = now

        if response.status_code != 200:
            print(
                "⚠️ Emergency propagation | "
                f"{event_id} | "
                f"{response.status_code}"
            )
            return None

        data = response.json()

        affected_count = int(
            data.get(
                "affectedCameraCount",
                0,
            )
            or 0
        )

        cameras = data.get(
            "cameras",
            [],
        )

        print(
            "🌐 Emergency Propagation | "
            f"{event_id} | "
            f"{vehicle_type} | "
            f"Radius=5km | "
            f"Affected={affected_count}"
        )

        for camera in cameras[:5]:
            distance_meters = float(
                camera.get(
                    "distanceMeters",
                    0,
                )
                or 0
            )

            print(
                "   📡 "
                f"{camera.get('cameraId', 'UNKNOWN')} | "
                f"{distance_meters / 1000:.2f} km | "
                f"{camera.get('zone', 'AWARE')} | "
                f"Score={camera.get('priorityScore', 0)}"
            )

        return data

    except requests.RequestException as error:
        print(
            "⚠️ Emergency propagation error | "
            f"{event_id} | {error}"
        )
        return None


def send_ai_emergency_event(
    camera,
    vehicle_type,
    confidence,
):
    """
    Phase 14:
    Create or refresh the persistent AI_DETECTED
    EmergencyEvent for the current camera.
    """
    url = (
        f"{BACKEND_API_ROOT}"
        "/emergency/events/ai-detected"
    )

    try:
        response = requests.post(
            url,

            json={
                "cameraId":
                    camera.camera_id,

                "vehicleType":
                    vehicle_type,

                "confidence":
                    confidence,

                "appearanceSignature":
                    camera.emergency_signature
                    or [],

                "location": {
                    "name": getattr(
                        camera,
                        "location",
                        "",
                    ),
                    "latitude": getattr(
                        camera,
                        "latitude",
                        None,
                    ),
                    "longitude": getattr(
                        camera,
                        "longitude",
                        None,
                    ),
                },
            },

            headers={
                "x-internal-ai-key":
                    INTERNAL_AI_KEY,
            },

            timeout=2,
        )

        if response.status_code in (
            200,
            201,
        ):
            event = (
                response.json()
                .get("event")
            )

            print(
                "🚨 AI Emergency Event | "
                f"{camera.camera_id} | "
                f"{vehicle_type} | "
                f"{confidence * 100:.1f}% | "
                f"{event.get('emergencyId') if event else 'N/A'}"
            )

            return event

        print(
            "⚠️ AI Emergency Event status | "
            f"{camera.camera_id} | "
            f"{response.status_code}"
        )

    except requests.RequestException as error:
        print(
            "⚠️ AI Emergency Event error | "
            f"{camera.camera_id} | {error}"
        )

    return None


def send_ai_emergency_handoff(
    event_id,
    next_camera_id,
    confidence,
    vehicle_type,
    appearance_signature,
):
    """
    Phase 16B:
    Tell the backend that the emergency has been
    observed at a directly connected downstream camera.
    """
    url = (
        f"{BACKEND_API_ROOT}"
        f"/emergency/events/{event_id}"
        "/handoff"
    )

    try:
        response = requests.post(
            url,

            json={
                "nextCameraId":
                    next_camera_id,

                "confidence":
                    confidence,

                "appearanceSignature":
                    appearance_signature
                    or [],
            },

            headers={
                "x-internal-ai-key":
                    INTERNAL_AI_KEY,
            },

            timeout=2,
        )

        if response.status_code in (
            200,
            201,
        ):
            data = response.json()
            event = data.get(
                "event"
            )

            update_active_ai_emergency(
                vehicle_type,
                current_camera_id=
                    next_camera_id,
                candidate_camera_ids=
                    set(),
            )

            print(
                "🚨 Emergency Camera Handoff | "
                f"{event_id} | "
                f"{event.get('previousCameraId') if event else 'N/A'} → "
                f"{event.get('currentCameraId') if event else next_camera_id} | "
                f"{confidence * 100:.1f}%"
            )

            return event

        print(
            "⚠️ Emergency Handoff status | "
            f"{next_camera_id} | "
            f"{response.status_code}"
        )

    except requests.RequestException as error:
        print(
            "⚠️ Emergency Handoff error | "
            f"{next_camera_id} | {error}"
        )

    return None





def fetch_ai_recovery_state(event_id):
    """
    Phase 20:
    Ask the backend whether an active emergency has
    entered SEARCHING mode and return its recovery candidates.
    """

    if not event_id:
        return None

    url = (
        f"{BACKEND_API_ROOT}"
        f"/emergency-recovery/internal/{event_id}"
    )

    try:
        response = requests.get(
            url,
            headers={
                "x-internal-ai-key":
                    INTERNAL_AI_KEY,
            },
            timeout=2,
        )

        if response.status_code == 404:
            return {
                "success": False,
                "eventNotFound": True,
            }

        if response.status_code != 200:
            return None

        return response.json()

    except requests.RequestException as error:
        print(
            "⚠️ Emergency recovery state error | "
            f"{event_id} | {error}"
        )
        return None


def send_ai_emergency_recovery(
    event_id,
    camera,
    vehicle_type,
    confidence,
):
    """
    Phase 20:
    Attempt same-vehicle recovery at a candidate camera.
    """

    if not event_id:
        return None

    url = (
        f"{BACKEND_API_ROOT}"
        f"/emergency-recovery/{event_id}"
        "/recover"
    )

    try:
        response = requests.post(
            url,
            json={
                "cameraId":
                    camera.camera_id,

                "vehicleType":
                    vehicle_type,

                "confidence":
                    confidence,

                "appearanceSignature":
                    camera.emergency_signature
                    or [],
            },
            headers={
                "x-internal-ai-key":
                    INTERNAL_AI_KEY,
            },
            timeout=2,
        )

        if response.status_code not in (
            200,
            201,
        ):
            print(
                "⚠️ Emergency recovery status | "
                f"{camera.camera_id} | "
                f"{response.status_code}"
            )
            return None

        data = response.json()

        if data.get("recovered"):
            print(
                "🔎 Emergency Recovered | "
                f"{event_id} | "
                f"{camera.camera_id} | "
                f"score="
                f"{data.get('similarity', 0):.3f}"
            )

        return data

    except requests.RequestException as error:
        print(
            "⚠️ Emergency recovery error | "
            f"{event_id} | "
            f"{camera.camera_id} | "
            f"{error}"
        )
        return None


def reconcile_ai_emergency(
    camera,
    vehicle_type,
    confidence,
):
    """
    Phase 16B + Phase 20 emergency state machine.

    Phase 16B:
    1. First detection -> create EmergencyEvent.
    2. Same current camera -> refresh event.
    3. Direct downstream candidate -> handoff.
    4. Unrelated camera -> ignore.

    Phase 20:
    5. Backend may place the event in SEARCHING.
    6. Candidate cameras may attempt same-vehicle recovery.
    """

    record = get_active_ai_emergency(
        vehicle_type
    )

    # =========================================================
    # FIRST DETECTION
    # =========================================================

    if record is None:

        event = send_ai_emergency_event(
            camera,
            vehicle_type,
            confidence,
        )

        if event:
            event_id = event.get(
                "emergencyId"
            )

            if event_id:
                set_active_ai_emergency(
                    vehicle_type,
                    event_id,
                    camera.camera_id,
                )

                candidates = (
                    fetch_ai_emergency_candidates(
                        event_id,
                        vehicle_type,
                    )
                )

                camera.emergency_candidate_camera_ids = (
                    candidates
                )

                sync_ai_emergency_propagation(
                    event_id,
                    vehicle_type,
                )

        return event

    event_id = record[
        "emergencyId"
    ]

    current_camera_id = record[
        "currentCameraId"
    ]

    # =========================================================
    # PRIORITY RULE — SAME CURRENT CAMERA
    # =========================================================
    #
    # If the emergency is visibly detected on the current
    # camera right now, refresh the persistent event FIRST.
    #
    # This prevents an old lastSeenAt from incorrectly pushing
    # a still-visible emergency into SEARCHING.
    # =========================================================

    if (
        current_camera_id
        == camera.camera_id
    ):

        event = send_ai_emergency_event(
            camera,
            vehicle_type,
            confidence,
        )

        if event:

            candidates = (
                fetch_ai_emergency_candidates(
                    event_id,
                    vehicle_type,
                )
            )

            camera.emergency_candidate_camera_ids = (
                candidates
            )

            sync_ai_emergency_propagation(
                event_id,
                vehicle_type,
            )

        return event

    # =========================================================
    # PHASE 20 — SEARCHING RECOVERY
    # =========================================================

    recovery_state = (
        fetch_ai_recovery_state(
            event_id
        )
    )

    if recovery_state:

        if recovery_state.get(
            "eventNotFound"
        ):
            clear_active_ai_emergency(
                vehicle_type
            )
            return None

        if recovery_state.get(
            "searching"
        ):

            candidates = (
                recovery_state.get(
                    "candidates",
                    [],
                )
            )

            candidate_ids = set()

            for item in candidates:

                if isinstance(
                    item,
                    dict,
                ):
                    candidate_id = (
                        item.get(
                            "cameraId"
                        )
                    )
                else:
                    candidate_id = (
                        item
                    )

                if candidate_id:
                    candidate_ids.add(
                        str(
                            candidate_id
                        ).strip()
                    )

            camera.emergency_candidate_camera_ids = (
                candidate_ids
            )

            # Only recovery candidates can attempt
            # same-vehicle recovery.
            if (
                camera.camera_id
                not in candidate_ids
            ):
                return None

            recovery = (
                send_ai_emergency_recovery(
                    event_id,
                    camera,
                    vehicle_type,
                    confidence,
                )
            )

            if (
                recovery
                and recovery.get(
                    "recovered"
                )
            ):

                recovered_event = (
                    recovery.get(
                        "event"
                    )
                )

                update_active_ai_emergency(
                    vehicle_type,
                    current_camera_id=
                        camera.camera_id,
                    candidate_camera_ids=
                        set(),
                )

                camera.emergency_event_id = (
                    event_id
                )

                print(
                    "✅ Phase 20 recovery complete | "
                    f"{event_id} | "
                    f"{camera.camera_id} | "
                    "TRACKING"
                )

                return (
                    recovered_event
                    or {
                        "emergencyId":
                            event_id,
                        "currentCameraId":
                            camera.camera_id,
                        "status":
                            "TRACKING",
                    }
                )

            return None

    # =========================================================
    # PHASE 16B — DOWNSTREAM HANDOFF
    # =========================================================

    candidates = (
        fetch_ai_emergency_candidates(
            event_id,
            vehicle_type,
        )
    )

    camera.emergency_candidate_camera_ids = (
        candidates
    )

    if (
        camera.camera_id
        not in candidates
    ):
        return None

    event = send_ai_emergency_handoff(
        event_id,
        camera.camera_id,
        confidence,
        vehicle_type,
        camera.emergency_signature,
    )

    if event:

        camera.emergency_event_id = (
            event.get(
                "emergencyId",
                camera.emergency_event_id,
            )
        )

        fetch_ai_emergency_candidates(
            event_id,
            vehicle_type,
        )

        sync_ai_emergency_propagation(
            event_id,
            vehicle_type,
        )

    return event



def poll_ai_emergency_recovery():
    """
    Phase 20:
    Periodically ask the backend to evaluate active AI
    emergencies and transition stale events into SEARCHING.

    This is deliberately throttled for the CPU-only runner.
    """

    global last_emergency_recovery_poll

    now = time.monotonic()

    if (
        now
        - last_emergency_recovery_poll
        < EMERGENCY_RECOVERY_POLL_INTERVAL
    ):
        return

    last_emergency_recovery_poll = now

    with emergency_tracking_lock:
        active_records = [
            (
                vehicle_type,
                dict(record),
            )
            for (
                vehicle_type,
                record
            ) in active_ai_emergencies.items()
        ]

    for (
        vehicle_type,
        record
    ) in active_records:

        event_id = record.get(
            "emergencyId"
        )

        if not event_id:
            continue

        state = (
            fetch_ai_recovery_state(
                event_id
            )
        )

        if not state:
            continue

        if state.get(
            "eventNotFound"
        ):
            clear_active_ai_emergency(
                vehicle_type
            )
            continue

        if state.get(
            "searching"
        ):
            candidate_ids = set()

            for item in state.get(
                "candidates",
                [],
            ):

                if isinstance(
                    item,
                    dict,
                ):
                    candidate_id = (
                        item.get(
                            "cameraId"
                        )
                    )
                else:
                    candidate_id = (
                        item
                    )

                if candidate_id:
                    candidate_ids.add(
                        str(
                            candidate_id
                        ).strip()
                    )

            update_active_ai_emergency(
                vehicle_type,
                candidate_camera_ids=
                    candidate_ids,
            )

            print(
                "🔎 Phase 20 SEARCHING | "
                f"{event_id} | "
                f"Last="
                f"{state.get('currentCameraId', 'N/A')} | "
                f"Candidates="
                f"{len(candidate_ids)}"
            )




def send_backend_update(payload):
    try:
        response = requests.post(
            BACKEND_URL,
            json=payload,
            headers={
                "x-internal-ai-key": INTERNAL_AI_KEY,
            },
            timeout=5,
        )

        if response.status_code == 200:
            print(
                "✅ Backend update | "
                f"{payload['cameraId']} | "
                f"Vehicles={payload['vehicleCount']}"
            )
        else:
            print(
                "⚠️ Backend status | "
                f"{payload['cameraId']} | "
                f"{response.status_code}"
            )

    except requests.RequestException as error:
        print(
            "⚠️ Backend update error | "
            f"{payload['cameraId']} | "
            f"{error}"
        )


# =========================================================
# Phase 27 — Adaptive Camera Priority
# =========================================================

def get_camera_inference_priority(camera):
    """
    Determine how aggressively this camera should receive
    expensive AI inference.

    Priority order:
        EMERGENCY > HIGH_RISK > HIGH_CONGESTION > NORMAL

    An emergency candidate/current camera is promoted before
    its own new emergency detection arrives, which helps the
    handoff path react quickly.
    """

    active_emergency = False

    if camera.emergency_detected:
        active_emergency = True

    # emergency_event_id alone is historical state and may remain on
    # the runtime after an event is completed. Only treat an emergency
    # as active when the current detection or active tracking registry
    # says so.

    with emergency_tracking_lock:
        for record in active_ai_emergencies.values():
            if record.get("currentCameraId") == camera.camera_id:
                active_emergency = True
                break

            if camera.camera_id in set(
                record.get("candidateCameraIds", set())
            ):
                active_emergency = True
                break

    if active_emergency:
        return "EMERGENCY"

    if camera.accident_detected:
        return "HIGH_RISK"

    if (
        camera.last_vehicle_congestion == "HIGH"
        or camera.last_vehicle_count >= 25
    ):
        return "HIGH_CONGESTION"

    return "NORMAL"


def get_camera_inference_interval(priority):
    if priority == "EMERGENCY":
        return PHASE27_EMERGENCY_INTERVAL

    if priority == "HIGH_RISK":
        return PHASE27_HIGH_RISK_INTERVAL

    if priority == "HIGH_CONGESTION":
        return PHASE27_HIGH_CONGESTION_INTERVAL

    return PHASE27_NORMAL_INTERVAL


def get_accident_inference_interval(priority):
    if priority == "EMERGENCY":
        return PHASE27_ACCIDENT_AI_ACTIVE_INTERVAL

    if priority == "HIGH_RISK":
        return PHASE27_ACCIDENT_AI_HIGH_RISK_INTERVAL

    if priority == "HIGH_CONGESTION":
        return PHASE27_ACCIDENT_AI_HIGH_CONGESTION_INTERVAL

    return PHASE27_ACCIDENT_AI_NORMAL_INTERVAL


def get_emergency_inference_interval(priority):
    if priority == "EMERGENCY":
        return PHASE27_EMERGENCY_AI_ACTIVE_INTERVAL

    if priority == "HIGH_RISK":
        return PHASE27_EMERGENCY_AI_HIGH_RISK_INTERVAL

    if priority == "HIGH_CONGESTION":
        return PHASE27_EMERGENCY_AI_HIGH_CONGESTION_INTERVAL

    return PHASE27_EMERGENCY_AI_NORMAL_INTERVAL


def should_run_vehicle_inference(camera, now):
    """Return True when vehicle YOLO should run for this camera."""

    if not PHASE27_ADAPTIVE_AI_ENABLED:
        return (
            camera.frame_counter % FRAME_SKIP == 0
        )

    # FRAME_SKIP remains a safety floor so we don't run inference
    # on every decoded frame even for high-priority cameras.
    if camera.frame_counter % FRAME_SKIP != 0:
        return False

    return (
        now - camera.last_vehicle_inference
        >= camera.inference_interval
    )


def cache_vehicle_results(
    camera,
    vehicle_results,
    vehicle_model,
):
    """Extract and cache lightweight vehicle state from YOLO results."""

    vehicle_breakdown = {
        "bicycle": 0,
        "car": 0,
        "motorcycle": 0,
        "bus": 0,
        "truck": 0,
    }

    road_vehicle_classes = set(
        vehicle_breakdown.keys()
    )

    vehicle_count = 0
    confidences = []

    for result in vehicle_results:
        for box in result.boxes:
            cls_id = int(box.cls[0])
            class_name = vehicle_model.names[cls_id]
            confidence = float(box.conf[0])

            if class_name in road_vehicle_classes:
                vehicle_count += 1
                vehicle_breakdown[class_name] += 1
                confidences.append(confidence)

    if confidences:
        average_confidence = (
            sum(confidences)
            / len(confidences)
        )
        max_confidence = max(confidences)
    else:
        average_confidence = 0.0
        max_confidence = 0.0

    if vehicle_count < 5:
        congestion = "LOW"
    elif vehicle_count < 15:
        congestion = "MEDIUM"
    else:
        congestion = "HIGH"

    camera.last_vehicle_count = vehicle_count
    camera.last_vehicle_breakdown = vehicle_breakdown
    camera.last_vehicle_average_confidence = average_confidence
    camera.last_vehicle_max_confidence = max_confidence
    camera.last_vehicle_congestion = congestion

    return (
        vehicle_count,
        vehicle_breakdown,
        average_confidence,
        max_confidence,
        congestion,
    )


VEHICLE_TRACK_CLASSES = {
    "bicycle",
    "car",
    "motorcycle",
    "bus",
    "truck",
}
VEHICLE_TRACK_MAX_FEATURES = 24
VEHICLE_TRACK_REFRESH_EVERY = 6
VEHICLE_TRACK_MIN_POINTS = 3


def _vehicle_box_features(gray_frame, box, max_corners=VEHICLE_TRACK_MAX_FEATURES):
    """Find image features inside a vehicle box for lightweight optical flow."""
    height, width = gray_frame.shape[:2]
    x1, y1, x2, y2 = [int(round(value)) for value in box]
    x1 = max(0, min(width - 1, x1))
    y1 = max(0, min(height - 1, y1))
    x2 = max(x1 + 1, min(width, x2))
    y2 = max(y1 + 1, min(height, y2))

    roi = gray_frame[y1:y2, x1:x2]
    if roi.size == 0 or roi.shape[0] < 5 or roi.shape[1] < 5:
        return np.empty((0, 1, 2), dtype=np.float32)

    points = cv2.goodFeaturesToTrack(
        roi,
        maxCorners=max_corners,
        qualityLevel=0.01,
        minDistance=4,
        blockSize=3,
    )
    if points is None or len(points) == 0:
        return np.empty((0, 1, 2), dtype=np.float32)

    points = points.astype(np.float32)
    points[:, 0, 0] += x1
    points[:, 0, 1] += y1
    return points


def refresh_vehicle_tracks(camera, frame, vehicle_results, vehicle_model):
    """Reset per-camera motion tracks from the newest YOLO vehicle detections."""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    frame_height, frame_width = gray.shape[:2]
    names = vehicle_model.names
    tracks = []
    now = time.monotonic()

    for result in vehicle_results:
        if result.boxes is None or len(result.boxes) == 0:
            continue

        for detection in result.boxes:
            class_id = int(detection.cls[0])
            if isinstance(names, dict):
                class_name = str(names.get(class_id, class_id)).lower()
            else:
                class_name = str(names[class_id]).lower()

            if class_name not in VEHICLE_TRACK_CLASSES:
                continue

            coordinates = detection.xyxy[0].detach().cpu().numpy().astype(np.float32)
            x1, y1, x2, y2 = coordinates.tolist()
            x1 = max(0.0, min(float(frame_width - 1), x1))
            y1 = max(0.0, min(float(frame_height - 1), y1))
            x2 = max(x1 + 2.0, min(float(frame_width), x2))
            y2 = max(y1 + 2.0, min(float(frame_height), y2))
            box = np.array([x1, y1, x2, y2], dtype=np.float32)
            points = _vehicle_box_features(gray, box)

            if len(points) < VEHICLE_TRACK_MIN_POINTS:
                # Skip boxes without enough visual features to follow safely.
                continue

            tracks.append({
                "box": box,
                "points": points,
                "class_name": class_name,
                "confidence": float(detection.conf[0]),
            })

    camera.vehicle_tracks = tracks
    camera.vehicle_previous_gray = gray
    camera.vehicle_track_frame_count = 0
    camera.vehicle_tracks_last_detection = now


def advance_vehicle_tracks(camera, frame):
    """Move cached YOLO boxes with sparse optical flow between detections."""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    previous_gray = camera.vehicle_previous_gray
    camera.vehicle_track_frame_count += 1

    if previous_gray is None:
        camera.vehicle_previous_gray = gray
        return

    now = time.monotonic()
    max_track_age = max(1.5, min(5.0, float(camera.inference_interval) * 1.75))
    height, width = gray.shape[:2]
    updated_tracks = []

    for track in camera.vehicle_tracks or []:
        if now - camera.vehicle_tracks_last_detection > max_track_age:
            continue

        previous_points = track.get("points")
        if previous_points is None or len(previous_points) < VEHICLE_TRACK_MIN_POINTS:
            continue

        next_points, status, _ = cv2.calcOpticalFlowPyrLK(
            previous_gray,
            gray,
            previous_points,
            None,
            winSize=(21, 21),
            maxLevel=2,
            criteria=(
                cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT,
                20,
                0.03,
            ),
        )

        if next_points is None or status is None:
            continue

        mask = status.reshape(-1).astype(bool)
        old_xy = previous_points.reshape(-1, 2)[mask]
        new_xy = next_points.reshape(-1, 2)[mask]
        if len(new_xy) < VEHICLE_TRACK_MIN_POINTS:
            continue

        displacement = new_xy - old_xy
        median_shift = np.median(displacement, axis=0)
        residual = np.linalg.norm(displacement - median_shift, axis=1)
        residual_limit = max(4.0, float(np.median(residual)) * 2.5)
        inliers = residual <= residual_limit
        if int(np.count_nonzero(inliers)) < VEHICLE_TRACK_MIN_POINTS:
            continue

        dx, dy = np.median(displacement[inliers], axis=0).tolist()
        if not np.isfinite(dx) or not np.isfinite(dy) or (dx * dx + dy * dy) > 120.0 ** 2:
            continue

        box = track["box"].astype(np.float32).copy()
        box += np.array([dx, dy, dx, dy], dtype=np.float32)
        box[0] = max(0.0, min(float(width - 1), box[0]))
        box[1] = max(0.0, min(float(height - 1), box[1]))
        box[2] = max(box[0] + 2.0, min(float(width), box[2]))
        box[3] = max(box[1] + 2.0, min(float(height), box[3]))

        track["box"] = box
        track["points"] = new_xy[inliers].astype(np.float32).reshape(-1, 1, 2)

        # Re-seed features periodically so the optical-flow points do not
        # disappear as vehicles move or become partially occluded.
        if camera.vehicle_track_frame_count % VEHICLE_TRACK_REFRESH_EVERY == 0:
            refreshed = _vehicle_box_features(gray, box)
            if len(refreshed) >= VEHICLE_TRACK_MIN_POINTS:
                track["points"] = refreshed

        updated_tracks.append(track)

    camera.vehicle_tracks = updated_tracks
    camera.vehicle_previous_gray = gray


def draw_vehicle_tracks(frame, camera):
    """Draw the latest tracked vehicle boxes on every outgoing YOLO frame."""
    for track in camera.vehicle_tracks or []:
        x1, y1, x2, y2 = [int(round(value)) for value in track["box"]]
        if x2 <= x1 or y2 <= y1:
            continue

        color = (40, 220, 80)
        label = (
            f"{track['class_name'].upper()} "
            f"{track['confidence'] * 100:.0f}%"
        )
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
        cv2.putText(
            frame,
            label,
            (x1, max(18, y1 - 7)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.55,
            color,
            2,
            cv2.LINE_AA,
        )


# =========================================================
# MAIN
# =========================================================

def main():

    print(
        "========================================"
    )

    print(
        "🚦 TrafficMind AI "
        "SINGLE-PROCESS RUNNER"
    )

    print(
        "========================================"
    )


    # =====================================================
    # Load Models Once
    # =====================================================

    print(
        "\n🤖 Loading vehicle model..."
    )

    vehicle_model = YOLO(
        VEHICLE_MODEL_PATH
    )

    print(
        "✅ Vehicle model loaded."
    )

    print(
        "\n🤖 Loading accident model..."
    )

    accident_model = YOLO(
        ACCIDENT_MODEL_PATH
    )

    print(
        "✅ Accident model loaded."
    )

    print(
        "\n🤖 Loading emergency vehicle model..."
    )

    emergency_model = YOLO(
        EMERGENCY_MODEL_PATH
    )

    print(
        "✅ Emergency vehicle model loaded."
    )

    print(
        "   Emergency classes:",
        emergency_model.names
    )

    # Register the existing model instances for shared inference.
    AI_MODELS["vehicle"] = vehicle_model
    AI_MODELS["accident"] = accident_model
    AI_MODELS["emergency"] = emergency_model

    # Signal that all models are ready.
    AI_MODELS_READY.set()

    print("✅ Shared YOLO model registry is ready.")

    # =====================================================
    # Start local stream server before fetching camera config.
    # It remains available while the registry or RTSP cameras recover.
    # =====================================================

    stream_server = start_stream_server()

        # =====================================================
    # IMAGE-ONLY MODE
    # Load YOLO models without opening live cameras.
    # =====================================================

    image_only_mode = (
        os.getenv(
            "TRAFFIC_IMAGE_ONLY_MODE",
            "false",
        ).strip().lower()
        in {"1", "true", "yes", "on"}
    )

    if image_only_mode:
        print("✅ TrafficMind Image-Only Mode started.")
        print("✅ YOLO models are ready for uploaded-image analysis.")
        print("✅ Live cameras are not being initialized.")

        try:
            while True:
                time.sleep(0.5)

        except KeyboardInterrupt:
            print("Image-Only Mode stopping.")

        finally:
            AI_MODELS_READY.clear()
            stream_server.shutdown()
            stream_server.server_close()

            print("Image-Only Mode stopped.")

        return


    # =====================================================
    # Create Cameras
    # =====================================================

    global CAMERA_CONFIGS

    try:
        CAMERA_CONFIGS = load_camera_configs()
    except Exception as error:
        CAMERA_CONFIGS = []
        print(
            "⚠️ Initial camera configuration unavailable. "
            "The runner will retry automatically: "
            f"{error}"
        )

    cameras = []

    for config in CAMERA_CONFIGS:

        camera = build_camera_runtime(
            config
        )

        if (
            camera.latitude is None
            or camera.longitude is None
        ):
            print(
                f"⚠️ {camera.camera_id} "
                "has no latitude/longitude in backend camera configuration. "
                "5 km emergency propagation will ignore this camera."
            )

        cameras.append(
            camera
        )

        cameras_by_id[
            camera.camera_id
        ] = camera


    # =====================================================
    # Open Cameras
    # =====================================================

    print(
        "\n📹 Opening camera sources..."
    )

    for camera in cameras:

        print(
            f"\n{camera.camera_id}"
        )

        print(
            f"Source: {display_source(camera.source)}"
        )

        if not open_capture(
            camera
        ):

            print(
                f"❌ {camera.camera_id} "
                "could not open."
            )

            continue

        print(
            f"✅ {camera.camera_id} "
            "opened."
        )

        if warmup_capture(
            camera
        ):

            print(
                f"🟢 {camera.camera_id} "
                "ready."
            )

        else:

            print(
                f"⚠️ {camera.camera_id} "
                "warm-up failed."
            )


    active = [
        camera
        for camera in cameras
        if (
            (
                camera.capture is not None
                and camera.capture.isOpened()
            )
            or (
                camera.ffmpeg_process is not None
                and camera.ffmpeg_stream_ready
            )
        )
    ]

    if not active:
        print(
            "⚠️ No cameras are currently available. "
            "The edge runner will stay online and retry RTSP connections."
        )


    print(
        "\n✅ Camera initialization complete."
    )

    print(
        f"🟢 Active cameras: "
        f"{len(active)} / {len(cameras)}"
    )

    # =====================================================
    # Phase 27 summary
    # =====================================================

    print(
        "🧠 Phase 27 Adaptive AI: "
        f"{'ENABLED' if PHASE27_ADAPTIVE_AI_ENABLED else 'DISABLED'}"
    )

    print(
        "   Vehicle AI intervals (effective): "
        f"Emergency={PHASE27_EMERGENCY_INTERVAL:.2f}s | "
        f"HighRisk={PHASE27_HIGH_RISK_INTERVAL:.2f}s | "
        f"HighCongestion={PHASE27_HIGH_CONGESTION_INTERVAL:.2f}s | "
        f"Normal={PHASE27_NORMAL_INTERVAL:.2f}s"
    )
    print(
        "   Vehicle stream overlay: optical-flow tracking between YOLO inferences"
    )


    print(
        "\n🔥 Single AI process started."
    )

    print(
        "All cameras share the loaded YOLO models."
    )

    print(
        "🎥 Live YOLO streams are available."
    )

    print(
        f"⚡ Accident AI interval: "
        f"{ACCIDENT_ANALYSIS_INTERVAL:.1f}s"
    )


    print(
        f"🚨 Emergency AI interval: "
        f"{EMERGENCY_ANALYSIS_INTERVAL:.1f}s"
    )


    print(
        f"🔄 Emergency handoff lookup: "
        f"{EMERGENCY_HANDOFF_LOOKUP_INTERVAL:.1f}s"
    )

    print(
        f"🧠 Emergency re-identification threshold: "
        f"{EMERGENCY_REID_MIN_SCORE:.2f}"
    )

    print(
        f"🔎 Emergency recovery polling: "
        f"{EMERGENCY_RECOVERY_POLL_INTERVAL:.1f}s"
    )

    print(
        "📍 Camera coordinate check:"
    )

    for camera in cameras:
        print(
            f"   {camera.camera_id} → "
            f"lat={camera.latitude}, "
            f"lon={camera.longitude}"
        )


    backend_executor = ThreadPoolExecutor(
        max_workers=4
    )


    # =====================================================
    # Main Loop
    # =====================================================

    last_no_active_log = 0.0

    try:

        while True:

            # -----------------------------------------
            # Phase 28 — Dynamic real camera registry
            # -----------------------------------------

            maybe_refresh_camera_registry(
                cameras,
                active,
            )

            reactivate_inactive_rtsp_cameras(
                cameras,
                active,
            )

            for camera in list(
                active
            ):

                # -----------------------------------------
                # Phase 27/28 — RTSP Recovery
                # -----------------------------------------

                recover_rtsp_camera(
                    camera
                )

                # -----------------------------------------
                # Read frame
                # -----------------------------------------

                success, frame = (
                    read_camera_frame(camera)
                )

                if (
                    not success
                    or frame is None
                ):

                    if is_video_file(
                        camera.source
                    ):

                        if restart_video(
                            camera
                        ):

                            success, frame = (
                                camera.capture.read()
                            )

                        else:

                            continue

                    else:

                        camera.consecutive_failures += 1

                        if is_rtsp_source(camera.source):
                            # The RTSP watchdog uses process health and frame age.
                            # Do not evict RTSP cameras after a few fast empty reads;
                            # leave them monitored so the same camera can recover.
                            continue

                        if (
                            camera.consecutive_failures
                            >= 10
                        ):

                            print(
                                f"❌ "
                                f"{camera.camera_id} "
                                "stopped."
                            )

                            if camera.capture is not None:
                                camera.capture.release()

                            _stop_ffmpeg(camera)

                            if camera in active:
                                active.remove(
                                    camera
                                )

                        continue


                camera.consecutive_failures = 0

                # Preserve the untouched source frame so the
                # browser can show the original camera feed.
                update_source_live_frame(
                    camera,
                    frame,
                )

                camera.frame_counter += 1


                # -----------------------------------------
                # Phase 27 — Adaptive inference priority
                # -----------------------------------------

                processing_now = time.monotonic()

                camera.inference_priority = (
                    get_camera_inference_priority(
                        camera
                    )
                )

                camera.inference_interval = (
                    get_camera_inference_interval(
                        camera.inference_priority
                    )
                )

                should_run_vehicle_ai = (
                    should_run_vehicle_inference(
                        camera,
                        processing_now,
                    )
                )

                vehicle_results = []
                fresh_vehicle_inference = False

                if should_run_vehicle_ai:
                    try:
                        with AI_INFERENCE_LOCK:
                            vehicle_results = (
                                vehicle_model(
                                    frame,
                                    imgsz=IMG_SIZE,
                                    conf=VEHICLE_CONFIDENCE,
                                    device=0,
                                    verbose=False,
                                )
                            )

                        (
                            vehicle_count,
                            vehicle_breakdown,
                            average_confidence,
                            max_confidence,
                            congestion,
                        ) = cache_vehicle_results(
                            camera,
                            vehicle_results,
                            vehicle_model,
                        )

                        camera.last_vehicle_inference = (
                            processing_now
                        )
                        camera.last_inference_reason = (
                            camera.inference_priority
                        )
                        fresh_vehicle_inference = True

                    except Exception as error:
                        print(
                            f"⚠️ "
                            f"{camera.camera_id} "
                            f"vehicle AI error: "
                            f"{error}"
                        )

                else:
                    vehicle_count = (
                        camera.last_vehicle_count
                    )

                    vehicle_breakdown = (
                        camera.last_vehicle_breakdown
                        or {
                            "bicycle": 0,
                            "car": 0,
                            "motorcycle": 0,
                            "bus": 0,
                            "truck": 0,
                        }
                    )

                    average_confidence = (
                        camera.last_vehicle_average_confidence
                    )

                    max_confidence = (
                        camera.last_vehicle_max_confidence
                    )

                    congestion = (
                        camera.last_vehicle_congestion
                        or "LOW"
                    )


                # -----------------------------------------
                # Accident AI
                # -----------------------------------------
                #
                # The accident model is heavier than the
                # vehicle model. Run it periodically and
                # keep the latest result between analyses.
                # This keeps the live stream responsive.

                processing_now = time.monotonic()

                accident_interval = (
                    get_accident_inference_interval(
                        camera.inference_priority
                    )
                    if PHASE27_ADAPTIVE_AI_ENABLED
                    else ACCIDENT_ANALYSIS_INTERVAL
                )

                if (
                    processing_now
                    - camera.last_accident_analysis
                    >= accident_interval
                ):

                    try:

                        with AI_INFERENCE_LOCK:
                            accident_results = (
                                accident_model(
                                    frame,
                                    imgsz=IMG_SIZE,
                                    conf=ACCIDENT_CONFIDENCE,
                                    device=0,
                                    verbose=False,
                                )
                            )

                        # =================================================
                        # ACCIDENT DEBUG
                        # =================================================
                        debug_box_count = 0

                        for debug_result in accident_results:
                            if (
                                debug_result.boxes is None
                                or len(debug_result.boxes) == 0
                            ):
                                continue

                            for debug_box in debug_result.boxes:
                                debug_box_count += 1

                                debug_cls_id = int(
                                    debug_box.cls[0]
                                )

                                debug_confidence = float(
                                    debug_box.conf[0]
                                )

                                debug_class_name = (
                                    accident_model.names[
                                        debug_cls_id
                                    ]
                                )

                                print(
                                    "[ACCIDENT DEBUG] "
                                    f"camera={camera.camera_id} "
                                    f"class={debug_class_name} "
                                    f"confidence="
                                    f"{debug_confidence:.3f}"
                                )

                        if debug_box_count == 0:
                            print(
                                "[ACCIDENT DEBUG] "
                                f"camera={camera.camera_id} "
                                "No accident-model boxes detected"
                            )



                        camera.last_accident_analysis = (
                            processing_now
                        )

                        # =================================================
                        # TEMPORAL ACCIDENT PERSISTENCE
                        # =================================================
                        # A fresh Accident detection immediately activates
                        # the alert. Short detector misses do not instantly
                        # erase the confirmed state.
                        current_accident_boxes = []
                        current_max_accident_confidence = 0.0

                        for result in accident_results:

                            if (
                                result.boxes is None
                                or len(result.boxes) == 0
                            ):
                                continue

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
                                    and confidence
                                    >= ACCIDENT_CONFIDENCE
                                ):

                                    x1, y1, x2, y2 = map(
                                        int,
                                        box.xyxy[0],
                                    )

                                    current_accident_boxes.append(
                                        (
                                            x1,
                                            y1,
                                            x2,
                                            y2,
                                            confidence,
                                        )
                                    )

                                    current_max_accident_confidence = max(
                                        current_max_accident_confidence,
                                        confidence,
                                    )

                        if current_accident_boxes:
                            camera.accident_detected = True
                            camera.accident_severity = "HIGH"
                            camera.accident_missed_analyses = 0
                            camera.accident_candidate_confidence = (
                                current_max_accident_confidence
                            )
                            camera.accident_boxes = (
                                current_accident_boxes
                            )

                            print(
                                "[ACCIDENT CONFIRMED] "
                                f"camera={camera.camera_id} "
                                f"confidence="
                                f"{current_max_accident_confidence:.3f}"
                            )

                        elif camera.accident_detected:
                            camera.accident_missed_analyses += 1

                            if (
                                camera.accident_missed_analyses
                                <= ACCIDENT_MAX_MISSES
                            ):
                                print(
                                    "[ACCIDENT PERSISTED] "
                                    f"camera={camera.camera_id} "
                                    f"miss="
                                    f"{camera.accident_missed_analyses}/"
                                    f"{ACCIDENT_MAX_MISSES} "
                                    f"last_confidence="
                                    f"{camera.accident_candidate_confidence:.3f}"
                                )
                            else:
                                camera.accident_detected = False
                                camera.accident_severity = "NONE"
                                camera.accident_boxes = []
                                camera.accident_missed_analyses = 0
                                camera.accident_candidate_confidence = 0.0

                                print(
                                    "[ACCIDENT CLEARED] "
                                    f"camera={camera.camera_id} "
                                    "no fresh accident evidence"
                                )

                        else:
                            camera.accident_severity = "NONE"
                            camera.accident_boxes = []
                            camera.accident_missed_analyses = 0
                            camera.accident_candidate_confidence = 0.0

                    except Exception as error:

                        camera.last_accident_analysis = (
                            processing_now
                        )

                        print(
                            f"⚠️ "
                            f"{camera.camera_id} "
                            f"accident AI error: "
                            f"{error}"
                        )

                accident_detected = (
                    camera.accident_detected
                )

                accident_severity = (
                    camera.accident_severity
                )

                # -----------------------------------------
                # Emergency Vehicle AI
                # -----------------------------------------
                #
                # The uploaded model has:
                # Ambulance, Fire_Truck, Police, Vehicle.
                # Generic "Vehicle" is deliberately ignored.
                #
                # Run less frequently than vehicle AI to
                # protect the CPU-only live pipeline.

                emergency_interval = (
                    get_emergency_inference_interval(
                        camera.inference_priority
                    )
                    if PHASE27_ADAPTIVE_AI_ENABLED
                    else EMERGENCY_ANALYSIS_INTERVAL
                )

                if (
                    processing_now
                    - camera.last_emergency_analysis
                    >= emergency_interval
                ):

                    try:

                        with AI_INFERENCE_LOCK:
                            emergency_results = emergency_model(
                                frame,
                                imgsz=IMG_SIZE,
                                conf=EMERGENCY_CONFIDENCE,
                                device=0,
                                verbose=False,
                            )

                        # Commit a fresh result only after inference and result
                        # parsing complete. This avoids clearing valid cached
                        # state if an unexpected result-format error occurs.
                        detected_boxes = []
                        best_emergency_type = ""
                        best_emergency_confidence = 0.0
                        best_emergency_bbox = None

                        frame_height, frame_width = frame.shape[:2]

                        for result in emergency_results:

                            boxes = getattr(result, "boxes", None)
                            if boxes is None:
                                continue

                            class_names = getattr(result, "names", None)
                            if class_names is None:
                                class_names = emergency_model.names

                            for box in boxes:

                                if box.cls is None or box.conf is None:
                                    continue

                                cls_id = int(box.cls[0].item())
                                confidence = float(box.conf[0].item())

                                if not np.isfinite(confidence):
                                    continue

                                if confidence < EMERGENCY_CONFIDENCE:
                                    continue

                                # Ultralytics may expose names as a dict or list.
                                if isinstance(class_names, dict):
                                    class_name = class_names.get(cls_id, "")
                                elif (
                                    isinstance(class_names, (list, tuple))
                                    and 0 <= cls_id < len(class_names)
                                ):
                                    class_name = class_names[cls_id]
                                else:
                                    continue

                                emergency_type = normalize_emergency_type(
                                    class_name
                                )

                                # Ignore generic "Vehicle" and unknown classes.
                                if emergency_type is None:
                                    continue

                                if box.xyxy is None:
                                    continue

                                coordinates = box.xyxy[0].tolist()
                                if len(coordinates) != 4:
                                    continue

                                if not np.all(np.isfinite(coordinates)):
                                    continue

                                x1, y1, x2, y2 = map(int, coordinates)

                                # Clamp coordinates to the source frame.
                                x1 = max(0, min(frame_width - 1, x1))
                                y1 = max(0, min(frame_height - 1, y1))
                                x2 = max(0, min(frame_width, x2))
                                y2 = max(0, min(frame_height, y2))

                                if x2 <= x1 or y2 <= y1:
                                    continue

                                detected_boxes.append(
                                    (
                                        x1,
                                        y1,
                                        x2,
                                        y2,
                                        confidence,
                                        emergency_type,
                                    )
                                )

                                if confidence > best_emergency_confidence:
                                    best_emergency_type = emergency_type
                                    best_emergency_confidence = confidence
                                    best_emergency_bbox = (x1, y1, x2, y2)

                        # Successful inference: replace the cached state,
                        # including clearing it when no emergency is detected.
                        camera.last_emergency_analysis = processing_now
                        camera.emergency_boxes = detected_boxes
                        camera.emergency_detected = bool(detected_boxes)
                        camera.emergency_vehicle_type = best_emergency_type
                        camera.emergency_confidence = best_emergency_confidence
                        camera.emergency_signature = (
                            build_emergency_signature(
                                frame,
                                best_emergency_bbox,
                            )
                            if best_emergency_bbox is not None
                            else []
                        )

                    except Exception as error:

                        camera.last_emergency_analysis = (
                            processing_now
                        )

                        print(
                            f"⚠️ "
                            f"{camera.camera_id} "
                            f"emergency AI error: "
                            f"{error}"
                        )

                # -----------------------------------------
                # Phase 14 — Automatic Emergency Event
                # -----------------------------------------
                if (
                    camera.emergency_detected
                    and camera.emergency_vehicle_type
                    and camera.emergency_confidence
                    >= EMERGENCY_CONFIDENCE
                ):
                    event = reconcile_ai_emergency(
                        camera,
                        camera.emergency_vehicle_type,
                        camera.emergency_confidence,
                    )

                    if event:
                        camera.emergency_event_id = (
                            event.get(
                                "emergencyId",
                                camera.emergency_event_id,
                            )
                        )

                # -----------------------------------------
                # Phase 20 — Lost Vehicle Recovery
                # -----------------------------------------
                poll_ai_emergency_recovery()

                # -----------------------------------------
                # Vehicle Detection / Cached State
                # -----------------------------------------

                annotated_frame = (
                    frame.copy()
                )

                # Refresh optical-flow tracks after a new YOLO inference;
                # otherwise move existing boxes with the current video frame.
                # This keeps annotations visible between inference cycles without
                # leaving boxes frozen at their old positions.
                if fresh_vehicle_inference:
                    refresh_vehicle_tracks(
                        camera,
                        frame,
                        vehicle_results,
                        vehicle_model,
                    )
                else:
                    advance_vehicle_tracks(camera, frame)

                draw_vehicle_tracks(
                    annotated_frame,
                    camera,
                )


                # -----------------------------------------
                # Cached Accident Overlay
                # -----------------------------------------

                for (
                    x1,
                    y1,
                    x2,
                    y2,
                    confidence,
                ) in (
                    camera.accident_boxes or []
                ):

                    cv2.rectangle(
                        annotated_frame,
                        (x1, y1),
                        (x2, y2),
                        (0, 0, 255),
                        3,
                    )

                    cv2.putText(
                        annotated_frame,
                        (
                            "ACCIDENT "
                            f"{confidence * 100:.1f}%"
                        ),
                        (
                            x1,
                            max(
                                y1 - 10,
                                25,
                            ),
                        ),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.8,
                        (0, 0, 255),
                        2,
                    )

                # -----------------------------------------
                # Emergency Vehicle Overlay
                # -----------------------------------------

                for (
                    x1,
                    y1,
                    x2,
                    y2,
                    confidence,
                    emergency_type,
                ) in (
                    camera.emergency_boxes
                    or []
                ):

                    cv2.rectangle(
                        annotated_frame,
                        (x1, y1),
                        (x2, y2),
                        (0, 165, 255),
                        3,
                    )

                    cv2.putText(
                        annotated_frame,
                        (
                            "EMERGENCY "
                            f"{emergency_type.upper()} "
                            f"{confidence * 100:.1f}%"
                        ),
                        (
                            x1,
                            max(y1 - 10, 25),
                        ),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.7,
                        (0, 165, 255),
                        2,
                    )

                # -----------------------------------------
                # Traffic State
                # -----------------------------------------

                (
                    congestion,
                    recommendation,
                    signal_time,
                    emergency_detected,
                    accident_severity,
                ) = calculate_state(
                    vehicle_count,
                    accident_detected,
                )


                # -----------------------------------------
                # Draw Overlay
                # -----------------------------------------

                annotated_frame = (
                    draw_overlay(
                        annotated_frame,
                        camera.camera_id,
                        vehicle_count,
                        congestion,
                        average_confidence,
                        recommendation,
                        signal_time,
                        accident_detected,
                        accident_severity,
                    )
                )

                # -----------------------------------------
                # Phase 27 priority overlay
                # -----------------------------------------

                cv2.putText(
                    annotated_frame,
                    (
                        "AI Priority : "
                        f"{camera.inference_priority}"
                    ),
                    (20, 345),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (255, 255, 255),
                    2,
                )

                cv2.putText(
                    annotated_frame,
                    (
                        "AI Interval : "
                        f"{camera.inference_interval:.1f}s"
                    ),
                    (20, 375),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.65,
                    (255, 255, 255),
                    2,
                )


                # -----------------------------------------
                # Update Live Stream
                # -----------------------------------------

                update_live_frame(
                    camera,
                    annotated_frame,
                )


                # -----------------------------------------
                # Backend Update
                # -----------------------------------------

                now = time.monotonic()

                if (
                    now
                    - camera.last_backend_update
                    >= LIVE_UPDATE_INTERVAL
                ):

                    payload = {
                        "cameraId":
                            camera.camera_id,

                        "vehicleCount":
                            vehicle_count,

                        "vehicleBreakdown":
                            vehicle_breakdown,

                        "congestion":
                            congestion,

                        "averageConfidence":
                            average_confidence,

                        "maxConfidence":
                            max_confidence,

                        "recommendation":
                            recommendation,

                        "emergencyDetected":
                            (
                                camera.emergency_detected
                                or emergency_detected
                            ),

                        "emergencyVehicleType":
                            camera.emergency_vehicle_type,

                        "emergencyConfidence":
                            camera.emergency_confidence,

                        "accidentDetected":
                            accident_detected,

                        "accidentSeverity":
                            accident_severity,
                    }

                    backend_executor.submit(
                        send_backend_update,
                        payload.copy(),
                    )

                    camera.last_backend_update = now


                # -----------------------------------------
                # Optional Local Preview
                # -----------------------------------------

                if not HEADLESS:

                    cv2.imshow(
                        (
                            "TrafficMind AI - "
                            f"{camera.camera_id}"
                        ),
                        annotated_frame,
                    )


            if not active:
                now = time.monotonic()
                if now - last_no_active_log >= 15.0:
                    print(
                        "⚠️ No active cameras. The runner is still alive "
                        "and will retry the RTSP registry/connections."
                    )
                    last_no_active_log = now


            if not HEADLESS:

                key = (
                    cv2.waitKey(1)
                    & 0xFF
                )

                if key == ord("q"):
                    break

            else:

                time.sleep(
                    1.0 if not active else 0.001
                )


    except KeyboardInterrupt:

        print(
            "\n🛑 Stop requested by user."
        )

    finally:

        for camera in cameras:

            close_camera_runtime(
                camera
            )

        if not HEADLESS:

            cv2.destroyAllWindows()

        try:

            backend_executor.shutdown(
                wait=False,
                cancel_futures=True,
            )

        except Exception:
            pass

        try:

            stream_server.shutdown()

            stream_server.server_close()

        except Exception:
            pass

        print(
            "🔴 Single-process "
            "multi-camera AI stopped."
        )


if __name__ == "__main__":

    main()
