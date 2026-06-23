// --- Tab Navigation ---
function showTab(tabId) {
  document.querySelectorAll(".tab-content").forEach(section => {
    section.classList.remove("active");
  });
  document.getElementById(tabId).classList.add("active");

  // 🔄 If user opens History tab, load history + sync chart
  if (tabId === "historyTab") {
    fetchHistory(true);
  }
}

// --- Chart.js Setup ---
const ctx = document.getElementById("yieldChart").getContext("2d");
const yieldChart = new Chart(ctx, {
  type: "line",
  data: {
    labels: [],   // timestamps
    datasets: [{
      label: "Yield Predictions",
      data: [],
      borderColor: "rgba(75, 192, 192, 1)",
      backgroundColor: "rgba(75, 192, 192, 0.2)",
      fill: true,
      tension: 0.3
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "SmartFarm AI Yield Predictions" }
    }
  }
});

// --- Yield Prediction ---
document.getElementById("yieldForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    rainfall: parseFloat(document.getElementById("rainfall").value),
    temperature: parseFloat(document.getElementById("temperature").value),
    fertilizer: parseFloat(document.getElementById("fertilizer").value),
    soilPh: parseFloat(document.getElementById("soilPh").value),
    moisture: parseFloat(document.getElementById("moisture").value),
    humidity: parseFloat(document.getElementById("humidity").value),
    cropType: document.getElementById("cropType").value,
    season: document.getElementById("season").value
  };

  const res = await fetch("http://127.0.0.1:5000/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const result = await res.json();

  // Show result
  document.getElementById("result").innerText = `Predicted Yield: ${result.yield} Tons/Hectare`;

  // --- Update Chart ---
  const timestamp = new Date().toLocaleTimeString();
  yieldChart.data.labels.push(timestamp);
  yieldChart.data.datasets[0].data.push(result.yield);
  yieldChart.update();
});

// --- Weather Data ---
async function fetchWeather() {
  const location = document.getElementById("location").value || "Nairobi,KE";
  const res = await fetch(`http://127.0.0.1:5000/weather?location=${location}`);
  const data = await res.json();

  document.getElementById("weatherResult").innerHTML = `
    <p>🌍 Location: ${data.location}</p>
    <p>🌡️ Temperature: ${data.temperature} °C</p>
    <p>💧 Humidity: ${data.humidity} %</p>
    <p>🌧️ Rainfall: ${data.rainfall} mm</p>
  `;

  // Auto-fill yield form fields
  document.getElementById("rainfall").value = data.rainfall;
  document.getElementById("temperature").value = data.temperature;
  document.getElementById("humidity").value = data.humidity;
}

// --- Fertilizer Optimization ---
async function checkFertilizer() {
  const data = {
    rainfall: parseFloat(document.getElementById("rainfall").value),
    temperature: parseFloat(document.getElementById("temperature").value),
    fertilizer: parseFloat(document.getElementById("fertilizer").value),
    moisture: parseFloat(document.getElementById("moisture").value),
    soilPh: parseFloat(document.getElementById("soilPh").value),
    humidity: parseFloat(document.getElementById("humidity").value),
    cropType: document.getElementById("cropType").value,
    season: document.getElementById("season").value
  };

  const res = await fetch("http://127.0.0.1:5000/fertilizer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const result = await res.json();
  document.getElementById("fertilizerResult").innerText =
    `Status: ${result.status}, Predicted Yield: ${result.predicted_yield} Tons/Hectare`;
}

// --- Risk Assessment ---
async function checkRisk() {
  const data = {
    rainfall: parseFloat(document.getElementById("rainfall").value),
    temperature: parseFloat(document.getElementById("temperature").value),
    fertilizer: parseFloat(document.getElementById("fertilizer").value),
    moisture: parseFloat(document.getElementById("moisture").value),
    soilPh: parseFloat(document.getElementById("soilPh").value),
    humidity: parseFloat(document.getElementById("humidity").value),
    cropType: document.getElementById("cropType").value,
    season: document.getElementById("season").value
  };

  const res = await fetch("http://127.0.0.1:5000/risk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const result = await res.json();
  document.getElementById("riskResult").innerText =
    `Risk Level: ${result.risk_level}, Message: ${result.message}`;
}

// --- Prediction History + Chart Sync ---
async function fetchHistory(syncChart = false) {
  
  const history = await res.json();

  const list = document.getElementById("historyList");
  list.innerHTML = "";
  history.forEach(item => {
    const li = document.createElement("li");
    li.textContent = `${item.timestamp} | Crop: ${item.crop}, Season: ${item.season}, Yield: ${item.yield}`;
    list.appendChild(li);

    // 🔄 Sync chart with history
    if (syncChart) {
      yieldChart.data.labels.push(item.timestamp);
      yieldChart.data.datasets[0].data.push(item.yield);
    }
  });

  if (syncChart) {
    yieldChart.update();
  }
}
