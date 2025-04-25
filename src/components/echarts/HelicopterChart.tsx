import React, { useState, useEffect, useRef, memo, useCallback, useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { EChartsOption, SetOptionOpts } from 'echarts';

// Import solo dei chart types necessari
import { LineChart } from 'echarts/charts';

// Import solo dei componenti necessari - riduci quelli non utilizzati
import {
  GridComponent,
  TooltipComponent,
  ToolboxComponent,
  TitleComponent,
  DataZoomComponent,
  DataZoomInsideComponent,
  DataZoomSliderComponent,
  LegendComponent,
  MarkLineComponent,
  AxisPointerComponent
} from 'echarts/components';

import { CanvasRenderer } from 'echarts/renderers';

// Registra i componenti
echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  ToolboxComponent,
  TitleComponent,
  DataZoomComponent,
  DataZoomInsideComponent,
  DataZoomSliderComponent,
  LegendComponent,
  MarkLineComponent,
  AxisPointerComponent,
  CanvasRenderer
]);

// Definizione dei tipi per i dati del grafico
export interface FlightDataPoint {
  flightTimeSeconds: number;
  timestamp: number;
  flightHours: string;
  dateTime: string;
  amplitude: number;
}

export interface HelicopterChartProps {
  data: FlightDataPoint[];
  title?: string;
  chartId: string;
  syncGroup?: string;
  onChartReady?: (instance: echarts.ECharts) => void;
}

// Funzioni di utilità memoizzate
export const formatFlightHours = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  // const secs = Math.floor(seconds % 60);
  
  return `${String(hours).padStart(4, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export const formatDateTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).replace(',', '');
};

// Componenti UI memorizzati
const ModeButton = memo(({ 
  onClick, 
  label 
}: { 
  onClick: () => void; 
  label: string 
}) => (
  <button 
    onClick={onClick}
    style={{
      padding: '6px 12px',
      backgroundColor: '#4285f4',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '13px'
    }}
  >
    {label}
  </button>
));

const SyncIndicator = memo(() => (
  <div style={{
    position: 'absolute',
    top: '15px',
    right: '15px',
    zIndex: 10,
    backgroundColor: 'rgba(52, 168, 83, 0.8)',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '5px'
  }}>
    <span style={{ 
      display: 'inline-block',
      width: '8px',
      height: '8px',
      backgroundColor: '#fff',
      borderRadius: '50%'
    }}></span>
    Grafici sincronizzati
  </div>
));

const DataPointsInfo = memo(({ count }: { count: number }) => (
  <div style={{
    fontSize: '12px',
    color: '#999',
    marginBottom: '10px'
  }}>
    {count.toLocaleString()} punti di volo
  </div>
));

const DisplayModeInfo = memo(({ mode }: { mode: string }) => (
  <div style={{ 
    fontSize: '13px',
    color: '#666'
  }}>
    Formato asse X: <strong>{mode === 'flightHours' ? 'Ore di volo (HHHH:MM:SS)' : 'Data/Ora (DD/MM/YYYY HH:MM:SS)'}</strong>
  </div>
));

// Componente principale ottimizzato
const HelicopterChart: React.FC<HelicopterChartProps> = memo(({
  data,
  title = 'Dati di volo',
  syncGroup,
  onChartReady
}) => {
  const [displayMode, setDisplayMode] = useState<'flightHours' | 'datetime'>('flightHours');
  const chartRef = useRef<ReactEChartsCore>(null);
  
  // Memoizza i dati del grafico per evitare ricalcoli inutili
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map(point => [
      displayMode === 'flightHours' ? point.flightHours : point.dateTime,
      point.amplitude
    ]);
  }, [data, displayMode]);
  
  // Memoizza le opzioni del grafico
  const chartOptions = useMemo((): EChartsOption => {
    return {
      title: {
        text: title,
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        }
      },
      toolbox: {
        feature: {
          dataZoom: {
            yAxisIndex: 'none'
          },
          restore: {},
          saveAsImage: {}
        }
      },
      grid: {
        bottom: '13%',
      },
      xAxis: {
        type: 'category',
        data: chartData.map(item => item[0]),
      },
      yAxis: {
        type: 'value',
        name: 'Ampiezza (g)',
        min: -1000,
        max: 30000,
      },
      dataZoom: [
        {
          type: 'select',
        },
      ],
      series: [
        {
          name: 'Ampiezza',
          type: 'line',
          sampling: 'lttb', // Large Threshold Turbulent Breakthrough sampling
          data: chartData.map(item => item[1]),
          lineStyle: {
            width: 0.8,
            color: '#4285f4'
          },
          progressive: 300,
          progressiveThreshold: 5000,
          symbol: 'none',
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: {
              type: 'dashed',
              width: 0.5
            },
            data: [
              {
                name: 'Soglia alta',
                yAxis: 20000,
                lineStyle: { 
                  color: '#e53935' 
                },
                label: { 
                  show: true,
                  position: 'end',
                  formatter: 'Soglia critica',
                  color: '#e53935',
                  fontSize: 11
                }
              },
              {
                name: 'Soglia media',
                yAxis: 15000,
                lineStyle: { 
                  color: '#ff9800' 
                },
              }
            ]
          }
        }
      ],
      animation: false // Disabilita l'animazione per migliorare le performance
    };
  }, [title, chartData]);

  // Opzioni per setOption
  const echartsOpts = useMemo((): SetOptionOpts => ({
    notMerge: true,
    lazyUpdate: true
  }), []);
  
  // Gestisce la sincronizzazione dei grafici
  useEffect(() => {
    const chart = chartRef.current?.getEchartsInstance();
    
    if (chart && syncGroup) {
      chart.group = syncGroup;
      
      return () => {
        chart.group = '';
      };
    }
  }, [syncGroup]);
  
  // Callback quando il grafico è pronto
  const handleChartReady = useCallback((instance: echarts.ECharts) => {
    if (onChartReady) {
      onChartReady(instance);
    }
  }, [onChartReady]);
  
  // Gestisce il cambio della modalità di visualizzazione
  const toggleDisplayMode = useCallback(() => {
    setDisplayMode(prev => prev === 'flightHours' ? 'datetime' : 'flightHours');
  }, []);
  
  return (
    <div className="helicopter-chart" style={{ 
      position: 'relative',
      border: '1px solid #eaeaea',
      borderRadius: '8px',
      padding: '15px 15px 5px 15px',
      backgroundColor: '#fff'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <DisplayModeInfo mode={displayMode} />
        
        <ModeButton 
          onClick={toggleDisplayMode}
          label={displayMode === 'flightHours' ? 'Passa a DateTime' : 'Passa a Ore di volo'}
        />
      </div>
      
      {syncGroup && <SyncIndicator />}

      <DataPointsInfo count={data.length} />
      
      <ReactEChartsCore
        ref={chartRef}
        echarts={echarts}
        option={chartOptions}
        notMerge={echartsOpts.notMerge}
        lazyUpdate={echartsOpts.lazyUpdate}
        style={{ height: '400px', width: '100%' }}
        opts={{ 
          renderer: 'canvas',
          // Aggiunta: imposta un limite massimo di frequenza di rendering
          // throttle: 100 
        }}
        onChartReady={handleChartReady}
      />
    </div>
  );
});

export default HelicopterChart;