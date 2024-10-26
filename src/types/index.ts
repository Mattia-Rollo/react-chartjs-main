export interface Transaction {
  operazione: string;
  importo: number;
  data: number;
  [key: string]: string | number;
}
  
  export interface DataGraficoLineare {
    data: string;  // Cambiato da mese a data
    spesa: number;
  }
  
  export interface GraficoSpeseSalarioProps {
    datagraficeLineare: DataGraficoLineare[];
    stipendio: number;
  }