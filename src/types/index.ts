export interface Transaction {
  operazione: string;
  importo: number;
  data: number;
  [key: string]: string | number;
}

export interface DataGraficoLineare {
  data: string; 
  spesa: number;
  [key: string]: string | number;
}

export interface GraficoSpeseSalarioProps {
  dataGraficoLineare: DataGraficoLineare[];
  stipendio: number;
}