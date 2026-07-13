from ultralytics import YOLO
import cv2
import json
import os

import os

MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "ai_models",
    "yolov8n.pt"
)

model = YOLO(MODEL_PATH)

uploads_folder = os.path.join(
    os.path.dirname(__file__),
    "..",
    "uploads"
)

files = sorted(
    [
        os.path.join(uploads_folder, f)
        for f in os.listdir(uploads_folder)
    ],
    key=os.path.getmtime,
    reverse=True
)

video_path = files[0]

if not files:
    print(json.dumps({
        "error": "No video uploaded"
    }))
    exit()

cap = cv2.VideoCapture(video_path)

vehicle_classes = [
    "car",
    "truck",
    "bus",
    "motorcycle"
]

frame_count = 0
total_vehicles = 0
peak_vehicles = 0

while cap.isOpened():

    success, frame = cap.read()

    if not success:
        break

    frame_count += 1

    # Analyze every 10th frame
    if frame_count % 10 != 0:
        continue

    results = model(
        frame,
        verbose=False
    )

    current_count = 0

    for result in results:
        for box in result.boxes:

            cls_id = int(box.cls[0])

            class_name = model.names[cls_id]

            if class_name in vehicle_classes:
                current_count += 1

    total_vehicles += current_count

    if current_count > peak_vehicles:
        peak_vehicles = current_count

cap.release()

average_vehicles = 0

if frame_count > 0:
    average_vehicles = int(
        total_vehicles /
        max(1, frame_count // 10)
    )

if average_vehicles < 20:
    congestion = "LOW"
elif average_vehicles < 35:
    congestion = "MEDIUM"
else:
    congestion = "HIGH"

result = {
    "averageVehicleCount":
        average_vehicles,
    "peakVehicleCount":
        peak_vehicles,
    "congestion":
        congestion
}

print(
    json.dumps(result)
)