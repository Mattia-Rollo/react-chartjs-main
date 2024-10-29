import { useRef, useCallback, FC } from "react";
import { Chart as ChartJS, defaults } from "chart.js/auto";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import zoomPlugin from "chartjs-plugin-zoom";
import { Button, Box } from '@mui/material';

import revenueData from "../data/revenueData.json";
import sourceData from "../data/sourceData.json";

// Registrazione plugin e configurazione defaults
ChartJS.register(zoomPlugin);

defaults.maintainAspectRatio = false;
defaults.responsive = true;
defaults.plugins.title.display = true;
defaults.plugins.title.align = "start";
defaults.plugins.title.color = "black";

const Dashboard: FC = () => {
  const chartRef = useRef<ChartJS<"line"> | null>(null);

  const handleZoom = useCallback((chart: { chart: ChartJS }) => {
    const { chart: zoomedChart } = chart;
    const { min: xMin, max: xMax } = zoomedChart.scales.x;
    const { min: yMin, max: yMax } = zoomedChart.scales.y;

    console.log("Zoom applicato:", { xMin, xMax, yMin, yMax });

    const labels = zoomedChart.data.labels;
    if (!labels) return;
    const startIndex = Math.max(0, Math.floor(xMin));
    const endIndex = Math.min(labels.length - 1, Math.ceil(xMax));

    console.log(`Periodo: da ${labels[startIndex]} a ${labels[endIndex]}`);
  }, []);

  const resetZoom = () => {
    chartRef.current?.resetZoom();
  };

  return (
    <Box>
      <Box className="dataCard revenueCard">
        <Box className="resetButton">
          <Button onClick={resetZoom}>Reset Zoom</Button>
        </Box>
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
                zoom: {
                  mode: "x",
                  drag: {
                    enabled: true,
                    backgroundColor: "rgba(255,122,90,0.3)",
                    borderColor: "rgba(90,90,90)",
                    borderWidth: 0.2,
                  },
                  onZoom: handleZoom,
                },
              },
            },
          }}
        />
      </Box>

      <Box className="dataCard customerCard">
        <Bar
          data={{
            labels: sourceData.map((data) => data.label),
            datasets: [{
              label: "Count",
              data: sourceData.map((data) => data.value),
              backgroundColor: [
                "rgba(43, 63, 229, 0.8)",
                "rgba(250, 192, 19, 0.8)",
                "rgba(253, 135, 135, 0.8)",
              ],
              borderRadius: 5,
            }],
          }}
          options={{
            plugins: {
              title: {
                text: "Revenue Source",
              },
            },
          }}
        />
      </Box>

      <Box className="dataCard categoryCard">
        <Doughnut
          data={{
            labels: sourceData.map((data) => data.label),
            datasets: [{
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
            }],
          }}
          options={{
            plugins: {
              title: {
                text: "Revenue Sources",
              },
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default Dashboard;