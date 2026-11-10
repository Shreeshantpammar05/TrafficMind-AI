
"""TrafficMind AI Edge Agent.

Run this on the Windows laptop that owns the RTX GPU and camera network.
It stays idle until an administrator activates a 40-minute demo session in
AI Vision Center. All traffic to Render is outbound HTTPS; port 5050 remains
bound to 127.0.0.1 and is never exposed to the internet.
"""

from __future__ import annotations

import base64
import os
import signal
import subprocess
import sys
import threading
import time
from pathlib import Path
from typing import Dict, Iterable
from urllib.parse import urlparse

import cv2
import numpy as np
import requests
from dotenv import load_dotenv, dotenv_values

BACKEND_DIR = Path(__file__).resolve().parents[1]
PROJECT_DIR = BACKEND_DIR.parent
RUNNER_PATH = BACKEND_DIR / "ai" / "multi_camera_runner.py"
ENV_PATH = BACKEND_DIR / ".env"

load_dotenv(ENV_PATH)

# Make the six documented performance values in backend/.env authoritative.
# Other environment variables (especially the staging API URLs injected into
# the child runner) keep their normal environment precedence.
_PERFORMANCE_ENV = dotenv_values(ENV_PATH)
for _performance_key in (
    "TRAFFIC_EDGE_FRAME_INTERVAL",
    "TRAFFIC_EDGE_MAX_FRAME_WIDTH",
    "TRAFFIC_EDGE_JPEG_QUALITY",
    "TRAFFIC_AI_NORMAL_INTERVAL",
    "TRAFFIC_AI_HIGH_CONGESTION_INTERVAL",
    "TRAFFIC_AI_HIGH_RISK_INTERVAL",
):
    _performance_value = _PERFORMANCE_ENV.get(_performance_key)
    if _performance_value is not None and str(_performance_value).strip():
        os.environ[_performance_key] = str(_performance_value).strip()

BACKEND_URL = os.getenv("TRAFFIC_EDGE_BACKEND_URL", "").strip().rstrip("/")
BACKEND_HOST = (urlparse(BACKEND_URL).hostname or "").lower()
LOCAL_BACKEND = BACKEND_HOST in {"localhost", "127.0.0.1", "::1"}
INTERNAL_AI_KEY = os.getenv("INTERNAL_AI_KEY", "").strip()
LOCAL_STREAM_BASE = os.getenv("TRAFFIC_EDGE_LOCAL_STREAM_BASE", "http://127.0.0.1:5050").strip().rstrip("/")
POLL_SECONDS = max(1.0, float(os.getenv("TRAFFIC_EDGE_POLL_SECONDS", "2")))
FRAME_INTERVAL_SECONDS = max(0.08, float(os.getenv("TRAFFIC_EDGE_FRAME_INTERVAL", "0.10")))
MAX_FRAME_WIDTH = max(320, int(os.getenv("TRAFFIC_EDGE_MAX_FRAME_WIDTH", "800")))
JPEG_QUALITY = min(90, max(35, int(os.getenv("TRAFFIC_EDGE_JPEG_QUALITY", "64"))))

HTTP = requests.Session()
HTTP.headers.update({"X-Internal-AI-Key": INTERNAL_AI_KEY})


def log(message: str) -> None:
    print(f"[TRAFFICMIND EDGE] {message}", flush=True)


def validate_configuration() -> None:
    if not BACKEND_URL:
        raise RuntimeError(
            "TRAFFIC_EDGE_BACKEND_URL is missing in backend/.env. "
            "Set it to your Render STAGING backend URL."
        )
    if not BACKEND_URL.startswith("https://") and not BACKEND_URL.startswith("http://localhost"):
        raise RuntimeError("TRAFFIC_EDGE_BACKEND_URL must use HTTPS (or localhost for local testing).")
    if not INTERNAL_AI_KEY:
        raise RuntimeError("INTERNAL_AI_KEY is missing in backend/.env.")
    if not RUNNER_PATH.exists():
        raise RuntimeError(f"AI runner not found: {RUNNER_PATH}")


def endpoint(path: str) -> str:
    return f"{BACKEND_URL}/api/demo-control{path}"


def send_heartbeat(runner_running: bool, error: str = "") -> None:
    try:
        HTTP.post(
            endpoint("/edge/heartbeat"),
            json={"runnerRunning": runner_running, "error": error[:300]},
            timeout=8,
        ).raise_for_status()
    except requests.RequestException as exc:
        log(f"Heartbeat retry needed: {exc}")


def get_command() -> dict:
    response = HTTP.get(endpoint("/edge/command"), timeout=8)
    response.raise_for_status()
    data = response.json()
    if not isinstance(data, dict):
        raise RuntimeError("Invalid control response from backend")
    return data


def local_runner_is_responding() -> bool:
    try:
        response = requests.get(f"{LOCAL_STREAM_BASE}/health", timeout=2)
        return response.ok
    except requests.RequestException:
        return False


def start_runner(
    heartbeat_callback=None,
    image_only: bool = False,
) -> subprocess.Popen:
    if local_runner_is_responding():
        raise RuntimeError(
            "A runner is already listening on local port 5050. Stop the manually started "
            "multi_camera_runner.py with Ctrl+C before the Edge Agent starts its runner."
        )

    child_env = os.environ.copy()
    # Force cloud API URLs for this child process; do not overwrite the user's .env.
    child_env["LIVE_UPDATE_URL"] = f"{BACKEND_URL}/api/live-update"
    child_env["AI_CAMERA_CONFIG_URL"] = f"{BACKEND_URL}/api/ai-camera-config"
    child_env["TRAFFIC_STREAM_HOST"] = "127.0.0.1"
    child_env["TRAFFIC_STREAM_PORT"] = "5050"
    child_env["TRAFFIC_DEMO_MODE"] = "1"
    child_env["TRAFFIC_IMAGE_ONLY_MODE"] = "1" if image_only else "0"

    creationflags = 0
    if os.name == "nt":
        creationflags = subprocess.CREATE_NEW_PROCESS_GROUP

    if image_only:
        log("Starting YOLO runner in uploaded-image-only mode...")
    else:
        log("Starting the existing multi-camera YOLO runner...")

    process = subprocess.Popen(
        [sys.executable, str(RUNNER_PATH)],
        cwd=str(BACKEND_DIR),
        env=child_env,
        stdout=None,
        stderr=None,
        creationflags=creationflags,
    )

    deadline = time.monotonic() + 120
    last_startup_heartbeat = 0.0
    while time.monotonic() < deadline:
        if heartbeat_callback and time.monotonic() - last_startup_heartbeat >= 4:
            message = (
                "Loading YOLO models for uploaded-image analysis..."
                if image_only
                else "Loading YOLO models and initializing cameras..."
            )
            heartbeat_callback(False, message)
            last_startup_heartbeat = time.monotonic()
        if process.poll() is not None:
            raise RuntimeError(
                f"YOLO runner exited during startup (exit code {process.returncode}). "
                "Check the runner output above."
            )
        if local_runner_is_responding():
            log("YOLO inference server is ready on 127.0.0.1:5050.")
            return process
        time.sleep(1)

    stop_runner(process)
    raise RuntimeError("YOLO runner did not expose its local service within 120 seconds.")


def stop_runner(process: subprocess.Popen | None) -> None:
    if process is None or process.poll() is not None:
        return

    log("Stopping the YOLO runner and its child processes...")
    try:
        if os.name == "nt":
            # /T stops FFmpeg children created by the camera runner too.
            subprocess.run(
                ["taskkill", "/PID", str(process.pid), "/T", "/F"],
                check=False,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                timeout=15,
            )
        else:
            process.send_signal(signal.SIGTERM)
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                process.kill()
    except Exception as exc:  # noqa: BLE001
        log(f"Runner stop warning: {exc}")


def report_image_job_failure(job_id: str, message: str) -> None:
    """Best-effort notification so a failed local inference does not block the queue."""
    try:
        HTTP.post(
            endpoint(f"/edge/image-jobs/{job_id}/fail"),
            json={"error": str(message)[:300]},
            timeout=10,
        ).raise_for_status()
    except requests.RequestException as exc:
        log(f"Could not report image job failure {job_id}: {exc}")


def process_one_image_job(ensure_runner_callback) -> bool:
    """Claim one Render job, infer on the local GPU, and upload JSON + JPEG result."""
    job_id = ""
    try:
        response = HTTP.get(
            endpoint("/edge/image-jobs/next"),
            timeout=(5, 20),
        )
        if response.status_code == 204:
            return False
        response.raise_for_status()

        job_id = str(response.headers.get("X-Image-Job-Id", "")).strip()
        content_type = str(response.headers.get("Content-Type", "")).split(";", 1)[0].strip().lower()
        image_bytes = response.content

        if not job_id:
            raise RuntimeError("Backend returned an image job without an ID.")
        if content_type not in {"image/jpeg", "image/png", "image/webp"}:
            raise RuntimeError(f"Unsupported queued image content type: {content_type or 'missing'}")
        if not image_bytes or len(image_bytes) > 10 * 1024 * 1024:
            raise RuntimeError("Queued image is empty or exceeds the 10 MB limit.")

        ensure_runner_callback()

        local_response = requests.post(
            f"{LOCAL_STREAM_BASE}/analyze-image",
            data=image_bytes,
            headers={"Content-Type": content_type},
            timeout=(10, 180),
        )
        local_response.raise_for_status()
        analysis = local_response.json()

        if not isinstance(analysis, dict) or not analysis.get("success"):
            raise RuntimeError(
                str(analysis.get("error", "Local GPU inference failed."))
                if isinstance(analysis, dict)
                else "Local GPU returned an invalid response."
            )

        image_data_url = analysis.get("jpg") or analysis.get("annotatedImage")
        if not isinstance(image_data_url, str) or "," not in image_data_url:
            raise RuntimeError("Local GPU did not return an annotated JPEG image.")

        data_header, image_encoded = image_data_url.split(",", 1)
        if "image/jpeg" not in data_header.lower() or "base64" not in data_header.lower():
            raise RuntimeError("Local GPU returned an unsupported annotated-image format.")

        try:
            annotated_jpeg = base64.b64decode(image_encoded, validate=True)
        except Exception as exc:
            raise RuntimeError("Local GPU returned invalid annotated-image data.") from exc

        if not annotated_jpeg or len(annotated_jpeg) > 10 * 1024 * 1024:
            raise RuntimeError("Annotated JPEG is empty or exceeds the 10 MB limit.")

        result_payload = {
            key: value
            for key, value in analysis.items()
            if key not in {"jpg", "annotatedImage", "annotatedImageMimeType"}
        }

        metadata_response = HTTP.post(
            endpoint(f"/edge/image-jobs/{job_id}/result"),
            json=result_payload,
            timeout=20,
        )
        metadata_response.raise_for_status()

        image_response = HTTP.post(
            endpoint(f"/edge/image-jobs/{job_id}/image"),
            data=annotated_jpeg,
            headers={"Content-Type": "image/jpeg"},
            timeout=(10, 45),
        )
        image_response.raise_for_status()

        log(f"Uploaded-image GPU job completed: {job_id}")
        return True

    except Exception as exc:  # noqa: BLE001
        message = str(exc)[:300]
        if job_id:
            report_image_job_failure(job_id, message)
        log(f"Uploaded-image job failed{f' ({job_id})' if job_id else ''}: {message}")
        return bool(job_id)


def extract_jpegs(response: requests.Response) -> Iterable[bytes]:
    """Extract JPEGs from the runner's local multipart MJPEG stream."""
    buffer = bytearray()
    for chunk in response.iter_content(chunk_size=16_384):
        if not chunk:
            continue
        buffer.extend(chunk)
        while True:
            start = buffer.find(b"\xff\xd8")
            if start < 0:
                if len(buffer) > 2_000_000:
                    del buffer[:-2]
                break
            end = buffer.find(b"\xff\xd9", start + 2)
            if end < 0:
                if start > 0:
                    del buffer[:start]
                if len(buffer) > 2_000_000:
                    del buffer[:-2]
                break
            frame = bytes(buffer[start : end + 2])
            del buffer[: end + 2]
            yield frame


def compress_frame(jpeg: bytes) -> bytes | None:
    image = cv2.imdecode(
        np.frombuffer(jpeg, dtype=np.uint8),
        cv2.IMREAD_COLOR,
    )
    if image is None:
        return None

    height, width = image.shape[:2]
    if width > MAX_FRAME_WIDTH:
        scale = MAX_FRAME_WIDTH / float(width)
        image = cv2.resize(
            image,
            (MAX_FRAME_WIDTH, max(1, int(height * scale))),
            interpolation=cv2.INTER_AREA,
        )

    ok, encoded = cv2.imencode(
        ".jpg",
        image,
        [cv2.IMWRITE_JPEG_QUALITY, JPEG_QUALITY],
    )
    return encoded.tobytes() if ok else None


class FrameRelay:
    """Relay the original and annotated MJPEG frames for every camera.

    Each stream has its own reader, latest-frame slot and uploader. This keeps
    both feeds independent: a slow upload on one stream cannot build a queue
    or block the other stream. The existing YOLO upload remains the default
    backend stream type for backward compatibility.
    """

    STREAM_TYPES = ("normal", "yolo")

    def __init__(self) -> None:
        self.stop_event = threading.Event()
        self.threads: Dict[str, list[threading.Thread]] = {}
        self.states: Dict[str, dict] = {}

    def ensure_cameras(self, camera_ids: Iterable[str]) -> None:
        wanted = {str(item).strip() for item in camera_ids if str(item).strip()}

        # Stop relays for cameras no longer in the active backend session.
        for camera_id in list(self.states):
            if camera_id in wanted:
                continue
            state = self.states.pop(camera_id)
            state["stop"].set()
            for thread in self.threads.pop(camera_id, []):
                thread.join(timeout=2)
            log(f"Frame relay stopped: {camera_id}")

        for camera_id in wanted:
            existing = self.threads.get(camera_id)
            if existing and all(thread.is_alive() for thread in existing):
                continue

            state = {
                "stop": threading.Event(),
                "lock": threading.Lock(),
                "latest": {kind: None for kind in self.STREAM_TYPES},
                "sequence": {kind: 0 for kind in self.STREAM_TYPES},
                "received_at": {kind: 0.0 for kind in self.STREAM_TYPES},
            }
            camera_threads: list[threading.Thread] = []
            for stream_type in self.STREAM_TYPES:
                reader = threading.Thread(
                    target=self._camera_reader,
                    args=(camera_id, state, stream_type),
                    daemon=True,
                    name=f"edge-read-{stream_type}-{camera_id}",
                )
                uploader = threading.Thread(
                    target=self._camera_uploader,
                    args=(camera_id, state, stream_type),
                    daemon=True,
                    name=f"edge-upload-{stream_type}-{camera_id}",
                )
                camera_threads.extend((reader, uploader))

            self.states[camera_id] = state
            self.threads[camera_id] = camera_threads
            for thread in camera_threads:
                thread.start()
            log(f"Original + YOLO frame relays started: {camera_id}")

    def _camera_reader(self, camera_id: str, state: dict, stream_type: str) -> None:
        """Continuously drain one local MJPEG stream into its latest-frame slot."""
        local_path = "normal-stream" if stream_type == "normal" else "stream"
        stream_url = f"{LOCAL_STREAM_BASE}/{local_path}/{camera_id}"

        while not self.stop_event.is_set() and not state["stop"].is_set():
            try:
                with requests.get(
                    stream_url,
                    stream=True,
                    timeout=(5, 20),
                ) as response:
                    response.raise_for_status()
                    for jpeg in extract_jpegs(response):
                        if self.stop_event.is_set() or state["stop"].is_set():
                            return
                        with state["lock"]:
                            state["latest"][stream_type] = jpeg
                            state["sequence"][stream_type] += 1
                            state["received_at"][stream_type] = time.monotonic()
            except requests.RequestException as exc:
                if not self.stop_event.is_set() and not state["stop"].is_set():
                    log(f"Local {stream_type} stream reconnect {camera_id}: {exc}")
                    state["stop"].wait(1.0)
            except Exception as exc:  # noqa: BLE001
                if not self.stop_event.is_set() and not state["stop"].is_set():
                    log(f"Local {stream_type} frame reader error {camera_id}: {exc}")
                    state["stop"].wait(1.0)

    def _camera_uploader(self, camera_id: str, state: dict, stream_type: str) -> None:
        """Upload the newest frame for one stream using a persistent connection."""
        upload_url = endpoint(f"/edge/frame/{camera_id}?type={stream_type}")
        last_uploaded_sequence = 0
        last_upload_at = 0.0

        with requests.Session() as session:
            session.headers.update({
                "X-Internal-AI-Key": INTERNAL_AI_KEY,
                "Content-Type": "image/jpeg",
            })

            while not self.stop_event.is_set() and not state["stop"].is_set():
                elapsed = time.monotonic() - last_upload_at
                wait_seconds = max(0.01, FRAME_INTERVAL_SECONDS - elapsed)
                if state["stop"].wait(wait_seconds) or self.stop_event.is_set():
                    break

                with state["lock"]:
                    jpeg = state["latest"][stream_type]
                    sequence = state["sequence"][stream_type]
                    received_at = state["received_at"][stream_type]

                if not jpeg or sequence == last_uploaded_sequence:
                    continue

                # Never send a buffered frame that has already become stale.
                if time.monotonic() - received_at > 1.5:
                    continue

                compressed = compress_frame(jpeg)
                if not compressed:
                    last_uploaded_sequence = sequence
                    continue

                try:
                    upload = session.post(
                        upload_url,
                        data=compressed,
                        timeout=(5, 10),
                    )
                    if upload.status_code in (403, 409):
                        log(
                            f"{stream_type} frame relay ended for {camera_id} "
                            f"(session status {upload.status_code})."
                        )
                        state["stop"].set()
                        return
                    upload.raise_for_status()
                    last_uploaded_sequence = sequence
                    last_upload_at = time.monotonic()
                except requests.RequestException as exc:
                    if not self.stop_event.is_set() and not state["stop"].is_set():
                        log(f"{stream_type} frame upload retry {camera_id}: {exc}")
                        state["stop"].wait(0.5)

    def stop(self) -> None:
        self.stop_event.set()
        for state in self.states.values():
            state["stop"].set()
        for camera_threads in list(self.threads.values()):
            for thread in camera_threads:
                thread.join(timeout=2)
        self.threads.clear()
        self.states.clear()


class EdgeAgent:
    def __init__(self) -> None:
        self.runner: subprocess.Popen | None = None
        self.runner_mode: str | None = None
        self.relay: FrameRelay | None = None
        self.last_error = ""
        self.last_heartbeat = 0.0
        self.local_expires_at = 0.0

    def runner_alive(self) -> bool:
        return self.runner is not None and self.runner.poll() is None

    def stop_session(self) -> None:
        if self.relay is not None:
            self.relay.stop()
            self.relay = None
        stop_runner(self.runner)
        self.runner = None
        self.runner_mode = None

    def ensure_image_runner(self) -> None:
        if self.runner_alive():
            return

        self.runner = None
        self.runner_mode = None

        if local_runner_is_responding():
            # Reuse a runner manually started for local verification, or any
            # existing camera runner. The local HTTP service remains loopback-only.
            log("Reusing the YOLO runner already listening on 127.0.0.1:5050.")
            return

        self.runner = start_runner(
            heartbeat_callback=send_heartbeat,
            image_only=True,
        )
        self.runner_mode = "image"

    def process_one_image_job(self) -> None:
        process_one_image_job(self.ensure_image_runner)

    def run(self) -> None:
        log(f"Connected to staging backend: {BACKEND_URL}")
        log("Waiting for Activate Demo command. Keep this window open during demonstrations.")

        while True:
            try:
                command = get_command()
                desired = command.get("desiredState", "STOP")
                camera_ids = command.get("cameras", [])
                if not isinstance(camera_ids, list):
                    camera_ids = []

                if desired == "RUN":
                    expires_at = command.get("expiresAt")
                    if expires_at:
                        try:
                            from datetime import datetime
                            self.local_expires_at = datetime.fromisoformat(
                                str(expires_at).replace("Z", "+00:00")
                            ).timestamp()
                        except ValueError:
                            self.local_expires_at = 0.0
                    self.last_error = ""
                    if not self.runner_alive() or self.runner_mode == "image":
                        self.stop_session()
                        self.runner = start_runner(heartbeat_callback=send_heartbeat)
                        self.runner_mode = "demo"
                        if LOCAL_BACKEND:
                            # Local AI Vision Center reads the runner directly from
                            # 127.0.0.1:5050. Relaying the same four feeds back into
                            # localhost would add JPEG decode/encode and HTTP work
                            # without improving the local preview.
                            self.relay = None
                            log(
                                "Local backend detected: remote frame relay skipped. "
                                "The local dashboard will read streams directly from 127.0.0.1:5050."
                            )
                        else:
                            # Hosted dashboards cannot access the laptop's loopback
                            # server, so keep the authenticated outbound frame relay.
                            self.relay = FrameRelay()
                    if self.relay is not None:
                        self.relay.ensure_cameras(camera_ids)
                else:
                    self.local_expires_at = 0.0
                    # Keep the image-only runner warm between uploads. Stop only
                    # a camera-demo runner when the administrator ends the demo.
                    if self.runner_mode == "demo" or self.relay is not None:
                        self.stop_session()
                        log("Demo session stopped. Edge Agent is idle.")

                # Image inference is independent of the camera-demo toggle.
                # A queued job starts an image-only runner when no runner exists.
                self.process_one_image_job()

                if time.monotonic() - self.last_heartbeat >= 4:
                    send_heartbeat(self.runner_alive(), self.last_error)
                    self.last_heartbeat = time.monotonic()

            except requests.RequestException as exc:
                self.last_error = f"Backend connection error: {exc}"
                log(self.last_error)
                if self.local_expires_at and time.time() >= self.local_expires_at:
                    if self.runner_mode == "demo" or self.relay is not None:
                        self.stop_session()
                    self.local_expires_at = 0.0
                    send_heartbeat(self.runner_alive(), "Local 40-minute session timer elapsed.")
            except Exception as exc:  # noqa: BLE001
                self.last_error = str(exc)
                log(f"{self.last_error}")
                self.stop_session()
                send_heartbeat(False, self.last_error)
                time.sleep(3)

            if self.local_expires_at and time.time() >= self.local_expires_at:
                if self.runner_mode == "demo" or self.relay is not None:
                    self.stop_session()
                self.local_expires_at = 0.0
                send_heartbeat(self.runner_alive(), "Local 40-minute session timer elapsed.")

            time.sleep(POLL_SECONDS)


def main() -> int:
    try:
        validate_configuration()
        agent = EdgeAgent()
        try:
            agent.run()
        finally:
            agent.stop_session()
            send_heartbeat(False, "Edge Agent stopped by operator.")
    except KeyboardInterrupt:
        log("Ctrl+C received; stopping demo runner.")
        return 0
    except Exception as exc:  # noqa: BLE001
        log(f"STARTUP ERROR: {exc}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
