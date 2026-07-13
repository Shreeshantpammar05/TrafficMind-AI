import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import joblib

# Load dataset
data = pd.read_csv("traffic_data.csv")

# Encode weather
weather_encoder = LabelEncoder()
data["weather"] = weather_encoder.fit_transform(data["weather"])

# Encode risk
risk_encoder = LabelEncoder()
data["risk"] = risk_encoder.fit_transform(data["risk"])

# Features
X = data[["vehicles", "time", "weather"]]

# Target
y = data["risk"]

# Train model
model = RandomForestClassifier(
    n_estimators=100,
    random_state=42
)

model.fit(X, y)

# Save files
joblib.dump(model, "traffic_model.pkl")
joblib.dump(weather_encoder, "weather_encoder.pkl")
joblib.dump(risk_encoder, "risk_encoder.pkl")

print("✅ Model Trained Successfully")