import React, { useEffect, useState, useRef } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale,
    Chart,
    ChartOptions
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Line } from 'react-chartjs-2';
import { it } from 'date-fns/locale';
import zoomPlugin from 'chartjs-plugin-zoom';
import annotationPlugin from 'chartjs-plugin-annotation';

// Registriamo i componenti necessari di Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale,
    zoomPlugin,
    annotationPlugin
);

// Tipo per i dati TVM
interface TVMData {
    timestamp: number;      // timestamp per datetime
    flightHours: number;    // secondi di volo totali
    amplitude: number;      // valore di ampiezza (g)
}

// Proprietà del componente
interface TVMChartsProps {
    sensorData1?: TVMData[];
    sensorData2?: TVMData[];
    xAxisType?: 'datetime' | 'flightHours' | 'flightHoursCategory';
    height?: number;
    showMarkers?: boolean;
}

// Riferimenti ai grafici per la sincronizzazione
interface ChartRefs {
    chart1: Chart | null;
    chart2: Chart | null;
}

const TVMChart: React.FC<{
    id: string;
    title: string;
    subtitle: string;
    color: string;
    data: TVMData[];
    xAxisType: 'datetime' | 'flightHours' | 'flightHoursCategory';
    height: number;
    showMarkers?: boolean;
    onZoom?: (min: number | string, max: number | string) => void;
    onSetRef?: (chart: Chart) => void;
}> = ({
    // id,
    title,
    subtitle,
    color,
    data,
    xAxisType,
    height,
    showMarkers = false,
    onZoom,
    onSetRef
}) => {

        const chartRef = useRef<Chart<'line'>>(null);

        // Formatta le ore di volo (HHHH:MM:SS)
        const formatFlightHours = (seconds: number): string => {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = Math.floor(seconds % 60);

            return `${hours.toString().padStart(4, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        };

        // Formatta valori di ampiezza grandi
        const formatAmplitude = (value: number): string => {
            if (value >= 1000000) {
                return `${(value / 1000000).toFixed(2)}M g`;
            } else if (value >= 1000) {
                return `${(value / 1000).toFixed(2)}K g`;
            }
            return `${value.toFixed(2)} g`;
        };

        // Preparazione dei dati in base al tipo di asse X selezionato
        const prepareChartData = () => {
            const labels: (string | number)[] = [];
            const values: number[] = [];

            data.forEach(point => {
                if (xAxisType === 'datetime') {
                    labels.push(point.timestamp);
                } else if (xAxisType === 'flightHours') {
                    labels.push(point.flightHours);
                } else {
                    labels.push(formatFlightHours(point.flightHours));
                }
                values.push(point.amplitude);
            });

            return {
                labels,
                datasets: [
                    {
                        label: title,
                        data: values,
                        borderColor: color,
                        backgroundColor: `${color}20`,
                        borderWidth: 3,
                        pointRadius: 0,
                        pointHoverRadius: 5,
                        tension: 0.1,
                        fill: false,
                    }
                ]
            };
        };

        // Generazione di linee verticali come markers
        const generateMarkers = () => {
            if (!showMarkers) return {};

            // Generiamo circa 5-8 linee verticali come markers
            const numMarkers = Math.floor(Math.random() * 4) + 5; // da 5 a 8 markers
            const annotations: Record<string, any> = {};

            // Dividiamo i dati in sezioni per distribuire le linee
            const step = Math.floor(data.length / numMarkers);

            for (let i = 0; i < numMarkers; i++) {
                // Scegliamo un punto casuale all'interno di ogni sezione
                const baseIndex = i * step;
                const randomOffset = Math.floor(Math.random() * (step * 0.8));
                const pointIndex = Math.min(baseIndex + randomOffset, data.length - 1);

                // Valore numerico fisso per l'etichetta (sarà dinamico in futuro)
                const markerValue = Math.floor(Math.random() * 100) + 1; // Valore tra 1 e 100

                // Coordinata X della linea verticale
                let xValue;
                if (xAxisType === 'datetime') {
                    xValue = data[pointIndex].timestamp;
                } else if (xAxisType === 'flightHours') {
                    xValue = data[pointIndex].flightHours;
                } else {
                    // Per il tipo categoria, dobbiamo usare l'indice invece del valore formattato
                    xValue = pointIndex;
                }

                annotations[`line${i}`] = {
                    type: 'line',
                    xMin: xValue,
                    xMax: xValue,
                    yMin: 0,
                    yMax: 'max',
                    borderColor: color,
                    borderWidth: 2,
                    label: {
                        content: markerValue.toString(),
                        display: true,
                        backgroundColor: color,
                        color: 'white',
                        position: 'start'
                    }
                };
            }

            return annotations;
        };

        // Configurazione delle opzioni del grafico in base al tipo di asse X
        const getChartOptions = (): ChartOptions<'line'> => {
            let options: ChartOptions<'line'> = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: title,
                        font: {
                            size: 16,
                            weight: 'bold'
                        }
                    },
                    subtitle: {
                        display: true,
                        text: subtitle,
                        padding: {
                            bottom: 10
                        }
                    },
                    tooltip: {
                        enabled: true,
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: (context) => {
                                return `${context.dataset.label}: ${formatAmplitude(context.parsed.y)}`;
                            }
                        }
                    },
                    zoom: {
                        pan: {
                            enabled: true,
                            mode: 'x',
                        },
                        zoom: {
                            drag: {
                                enabled: true
                            },
                            wheel: {
                                enabled: false,
                            },
                            pinch: {
                                enabled: false,
                            },
                            mode: 'x',
                            onZoom: ({ chart }) => {
                                if (onZoom && chart.scales.x) {
                                    onZoom(chart.scales.x.min || 0, chart.scales.x.max || 0);
                                }
                            }
                        }
                    },
                    annotation: {
                        annotations: generateMarkers()
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            callback: function (value) {
                                return formatAmplitude(Number(value));
                            }
                        },
                        title: {
                            display: true,
                            text: 'Amplitude (g)'
                        }
                    }
                },
                animation: {
                    duration: 300
                }
            };

            // Configurazione specifica per il tipo di asse X selezionato
            if (xAxisType === 'datetime') {
                options.scales = {
                    ...options.scales,
                    x: {
                        type: 'time',
                        time: {
                            unit: 'hour',
                            displayFormats: {
                                hour: 'dd/MM/yyyy HH:mm'
                            },
                            tooltipFormat: 'dd/MM/yyyy HH:mm:ss'
                        },
                        adapters: {
                            date: {
                                locale: it
                            }
                        },
                        title: {
                            display: true,
                            text: 'Data e Ora'
                        }
                    }
                };
            } else if (xAxisType === 'flightHours') {
                options.scales = {
                    ...options.scales,
                    x: {
                        type: 'linear',
                        ticks: {
                            callback: function (value) {
                                return formatFlightHours(Number(value));
                            }
                        },
                        title: {
                            display: true,
                            text: 'Ore di Volo'
                        }
                    }
                };
            } else {
                options.scales = {
                    ...options.scales,
                    x: {
                        type: 'category',
                        title: {
                            display: true,
                            text: 'Ore di Volo (HHHH:MM:SS)'
                        }
                    }
                };
            }

            return options;
        };

        // Quando il componente si monta, assegna il riferimento al grafico al parent
        useEffect(() => {
            if (chartRef.current && onSetRef) {
                onSetRef(chartRef.current);
            }
        }, [chartRef.current]);

        return (
            <div className="bg-white rounded-lg shadow p-4" style={{ height: `${height + 60}px` }}>
                <Line
                    ref={chartRef}
                    data={prepareChartData()}
                    options={getChartOptions()}
                    height={height}
                />
            </div>
        );
    };

const TVMSynchronizedCharts: React.FC<TVMChartsProps> = ({
    sensorData1 = [],
    sensorData2 = [],
    xAxisType = 'datetime',
    height = 250,
    showMarkers = false
}) => {
    // Riferimenti ai grafici per la sincronizzazione
    const [chartRefs, setChartRefs] = useState<ChartRefs>({
        chart1: null,
        chart2: null
    });

    // Funzione per resettare lo zoom su tutti i grafici
    const resetZoom = () => {
        if (chartRefs.chart1) {
            chartRefs.chart1.resetZoom();
        }
        if (chartRefs.chart2) {
            chartRefs.chart2.resetZoom();
        }
    };

    // Gestione dello zoom sincronizzato
    const handleZoom = (chartId: 'chart1' | 'chart2', min: number | string, max: number | string) => {
        // Se uno dei grafici fa zoom, sincronizza l'altro
        const otherChartId = chartId === 'chart1' ? 'chart2' : 'chart1';
        const otherChart = chartRefs[otherChartId];

        if (otherChart) {
            // Imposta manualmente lo stesso range sull'altro grafico
            otherChart.zoomScale('x', {
                min: typeof min === 'string' ? parseFloat(min) : min,
                max: typeof max === 'string' ? parseFloat(max) : max
            });
            otherChart.update('none');
        }
    };

    // Formatta il tipo di visualizzazione per il display
    const getDisplayAxisType = () => {
        switch (xAxisType) {
            case 'datetime':
                return 'Data e Ora';
            case 'flightHours':
                return 'Ore di Volo (Numeriche)';
            case 'flightHoursCategory':
                return 'Ore di Volo (HHHH:MM:SS)';
            default:
                return 'Sconosciuto';
        }
    };

    return (
        <div className="tvm-charts-container">
            <div className="mb-4 flex justify-between">
                <div>
                    {showMarkers && (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                            Linee verticali attive
                        </span>
                    )}
                </div>
                <button
                    onClick={resetZoom}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Reset Zoom
                </button>
            </div>

            <div className="mb-6">
                <TVMChart
                    id="tvm-sensor1"
                    title="TVM Sensore 1"
                    subtitle="Dati di vibrazione trasmissione"
                    color="#008FFB"
                    data={sensorData1}
                    xAxisType={xAxisType}
                    height={height}
                    showMarkers={showMarkers}
                    onZoom={(min, max) => handleZoom('chart1', min, max)}
                    onSetRef={(chart) => setChartRefs(prev => ({ ...prev, chart1: chart }))}
                />
            </div>

            <div className="mb-6">
                <TVMChart
                    id="tvm-sensor2"
                    title="TVM Sensore 2"
                    subtitle="Dati di vibrazione trasmissione - Alta scala"
                    color="#00E396"
                    data={sensorData2}
                    xAxisType={xAxisType}
                    height={height}
                    showMarkers={showMarkers}
                    onZoom={(min, max) => handleZoom('chart2', min, max)}
                    onSetRef={(chart) => setChartRefs(prev => ({ ...prev, chart2: chart }))}
                />
            </div>

            <div className="mt-2 text-sm text-gray-600">
                <p className="mb-1"><strong>Visualizzazione:</strong> {getDisplayAxisType()}</p>
                <p><strong>Nota:</strong> Seleziona un'area sul grafico per zoomare. I grafici si sincronizzeranno automaticamente.</p>
            </div>
        </div>
    );
};

// Componente per la demo con dati di esempio
const TVMChartsDemo: React.FC = () => {
    // Genera dati di esempio
    const generateSampleData = (count: number = 100, baseAmplitude: number = 5000): TVMData[] => {
        const data: TVMData[] = [];
        const startDate = new Date();
        startDate.setHours(startDate.getHours() - count);
        const startFlightHours = 1200 * 3600; // 1200 ore in secondi

        for (let i = 0; i < count; i++) {
            const timestamp = new Date(startDate).setHours(startDate.getHours() + i);
            const flightHours = startFlightHours + (i * 3600); // +1 ora di volo per punto
            const amplitude = Math.abs(
                baseAmplitude +
                (Math.random() * baseAmplitude * 0.2) + // 20% di variabilità casuale
                (Math.sin(i / 10) * baseAmplitude * 0.1) + // Componente ciclica
                (i > count * 0.7 ? baseAmplitude * 0.5 : 0) // Picco verso la fine
            );

            data.push({ timestamp, flightHours, amplitude });
        }

        return data;
    };

    const sampleData1 = generateSampleData(100, 5000);
    const sampleData2 = generateSampleData(3000, 5000);

    // Tipo di asse X selezionato
    const [xAxisType, setXAxisType] = useState<'datetime' | 'flightHours' | 'flightHoursCategory'>('datetime');

    // Stato per mostrare/nascondere i markers
    const [showMarkers, setShowMarkers] = useState(false);

    // Forza il re-render completo quando cambia il tipo
    const [key, setKey] = useState(0);

    const handleTypeChange = (newType: 'datetime' | 'flightHours' | 'flightHoursCategory') => {
        setXAxisType(newType);
        setKey(prevKey => prevKey + 1);
    };

    // Gestione del toggle delle linee verticali
    const toggleMarkers = () => {
        setShowMarkers(prev => !prev);
        setKey(prevKey => prevKey + 1); // Forza il re-render anche quando cambia lo stato dei markers
    };

    return (
        <div className="max-w-6xl mx-auto p-4">
            <h2 className="text-2xl font-bold text-center mb-4">Monitoraggio TVM Trasmissione Elicottero</h2>

            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="mr-2 font-medium">Visualizzazione Asse X:</label>
                    <select
                        value={xAxisType}
                        onChange={(e) => handleTypeChange(e.target.value as 'datetime' | 'flightHours' | 'flightHoursCategory')}
                        className="p-2 border rounded w-full mt-1"
                    >
                        <option value="datetime">Data e Ora (DD/MM/YYYY HH:MM:SS)</option>
                        <option value="flightHours">Ore di Volo (Numeriche)</option>
                        <option value="flightHoursCategory">Ore di Volo (HHHH:MM:SS)</option>
                    </select>
                </div>

                <div className="flex items-center">
                    <label className="inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showMarkers}
                            onChange={toggleMarkers}
                            className="sr-only peer"
                        />
                        <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        <span className="ml-3 text-sm font-medium text-gray-900">Mostra linee verticali</span>
                    </label>
                </div>
            </div>

            <div className="mt-2 text-sm text-gray-500 mb-6">
                <p>In un'applicazione reale, sostituire i dati di esempio con i dati TVM effettivi dell'elicottero.</p>
            </div>

            {/* Usa una key per forzare il re-render completo quando cambia il tipo */}
            <div key={`charts-container-${key}`}>
                <TVMSynchronizedCharts
                    sensorData1={sampleData1}
                    sensorData2={sampleData2}
                    xAxisType={xAxisType}
                    height={300}
                    showMarkers={showMarkers}
                />
            </div>
        </div>
    );
};

export default TVMChartsDemo;