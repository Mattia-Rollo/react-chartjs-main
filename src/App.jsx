import React, { useRef, useCallback } from "react";
import { Chart as ChartJS, defaults } from "chart.js/auto"; // import all chart.js modules and plugins
import { Bar, Doughnut, Line } from "react-chartjs-2";
import zoomPlugin from "chartjs-plugin-zoom";
import FlightDataChart from "./components/FlightDataChart";
import FlyingHelicopter from "./components/HelicopterAnimation";

import "./App.css";

import revenueData from "./data/revenueData.json";
import sourceData from "./data/sourceData.json";


console.log("zoomPlugin:", zoomPlugin);

ChartJS.register(zoomPlugin);

console.log("ChartJS plugins:", ChartJS.registry.plugins);

defaults.maintainAspectRatio = false;
defaults.responsive = true;

defaults.plugins.title.display = true;
defaults.plugins.title.align = "start";
defaults.plugins.title.font.size = 20;
defaults.plugins.title.color = "black";

export const App = () => {
  const chartRef = useRef(null);

  const handleZoom = useCallback((chart) => {
    const { chart: zoomedChart } = chart;
    const { min: xMin, max: xMax } = zoomedChart.scales.x;
    const { min: yMin, max: yMax } = zoomedChart.scales.y;

    console.log("Zoom applicato:");
    console.log(`Asse X: da ${xMin} a ${xMax}`);
    console.log(`Asse Y: da ${yMin} a ${yMax}`);

    const labels = zoomedChart.data.labels;
    const startIndex = Math.max(0, Math.floor(xMin));
    const endIndex = Math.min(labels.length - 1, Math.ceil(xMax));

    const startLabel = labels[startIndex];
    const endLabel = labels[endIndex];

    console.log(`Periodo: da ${startLabel} a ${endLabel}`);
  }, []);

  const resetZoom = () => {
    if (chartRef && chartRef.current) {
      chartRef.current.resetZoom();
    }
  };
  return (
    <div className="App">
      <FlyingHelicopter />
      <div className="dataCard revenueCard">
        <div className="resetButton">
          <button onClick={resetZoom}>Reset Zoom</button>
        </div>
        <Line
          ref={chartRef}
          data={{
            labels: revenueData.map((data) => data.label),
            datasets: [
              {
                label: "Revenue",
                data: revenueData.map((data) => data.revenue),
                backgroundColor: "#064FF0",
                borderColor: "#064FF0",
                borderWidth: 1,
              },
              {
                label: "Cost",
                data: revenueData.map((data) => data.cost),
                backgroundColor: "#FF3030",
                borderColor: "#FF3030",
                borderWidth: 1,
              },
            ],
          }}
          options={{
            elements: {
              line: {
                tension: 0.5,
              },
            },
            plugins: {
              title: {
                text: "Monthly Revenue & Cost",
              },
              zoom: {
                // limits: {
                //   y: { min: "original", max: "original" },
                // },
                // pan: {
                //   enabled: true,
                //   mode: "xy",
                // },
                zoom: {
                  mode: "x",
                  drag: {
                    enabled: true,
                    backgroundColor: "rgba(255,122,90,0.3)",
                    borderColor: "rgba(90,90,90)",
                    borderWidth: 0.2,
                    // threshold: 10,
                  },
                  onZoom: handleZoom,
                },
              },
            },
          }}
        />
      </div>

      <div className="dataCard customerCard">
        <Bar
          data={{
            labels: sourceData.map((data) => data.label),
            datasets: [
              {
                label: "Count",
                data: sourceData.map((data) => data.value),
                backgroundColor: [
                  "rgba(43, 63, 229, 0.8)",
                  "rgba(250, 192, 19, 0.8)",
                  "rgba(253, 135, 135, 0.8)",
                ],
                borderRadius: 5,
              },
            ],
          }}
          options={{
            plugins: {
              title: {
                text: "Revenue Source",
              },
            },
          }}
        />
      </div>

      <div className="dataCard categoryCard">
        <Doughnut
          data={{
            labels: sourceData.map((data) => data.label),
            datasets: [
              {
                label: "Count",
                data: sourceData.map((data) => data.value),
                backgroundColor: [
                  "rgba(43, 63, 229, 0.8)",
                  "rgba(250, 192, 19, 0.8)",
                  "rgba(253, 135, 135, 0.8)",
                ],
                borderColor: [
                  "rgba(43, 63, 229, 0.8)",
                  "rgba(250, 192, 19, 0.8)",
                  "rgba(253, 135, 135, 0.8)",
                ],
              },
            ],
          }}
          options={{
            plugins: {
              title: {
                text: "Revenue Sources",
              },
            },
          }}
        />
      </div>

      <div className="dataCard revenueCard">
        <FlightDataChart />
      </div>
    </div>
  );
};
