import sys
import os
import joblib
import pandas as pd

# Load model files

model = joblib.load(
    os.path.join(
        os.path.dirname(__file__),
        "traffic_model.pkl"
    )
)

weather_encoder = joblib.load(
    os.path.join(
        os.path.dirname(__file__),
        "weather_encoder.pkl"
    )
)

risk_encoder = joblib.load(
    os.path.join(
        os.path.dirname(__file__),
        "risk_encoder.pkl"
    )
)

# Get values from Node.js

vehicles = int(sys.argv[1])
time = int(sys.argv[2])
weather = sys.argv[3]

# Encode weather

if weather not in weather_encoder.classes_:
    weather = "Sunny"

weather_encoded = weather_encoder.transform(
    [weather]
)[0]

# Create input

input_data = pd.DataFrame([
    {
        "vehicles": vehicles,
        "time": time,
        "weather": weather_encoded,
    }
])

# Predict

prediction = model.predict(input_data)

risk = risk_encoder.inverse_transform(
    prediction
)

print(risk[0])