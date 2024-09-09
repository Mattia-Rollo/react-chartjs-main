import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const FlightDataChart = () => {
  const [xAxis, setXAxis] = useState('timestamp');

  const data = [
    { id: 1, flightHours: 0, s1r: 20, s1r_avg: 2, timestamp: new Date('2023-07-25T06:00:00'), valid: false, farAndClose: "far" },
    { id: 2, flightHours: 35.30, s1r: 35, s1r_avg: 5, timestamp: new Date('2023-07-25T07:30:00'), valid: true, farAndClose: "far" },
    { id: 3, flightHours: 52.00, s1r: 2, s1r_avg: 10, timestamp: new Date('2023-07-25T08:45:00'), valid: true, farAndClose: "close" },
    { id: 4, flightHours: 83.20, s1r: 10, s1r_avg: 23, timestamp: new Date('2023-07-25T09:55:00'), valid: true, farAndClose: "far" },
    { id: 5, flightHours: 106.40, s1r: 40, s1r_avg: 1, timestamp: new Date('2023-07-25T10:00:00'), valid: true, farAndClose: "far" },
    { id: 6, flightHours: 145.40, s1r: 60, s1r_avg: 6, timestamp: new Date('2023-07-25T11:10:00'), valid: false, farAndClose: "far" },
    { id: 7, flightHours: 178.40, s1r: 89, s1r_avg: 12, timestamp: new Date('2023-07-25T12:20:00'), valid: false, farAndClose: "far" },
    { id: 8, flightHours: 213.70, s1r: 56, s1r_avg: 21, timestamp: new Date('2023-07-25T13:30:00'), valid: true, farAndClose: "far" },
    { id: 9, flightHours: 230.40, s1r: 5, s1r_avg: 8, timestamp: new Date('2023-07-25T14:40:00'), valid: true, farAndClose: "close" },
    { id: 10, flightHours: 261.60, s1r: 13, s1r_avg: 34, timestamp: new Date('2023-07-25T15:50:00'), valid: true, farAndClose: "far" },
    { id: 11, flightHours: 284.80, s1r: 5, s1r_avg: 40, timestamp: new Date('2023-07-25T16:00:00'), valid: true, farAndClose: "close" },
    { id: 12, flightHours: 300.80, s1r: -3, s1r_avg: 24, timestamp: new Date('2023-07-25T17:10:00'), valid: true, farAndClose: "close" },
  ];

  const formatDate = (date) => {
    const pad = (num) => num.toString().padStart(2, '0');
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const chartData = {
    labels: data.map(d => xAxis === 'timestamp' ? formatDate(d.timestamp) : d.flightHours.toFixed(2)),
    datasets: [
      {
        label: 'S1R',
        data: data.map(d => d.s1r),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Grafico S1R',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: xAxis === 'timestamp' ? 'Data e Ora' : 'Ore di volo',
        },
        ticks: {
          maxRotation: 0,
          minRotation: 0
        }
      },
      y: {
        title: {
          display: true,
          text: 'S1R',
        },
      },
    },
  };

  return (
    <div className="w-full" style={{ height: '400px' }}>
      <div className="mb-4">
        <label className="mr-2">Asse X:</label>
        <select 
          value={xAxis} 
          onChange={(e) => setXAxis(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="timestamp">Data e Ora</option>
          <option value="flightHours">Ore di volo</option>
        </select>
      </div>
      <div style={{ height: 'calc(100% - 40px)' }}>
        <Line options={options} data={chartData} />
      </div>
    </div>
  );
};

export default FlightDataChart;