function CriticalZones() {
  const zones = [
    {
      name: "Whitefield",
      incidents: 8,
      color: "#EF4444",
    },
    {
      name: "Hebbal",
      incidents: 5,
      color: "#F59E0B",
    },
    {
      name: "Silk Board",
      incidents: 4,
      color: "#F59E0B",
    },
  ];

  return (
    <div
      style={{
        background:
          "var(--app-surface)",
        padding: "20px",
        borderRadius: "16px",
        color:
          "var(--text-primary)",
        border:
          "1px solid var(--border)",
        boxShadow:
          "var(--shadow)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              color:
                "var(--text-primary)",
            }}
          >
            🔥 Critical Traffic Zones
          </h2>

          <p
            style={{
              margin:
                "6px 0 0",
              color:
                "var(--text-muted)",
              fontSize: "12px",
            }}
          >
            Areas requiring closer traffic monitoring.
          </p>
        </div>

        <span
          style={{
            background:
              "rgba(239,68,68,.10)",
            color:
              "#EF4444",
            border:
              "1px solid rgba(239,68,68,.22)",
            padding:
              "6px 10px",
            borderRadius:
              "999px",
            fontSize:
              "10px",
            fontWeight:
              "800",
          }}
        >
          HIGH RISK
        </span>
      </div>

      <div
        style={{
          display:
            "grid",
          gap:
            "10px",
        }}
      >
        {zones.map(
          (zone, index) => (
            <div
              key={
                zone.name
              }
              style={{
                display:
                  "flex",
                alignItems:
                  "center",
                justifyContent:
                  "space-between",
                gap:
                  "12px",
                background:
                  "var(--app-surface-2)",
                border:
                  "1px solid var(--border)",
                borderLeft:
                  `4px solid ${zone.color}`,
                borderRadius:
                  "12px",
                padding:
                  "12px 14px",
              }}
            >
              <div
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap:
                    "10px",
                }}
              >
                <span
                  style={{
                    width:
                      "30px",
                    height:
                      "30px",
                    borderRadius:
                      "9px",
                    display:
                      "grid",
                    placeItems:
                      "center",
                    background:
                      `${zone.color}14`,
                    color:
                      zone.color,
                    fontSize:
                      "12px",
                    fontWeight:
                      "800",
                  }}
                >
                  {index + 1}
                </span>

                <span
                  style={{
                    color:
                      "var(--text-primary)",
                    fontWeight:
                      "700",
                  }}
                >
                  📍 {zone.name}
                </span>
              </div>

              <span
                style={{
                  color:
                    zone.color,
                  fontWeight:
                    "800",
                  fontSize:
                    "13px",
                }}
              >
                {zone.incidents} incidents
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default CriticalZones;