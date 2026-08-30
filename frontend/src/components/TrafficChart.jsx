import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

import {
  useEffect,
  useState,
} from "react";

import axios from "axios";

import { useTheme } from "../theme/ThemeContext";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000";

function TrafficChart() {
  const [data, setData] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const { isDark } =
    useTheme();

  useEffect(() => {
    fetchChartData();

    const interval =
      setInterval(
        fetchChartData,
        5000
      );

    return () =>
      clearInterval(interval);
  }, []);

  const fetchChartData =
    async () => {
      try {
        setLoading(true);

        const res =
          await axios.get(
            `${API_BASE}/api/incidents`,
            {
              headers: {
                Authorization:
                  `Bearer ${localStorage.getItem(
                    "token"
                  )}`,
              },
            }
          );

        const incidents =
          res.data?.incidents || [];

        const areaCount = {};

        incidents.forEach(
          (item) => {
            const area =
              item.location?.trim() ||
              "Unknown";

            areaCount[area] =
              (areaCount[area] ||
                0) + 1;
          }
        );

        const chartData =
          Object.entries(areaCount)
            .map(
              ([area, incidents]) => ({
                area,
                incidents,
              })
            )
            .sort(
              (a, b) =>
                b.incidents -
                a.incidents
            );

        setData(chartData);
      } catch (error) {
        console.log(
          "Traffic chart error:",
          error
        );

        setData([]);
      } finally {
        setLoading(false);
      }
    };

  const chartColors = isDark
    ? {
        grid:
          "rgba(255,255,255,.10)",
        axis:
          "var(--text-muted)",
        tooltipBg:
          "var(--app-surface-2)",
        tooltipBorder:
          "var(--border)",
        tooltipText:
          "var(--text-primary)",
      }
    : {
        grid:
          "rgba(15,23,42,.10)",
        axis:
          "var(--text-secondary)",
        tooltipBg:
          "var(--app-surface)",
        tooltipBorder:
          "var(--border-strong)",
        tooltipText:
          "var(--text-primary)",
      };

  return (
    <div
      style={{
        background:
          "var(--app-surface)",
        padding:
          "20px",
        borderRadius:
          "16px",
        marginTop:
          "30px",
        border:
          "1px solid var(--border)",
        boxShadow:
          "var(--shadow)",
        color:
          "var(--text-primary)",
      }}
    >
      <div
        style={{
          display:
            "flex",
          justifyContent:
            "space-between",
          alignItems:
            "center",
          gap:
            "15px",
          marginBottom:
            "15px",
          flexWrap:
            "wrap",
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
            📊 Traffic Analytics
          </h2>

          <p
            style={{
              marginTop:
                "6px",
              marginBottom: 0,
              color:
                "var(--text-muted)",
              fontSize:
                "14px",
            }}
          >
            Incident distribution by location.
          </p>
        </div>

        <div
          style={{
            background:
              "var(--accent-soft)",
            color:
              "var(--accent)",
            padding:
              "7px 12px",
            borderRadius:
              "18px",
            fontSize:
              "12px",
            fontWeight:
              "800",
            border:
              "1px solid var(--border)",
          }}
        >
          LIVE
        </div>
      </div>

      {loading ? (
        <div
          style={{
            height:
              "320px",
            display:
              "flex",
            justifyContent:
              "center",
            alignItems:
              "center",
            color:
              "var(--text-muted)",
            background:
              "var(--app-surface-2)",
            borderRadius:
              "12px",
          }}
        >
          Loading traffic analytics...
        </div>
      ) : data.length ===
        0 ? (
        <div
          style={{
            height:
              "320px",
            display:
              "flex",
            justifyContent:
              "center",
            alignItems:
              "center",
            color:
              "var(--text-muted)",
            background:
              "var(--app-surface-2)",
            borderRadius:
              "12px",
            border:
              "1px dashed var(--border)",
          }}
        >
          No incident data available.
        </div>
      ) : (
        <ResponsiveContainer
          width="100%"
          height={320}
        >
          <BarChart
            data={data}
            margin={{
              top: 10,
              right: 20,
              left: 0,
              bottom: 40,
            }}
          >
            <CartesianGrid
              stroke={
                chartColors.grid
              }
              strokeDasharray="3 3"
            />

            <XAxis
              dataKey="area"
              angle={-25}
              textAnchor="end"
              interval={0}
              height={60}
              tick={{
                fill:
                  chartColors.axis,
                fontSize: 12,
              }}
              axisLine={{
                stroke:
                  chartColors.grid,
              }}
              tickLine={{
                stroke:
                  chartColors.grid,
              }}
            />

            <YAxis
              allowDecimals={false}
              tick={{
                fill:
                  chartColors.axis,
                fontSize: 12,
              }}
              axisLine={{
                stroke:
                  chartColors.grid,
              }}
              tickLine={{
                stroke:
                  chartColors.grid,
              }}
            />

            <Tooltip
              cursor={{
                fill: isDark
                  ? "rgba(59,130,246,.07)"
                  : "rgba(37,99,235,.06)",
              }}
              contentStyle={{
                background:
                  chartColors.tooltipBg,
                border:
                  `1px solid ${chartColors.tooltipBorder}`,
                borderRadius:
                  "10px",
                color:
                  chartColors.tooltipText,
                boxShadow:
                  "0 12px 30px rgba(0,0,0,.15)",
              }}
              labelStyle={{
                color:
                  chartColors.tooltipText,
                fontWeight:
                  700,
              }}
              itemStyle={{
                color:
                  isDark
                    ? "#60A5FA"
                    : "#2563EB",
              }}
            />

            <Bar
              dataKey="incidents"
              fill={
                isDark
                  ? "#60A5FA"
                  : "#2563EB"
              }
              radius={[
                10,
                10,
                0,
                0,
              ]}
              maxBarSize={64}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default TrafficChart;