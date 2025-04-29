# React Chart Playground

Un'app React che funge da playground per testare diverse librerie di visualizzazione grafica. Lo scopo è confrontare l'usabilità, le performance e le funzionalità di librerie come Chart.js (con plugin), ECharts, ApexCharts e Recharts.

**Live Demo:** [https://react-chartjs-main.vercel.app](https://react-chartjs-main.vercel.app)

## Tecnologie utilizzate

- [React](https://react.dev/)
- [Chart.js](https://www.chartjs.org/) + [`chartjs-plugin-zoom`](https://www.chartjs.org/chartjs-plugin-zoom/latest/)
- [Apache ECharts](https://echarts.apache.org/)
- [ApexCharts](https://apexcharts.com/) via [`react-apexcharts`](https://github.com/apexcharts/react-apexcharts)
- [Recharts](https://recharts.org/)

## Caratteristiche

- Test e confronto tra diverse librerie di charting
- Integrazione del plugin di zoom per Chart.js
- Visualizzazione interattiva di dati (statici/mockati)
- UI semplice e modulare per esplorare i diversi grafici
- Deploy automatico con Vercel

## Installazione

Clona il repository ed esegui l'ambiente di sviluppo:

```bash
git clone https://github.com/tuo-username/react-chart-playground.git
cd react-chart-playground
npm install
npm run dev