import React, { useRef, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Chart as ChartJS, defaults } from "chart.js/auto";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import zoomPlugin from "chartjs-plugin-zoom";
import FlightDataChart from "./components/FlightDataChart";
import FlyingHelicopter from "./components/HelicopterAnimation";
import SpeseMensiliDashboard from "./components/DashboardBank";
import TestPage from "./pages/TestPage";
import { AppBar, Toolbar, Button, Container, Box } from '@mui/material';

import "./App.css";

import revenueData from "./data/revenueData.json";
import sourceData from "./data/sourceData.json";

ChartJS.register(zoomPlugin);

defaults.maintainAspectRatio = false;
defaults.responsive = true;
defaults.plugins.title.display = true;
defaults.plugins.title.align = "start";
defaults.plugins.title.font.size = 20;
defaults.plugins.title.color = "black";

const Dashboard = ({ chartRef, handleZoom, resetZoom }) => (
  <Box container>
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
    </Box>
);

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
    <Router>
      {/* <FlyingHelicopter /> */}
      <div className="App">
        <AppBar position="static">
          <Toolbar>
            <Button color="inherit" component={Link} to="/">Dashboard</Button>
            <Button color="inherit" component={Link} to="/flight-data">Flight Data</Button>
            <Button color="inherit" component={Link} to="/bank-dashboard">Bank Dashboard</Button>
            <Button color="inherit" component={Link} to="/test-chart">TEST Chart</Button>
          </Toolbar>
        </AppBar>

        <Container>
          <Routes>
            <Route path="/" element={<Dashboard chartRef={chartRef} handleZoom={handleZoom} resetZoom={resetZoom} />} />
            <Route path="/flight-data" element={<div className="dataCard revenueCard"><FlightDataChart /></div>} />
            <Route path="/bank-dashboard" element={<div className="bankCard dataCard"><SpeseMensiliDashboard /></div>} />
            <Route path="/test-chart" element={<div className="test chart"><TestPage /></div>} />
          </Routes>
        </Container>
      </div>
    </Router>
  );
};