import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';

// Tipo per i dati TVM
interface TVMData {
  timestamp: number;      
  flightHours: number;    
  amplitude: number;      
}

// Proprietà del componente
interface TVMChartsProps {
  sensorData1?: TVMData[];
  sensorData2?: TVMData[];
  xAxisType?: 'datetime' | 'flightHours' | 'flightHoursCategory';
  height?: number;
  showMarkers?: boolean;
}

// Gestore sincronizzazione tra grafici
class SyncManager {
  private key: string;
  private charts: Map<string, uPlot> = new Map();
  private enabled: boolean = true;
  
  constructor(key: string) {
    this.key = key;
  }
  
  getKey(): string {
    return this.key;
  }
  
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
  
  isEnabled(): boolean {
    return this.enabled;
  }
  
  sub(chart: uPlot): void {
    this.charts.set((chart as any).id || Math.random().toString(36).substring(2, 9), chart);
  }
  
  unsub(chart: uPlot): void {
    this.charts.forEach((value, key) => {
      if (value === chart) {
        this.charts.delete(key);
      }
    });
  }
  
  createFilter(syncMouseUpDown: boolean = true) {
    return (type: string) => {
      // Se la sincronizzazione è disabilitata, blocchiamo tutti i tipi di eventi
      if (!this.enabled) return false;
      
      // Altrimenti filtriamo normalmente gli eventi mouseup/mousedown in base alle preferenze
      return (syncMouseUpDown || (type !== "mouseup" && type !== "mousedown"));
    };
  }
  
  // Corretto il problema principale: ora rispetta la proprietà enabled
  syncZoom(sourceId: string, minX: number, maxX: number) {
    // Controllo che la sincronizzazione sia abilitata prima di procedere
    if (!this.enabled) return;
    
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

const matchSyncKeys = (own: string, ext: string) => own === ext;

const matchSeriesIdxs = (sub: uPlot, pub: uPlot, pubSeriesIdx: number | null) => {
  if (pubSeriesIdx == null) return null;
  const pubSeriesLabel = pub.series[pubSeriesIdx].label;
  return sub.series.findIndex(s => s.label === pubSeriesLabel);
};

const createSyncCursorOptions = (syncManager: SyncManager, syncMouseUpDown: boolean = true) => {
  return {
    lock: true,
    focus: {
      prox: 16,
    },
    sync: {
      key: syncManager.getKey(),
      setSeries: true,
      match: [matchSyncKeys, matchSyncKeys, matchSeriesIdxs],
      filters: {
        pub: syncManager.createFilter(syncMouseUpDown),
      }
    },
  };
};

// Istanza globale del sincronizzatore
const globalSyncManager = new SyncManager("tvm-sync");

// Funzioni di utilità
const formatFlightHours = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${hours.toString().padStart(4, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

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
  syncManager: SyncManager;
  syncMouseUpDown: boolean;
  syncEnabled: boolean;
}> = ({ id, title, subtitle, color, data, xAxisType, height, syncManager, syncMouseUpDown, syncEnabled }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const plotInstance = useRef<uPlot | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  
  // Trasforma i dati per uPlot
  const transformData = (): uPlot.AlignedData => {
    if (!data || data.length === 0) {
      return [
        [0], // x values
        [0]  // y values
      ] as uPlot.AlignedData;
    }
    
    const timestamps: number[] = [];
    const amplitudes: number[] = [];
    
    data.forEach(point => {
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
        border: {
          show: true,
          stroke: "#808080",
          width: 1
        },
        space: 60,
        size: 10,
        label: "Data e Ora",
        labelSize: 60,
        gap: 15, 
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
        values: (_u: uPlot, vals: number[]) => {
          const density = vals.length / 100;
          
          if (density > 0.2) {
            const skipFactor = Math.ceil(density * 1000);
            
            return vals.map((v, i) => {
              if (i % skipFactor !== 0) return null;
              
              const date = new Date(v);
              return date.toLocaleDateString() + '\n' + 
                    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            });
          }
          
          return vals.map(v => { 
            const date = new Date(v);
            return date.toLocaleDateString() + '\n' + 
                  date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          });
        }
      };
    } else {
      return {
        border: {
          show: true,
          stroke: "#808080",
          width: 1
        },
        space: 60,
        size: 50,
        label: "Ore di Volo",
        labelSize: 20,
        gap: 10,
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
          width: 500
        },
        values: (_u: uPlot, vals: number[]) => vals.map(v => formatFlightHours(v))
      };
    }
  };

  // Funzione per gestire il ridimensionamento
  const handleResize = () => {
    if (chartRef.current && plotInstance.current) {
      const newWidth = chartRef.current.clientWidth;
      plotInstance.current.setSize({ width: newWidth, height: height });
    }
  };

  // Inizializza il grafico
  useLayoutEffect(() => {
    if (!chartRef.current) return;
    
    const plotData = transformData();
    
    const options: uPlot.Options = {
      width: chartRef.current.clientWidth || 800,
      height: height,
      title: "", 
      id,
      // Applichiamo le opzioni di sincronizzazione solo se syncEnabled è true
      cursor: syncEnabled ? createSyncCursorOptions(syncManager, syncMouseUpDown) : {
        lock: true, // Manteniamo il lock per la facilità d'uso
        focus: {
          prox: 16,
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
        {},
        {
          label: title,
          stroke: color,
          width: 1,
          points: {
            show: false,
          }
        }
      ],
      axes: [
        getXAxisConfig(),
        {
          scale: "y",
          space: 60,
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
            show: false,
            stroke: "#eee",
            width: 1
          },
          values: (_u: uPlot, vals: number[]) => vals.map(formatAmplitude)
        }
      ],
      plugins: [
        {
          hooks: {
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
                
                // Controlla lo stato di sincronizzazione prima di sincronizzare lo zoom
                if (syncEnabled) {
                  syncManager.syncZoom(id, minX, maxX);
                }
                
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
    
    setTimeout(() => {
      try {
        if (plotInstance.current) {
          plotInstance.current.destroy();
          plotInstance.current = null;
        }
        
        if (chartRef.current) {
          plotInstance.current = new uPlot(options, plotData, chartRef.current);
          syncManager.sub(plotInstance.current);
          
          // Configurazione ResizeObserver per monitorare le modifiche di dimensione
          if (resizeObserverRef.current) {
            resizeObserverRef.current.disconnect();
          }
          
          resizeObserverRef.current = new ResizeObserver(handleResize);
          resizeObserverRef.current.observe(chartRef.current);
        }
      } catch (error) {
        console.error('Errore durante la creazione del grafico:', error);
      }
    }, 100);
    
    // Event listener per il resize della finestra come backup
    window.addEventListener('resize', handleResize);
    
    return () => {
      // Pulizia
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      
      window.removeEventListener('resize', handleResize);
      
      if (plotInstance.current) {
        try {
          syncManager.unsub(plotInstance.current);
          plotInstance.current.destroy();
        } catch (error) {
          console.error('Errore durante la distruzione del grafico:', error);
        }
        plotInstance.current = null;
      }
    };
  }, [data, xAxisType, height, title, subtitle, color, id, syncManager, syncMouseUpDown, syncEnabled]);
  
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

// Componente principale che gestisce i grafici sincronizzati
const TVMSynchronizedCharts: React.FC<TVMChartsProps> = ({ 
  sensorData1 = [], 
  sensorData2 = [],
  xAxisType = 'datetime',
  height = 350,
}) => {
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [syncMouseUpDown, setSyncMouseUpDown] = useState(true);
  const [key, setKey] = useState(0); // Aggiungiamo uno stato per forzare il ricaricamento
  
  // Aggiorna lo stato nel SyncManager quando cambia l'impostazione
  useEffect(() => {
    globalSyncManager.setEnabled(syncEnabled);
    
    // Forza il ricaricamento completo dei grafici quando cambia lo stato di sincronizzazione
    // Questo assicura che le opzioni di sincronizzazione siano correttamente aggiornate
    setKey(prevKey => prevKey + 1);
  }, [syncEnabled]);
  
  const resetAllZoom = () => {
    globalSyncManager.resetAllZoom();
  };
  
  const getDisplayAxisType = () => {
    switch(xAxisType) {
      case 'datetime':
        return 'Data e Ora';
      case 'flightHours':
      case 'flightHoursCategory':
        return 'Ore di Volo (HHHH:MM:SS)';
      default:
        return 'Sconosciuto';
    }
  };
  
  return (
    <div className="tvm-charts-container" key={`charts-container-${key}`}>
      <div className="mb-4" style={{ background: '#f9f9f9', padding: '15px', borderRadius: '6px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '10px' }}>
              <input 
                type="checkbox" 
                checked={syncEnabled} 
                onChange={e => setSyncEnabled(e.target.checked)} 
                style={{ marginRight: '8px' }}
              />
              <span style={{ fontWeight: 'bold' }}>Sincronizza Zoom</span>
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={syncMouseUpDown} 
                onChange={e => setSyncMouseUpDown(e.target.checked)} 
                style={{ marginRight: '8px' }}
              />
              <span style={{ fontWeight: 'bold' }}>Sincronizza eventi mouseup/down</span>
            </label>
            
            <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
              {syncEnabled ? 
                "La sincronizzazione è attiva tra i grafici" : 
                "Ogni grafico è indipendente"}
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
          syncManager={globalSyncManager}
          syncMouseUpDown={syncMouseUpDown}
          syncEnabled={syncEnabled}
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
          syncManager={globalSyncManager}
          syncMouseUpDown={syncMouseUpDown}
          syncEnabled={syncEnabled}
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
        (Math.random() * baseAmplitude * 0.2) + 
        (Math.sin(i/10) * baseAmplitude * 0.1) + 
        (i > count * 0.7 ? baseAmplitude * 0.5 : 0) 
      );
      
      data.push({ timestamp, flightHours, amplitude });
    }
    
    return data;
  };
  
  const sampleData1 = generateSampleData(20000, 8000);
  const sampleData2 = generateSampleData(10000, 8000);
  
  const [xAxisType, setXAxisType] = useState<'datetime' | 'flightHours' | 'flightHoursCategory'>('datetime');
  
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