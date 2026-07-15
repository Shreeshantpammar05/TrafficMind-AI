from ultralytics import YOLO
import os

model_path = os.path.join(
    os.path.dirname(__file__),
    "ai_models",
    "accident_detector.pt"
)

model = YOLO(model_path)

print("✅ Model Loaded Successfully")
print("Classes:", model.names)