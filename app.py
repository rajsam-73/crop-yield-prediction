from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import datetime
import random
import os

app = Flask(__name__)
CORS(app)

# ✅ Load API key securely from environment variable
API_KEY = os.environ.get("OPENWEATHER_API_KEY", "your_fallback_key_here")

# In-memory history (replace with DB for persistence)
prediction_history = []

# --- Yield Prediction ---
def predict_yield(data):
    yield_estimate = (
        0.3 * data.get("rainfall", 0) +
        0.2 * data.get("temperature", 0) +
        0.25 * data.get("fertilizer", 0) +
        0.1 * data.get("soilMoisture", 0) -
        0.05 * abs(data.get("soilPh", 7) - 7) +
        0.1 * data.get("humidity", 0)
    )
    return round(yield_estimate, 2)

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    yield_value = predict_yield(data)

    prediction_history.append({
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "crop": data.get("cropType", "Unknown"),
        "season": data.get("season", "Unknown"),
        "yield": yield_value
    })

    return jsonify({"yield": yield_value})

# --- Weather Data with Fallback ---
@app.route("/weather", methods=["GET"])
def get_weather():
    location = request.args.get("location", "Nairobi,KE")
    url = f"http://api.openweathermap.org/data/2.5/weather?q={location}&appid={API_KEY}&units=metric"

    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        data = response.json()

        weather_info = {
            "location": location,
            "temperature": data["main"].get("temp", 25.0),
            "humidity": data["main"].get("humidity", 60),
            "rainfall": data.get("rain", {}).get("1h", 0)
        }
    except Exception:
        # 🌱 Fallback simulated values
        weather_info = {
            "location": location,
            "temperature": 25.0,
            "humidity": 60,
            "rainfall": 5
        }

    return jsonify(weather_info)

# --- Simulated Sensor Data ---
@app.route("/sensors", methods=["GET"])
def sensors():
    sensor_data = {
        "soilMoisture": round(random.uniform(30, 70), 1),  # %
        "soilPh": round(random.uniform(5.5, 7.5), 2),      # pH value
        "fertilizerLevel": round(random.uniform(20, 80), 1) # %
    }
    return jsonify(sensor_data)

# --- Fertilizer Optimization ---
@app.route("/fertilizer", methods=["POST"])
def fertilizer():
    data = request.get_json()
    yield_value = predict_yield(data)
    status = "Adequate" if data.get("fertilizer", 0) >= 50 else "Insufficient"
    return jsonify({"status": status, "predicted_yield": yield_value})

# --- Risk Assessment ---
@app.route("/risk", methods=["POST"])
def risk():
    data = request.get_json()
    risk_level = "Low"
    message = "Conditions are favorable."

    if data.get("rainfall", 0) < 50:
        risk_level = "High"
        message = "Low rainfall may reduce yield."
    elif data.get("temperature", 0) > 35:
        risk_level = "Medium"
        message = "High temperature may stress crops."
    elif data.get("soilMoisture", 0) < 40:
        risk_level = "Medium"
        message = "Soil moisture is below optimal levels."

    return jsonify({"risk_level": risk_level, "message": message})

# --- Prediction History ---
@app.route("/history", methods=["GET"])
def history():
    return jsonify(prediction_history)

@app.route("/history", methods=["DELETE"])
def clear_history():
    prediction_history.clear()
    return jsonify({"message": "History cleared"})

# --- Health Check ---
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "message": "SmartFarm AI backend is running"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
