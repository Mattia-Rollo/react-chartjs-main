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

// ********* SYNC CURSOR IMPLEMENTATION *********

/**
 * Classe SyncManager per gestire la sincronizzazione tra grafici
 * 
 * Questa classe è responsabile di:
 * 1. Gestire un registro di tutti i grafici da sincronizzare
 * 2. Fornire metodi per abilitare/disabilitare la sincronizzazione
 * 3. Sincronizzare eventi del cursore tra i grafici
 * 4. Sincronizzare lo zoom tra i grafici
 */
class SyncManager {
  // Chiave univoca per identificare questo gruppo di sincronizzazione
  private key: string;
  
  // Mappa per memorizzare tutti i grafici sincronizzati: ID -> istanza uPlot
  private charts: Map<string, uPlot> = new Map();
  
  // Flag per abilitare/disabilitare la sincronizzazione globalmente
  private enabled: boolean = true;
  
  /**
   * Costruttore che accetta una chiave univoca per il gruppo di sincronizzazione
   * 
   * @param key - Identificatore univoco per questo gruppo di sincronizzazione
   */
  constructor(key: string) {
    this.key = key;
  }
  
  /**
   * Restituisce la chiave di sincronizzazione
   * Questa chiave viene utilizzata dalle opzioni di uPlot per identificare
   * quali grafici appartengono allo stesso gruppo di sincronizzazione
   */
  getKey(): string {
    return this.key;
  }
  
  /**
   * Abilita o disabilita la sincronizzazione per tutti i grafici
   * 
   * @param enabled - true per abilitare, false per disabilitare
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
  
  /**
   * Verifica se la sincronizzazione è attualmente abilitata
   */
  isEnabled(): boolean {
    return this.enabled;
  }
  
  /**
   * Registra un grafico per la sincronizzazione
   * 
   * @param chart - Istanza uPlot da aggiungere al gruppo di sincronizzazione
   */
  sub(chart: uPlot): void {
    // Usa l'ID del grafico se disponibile, altrimenti genera un ID casuale
    this.charts.set(chart.id || Math.random().toString(36).substring(2, 9), chart);
  }
  
  /**
   * Rimuove un grafico dalla sincronizzazione
   * Importante per evitare memory leak quando un grafico viene distrutto
   * 
   * @param chart - Istanza uPlot da rimuovere dal gruppo di sincronizzazione
   */
  unsub(chart: uPlot): void {
    this.charts.forEach((value, key) => {
      if (value === chart) {
        this.charts.delete(key);
      }
    });
  }
  
  /**
   * Crea una funzione di filtro per gli eventi di sincronizzazione
   * Consente di controllare quali tipi di eventi vengono sincronizzati
   * 
   * @param syncMouseUpDown - Se true, sincronizza anche eventi mouseup/mousedown
   * @returns Una funzione che determina se un tipo di evento deve essere sincronizzato
   */
  createFilter(syncMouseUpDown: boolean = true) {
    return (type: string) => {
      // Se syncMouseUpDown è true, sincronizza tutti gli eventi
      // Altrimenti, sincronizza tutti tranne mouseup e mousedown
      return syncMouseUpDown || (type !== "mouseup" && type !== "mousedown");
    };
  }
  
  /**
   * Sincronizza lo zoom tra tutti i grafici quando uno viene zoomato
   * 
   * @param sourceId - ID del grafico che ha originato l'evento zoom
   * @param minX - Nuovo valore minimo dell'asse X
   * @param maxX - Nuovo valore massimo dell'asse X
   */
  syncZoom(sourceId: string, minX: number, maxX: number) {
    // Non fare nulla se la sincronizzazione è disabilitata
    if (!this.enabled) return;
    
    // Itera su tutti i grafici registrati
    this.charts.forEach((chart, id) => {
      // Applica lo zoom solo agli altri grafici (non a quello che ha originato lo zoom)
      if (id !== sourceId) {
        // Usa batch() per raggruppare le operazioni e migliorare le performance
        chart.batch(() => {
          // Imposta la nuova scala X con i valori min/max
          chart.setScale('x', {
            min: minX,
            max: maxX
          });
        });
      }
    });
  }
  
  /**
   * Resetta lo zoom di tutti i grafici al range completo dei dati
   * Utile per un pulsante "Reset Zoom" globale
   */
  resetAllZoom() {
    this.charts.forEach(chart => {
      // Verifica che ci siano dati nel grafico
      if (chart.data[0].length > 0) {
        chart.batch(() => {
          // Imposta la scala X al range completo dei dati (dal primo all'ultimo punto)
          chart.setScale('x', {
            min: chart.data[0][0],
            max: chart.data[0][chart.data[0].length - 1]
          });
        });
      }
    });
  }
}

/**
 * Funzione che confronta le chiavi di scala tra due grafici
 * Usata per determinare se due assi corrispondono tra loro
 * 
 * @param own - Chiave di scala del grafico corrente
 * @param ext - Chiave di scala del grafico esterno
 * @returns true se le chiavi corrispondono, false altrimenti
 */
const matchSyncKeys = (own: string, ext: string) => own === ext;

/**
 * Funzione che fa corrispondere le serie in base alle etichette anziché alla posizione
 * Questo è cruciale quando i grafici hanno serie in ordine diverso o un numero diverso di serie
 * 
 * @param sub - Grafico che riceve l'evento (subscriber)
 * @param pub - Grafico che origina l'evento (publisher)
 * @param pubSeriesIdx - Indice della serie nel grafico publisher
 * @returns L'indice corrispondente nel grafico subscriber o null se non trovato
 */
const matchSeriesIdxs = (sub: uPlot, pub: uPlot, pubSeriesIdx: number | null) => {
  // Se non c'è una serie selezionata, restituisci null
  if (pubSeriesIdx == null) return null;

  // Ottieni l'etichetta della serie dal grafico publisher
  const pubSeriesLabel = pub.series[pubSeriesIdx].label;
  
  // Trova l'indice della serie con la stessa etichetta nel grafico subscriber
  return sub.series.findIndex(s => s.label === pubSeriesLabel);
};

/**
 * Funzione factory che crea le opzioni di configurazione per il cursore sincronizzato
 * Questa funzione encapsula tutte le impostazioni necessarie per sincronizzare i cursori
 * 
 * @param syncManager - Istanza del SyncManager per ottenere la chiave e il filtro
 * @param syncMouseUpDown - Se true, sincronizza anche eventi mouseup/mousedown
 * @returns Oggetto di configurazione per l'opzione cursor di uPlot
 */
const createSyncCursorOptions = (syncManager: SyncManager, syncMouseUpDown: boolean = true) => {
  return {
    // Blocca il cursore sull'asse X per seguire meglio i dati
    lock: true,
    
    // Impostazioni per la messa a fuoco delle serie
    focus: {
      // Distanza in pixel entro la quale una serie viene messa a fuoco
      prox: 16,
    },
    
    // Configurazione della sincronizzazione
    sync: {
      // Chiave per identificare quali grafici sincronizzare insieme
      key: syncManager.getKey(),
      
      // Se true, sincronizza anche la serie selezionata/evidenziata
      setSeries: true,
      
      // Funzioni di corrispondenza per:
      // 1. Scale dell'asse X
      // 2. Scale dell'asse Y
      // 3. Indici delle serie (usando le etichette anziché le posizioni)
      match: [matchSyncKeys, matchSyncKeys, matchSeriesIdxs],
      
      // Filtri per controllare quali eventi vengono pubblicati agli altri grafici
      filters: {
        pub: syncManager.createFilter(syncMouseUpDown),
      }
    },
  };
};

// Crea un'istanza globale del sincronizzatore
const globalSyncManager = new SyncManager("tvm-sync");

// ********* END SYNC CURSOR IMPLEMENTATION *********

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
  syncManager: SyncManager;
  syncMouseUpDown: boolean;
}> = ({ id, title, subtitle, color, data, xAxisType, height, syncManager, syncMouseUpDown }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const plotInstance = useRef<uPlot | null>(null);
  
  // Trasforma i dati per uPlot
  const transformData = (): uPlot.AlignedData => {
    if (!data || data.length === 0) {
      return [
        [0], // x values
        [0]  // y values
      ] as uPlot.AlignedData;
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
        border: {
          show: true,      // Mostra il bordo
          stroke: "#808080", // Colore del bordo
          width: 1        // Spessore del bordo
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
        values: (_u: uPlot, vals: number[], space: number) => {
          // Se lo spazio è molto limitato, riduci il numero di etichette mostrate
          const density = vals.length / 100;
          
          // Se la densità è alta, mostra solo alcune etichette
          if (density > 0.2) {
            // Mostra circa un'etichetta ogni X valori basandosi sulla densità
            const skipFactor = Math.ceil(density * 1000);
            
            return vals.map((v, i) => {
              if (i % skipFactor !== 0) return null;
              
              const date = new Date(v);
              // Formato più compatto per le date
              return date.toLocaleDateString() + '\n' + 
                    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            });
          }
          
          // Altrimenti mostra tutte le etichette con un formato standard
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
          show: true,      // Mostra il bordo
          stroke: "#808080", // Colore del bordo
          width: 1        // Spessore del bordo
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

  // Inizializza il grafico
  useLayoutEffect(() => {
    // Non procedere se l'elemento DOM non è stato ancora renderizzato
    if (!chartRef.current) return;
    
    // Trasforma i dati nel formato richiesto da uPlot
    const plotData = transformData();
    
    // Configurazione completa delle opzioni per uPlot
    const options: uPlot.Options = {
      // Dimensioni del grafico (larghezza basata sul contenitore)
      width: chartRef.current.clientWidth || 800,
      height: height,
      
      // Usiamo un titolo vuoto perché lo gestiamo manualmente nell'UI
      title: "", 
      
      // ID univoco per identificare questo grafico nel SyncManager
      id,
      
      // Configurazione del cursore con sincronizzazione
      // Qui è dove avviene la magia della sincronizzazione!
      cursor: createSyncCursorOptions(syncManager, syncMouseUpDown),
      
      // Configurazione della selezione per lo zoom
      select: {
        show: true,     // Abilita la selezione per lo zoom
        left: 0,        // Posizione iniziale (verrà aggiornata durante l'uso)
        top: 0,
        width: 0,       // Dimensione iniziale (verrà aggiornata durante l'uso)
        height: 0
      },
      
      // Definizione delle serie di dati
      series: [
        {}, // Serie X (timestamp o ore di volo) - sempre vuota in uPlot
        {
          label: title,    // Etichetta della serie (usata per la corrispondenza tra grafici)
          stroke: color,   // Colore della linea
          width: 1,        // Spessore della linea
          points: {
            show: false,   // Non mostrare punti singoli sulla linea
          }
        }
      ],
      
      // Configurazione degli assi
      axes: [
        // Asse X - configurazione basata sul tipo scelto (datetime/flightHours)
        getXAxisConfig(),
        
        // Asse Y - configurazione per l'ampiezza
        {
          scale: "y",           // Nome della scala
          space: 60,            // Spazio attorno all'asse
          size: 40,             // Dimensione dell'asse
          label: "Amplitude (g)",// Etichetta dell'asse
          labelSize: 20,        // Dimensione dell'etichetta
          labelFont: "12px Arial",
          font: "12px Arial",
          stroke: "#808080",    // Colore dell'asse
          grid: {
            show: true,         // Mostra la griglia
            stroke: "#eee",     // Colore della griglia
            width: 1            // Spessore delle linee della griglia
          },
          ticks: {
            show: false,         // Mostra i tick
            stroke: "#eee",
            width: 1
          },
          // Formattazione dei valori sull'asse Y
          values: (_u: uPlot, vals: number[]) => vals.map(formatAmplitude)
        }
      ],
      
      // Plugin personalizzati per funzionalità aggiuntive
      plugins: [
        {
          hooks: {
            // Hook che viene chiamato quando l'utente completa una selezione (per lo zoom)
            setSelect: (u: uPlot) => {
              const { left, width } = u.select;
              
              // Procedi solo se c'è effettivamente una selezione
              if (width > 0) {
                // Converti le posizioni dei pixel in valori dei dati
                const minX = u.posToVal(left, 'x');
                const maxX = u.posToVal(left + width, 'x');
                
                // Usa batch() per raggruppare operazioni e migliorare le performance
                u.batch(() => {
                  // Aggiorna la scala X per effettuare lo zoom
                  u.setScale("x", {
                    min: minX,
                    max: maxX
                  });
                });
                
                // Sincronizza lo zoom con gli altri grafici tramite il SyncManager
                // Questo è cruciale: fa sì che tutti i grafici zoomino insieme
                syncManager.syncZoom(id, minX, maxX);
                
                // Reset della selezione dopo aver applicato lo zoom
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
          syncManager.sub(plotInstance.current);
          
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
          // Rimuovi il grafico dal sincronizzatore
          syncManager.unsub(plotInstance.current);
          plotInstance.current.destroy();
        } catch (error) {
          console.error('Errore durante la distruzione del grafico:', error);
        }
        plotInstance.current = null;
      }
    };
  }, [data, xAxisType, height, title, subtitle, color, id, syncManager, syncMouseUpDown]);
  
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

/**
 * Componente principale che gestisce i grafici sincronizzati
 * Questo componente:
 * 1. Gestisce i controlli per la sincronizzazione
 * 2. Renderizza più istanze del componente TVMChart
 * 3. Coordina la sincronizzazione tra i grafici
 */
const TVMSynchronizedCharts: React.FC<TVMChartsProps> = ({ 
  sensorData1 = [], 
  sensorData2 = [],
  xAxisType = 'datetime',
  height = 350,
}) => {
  // Stati per controllare le opzioni di sincronizzazione
  // - syncEnabled: attiva/disattiva tutta la sincronizzazione
  // - syncMouseUpDown: attiva/disattiva la sincronizzazione degli eventi mouseup/down
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [syncMouseUpDown, setSyncMouseUpDown] = useState(true);
  
  /**
   * Effect hook che aggiorna lo stato di sincronizzazione nel SyncManager
   * quando l'utente cambia l'impostazione di sincronizzazione nell'UI
   */
  useEffect(() => {
    // Aggiorna lo stato nel SyncManager per rifletterlo in tutti i grafici
    globalSyncManager.setEnabled(syncEnabled);
  }, [syncEnabled]); // Si attiva solo quando syncEnabled cambia
  
  /**
   * Funzione che resetta lo zoom di tutti i grafici
   * Chiamata quando l'utente preme il pulsante "Reset Zoom (tutti i grafici)"
   */
  const resetAllZoom = () => {
    globalSyncManager.resetAllZoom();
  };
  
  /**
   * Funzione helper che formatta il tipo di asse X per la visualizzazione nell'UI
   * Converte i valori tecnici in etichette leggibili dall'utente
   */
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
    <div className="tvm-charts-container">
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
  
  const sampleData1 = generateSampleData(10000, 8000);
  const sampleData2 = generateSampleData(10000, 8000);
  
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