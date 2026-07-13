import jsPDF from "jspdf";
import MainLayout from "../layouts/MainLayout";
import axios from "axios";
import { useState } from "react";


function AIVisionCenter() {

  
  const [result, setResult] =
    useState(null);

    const [imageUrl, setImageUrl] =
  useState("");

    const [selectedFile, setSelectedFile] =
  useState(null);

  const [fileType, setFileType] =
  useState("image");

  const [loading, setLoading] =
  useState(false);

  const analyzeTraffic = async () => {
  try {

    if (!selectedFile) {
      alert("Please select an image");
      return;
    }

    setLoading(true);

    const formData = new FormData();

    formData.append(
      "image",
      selectedFile
    );

    await axios.post(
      "http://localhost:5000/api/upload/image",
      formData
    );

    let res;

    if (fileType === "video") {

      res = await axios.get(
        "http://localhost:5000/api/video/analyze-video"
      );

    } else {

      res = await axios.get(
        "http://localhost:5000/api/ai/analyze"
      );

    }

    setResult(res.data);

   if (res.data.accidentDetected) {
  try {
    await axios.post(
      "http://localhost:5000/api/incidents",
      {
        location: "AI Surveillance",
        incidentType: "Accident",
        severity:
          res.data.accidentSeverity,
        description:
          "AI detected a possible road accident."
      }
    );

    alert(
      "🚨 Accident Detected!\n\nEmergency incident has been created successfully."
    );

  } catch (error) {
    console.log(error);
  }
}

    const resultImage =
      "http://localhost:5000/results/annotated_result.jpg?t=" +
      Date.now();

    setImageUrl(resultImage);

    setLoading(false);

    alert("AI Analysis Success");

  } catch (error) {

    setLoading(false);

    console.log(error);

    alert(
      error.response?.data?.error ||
      error.message ||
      "AI Analysis Failed"
    );
  }
};

const downloadReport = () => {

  if (!result) {
    alert("Run analysis first");
    return;
  }

  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text(
    "TrafficMind AI Report",
    20,
    20
  );

  doc.setFontSize(12);

  doc.text(
    `Vehicle Count: ${
      result.vehicleCount ||
      result.averageVehicleCount
    }`,
    20,
    50
  );

  doc.text(
    `Congestion: ${result.congestion}`,
    20,
    70
  );

  doc.text(
    `Recommendation: ${
      result.recommendation ||
      "Monitor Traffic"
    }`,
    20,
    90
  );

  doc.text(
    `Generated: ${new Date().toLocaleString()}`,
    20,
    110
  );

  doc.save(
    "TrafficMind_AI_Report.pdf"
  );
};

  return (
    <MainLayout>
     <div className="hero-header">
  <div>
    <h1>🤖 AI Surveillance Center</h1>

    <p
      style={{
        color: "#94a3b8",
        fontSize: "18px",
        fontWeight: "600",
      }}
    >
      Real-Time AI Surveillance & Traffic Intelligence
    </p>

    <p
      style={{
        color: "#cbd5e1",
      }}
    >
     Live CCTV monitoring,
AI-powered vehicle detection,
traffic analysis,
emergency detection,
and smart city surveillance.
    </p>
  </div>

  <div
    style={{
      background: "#16a34a",
      padding: "10px 18px",
      borderRadius: "25px",
      fontWeight: "bold",
    }}
  >
    🟢 AI Surveillance Active
  </div>
</div>

<div className="cards">

<div
  className="card"
  style={{
    minHeight: "120px",
    transition: "all .3s ease",
    cursor: "pointer",
  }}

  onMouseEnter={(e) => {
    e.currentTarget.style.transform =
      "translateY(-5px)";
  }}

  onMouseLeave={(e) => {
    e.currentTarget.style.transform =
      "translateY(0)";
  }}
>
    <h3>🤖 AI Engine</h3>
    <h2>ONLINE</h2>
  </div>

 <div
  className="card"
  style={{
    minHeight: "120px",
    transition: "all .3s ease",
    cursor: "pointer",
  }}

  onMouseEnter={(e) => {
    e.currentTarget.style.transform =
      "translateY(-5px)";
  }}

  onMouseLeave={(e) => {
    e.currentTarget.style.transform =
      "translateY(0)";
  }}
>
    <h3>🎥 Detection Mode</h3>
    <h2>
      {fileType === "video"
        ? "VIDEO"
        : "IMAGE"}
    </h2>
  </div>

</div>

 <div
  className="section-card"
  style={{
    marginTop: "25px",
    marginBottom: "25px",
  }}
>
  <h2>📹 Live Traffic Camera Monitoring</h2>

  <p
    style={{
      color: "#94A3B8",
      marginBottom: "20px",
    }}
  >
    Live surveillance feeds from major city intersections.
  </p>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(2,1fr)",
      gap: "20px",
    }}
  >

    {/* Camera 1 */}

    <div
  style={{
    background: "#111827",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    padding: "15px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
  }}
>
      <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  }}
>
  <div>
    <h3
      style={{
        margin: 0,
      }}
    >
      📹 Camera 1
    </h3>

    <p
      style={{
        margin: "4px 0 0",
        color: "#94A3B8",
        fontSize: "14px",
      }}
    >
      MG Road Junction
    </p>
  </div>

  <span
    style={{
      color: "#22C55E",
      fontWeight: "700",
    }}
  >
    🟢 LIVE
  </span>
</div>

     <video
  width="100%"
  height="280"
  autoPlay
  muted
  loop
  playsInline
  controls={false}
  style={{
    borderRadius: "12px",
    objectFit: "cover",
    background: "#000",
  }}
>
        <source
          src="/videos/camera1.mp4"
          type="video/mp4"
          
        />
      </video>
      <div
  style={{
    marginTop: "12px",
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
  }}
>
  <span style={{ color: "#22C55E" }}>
    🤖 AI Monitoring Active
  </span>

  <span style={{ color: "#60A5FA" }}>
    🎥 HD Stream
  </span>
</div>
    </div>

    {/* Camera 2 */}

    <div
  style={{
    background: "#111827",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    padding: "15px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
  }}
>
      <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  }}
>
  <div>
    <h3
      style={{
        margin: 0,
      }}
    >
      📹 Camera 2
    </h3>

    <p
      style={{
        margin: "4px 0 0",
        color: "#94A3B8",
        fontSize: "14px",
      }}
    >
      Hebbal
    </p>
  </div>

  <span
    style={{
      color: "#22C55E",
      fontWeight: "700",
    }}
  >
    🟢 LIVE
  </span>
</div>

      <video
  width="100%"
  height="280"
  autoPlay
  muted
  loop
  playsInline
  controls={false}
  style={{
    borderRadius: "12px",
    objectFit: "cover",
    background: "#000",
  }}
>
        <source
          src="/videos/camera2.mp4"
          type="video/mp4"
        />
      </video>
      <div
  style={{
    marginTop: "12px",
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
  }}
>
  <span style={{ color: "#22C55E" }}>
    🤖 AI Monitoring Active
  </span>

  <span style={{ color: "#60A5FA" }}>
    🎥 HD Stream
  </span>
</div>
    </div>

    {/* Camera 3 */}

    <div
  style={{
    background: "#111827",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    padding: "15px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
  }}
>
     <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  }}
>
  <div>
    <h3
      style={{
        margin: 0,
      }}
    >
      📹 Camera 3
    </h3>

    <p
      style={{
        margin: "4px 0 0",
        color: "#94A3B8",
        fontSize: "14px",
      }}
    >
      Whitefield
    </p>
  </div>

  <span
    style={{
      color: "#22C55E",
      fontWeight: "700",
    }}
  >
    🟢 LIVE
  </span>
</div>

      <video
  width="100%"
  height="280"
  autoPlay
  muted
  loop
  playsInline
  controls={false}
  style={{
    borderRadius: "12px",
    objectFit: "cover",
    background: "#000",
  }}
>
        <source
          src="/videos/camera3.mp4"
          type="video/mp4"
        />
      </video>
      <div
  style={{
    marginTop: "12px",
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
  }}
>
  <span style={{ color: "#22C55E" }}>
    🤖 AI Monitoring Active
  </span>

  <span style={{ color: "#60A5FA" }}>
    🎥 HD Stream
  </span>
</div>
    </div>

    {/* Camera 4 */}

    <div
  style={{
    background: "#111827",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    padding: "15px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
  }}
>
      <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  }}
>
  <div>
    <h3
      style={{
        margin: 0,
      }}
    >
      📹 Camera 4
    </h3>

    <p
      style={{
        margin: "4px 0 0",
        color: "#94A3B8",
        fontSize: "14px",
      }}
    >
      Electronic City
    </p>
  </div>

  <span
    style={{
      color: "#22C55E",
      fontWeight: "700",
    }}
  >
    🟢 LIVE
  </span>
</div>

      <video
  width="100%"
  height="280"
  autoPlay
  muted
  loop
  playsInline
  controls={false}
  style={{
    borderRadius: "12px",
    objectFit: "cover",
    background: "#000",
  }}
>
        <source
          src="/videos/camera4.mp4"
          type="video/mp4"
        />
      </video>
      <div
  style={{
    marginTop: "12px",
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
  }}
>
  <span style={{ color: "#22C55E" }}>
    🤖 AI Monitoring Active
  </span>

  <span style={{ color: "#60A5FA" }}>
    🎥 HD Stream
  </span>
</div>
    </div>

  </div>
</div>

      <div
        className="section-card"
        style={{
          padding: "20px",
        }}
      >
    <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  }}
>
  <div>
    <h2
      style={{
        margin: 0,
      }}
    >
      🤖 AI Traffic Analysis Engine
    </h2>

    <p
      style={{
        color: "#94A3B8",
        marginTop: "6px",
      }}
    >
      Upload traffic images or videos for AI-powered vehicle detection and congestion analysis.
    </p>
  </div>

  <span
    style={{
      background: "#16A34A",
      color: "white",
      padding: "8px 15px",
      borderRadius: "20px",
      fontWeight: "700",
    }}
  >
    🟢 Ready
  </span>
</div>

        <br />

       <div
  style={{
    background: "#111827",
    border: "2px dashed #3B82F6",
    borderRadius: "15px",
    padding: "25px",
    textAlign: "center",
    marginBottom: "20px",
  }}
>
  <input
    type="file"
    accept="image/*,video/*"
    onChange={(e) => {
      const file = e.target.files[0];

      setSelectedFile(file);

      if (
        file &&
        file.type.startsWith("video")
      ) {
        setFileType("video");
      } else {
        setFileType("image");
      }
    }}
  />

  <p
    style={{
      color: "#94A3B8",
      marginTop: "10px",
    }}
  >
    📤 Select an image or video for AI analysis
  </p>
</div>

        <br />
        <br />

        <button
  onClick={analyzeTraffic}
  disabled={loading}
  style={{
    background: "#2563eb",
    color: "white",
    border: "none",
    padding: "12px 20px",
    borderRadius: "10px",
    cursor: loading
      ? "not-allowed"
      : "pointer",
    fontWeight: "bold",
    opacity: loading ? 0.7 : 1,
  }}
>
  {loading
    ? "⏳ Analyzing..."
    : "🚦 Analyze Traffic"}
</button>

        <button
  onClick={downloadReport}
  disabled={!result}
   style={{

    background: "#16a34a",

    color: "white",

    border: "none",

    padding: "12px 20px",

    borderRadius: "10px",

    cursor: "pointer",

    fontWeight: "bold",

    marginLeft: "10px",

  }}
>
  📄 Download Report
</button>


       {result && (
  <div
    className="section-card"
    style={{
      marginTop: "25px",
      marginBottom: "20px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}
  >
    <div>
      <h2 style={{ margin: 0 }}>
        🤖 AI Analysis Results
      </h2>

      <p
        style={{
          color: "#94A3B8",
          marginTop: "6px",
        }}
      >
        AI-generated traffic analysis summary.
      </p>
    </div>

    <span
      style={{
        background: "#16A34A",
        color: "white",
        padding: "8px 16px",
        borderRadius: "20px",
        fontWeight: "700",
      }}
    >
      ✔ Analysis Complete
    </span>
  </div>
)}

{result && (
  <div
    className="cards"
    style={{
      marginTop: "20px",
    }}
  >

    <div className="card">
      <h3>
        🚗 Vehicle Count
      </h3>

      <h2>
        {
          result.vehicleCount ||
          result.averageVehicleCount
        }
      </h2>
    </div>

    {result.peakVehicleCount && (
      <div className="card">
        <h3>
          📈 Peak Vehicles
        </h3>

        <h2>
          {result.peakVehicleCount}
        </h2>
      </div>
    )}

    <div className="card">
      <h3>
        🚦 Congestion
      </h3>

     <h2
  style={{
    color:
      result.congestion === "High"
        ? "#EF4444"
        : result.congestion === "Medium"
        ? "#F59E0B"
        : "#22C55E",
  }}
>
  {result.congestion}
</h2>
    </div>

    <div className="card">
      <h3>
        💡 AI Recommendation
      </h3>

      <p
  style={{
    fontSize: "16px",
    fontWeight: "600",
    color: "#E2E8F0",
    lineHeight: "1.6",
  }}
>
  {result.recommendation}
</p>
    </div>

  </div>
)}

{result?.accidentDetected && (
  <div
    className="section-card"
    style={{
      marginTop: "25px",
      border: "2px solid #EF4444",
      background: "rgba(239,68,68,.08)",
    }}
  >
    <h2
      style={{
        color: "#EF4444",
        marginBottom: "15px",
      }}
    >
      🚨 Accident Detected
    </h2>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2,1fr)",
        gap: "20px",
      }}
    >
      <div>
        <p>
          <strong>Severity</strong>
        </p>

        <h3
          style={{
            color: "#EF4444",
          }}
        >
          {result.accidentSeverity}
        </h3>
      </div>

      <div>
        <p>
          <strong>AI Status</strong>
        </p>

        <h3
          style={{
            color: "#22C55E",
          }}
        >
          Detection Successful
        </h3>
      </div>
    </div>

    <div
      style={{
        marginTop: "20px",
        padding: "15px",
        borderRadius: "10px",
        background: "#991B1B",
        color: "white",
        fontWeight: "700",
      }}
    >
      <div
  style={{
    marginTop: "20px",
    display: "flex",
    gap: "15px",
  }}
>
  <button
    onClick={() => {
      window.location.href =
        "/emergency-operations";
    }}
    style={{
      background: "#DC2626",
      color: "white",
      border: "none",
      padding: "12px 18px",
      borderRadius: "10px",
      cursor: "pointer",
      fontWeight: "700",
    }}
  >
    🚑 Open Emergency Operations
  </button>

  <button
    onClick={() => {
      window.location.href =
        "/emergency-operations";
    }}
    style={{
      background: "#16A34A",
      color: "white",
      border: "none",
      padding: "12px 18px",
      borderRadius: "10px",
      cursor: "pointer",
      fontWeight: "700",
    }}
  >
    🟢 Activate Green Corridor
  </button>
</div>
    </div>
  </div>
)}

        {imageUrl && (
  <div
    className="section-card"
    style={{
      marginTop: "30px",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "15px",
      }}
    >
      <div>
        <h2
          style={{
            margin: 0,
          }}
        >
          🤖 Detection Output
        </h2>

        <p
          style={{
            color: "#94A3B8",
            marginTop: "6px",
          }}
        >
          Annotated traffic detection generated by the YOLO AI engine.
        </p>
      </div>

      <span
        style={{
          background: "#2563EB",
          color: "white",
          padding: "8px 15px",
          borderRadius: "20px",
          fontWeight: "700",
        }}
      >
        AI Output
      </span>
    </div>

    <img
      src={imageUrl}
      alt="YOLO Result"
      style={{
        width: "100%",
        borderRadius: "15px",
        border: "2px solid rgba(59,130,246,.3)",
      }}
    />
  </div>
)}

<div
  className="section-card"
  style={{
    marginTop: "30px",
    border: "1px solid rgba(239,68,68,0.30)",
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px",
    }}
  >
    <div>
      <h2 style={{ margin: 0 }}>
        🚨 Emergency Detection Center
      </h2>

      <p
        style={{
          color: "#94A3B8",
          marginTop: "6px",
        }}
      >
        Real-time AI emergency vehicle detection.
      </p>
    </div>

    <div
      style={{
        background: "#EF4444",
        color: "white",
        padding: "8px 16px",
        borderRadius: "20px",
        fontWeight: "700",
      }}
    >
      LIVE
    </div>
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      gap: "20px",
    }}
  >
    <div className="alert-item">
      <h3>🚑 Ambulance</h3>
      <h2 style={{ color: "#EF4444" }}>
        1 Active
      </h2>
      <p style={{ color: "#94A3B8" }}>
        Confidence: 98%
      </p>
    </div>

    <div className="alert-item">
      <h3>🚓 Police Vehicle</h3>
      <h2 style={{ color: "#22C55E" }}>
        0 Active
      </h2>
      <p style={{ color: "#94A3B8" }}>
        Confidence: --
      </p>
    </div>

    <div className="alert-item">
      <h3>🚒 Fire Truck</h3>
      <h2 style={{ color: "#22C55E" }}>
        0 Active
      </h2>
      <p style={{ color: "#94A3B8" }}>
        Confidence: --
      </p>
    </div>
  </div>
</div>


<div
  className="section-card"
  style={{
    marginTop: "25px",
    border: "1px solid rgba(239,68,68,0.30)",
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px",
    }}
  >
    <div>
      <h2 style={{ margin: 0 }}>
        🚑 Latest Emergency Event
      </h2>

      <p
        style={{
          color: "#94A3B8",
          marginTop: "6px",
        }}
      >
        Most recent emergency detected by AI.
      </p>
    </div>

    <div
      style={{
        background: "#22C55E",
        color: "white",
        padding: "8px 16px",
        borderRadius: "20px",
        fontWeight: "700",
      }}
    >
      ACTIVE
    </div>
  </div>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(2,1fr)",
      gap: "20px",
    }}
  >
    <div>
      <p><strong>🚑 Vehicle</strong></p>
      <p>Ambulance</p>

      <p><strong>📍 Location</strong></p>
      <p>MG Road Junction</p>

      <p><strong>🕒 ETA</strong></p>
      <p>4 Minutes</p>
    </div>

    <div>
      <p><strong>📏 Distance</strong></p>
      <p>2.4 KM</p>

      <p><strong>🚦 Green Corridor</strong></p>
      <p style={{ color: "#22C55E" }}>
        Active
      </p>

      <p><strong>✅ Status</strong></p>
      <p style={{ color: "#22C55E" }}>
        Route Clearance Active
      </p>
    </div>
  </div>
</div>
      </div>

     

      
    </MainLayout>
  );
}

export default AIVisionCenter;