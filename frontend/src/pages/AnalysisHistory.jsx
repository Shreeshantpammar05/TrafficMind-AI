import { API_BASE } from "../config/api.js";
import BackButton from "../components/BackButton";
import MainLayout from "../layouts/MainLayout";

import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip as RechartsTooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

import {
  useEffect,
  useState,
} from "react";

import axios from "axios";

function AnalysisHistory() {
  const [analyses, setAnalyses] =
    useState([]);

  const [loading, setLoading] =
    useState(true);



  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory =
    async () => {
      try {
        setLoading(true);

        const res =
          await axios.get(
            `${API_BASE}/api/analysis`,
            {
              headers: {
                Authorization:
                  `Bearer ${localStorage.getItem(
                    "token"
                  )}`,
              },
            }
          );

        setAnalyses(
          res.data?.analyses || []
        );
      } catch (error) {
        console.log(
          "Analysis history error:",
          error
        );

        setAnalyses([]);
      } finally {
        setLoading(false);
      }
    };

  const highCongestion =
    analyses.filter(
      (item) =>
        item.congestion ===
        "HIGH"
    ).length;

  const mediumCongestion =
    analyses.filter(
      (item) =>
        item.congestion ===
        "MEDIUM"
    ).length;

  const lowCongestion =
    analyses.filter(
      (item) =>
        item.congestion ===
        "LOW"
    ).length;

  const chartData =
    analyses.map(
      (item, index) => ({
        analysis: index + 1,
        vehicles:
          item.vehicleCount ||
          item.averageVehicleCount ||
          0,
      })
    );

  const congestionData = [
    {
      name: "HIGH",
      value:
        highCongestion,
    },
    {
      name: "MEDIUM",
      value:
        mediumCongestion,
    },
    {
      name: "LOW",
      value:
        lowCongestion,
    },
  ];

  const COLORS = [
    "#EF4444",
    "#F59E0B",
    "#22C55E",
  ];

  const chartTheme = {
    grid:
      "var(--border)",
    axis:
      "var(--text-muted)",
    tooltipBackground:
      "var(--app-surface)",
    tooltipText:
      "var(--text-primary)",
  };

  return (
    <MainLayout>
      <BackButton />

      {/* PAGE HEADER */}

      <div
        className="hero-header"
        style={{
          marginBottom:
            "25px",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
            }}
          >
            📊 Analysis History Center
          </h1>

          <p
            style={{
              color:
                "rgba(255,255,255,.88)",
              fontSize:
                "18px",
              fontWeight:
                "600",
              marginTop:
                "8px",
            }}
          >
            Historical AI Analytics
          </p>

          <p
            style={{
              color:
                "rgba(255,255,255,.84)",
              maxWidth:
                "720px",
              lineHeight:
                "1.6",
            }}
          >
            Review previous AI traffic
            analyses, congestion trends,
            vehicle trends, and historical
            recommendations.
          </p>
        </div>

        <div
          style={{
            background:
              "#8B5CF6",
            color:
              "#FFFFFF",
            padding:
              "10px 18px",
            borderRadius:
              "25px",
            fontWeight:
              "700",
            whiteSpace:
              "nowrap",
          }}
        >
          📊 ANALYTICS
        </div>
      </div>

      {/* KPI OVERVIEW */}

      <div
        className="cards"
        style={{
          marginBottom:
            "25px",
        }}
      >
        <div className="card">
          <span
            style={{
              color:
                "var(--text-muted)",
            }}
          >
            📊 Total Analyses
          </span>

          <h2
            style={{
              marginTop:
                "12px",
              fontSize:
                "36px",
            }}
          >
            {analyses.length}
          </h2>
        </div>

        <div className="card">
          <span
            style={{
              color:
                "var(--text-muted)",
            }}
          >
            🔴 High Congestion
          </span>

          <h2
            style={{
              marginTop:
                "12px",
              fontSize:
                "36px",
              color:
                "#EF4444",
            }}
          >
            {highCongestion}
          </h2>
        </div>

        <div className="card">
          <span
            style={{
              color:
                "var(--text-muted)",
            }}
          >
            🟡 Medium Congestion
          </span>

          <h2
            style={{
              marginTop:
                "12px",
              fontSize:
                "36px",
              color:
                "#F59E0B",
            }}
          >
            {mediumCongestion}
          </h2>
        </div>

        <div className="card">
          <span
            style={{
              color:
                "var(--text-muted)",
            }}
          >
            🟢 Low Congestion
          </span>

          <h2
            style={{
              marginTop:
                "12px",
              fontSize:
                "36px",
              color:
                "#22C55E",
            }}
          >
            {lowCongestion}
          </h2>
        </div>
      </div>

      {/* LOADING */}

      {loading && (
        <div
          className="section-card"
          style={{
            marginBottom:
              "25px",
            textAlign:
              "center",
            padding:
              "40px",
            color:
              "var(--text-muted)",
          }}
        >
          Loading analysis history...
        </div>
      )}

      {/* EMPTY STATE */}

      {!loading &&
        analyses.length ===
          0 && (
          <div
            className="section-card"
            style={{
              marginBottom:
                "25px",
              textAlign:
                "center",
              padding:
                "50px",
              color:
                "var(--text-muted)",
            }}
          >
            No historical AI analysis
            records available.
          </div>
        )}

      {/* VEHICLE TREND */}

      {!loading &&
        analyses.length >
          0 && (
          <div
            className="section-card"
            style={{
              padding:
                "20px",
              marginBottom:
                "25px",
            }}
          >
            <div
              style={{
                marginBottom:
                  "15px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                }}
              >
                📈 Vehicle Trend
              </h2>

              <p
                style={{
                  color:
                    "var(--text-muted)",
                  marginTop:
                    "6px",
                }}
              >
                Vehicle counts across recorded
                AI analyses.
              </p>
            </div>

            <ResponsiveContainer
              width="100%"
              height={300}
            >
              <LineChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 20,
                  left: 0,
                  bottom: 10,
                }}
              >
                <CartesianGrid
                  stroke={
                    chartTheme.grid
                  }
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="analysis"
                  tick={{
                    fill:
                      chartTheme.axis,
                  }}
                  axisLine={{
                    stroke:
                      chartTheme.grid,
                  }}
                  tickLine={{
                    stroke:
                      chartTheme.grid,
                  }}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{
                    fill:
                      chartTheme.axis,
                  }}
                  axisLine={{
                    stroke:
                      chartTheme.grid,
                  }}
                  tickLine={{
                    stroke:
                      chartTheme.grid,
                  }}
                />

                <RechartsTooltip
                  contentStyle={{
                    background:
                      chartTheme.tooltipBackground,
                    border:
                      "1px solid var(--border)",
                    borderRadius:
                      "10px",
                    color:
                      chartTheme.tooltipText,
                  }}
                  labelStyle={{
                    color:
                      chartTheme.tooltipText,
                  }}
                  itemStyle={{
                    color:
                      "var(--accent)",
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="vehicles"
                  stroke="#2563EB"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

      {/* CONGESTION DISTRIBUTION */}

      {!loading &&
        analyses.length >
          0 && (
          <div
            className="section-card"
            style={{
              padding:
                "20px",
              marginBottom:
                "25px",
            }}
          >
            <div
              style={{
                marginBottom:
                  "15px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                }}
              >
                🚦 Congestion Distribution
              </h2>

              <p
                style={{
                  color:
                    "var(--text-muted)",
                  marginTop:
                    "6px",
                }}
              >
                Distribution of recorded
                congestion levels.
              </p>
            </div>

            <ResponsiveContainer
              width="100%"
              height={300}
            >
              <PieChart>
                <Pie
                  data={congestionData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                  label
                >
                  {congestionData.map(
                    (
                      entry,
                      index
                    ) => (
                      <Cell
                        key={
                          entry.name
                        }
                        fill={
                          COLORS[index]
                        }
                      />
                    )
                  )}
                </Pie>

                <RechartsTooltip
                  contentStyle={{
                    background:
                      chartTheme.tooltipBackground,
                    border:
                      "1px solid var(--border)",
                    borderRadius:
                      "10px",
                    color:
                      chartTheme.tooltipText,
                  }}
                  labelStyle={{
                    color:
                      chartTheme.tooltipText,
                  }}
                />

                <Legend
                  wrapperStyle={{
                    color:
                      "var(--text-muted)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

      {/* ANALYSIS RECORDS */}

      {!loading &&
        analyses.length >
          0 && (
          <div
            className="section-card"
            style={{
              marginBottom:
                "20px",
            }}
          >
            <div
              style={{
                marginBottom:
                  "20px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                }}
              >
                📜 Analysis Records
              </h2>

              <p
                style={{
                  color:
                    "var(--text-muted)",
                  marginTop:
                    "6px",
                }}
              >
                Historical traffic analyses
                generated by the existing AI
                engine.
              </p>
            </div>

            <div
              style={{
                display:
                  "grid",
                gap:
                  "15px",
              }}
            >
              {analyses.map(
                (item) => (
                  <div
                    key={
                      item._id
                    }
                    className="card"
                    style={{
                      padding:
                        "20px",
                    }}
                  >
                    <div
                      style={{
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "flex-start",
                        gap:
                          "20px",
                        flexWrap:
                          "wrap",
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            margin:
                              0,
                          }}
                        >
                          🚗 Vehicles:{" "}
                          {item.vehicleCount ??
                            item.averageVehicleCount ??
                            0}
                        </h3>

                        <p
                          style={{
                            marginTop:
                              "10px",
                            color:
                              "var(--text-secondary)",
                          }}
                        >
                          🚦 Congestion:{" "}
                          <strong>
                            {item.congestion ||
                              "Unknown"}
                          </strong>
                        </p>

                        <p
                          style={{
                            color:
                              "var(--text-secondary)",
                          }}
                        >
                          📢 Recommendation:{" "}
                          {item.recommendation ||
                            "No recommendation"}
                        </p>
                      </div>

                      <span
                        style={{
                          color:
                            item.congestion ===
                            "HIGH"
                              ? "#EF4444"
                              : item.congestion ===
                                "MEDIUM"
                              ? "#F59E0B"
                              : "#22C55E",
                          fontWeight:
                            "800",
                          background:
                            "var(--glass)",
                          border:
                            "1px solid var(--border)",
                          padding:
                            "6px 10px",
                          borderRadius:
                            "999px",
                          fontSize:
                            "11px",
                        }}
                      >
                        {item.congestion ||
                          "UNKNOWN"}
                      </span>
                    </div>

                    <p
                      style={{
                        marginTop:
                          "12px",
                        fontSize:
                          "12px",
                        color:
                          "var(--text-subtle)",
                      }}
                    >
                      🕒{" "}
                      {item.createdAt
                        ? new Date(
                            item.createdAt
                          ).toLocaleString()
                        : "Unknown time"}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        )}
    </MainLayout>
  );
}

export default AnalysisHistory;