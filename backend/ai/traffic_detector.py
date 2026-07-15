import sys
import os
import cv2
import json
from ultralytics import YOLO

BASE_DIR = os.path.dirname(__file__)

# -----------------------------
# Load Models
# -----------------------------
vehicle_model = YOLO(os.path.join(BASE_DIR, "ai_models", "yolov8n.pt"))
accident_model = YOLO(os.path.join(BASE_DIR, "ai_models", "accident_detector.pt"))

# -----------------------------
# Check Image Path
# -----------------------------
if len(sys.argv) < 2:
    print(json.dumps({
        "success": False,
        "error": "No image path received"
    }))
    sys.exit()

image_path = sys.argv[1]

if not os.path.exists(image_path):
    print(json.dumps({
        "success": False,
        "error": "Image not found"
    }))
    sys.exit()

# -----------------------------
# Vehicle Detection
# -----------------------------
vehicle_results = vehicle_model(image_path, verbose=False)

annotated_image = vehicle_results[0].plot()

output_path = os.path.join(BASE_DIR, "annotated_result.jpg")
cv2.imwrite(output_path, annotated_image)

vehicle_breakdown = {
    "car": 0,
    "truck": 0,
    "bus": 0,
    "motorcycle": 0,
    "person": 0
}

vehicle_classes = vehicle_breakdown.keys()

vehicle_count = 0

for result in vehicle_results:
    for box in result.boxes:
        cls = int(box.cls[0])
        class_name = vehicle_model.names[cls]

        if class_name in vehicle_classes:
            vehicle_breakdown[class_name] += 1

            if class_name != "person":
                vehicle_count += 1

# -----------------------------
# Traffic Density
# -----------------------------
if vehicle_count <= 10:
    traffic_density = "LOW"
elif vehicle_count <= 25:
    traffic_density = "MEDIUM"
else:
    traffic_density = "HIGH"

# -----------------------------
# Accident Detection
# -----------------------------
accident_results = accident_model(image_path, verbose=False)

accident_detected = False
accident_confidence = 0

for result in accident_results:
    for box in result.boxes:

        cls = int(box.cls[0])
        confidence = float(box.conf[0])

        class_name = accident_model.names[cls]

        if class_name == "Accident":
            accident_detected = True
            accident_confidence = round(confidence * 100, 2)

# -----------------------------
# Severity
# -----------------------------
if accident_detected:

    if accident_confidence >= 90:
        severity = "HIGH"

    elif accident_confidence >= 70:
        severity = "MEDIUM"

    else:
        severity = "LOW"

else:
    severity = "NONE"

# -----------------------------
# Recommendations
# -----------------------------
recommendations = []

if accident_detected:
    recommendations.append("Dispatch Ambulance")
    recommendations.append("Alert Police")
    recommendations.append("Create Green Corridor")

elif traffic_density == "HIGH":
    recommendations.append("Increase Green Signal Time")
    recommendations.append("Deploy Traffic Officers")

elif traffic_density == "MEDIUM":
    recommendations.append("Monitor Traffic")

else:
    recommendations.append("Traffic Flow Normal")

# -----------------------------
# Final JSON
# -----------------------------
response = {
    "success": True,

    "vehicleCount": vehicle_count,

    "vehicleBreakdown": vehicle_breakdown,

    "trafficDensity": traffic_density,

    "accident": {
        "detected": accident_detected,
        "confidence": accident_confidence,
        "severity": severity
    },

    "recommendations": recommendations,

    "processedImage": output_path
}

print(json.dumps(response))
sys.stdout.flush()