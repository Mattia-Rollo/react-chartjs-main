import React, { useState, useEffect, useCallback, useRef } from 'react';
import HelicopterChart, { FlightDataPoint, formatFlightHours, formatDateTime } from '../components/echarts/HelicopterChart';
import * as echarts from 'echarts/core';

// Stili CSS incorporati
const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '20px',
  },
  controlsContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
    gap: '10px',
  },
  button: {
    padding: '10px 15px',
    backgroundColor: '#4285f4',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500' as const,
  },
  chartContainer: {
    marginBottom: '30px',
    padding: '15px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    backgroundColor: '#f8f9fa',
  },
  loader: {
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  loaderIcon: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    border: '3px solid #4285f4',
    borderTopColor: 'transparent',
    animation: 'spin 1s linear infinite',
  },
  perfContainer: {
    marginTop: '10px',
    padding: '10px',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
    fontSize: '13px',
  },
  perfItem: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '5px',
  },
  perfLabel: {
    fontWeight: 'bold',
  },
  perfValue: {
    fontFamily: 'monospace',
  },
  perfValueFast: {
    fontFamily: 'monospace',
    color: '#34a853',
    fontWeight: 'bold',
  },
  perfValueSlow: {
    fontFamily: 'monospace',
    color: '#ea4335',
    fontWeight: 'bold',
  },
};

// Stile CSS per l'animazione dello spinner
const spinnerStyle = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Interfaccia per lo stato di un singolo grafico
interface SingleChartState {
  instance: echarts.ECharts | null;
  isGeneratingData: boolean;
  data: FlightDataPoint[];
  // Metriche di performance
  perfMetrics: {
    dataGenerationTime: number;
    renderingTime: number;
    totalTime: number;
    dataPointsGenerated: number;
    lastUpdated: Date | null;
  };
}

// Interfaccia per il riferimento al timer
interface TimerRefs {
  dataGenStart?: number;
  renderStart?: number;
  totalStart?: number;
}

const HelicopterChartsPage: React.FC = () => {
  // Stati separati per ciascun grafico
  const [chart1State, setChart1State] = useState<SingleChartState>({
    instance: null,
    isGeneratingData: false,
    data: [],
    perfMetrics: {
      dataGenerationTime: 0,
      renderingTime: 0,
      totalTime: 0,
      dataPointsGenerated: 0,
      lastUpdated: null
    }
  });

  const [chart2State, setChart2State] = useState<SingleChartState>({
    instance: null,
    isGeneratingData: false,
    data: [],
    perfMetrics: {
      dataGenerationTime: 0,
      renderingTime: 0,
      totalTime: 0,
      dataPointsGenerated: 0,
      lastUpdated: null
    }
  });

  // Stato di sincronizzazione (l'unico stato condiviso)
  const [isSynced, setIsSynced] = useState(false);

  // Riferimenti per i timer
  const timerRefs1 = useRef<TimerRefs>({});
  const timerRefs2 = useRef<TimerRefs>({});

  // Funzione per generare dati di esempio per un singolo grafico
  const generateDataForChart = useCallback((
    count: number,
    patternType: 'sin' | 'cos',
    startTime: number = Date.now() - (count * 1000)
  ): FlightDataPoint[] => {
    const data: FlightDataPoint[] = [];

    for (let i = 0; i < count; i++) {
      const timestamp = startTime + (i * 1000); // Un punto al secondo
      const flightTimeSeconds = i;

      // Diversi modelli di oscillazione in base al patternType
      let baseAmplitude = 0;

      if (patternType === 'sin') {
        // Oscillazione sinusoidale
        baseAmplitude = 12000 + Math.sin(i * 0.01) * 8000;
      } else if (patternType === 'cos') {
        // Oscillazione cosinusoidale
        baseAmplitude = 15000 + Math.cos(i * 0.008) * 10000;
      }

      // Rumore e picchi casuali
      const noise = Math.random() * 4000 - 2000;
      const spike = Math.random() > 0.995 ? Math.random() * 15000 : 0;

      data.push({
        timestamp,
        flightTimeSeconds,
        flightHours: formatFlightHours(flightTimeSeconds),
        dateTime: formatDateTime(timestamp),
        amplitude: baseAmplitude + noise + spike
      });
    }

    return data;
  }, []);

  // Genera dati per il primo grafico
  const generateDataChart1 = useCallback(() => {
    // Resetta e inizia a tracciare il tempo totale
    timerRefs1.current.totalStart = performance.now();

    setChart1State(prev => ({
      ...prev,
      isGeneratingData: true,
      perfMetrics: {
        ...prev.perfMetrics,
        lastUpdated: new Date()
      }
    }));

    // Inizia a tracciare il tempo di generazione dati
    timerRefs1.current.dataGenStart = performance.now();

    // Genera i dati in modo asincrono per non bloccare l'UI
    // setTimeout(() => {
    const count = 50000; // Numero di punti dati
    const data = generateDataForChart(count, 'cos');

    // Calcola il tempo di generazione dati
    const dataGenEnd = performance.now();
    const dataGenerationTime = dataGenEnd - (timerRefs1.current.dataGenStart || 0);

    // Inizia a tracciare il tempo di rendering
    timerRefs1.current.renderStart = performance.now();

    setChart1State(prev => ({
      ...prev,
      data,
      isGeneratingData: false,
      perfMetrics: {
        ...prev.perfMetrics,
        dataGenerationTime,
        dataPointsGenerated: data.length
      }
    }));

    // Calcola il tempo di rendering dopo che il componente è stato aggiornato
    // setTimeout(() => {
    const renderEnd = performance.now();
    const renderingTime = renderEnd - (timerRefs1.current.renderStart || 0);
    const totalTime = renderEnd - (timerRefs1.current.totalStart || 0);

    setChart1State(prev => ({
      ...prev,
      perfMetrics: {
        ...prev.perfMetrics,
        renderingTime,
        totalTime
      }
    }));
    //   }, 100); // Piccolo ritardo per assicurarsi che il rendering sia completo
    // }, 0);
  }, [generateDataForChart]);

  // Genera dati per il secondo grafico
  const generateDataChart2 = useCallback(() => {
    // Resetta e inizia a tracciare il tempo totale
    timerRefs2.current.totalStart = performance.now();

    setChart2State(prev => ({
      ...prev,
      isGeneratingData: true,
      perfMetrics: {
        ...prev.perfMetrics,
        lastUpdated: new Date()
      }
    }));

    // Inizia a tracciare il tempo di generazione dati
    timerRefs2.current.dataGenStart = performance.now();

    // Genera i dati in modo asincrono per non bloccare l'UI
    // setTimeout(() => {
    const count = 50000; // Numero di punti dati
    const data = generateDataForChart(count, 'cos');

    // Calcola il tempo di generazione dati
    const dataGenEnd = performance.now();
    const dataGenerationTime = dataGenEnd - (timerRefs2.current.dataGenStart || 0);

    // Inizia a tracciare il tempo di rendering
    timerRefs2.current.renderStart = performance.now();

    setChart2State(prev => ({
      ...prev,
      data,
      isGeneratingData: false,
      perfMetrics: {
        ...prev.perfMetrics,
        dataGenerationTime,
        dataPointsGenerated: data.length
      }
    }));

    // // Calcola il tempo di rendering dopo che il componente è stato aggiornato
    // setTimeout(() => {
    const renderEnd = performance.now();
    const renderingTime = renderEnd - (timerRefs2.current.renderStart || 0);
    const totalTime = renderEnd - (timerRefs2.current.totalStart || 0);

    setChart2State(prev => ({
      ...prev,
      perfMetrics: {
        ...prev.perfMetrics,
        renderingTime,
        totalTime
      }
    }));
    // }, 100); // Piccolo ritardo per assicurarsi che il rendering sia completo
    // }, 0);
  }, [generateDataForChart]);

  // Genera entrambi i set di dati (separatamente)
  const generateAllData = useCallback(() => {
    generateDataChart1();
    // Piccolo ritardo per avviare la seconda generazione
    setTimeout(generateDataChart2, 100);
  }, [generateDataChart1, generateDataChart2]);

  // Genera i dati iniziali quando il componente viene montato
  useEffect(() => {
    generateAllData();
  }, [generateAllData]);

  // Callback per ottenere l'istanza del primo grafico
  const onChart1Ready = useCallback((instance: echarts.ECharts) => {
    setChart1State(prev => ({ ...prev, instance }));
  }, []);

  // Callback per ottenere l'istanza del secondo grafico
  const onChart2Ready = useCallback((instance: echarts.ECharts) => {
    setChart2State(prev => ({ ...prev, instance }));
  }, []);

  // Funzione per sincronizzare/desincronizzare i grafici
  const toggleSync = useCallback(() => {
    if (isSynced) {
      // Desincronizza
      echarts.disconnect('helicopterSyncGroup');
      setIsSynced(false);
    } else {
      // Sincronizza
      if (chart1State.instance && chart2State.instance) {
        chart1State.instance.group = 'helicopterSyncGroup';
        chart2State.instance.group = 'helicopterSyncGroup';
        echarts.connect('helicopterSyncGroup');
        setIsSynced(true);
      }
    }
  }, [isSynced, chart1State.instance, chart2State.instance]);

  // Funzione di utility per formattare i millisecondi in modo leggibile
  const formatTime = (milliseconds: number): string => {
    if (milliseconds < 1000) {
      return `${milliseconds.toFixed(2)} ms`;
    } else {
      return `${(milliseconds / 1000).toFixed(2)} s`;
    }
  };

  // Determina la classe di stile per i valori di performance in base alla velocità
  const getTimeClass = (milliseconds: number, threshold1: number, threshold2: number) => {
    if (milliseconds < threshold1) {
      return styles.perfValueFast;
    } else if (milliseconds > threshold2) {
      return styles.perfValueSlow;
    }
    return styles.perfValue;
  };

  // Renderizza le metriche di performance
  const renderPerfMetrics = (metrics: SingleChartState['perfMetrics']) => {
    if (!metrics.lastUpdated) return null;

    return (
      <div style={styles.perfContainer}>
        <h4 style={{ margin: '0 0 10px 0' }}>Metriche di Performance</h4>

        <div style={styles.perfItem}>
          <span style={styles.perfLabel}>Punti dati:</span>
          <span style={styles.perfValue}>{metrics.dataPointsGenerated.toLocaleString()}</span>
        </div>

        <div style={styles.perfItem}>
          <span style={styles.perfLabel}>Tempo generazione dati:</span>
          <span style={getTimeClass(metrics.dataGenerationTime, 500, 2000)}>
            {formatTime(metrics.dataGenerationTime)}
          </span>
        </div>

        <div style={styles.perfItem}>
          <span style={styles.perfLabel}>Tempo rendering grafico:</span>
          <span style={getTimeClass(metrics.renderingTime, 300, 1000)}>
            {formatTime(metrics.renderingTime)}
          </span>
        </div>

        <div style={styles.perfItem}>
          <span style={styles.perfLabel}>Tempo totale:</span>
          <span style={getTimeClass(metrics.totalTime, 800, 3000)}>
            {formatTime(metrics.totalTime)}
          </span>
        </div>

        <div style={styles.perfItem}>
          <span style={styles.perfLabel}>Ultimo aggiornamento:</span>
          <span style={styles.perfValue}>
            {metrics.lastUpdated.toLocaleTimeString()}
          </span>
        </div>

        <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
          <strong>Nota:</strong> Tempi di generazione elevati indicano un problema con la funzione di generazione dati,
          tempi di rendering elevati indicano un problema con ECharts.
        </div>
      </div>
    );
  };

  // Renderizza la pagina
  return (
    <div style={styles.container}>
      <style>{spinnerStyle}</style>

      <div style={styles.header}>
        <h1>Analisi Dati di Volo Elicottero</h1>
        <p>Visualizzazione e sincronizzazione di grafici ECharts per dati di volo</p>
      </div>

      <div style={styles.controlsContainer}>
        <button
          style={{
            ...styles.button,
            backgroundColor: isSynced ? '#34a853' : '#4285f4',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'background-color 0.3s'
          }}
          onClick={toggleSync}
          disabled={chart1State.isGeneratingData || chart2State.isGeneratingData || !chart1State.instance || !chart2State.instance}
        >
          <span style={{
            display: 'inline-block',
            width: '10px',
            height: '10px',
            backgroundColor: 'white',
            borderRadius: '50%',
            opacity: isSynced ? 1 : 0.6
          }}></span>
          {isSynced ? 'Grafici Sincronizzati (Clicca per desincronizzare)' : 'Sincronizza Grafici'}
        </button>

        <button
          style={{ ...styles.button, backgroundColor: '#34a853' }}
          onClick={generateAllData}
          disabled={chart1State.isGeneratingData || chart2State.isGeneratingData}
        >
          Genera Tutti i Dati
        </button>
      </div>

      {/* Grafico 1 */}
      <div style={styles.chartContainer}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '15px'
        }}>
          <h2 style={{ margin: 0 }}>Elicottero #1 - Dati di Volo</h2>

          <button
            style={{
              padding: '6px 12px',
              backgroundColor: '#4285f4',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
            onClick={generateDataChart1}
            disabled={chart1State.isGeneratingData}
          >
            {chart1State.isGeneratingData ? 'Generazione...' : 'Rigenera Dati'}
          </button>
        </div>

        {chart1State.isGeneratingData ? (
          <div style={styles.loader}>
            <div style={styles.loaderIcon}></div>
            <span>Generazione dati in corso...</span>
          </div>
        ) : chart1State.data.length > 0 ? (
          <HelicopterChart
            data={chart1State.data}
            title="Elicottero #1 - Dati di Volo"
            chartId="chart1"
            syncGroup={isSynced ? 'helicopterSyncGroup' : undefined}
            onChartReady={onChart1Ready}
          />
        ) : (
          <div>Nessun dato disponibile</div>
        )}

        {/* Metriche di performance per il grafico 1 */}
        {renderPerfMetrics(chart1State.perfMetrics)}
      </div>

      {/* Grafico 2 */}
      <div style={styles.chartContainer}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '15px'
        }}>
          <h2 style={{ margin: 0 }}>Elicottero #2 - Dati di Volo</h2>

          <button
            style={{
              padding: '6px 12px',
              backgroundColor: '#4285f4',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
            onClick={generateDataChart2}
            disabled={chart2State.isGeneratingData}
          >
            {chart2State.isGeneratingData ? 'Generazione...' : 'Rigenera Dati'}
          </button>
        </div>

        {chart2State.isGeneratingData ? (
          <div style={styles.loader}>
            <div style={styles.loaderIcon}></div>
            <span>Generazione dati in corso...</span>
          </div>
        ) : chart2State.data.length > 0 ? (
          <HelicopterChart
            data={chart2State.data}
            title="Elicottero #2 - Dati di Volo"
            chartId="chart2"
            syncGroup={isSynced ? 'helicopterSyncGroup' : undefined}
            onChartReady={onChart2Ready}
          />
        ) : (
          <div>Nessun dato disponibile</div>
        )}

        {/* Metriche di performance per il grafico 2 */}
        {renderPerfMetrics(chart2State.perfMetrics)}
      </div>
    </div>
  );
};

export default HelicopterChartsPage;