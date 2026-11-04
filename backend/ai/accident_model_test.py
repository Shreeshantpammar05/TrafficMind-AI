"""
TrafficMind AI - Standalone Accident Model Test

Purpose:
    Test accident_detector.pt independently from the multi-camera runner.

Usage from backend\ai:

    python accident_model_test.py "C:\path\to\image.jpg"

or:

    python accident_model_test.py "C:\path\to\video.mp4"

Optional:

    python accident_model_test.py "C:\path\to\video.mp4" --every 10

The script does NOT modify TrafficMind runtime state or backend data.
"""

from __future__ import annotations

import argparse
import os
from collections import Counter
from pathlib import Path

import cv2
from ultralytics import YOLO


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "ai_models" / "accident_detector.pt"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Standalone test for TrafficMind accident_detector.pt"
    )
    parser.add_argument(
        "input_path",
        help="Path to an image or video file",
    )
    parser.add_argument(
        "--conf",
        type=float,
        default=0.05,
        help=(
            "Very low inference threshold for diagnostics. "
            "Default: 0.05"
        ),
    )
    parser.add_argument(
        "--every",
        type=int,
        default=10,
        help=(
            "For videos, analyze every Nth frame. "
            "Default: 10"
        ),
    )
    parser.add_argument(
        "--save-dir",
        default="accident_model_test_output",
        help="Directory for annotated output images",
    )
    return parser.parse_args()


def print_model_info(model: YOLO) -> None:
    print("=" * 70)
    print("TrafficMind AI - Accident Model Standalone Test")
    print("=" * 70)
    print(f"Model : {MODEL_PATH}")
    print(f"Classes: {model.names}")
    print("=" * 70)


def inspect_result(
    model: YOLO,
    result,
    source_label: str,
    frame_index: int | None = None,
) -> list[tuple[str, float]]:
    detections: list[tuple[str, float]] = []

    if result.boxes is None or len(result.boxes) == 0:
        print(
            f"[MODEL TEST] {source_label}"
            + (
                f" frame={frame_index}"
                if frame_index is not None
                else ""
            )
            + " -> no boxes"
        )
        return detections

    for box in result.boxes:
        cls_id = int(box.cls[0])
        confidence = float(box.conf[0])
        class_name = model.names[cls_id]

        detections.append((class_name, confidence))

        print(
            f"[MODEL TEST] {source_label}"
            + (
                f" frame={frame_index}"
                if frame_index is not None
                else ""
            )
            + f" -> class={class_name} "
              f"confidence={confidence:.3f}"
        )

    return detections


def run_image(
    model: YOLO,
    input_path: Path,
    output_dir: Path,
    conf: float,
) -> None:
    image = cv2.imread(str(input_path))

    if image is None:
        raise RuntimeError(
            f"Could not read image: {input_path}"
        )

    results = model(
        image,
        imgsz=512,
        conf=conf,
        verbose=False,
    )

    all_detections: list[tuple[str, float]] = []

    for result in results:
        all_detections.extend(
            inspect_result(
                model,
                result,
                str(input_path.name),
            )
        )

        annotated = result.plot()

        output_path = (
            output_dir
            / f"{input_path.stem}_annotated.jpg"
        )

        cv2.imwrite(
            str(output_path),
            annotated,
        )

    print()
    print("[MODEL TEST] Image summary")
    print(f"Input      : {input_path}")
    print(f"Detections : {len(all_detections)}")

    if all_detections:
        for class_name, confidence in all_detections:
            print(
                f"  {class_name:<15} "
                f"{confidence:.3f}"
            )

    print(f"Annotated  : {output_dir}")


def run_video(
    model: YOLO,
    input_path: Path,
    output_dir: Path,
    conf: float,
    every: int,
) -> None:
    capture = cv2.VideoCapture(str(input_path))

    if not capture.isOpened():
        raise RuntimeError(
            f"Could not open video: {input_path}"
        )

    frame_count = int(
        capture.get(cv2.CAP_PROP_FRAME_COUNT)
    )
    fps = float(
        capture.get(cv2.CAP_PROP_FPS) or 0.0
    )

    print(
        f"[MODEL TEST] Video frames={frame_count} "
        f"fps={fps:.2f} every={every}"
    )

    class_counter: Counter[str] = Counter()
    confidence_by_class: dict[str, list[float]] = {}
    processed = 0
    frame_index = 0
    saved_samples = 0

    while True:
        ok, frame = capture.read()

        if not ok:
            break

        frame_index += 1

        if frame_index % every != 0:
            continue

        processed += 1

        results = model(
            frame,
            imgsz=512,
            conf=conf,
            verbose=False,
        )

        for result in results:
            detections = inspect_result(
                model,
                result,
                input_path.name,
                frame_index,
            )

            for class_name, confidence in detections:
                class_counter[class_name] += 1
                confidence_by_class.setdefault(
                    class_name,
                    [],
                ).append(confidence)

            # Save only frames containing at least one box.
            if detections and saved_samples < 20:
                annotated = result.plot()

                output_path = (
                    output_dir
                    / (
                        f"{input_path.stem}"
                        f"_frame_{frame_index:06d}.jpg"
                    )
                )

                cv2.imwrite(
                    str(output_path),
                    annotated,
                )

                saved_samples += 1

    capture.release()

    print()
    print("=" * 70)
    print("MODEL TEST SUMMARY")
    print("=" * 70)
    print(f"Input video       : {input_path}")
    print(f"Frames in video   : {frame_count}")
    print(f"Frames analyzed   : {processed}")
    print(f"Confidence cutoff : {conf:.3f}")
    print()

    if not class_counter:
        print("RESULT: NO DETECTIONS")
    else:
        print("Detection counts:")
        for class_name, count in class_counter.most_common():
            values = confidence_by_class[class_name]
            average = sum(values) / len(values)
            maximum = max(values)
            minimum = min(values)

            print(
                f"  {class_name:<15} "
                f"count={count:<4} "
                f"min={minimum:.3f} "
                f"avg={average:.3f} "
                f"max={maximum:.3f}"
            )

    print()
    print(
        f"Annotated samples saved to: "
        f"{output_dir.resolve()}"
    )
    print("=" * 70)


def main() -> None:
    args = parse_args()

    input_path = Path(args.input_path).expanduser().resolve()

    if not input_path.exists():
        raise FileNotFoundError(
            f"Input file does not exist: {input_path}"
        )

    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Accident model not found: {MODEL_PATH}"
        )

    if not 0.0 < args.conf <= 1.0:
        raise ValueError(
            "--conf must be > 0 and <= 1"
        )

    if args.every < 1:
        raise ValueError(
            "--every must be >= 1"
        )

    output_dir = Path(args.save_dir).resolve()
    output_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    print("[MODEL TEST] Loading accident model...")
    model = YOLO(str(MODEL_PATH))
    print("[MODEL TEST] Accident model loaded.")
    print_model_info(model)

    image_extensions = {
        ".jpg",
        ".jpeg",
        ".png",
        ".bmp",
        ".webp",
    }

    if input_path.suffix.lower() in image_extensions:
        run_image(
            model,
            input_path,
            output_dir,
            args.conf,
        )
    else:
        run_video(
            model,
            input_path,
            output_dir,
            args.conf,
            args.every,
        )


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n[MODEL TEST] Stopped by user.")
    except Exception as error:
        print(f"\n[MODEL TEST] ERROR: {error}")
        raise
