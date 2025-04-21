import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';

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

// Classe per gestire la sincronizzazione tra grafici
class ChartSynchronizer {
  private charts: Map<string, uPlot> = new Map();
  private isSyncEnabled: boolean = false;
  
  // Imposta lo stato di sincronizzazione
  setSyncEnabled(enabled: boolean) {
    this.isSyncEnabled = enabled;
  }
  
  // Ottieni lo stato di sincronizzazione
  getSyncEnabled(): boolean {
    return this.isSyncEnabled;
  }
  
  // Registra un grafico
  registerChart(id: string, chart: uPlot) {
    this.charts.set(id, chart);
    return () => {
      this.charts.delete(id);
    };
  }
  
  // Sincronizza lo zoom tra i grafici
  syncZoom(sourceId: string, minX: number, maxX: number) {
    if (!this.isSyncEnabled) return;
    
    this.charts.forEach((chart, id) => {
      if (id !== sourceId) {
        chart.batch(() => {
          chart.setScale('x', {
            min: minX,
            max: maxX
          });
        });
      }
    });
  }
  
  // Resetta lo zoom di tutti i grafici
  resetAllZoom() {
    this.charts.forEach(chart => {
      if (chart.data[0].length > 0) {
        chart.batch(() => {
          chart.setScale('x', {
            min: chart.data[0][0],
            max: chart.data[0][chart.data[0].length - 1]
          });
        });
      }
    });
  }
}

// Crea un'istanza globale del sincronizzatore
const globalSynchronizer = new ChartSynchronizer();

// Funzioni di utilità (riutilizzate dal componente originale)
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

// Componente del grafico singolo TVM con uPlot
const TVMChart: React.FC<{
  id: string;
  title: string;
  subtitle: string;
  color: string;
  data: TVMData[];
  xAxisType: 'datetime' | 'flightHours' | 'flightHoursCategory';
  height: number;
  synchronizer: ChartSynchronizer;
}> = ({ id, title, subtitle, color, data, xAxisType, height, synchronizer }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const plotInstance = useRef<uPlot | null>(null);
  
  // Trasforma i dati per uPlot
  const transformData = (): uPlot.AlignedData => {
    if (!data || data.length === 0) {
      return [
        [0], // x values
        [0]  // y values
      ] as uPlot.AlignedData; // Explicitly cast to uPlot.AlignedData
    }
    
    // uPlot richiede dati in serie di colonne [x, y1, y2, ...]
    const timestamps: number[] = [];
    const amplitudes: number[] = [];
    
    data.forEach(point => {
      // Scegli quale valore usare come asse X in base al tipo
      if (xAxisType === 'datetime') {
        timestamps.push(point.timestamp);
      } else {
        timestamps.push(point.flightHours);
      }
      
      amplitudes.push(point.amplitude);
    });
    
    return [timestamps, amplitudes] as uPlot.AlignedData;
  };
  
  // Configurazione per l'asse X in base al tipo
  const getXAxisConfig = () => {
    if (xAxisType === 'datetime') {
      return {
        space: 60,
        size: 50,
        label: "Data e Ora",
        labelSize: 20,
        labelFont: "12px Arial",
        font: "12px Arial",
        stroke: "#808080",
        grid: {
          show: true,
          stroke: "#eee",
          width: 1
        },
        ticks: {
          show: true,
          stroke: "#eee",
          width: 1
        },
        values: (_u: uPlot, vals: number[]) => vals.map(v => { 
          const date = new Date(v);
          return date.toLocaleDateString() + ' ' + 
             date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        })
      };
    } else if (xAxisType === 'flightHoursCategory') {
      return {
        space: 60,
        size: 50,
        label: "Ore di Volo",
        labelSize: 20,
        labelFont: "12px Arial",
        font: "12px Arial",
        stroke: "#808080",
        grid: {
          show: true,
          stroke: "#eee",
          width: 1
        },
        ticks: {
          show: true,
          stroke: "#eee",
          width: 1
        },
        values: (_u: uPlot, vals: number[]) => vals.map(v => formatFlightHours(v))
      };
    } else {
      return {
        space: 60,
        size: 50,
        label: "Ore di Volo",
        labelSize: 20,
        labelFont: "12px Arial",
        font: "12px Arial",
        stroke: "#808080",
        grid: {
          show: true,
          stroke: "#eee",
          width: 1
        },
        ticks: {
          show: true,
          stroke: "#eee",
          width: 1
        },
        values: (_u: uPlot, vals: number[]) => vals.map(v => formatFlightHours(v))
      };
    }
  };

  // Inizializza il grafico
  useLayoutEffect(() => {
    if (!chartRef.current) return;
    
    const plotData = transformData();
    
    // Configurazione opzioni per uPlot
    const options: uPlot.Options = {
      width: chartRef.current.clientWidth || 800,
      height: height,
      title: "", // Usiamo il titolo manuale
      id,
      cursor: {
        show: true,
        points: {
          show: false  // Disabilitiamo i punti del cursore per evitare problemi
        }
      },
      select: {
        show: true,
        left: 0,
        top: 0,
        width: 0,
        height: 0
      },
      series: [
        {}, // Serie X (timestamp o ore di volo)
        {
          label: title,
          stroke: color,
          width: 3,
          points: {
            show: false,
          }
        }
      ],
      axes: [
        getXAxisConfig(),
        {
          scale: "y",
          space: 50,
          size: 40,
          label: "Amplitude (g)",
          labelSize: 20,
          labelFont: "12px Arial",
          font: "12px Arial",
          stroke: "#808080",
          grid: {
            show: true,
            stroke: "#eee",
            width: 1
          },
          ticks: {
            show: true,
            stroke: "#eee",
            width: 1
          },
          values: (_u: uPlot, vals: number[]) => vals.map(formatAmplitude)
        }
      ],
      plugins: [
        {
          hooks: {
            // Hook per lo zoom quando l'utente seleziona un'area
            setSelect: (u: uPlot) => {
              const { left, width } = u.select;
              
              if (width > 0) {
                const minX = u.posToVal(left, 'x');
                const maxX = u.posToVal(left + width, 'x');
                
                u.batch(() => {
                  u.setScale("x", {
                    min: minX,
                    max: maxX
                  });
                });
                
                // Sincronizza lo zoom con altri grafici
                synchronizer.syncZoom(id, minX, maxX);
                
                // Reset della selezione
                u.setSelect({
                  left: 0,
                  top: 0,
                  width: 0,
                  height: 0
                });
              }
            }
          }
        }
      ]
    };
    
    // Attendiamo brevemente per assicurarci che il DOM sia pronto
    setTimeout(() => {
      try {
        // Distruggi l'istanza precedente se esiste
        if (plotInstance.current) {
          plotInstance.current.destroy();
          plotInstance.current = null;
        }
        
        // Crea una nuova istanza
        if (chartRef.current) {
          plotInstance.current = new uPlot(options, plotData, chartRef.current);
          
          // Registra il grafico nel sincronizzatore
          synchronizer.registerChart(id, plotInstance.current);
          
          console.log(`Grafico ${id} creato con successo`);
        }
      } catch (error) {
        console.error('Errore durante la creazione del grafico:', error);
      }
    }, 100);
    
    // Cleanup quando il componente viene smontato
    return () => {
      if (plotInstance.current) {
        try {
          plotInstance.current.destroy();
        } catch (error) {
          console.error('Errore durante la distruzione del grafico:', error);
        }
        plotInstance.current = null;
      }
    };
  }, [data, xAxisType, height, title, subtitle, color, id, synchronizer]);
  
  // Funzione per resettare lo zoom
  const resetZoom = () => {
    if (plotInstance.current && plotInstance.current.data[0].length > 0) {
      plotInstance.current.batch(() => {
        plotInstance.current?.setScale("x", {
          min: plotInstance.current.data[0][0],
          max: plotInstance.current.data[0][plotInstance.current.data[0].length - 1]
        });
      });
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '6px' }}>{title}</div>
      <div style={{ fontSize: '14px', marginBottom: '10px', color: '#666' }}>{subtitle}</div>
      
      <button
        onClick={resetZoom}
        style={{
          padding: '4px 10px',
          marginBottom: '10px',
          background: '#f0f0f0',
          border: '1px solid #ccc',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Reset Zoom (solo questo grafico)
      </button>
      
      <div ref={chartRef} style={{ width: '100%', height: `${height}px` }} />
    </div>
  );
};

// Componente per grafici sincronizzati
const TVMSynchronizedCharts: React.FC<TVMChartsProps> = ({ 
  sensorData1 = [], 
  sensorData2 = [],
  xAxisType = 'datetime',
  height = 250,
  // showMarkers = false
}) => {
  // Stato per la sincronizzazione
  const [syncEnabled, setSyncEnabled] = useState(false);
  
  // Aggiorna lo stato di sincronizzazione nel sincronizzatore globale
  useEffect(() => {
    globalSynchronizer.setSyncEnabled(syncEnabled);
  }, [syncEnabled]);
  
  // Funzione per resettare lo zoom di tutti i grafici
  const resetAllZoom = () => {
    globalSynchronizer.resetAllZoom();
  };
  
  // Formatta il tipo di visualizzazione per il display
  const getDisplayAxisType = () => {
    switch(xAxisType) {
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
      <div className="mb-4" style={{ background: '#f9f9f9', padding: '15px', borderRadius: '6px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={syncEnabled} 
                onChange={e => setSyncEnabled(e.target.checked)} 
                style={{ marginRight: '8px' }}
              />
              <span style={{ fontWeight: 'bold' }}>Sincronizza Zoom</span>
            </label>
            <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
              {syncEnabled ? 
                "Lo zoom sarà sincronizzato tra i grafici" : 
                "Ogni grafico avrà uno zoom indipendente"}
            </div>
          </div>
          
          <button 
            onClick={resetAllZoom}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reset Zoom (tutti i grafici)
          </button>
        </div>
        
        <div style={{ marginTop: '10px' }}>
          <p><strong>Visualizzazione:</strong> {getDisplayAxisType()}</p>
          <p><strong>Nota:</strong> Seleziona un'area sul grafico per zoomare.</p>
        </div>
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
          synchronizer={globalSynchronizer}
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
          synchronizer={globalSynchronizer}
        />
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
        (Math.sin(i/10) * baseAmplitude * 0.1) + // Componente ciclica
        (i > count * 0.7 ? baseAmplitude * 0.5 : 0) // Picco verso la fine
      );
      
      data.push({ timestamp, flightHours, amplitude });
    }
    
    return data;
  };
  
  const sampleData1 = generateSampleData(100, 5000);
  const sampleData2 = generateSampleData(100, 8000);
  
  // Tipo di asse X selezionato
  const [xAxisType, setXAxisType] = useState<'datetime' | 'flightHours' | 'flightHoursCategory'>('datetime');
  
  // Forza il re-render completo quando cambia il tipo
  const [key, setKey] = useState(0);
  
  const handleTypeChange = (newType: 'datetime' | 'flightHours' | 'flightHoursCategory') => {
    setXAxisType(newType);
    setKey(prevKey => prevKey + 1);
  };
  
  return (
    <div className="max-w-6xl mx-auto p-4">
      <h2 className="text-2xl font-bold text-center mb-4">Monitoraggio TVM Trasmissione Elicottero</h2>
      
      <div className="mb-6">
        <label className="mr-2 font-medium">Visualizzazione Asse X:</label>
        <select 
          value={xAxisType}
          onChange={(e) => handleTypeChange(e.target.value as 'datetime' | 'flightHours' | 'flightHoursCategory')}
          className="p-2 border rounded mt-1"
          style={{ padding: '5px 10px', maxWidth: '300px' }}
        >
          <option value="datetime">Data e Ora (DD/MM/YYYY HH:MM:SS)</option>
          <option value="flightHours">Ore di Volo (Numeriche)</option>
          <option value="flightHoursCategory">Ore di Volo (HHHH:MM:SS)</option>
        </select>
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
        />
      </div>
    </div>
  );
};

export default TVMChartsDemo;