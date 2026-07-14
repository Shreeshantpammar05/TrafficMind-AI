import sys
import os
from ultralytics import YOLO
import cv2
import json

MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "ai_models",
    "yolov8n.pt"
)

model = YOLO(MODEL_PATH)

import os

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

if len(files) == 0:
    print(json.dumps({
        "error": "No uploaded image found"
    }))
    sys.exit()

image_path = files[0]

results = model(
    image_path,
    verbose=False
)

annotated_image = results[0].plot()

output_path = os.path.join(
    os.path.dirname(__file__),
    "annotated_result.jpg"
)

cv2.imwrite(
    output_path,
    annotated_image
)
vehicle_count = 0
emergency_detected = False
vehicle_classes = [
    "car",
    "truck",
    "bus",
    "motorcycle"
]

for result in results:
    for box in result.boxes:
        cls_id = int(box.cls[0])

        class_name = model.names[cls_id]

        if class_name in vehicle_classes:
            vehicle_count += 1

        if class_name == "bus":
            emergency_detected = True

if vehicle_count < 20:
    congestion = "LOW"

elif vehicle_count < 35:
    congestion = "MEDIUM"

else:
    congestion = "HIGH"

if congestion == "HIGH":
    recommendation = "Deploy Traffic Officers"

elif congestion == "MEDIUM":
    recommendation = "Monitor Traffic"

else:
    recommendation = "Traffic Flow Normal"

    # AI Accident Detection

accident_detected = False
accident_severity = "NONE"

if vehicle_count >= 35:
    accident_detected = True
    accident_severity = "HIGH"

elif vehicle_count >= 25:
    accident_detected = True
    accident_severity = "MEDIUM"

result = {
    "vehicleCount": vehicle_count,
    "congestion": congestion,
    "recommendation": recommendation,

    "accidentDetected": accident_detected,
    "accidentSeverity": accident_severity,

    "emergencyDetected": emergency_detected
}

print(json.dumps(result))
sys.stdout.flush()
exit()