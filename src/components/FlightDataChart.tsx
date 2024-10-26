import { useState, useRef, useCallback, FC } from "react";
import { Line } from 'react-chartjs-2';
import { format } from "date-fns";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  // Legend,
} from 'chart.js';
import zoomPlugin from "chartjs-plugin-zoom";
// import crosshairPlugin from 'chartjs-plugin-crosshair';
import data from "../data/flightData.json";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  zoomPlugin,
  // crosshairPlugin,
);


const FlightDataChart: FC = () => {
  const [xAxis, setXAxis] = useState('timestamp');
  // const [zoomLimits, setZoomLimits] = useState({ xMin: null, xMax: null });

  const chartRef1 = useRef<ChartJS<'line'> | null>(null);
  const chartRef2 = useRef<ChartJS<'line'> | null>(null);

  const handleZoom = useCallback((chart: { chart: ChartJS }) => {
    const { chart: zoomedChart } = chart;
    const { min: xMin, max: xMax } = zoomedChart.scales.x;
    const { min: yMin, max: yMax } = zoomedChart.scales.y;

    // Sincronizza l'altro grafico
    if (chartRef1.current && chartRef2.current) {
      [chartRef1.current, chartRef2.current].forEach((ref) => {
        if (ref !== zoomedChart) { // Non aggiornare il grafico che ha già effettuato lo zoom
          ref.scales.x.options.min = xMin;
          ref.scales.x.options.max = xMax;
          ref.update();
        }
      });
    }

    console.log("Zoom applicato:");
    console.log(`Asse X: da ${xMin} a ${xMax}`);
    console.log(`Asse Y: da ${yMin} a ${yMax}`);

    const labels = zoomedChart.data.labels;
    if (!labels) return;

    const startIndex = Math.max(0, Math.floor(xMin));
    const endIndex = Math.min(labels.length - 1, Math.ceil(xMax));

    const startLabel = labels[startIndex];
    const endLabel = labels[endIndex];

    console.log(`Periodo: da ${startLabel} a ${endLabel}`);
  }, []);

  const handleXAxisChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setXAxis(e.target.value);

    // Dopo aver cambiato l'asse, applica i limiti di zoom salvati
    // if (chartRef.current && zoomLimits.xMin !== null && zoomLimits.xMax !== null) {
    //   const chart = chartRef.current;
    //   chart.zoomScale('x', { min: zoomLimits.xMin, max: zoomLimits.xMax });
    // }
  };

  const formatDate = (date: string | Date) => {
    return format(new Date(date), 'dd/MM/yyyy HH:mm');
  };

  const resetZoom = () => {
    if (chartRef1.current && chartRef2.current) {
      chartRef1.current.resetZoom();
      chartRef2.current.resetZoom();
    } else if (chartRef1.current && chartRef2.current) {
      chartRef1.current.resetZoom();
      chartRef2.current.resetZoom();
    }
  };

  const chartData = {
    labels: data.map(d => xAxis === 'timestamp' ? formatDate(d.timestamp) : d.flightHours),
    datasets: [
      {
        label: 'S1R',
        data: data.map(d => d.s1r),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };

  // const options1 = {
  //   responsive: true,
  //   maintainAspectRatio: false,
  //   plugins: {
  //     legend: {
  //       position: 'top',
  //     },
  //     title: {
  //       display: true,
  //       text: 'Grafico S1R',
  //     },
  //     zoom: {
  //       // limits: {
  //       //   y: { min: "original", max: "original" },
  //       // },
  //       // pan: {
  //       //   enabled: true,
  //       //   mode: "xy",
  //       // },
  //       zoom: {
  //         mode: "x",
  //         drag: {
  //           enabled: true,
  //           backgroundColor: "rgba(255,122,90,0.3)",
  //           borderColor: "rgba(90,90,90)",
  //           borderWidth: 0.2,
  //           // threshold: 10,
  //         },
  //         onZoom: handleZoom,
  //       },
  //     },
  //   },
  //   scales: {
  //     x: {
  //       title: {
  //         display: true,
  //         text: xAxis === 'timestamp' ? 'Data e Ora' : 'Ore di volo',
  //       },
  //       ticks: {
  //         maxRotation: 0,
  //         minRotation: 0
  //       },
  //     },
  //     y: {
  //       title: {
  //         display: true,
  //         text: 'S1R',
  //       },
  //     },
  //   },
  // };
  const options2 = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Grafico S1R',
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
          mode: 'x' as const,
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
    scales: {
      x: {
        title: {
          display: true,
          text: xAxis === 'timestamp' ? 'Data e Ora' : 'Ore di volo',
        },
        ticks: {
          maxRotation: 0,
          minRotation: 0
        },
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
    <div className="w-full" style={{ height: '500px' }}>
      <div className="mb-4">
        <label className="mr-2">Asse X:</label>
        <select
          value={xAxis}
          onChange={handleXAxisChange}
          className="p-2 border rounded"
        >
          <option value="timestamp">Data e Ora</option>
          <option value="flightHours">Ore di volo</option>
        </select>

      </div>
      {/* <div style={{ height: 'calc(100% - 40px)' }}>
        <Line ref={chartRef1} options={options1} data={chartData} />
      </div> */}
      <div style={{ height: 'calc(100% - 40px)' }}>
        <Line ref={chartRef2} options={options2} data={chartData} />
      </div>
      <div className="resetButton">
        <button onClick={resetZoom}>Reset Zoom</button>
      </div>
    </div>
  );
};

export default FlightDataChart;