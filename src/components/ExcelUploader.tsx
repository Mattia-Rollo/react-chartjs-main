import { useState, ChangeEvent, FC } from 'react';
import { Button, Typography, Box, CircularProgress } from '@mui/material';
import * as XLSX from 'xlsx';
import { Transaction } from '../types';

interface ExcelUploaderProps {
  onDataExtracted: (data: Transaction[]) => void;
}

interface WorksheetCell {
  v: string | number;
  t: string;
  w?: string;
}

const ExcelUploader: FC<ExcelUploaderProps> = ({ onDataExtracted }: ExcelUploaderProps): JSX.Element => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const parseImporto = (value: string | number): number => {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const cleanedValue = value.replace(/[^0-9,.-]/g, '');
      return parseFloat(cleanedValue.replace(',', '.'));
    }
    return 0;
  };

  const findAndVerifyHeaderRow = (sheet: XLSX.WorkSheet): number => {
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
    for (let row = range.s.r; row <= range.e.r; row++) {
      const cell1 = sheet[XLSX.utils.encode_cell({ r: row, c: 0 })] as WorksheetCell;
      const cell2 = sheet[XLSX.utils.encode_cell({ r: row, c: 1 })] as WorksheetCell;
      const cell3 = sheet[XLSX.utils.encode_cell({ r: row, c: 2 })] as WorksheetCell;

      if (cell1 && cell2 && cell3 &&
          cell1.v === 'Data' &&
          cell2.v === 'Operazione' &&
          cell3.v === 'Dettagli') {
        return row;
      }
    }
    throw new Error("Intestazioni 'Data', 'Operazione', 'Dettagli' non trovate nel foglio nell'ordine corretto.");
  };

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = e.target?.result;
        if (!result) throw new Error('Nessun dato letto dal file');

        const data = new Uint8Array(result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const startingRow = findAndVerifyHeaderRow(worksheet);
        
        const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, { 
          header: 1,
          range: startingRow
        });

        const headers = jsonData[0] as string[];
        const transactions: Transaction[] = jsonData.slice(1)
          .filter((row: any[]) => row.some(cell => cell !== ''))
          .map((row: any[]) => {
            const transaction: Transaction = {
              data: 0,
              operazione: '',
              dettagli: '',
              importo: 0
            };
            
            headers.forEach((header: string, index: number) => {
              const key = header.toLowerCase().trim();
              if (key === 'importo') {
                transaction[key] = parseImporto(row[index]);
              } else {
                transaction[key] = row[index]?.toString() || '';
              }
            });
            
            return transaction;
          });

        console.log(`Processed ${transactions.length} rows of data, starting from row ${startingRow + 1}.`);
        onDataExtracted(transactions);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 
          'Errore durante l\'elaborazione del file. Assicurati che sia un file Excel valido.';
        setError(errorMessage);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setError('Errore durante la lettura del file.');
      setIsLoading(false);
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <Box sx={{ my: 2 }}>
      <Typography variant="h6" gutterBottom>Carica File Excel Estratto Conto</Typography>
      <input
        accept=".xlsx, .xls"
        style={{ display: 'none' }}
        id="raised-button-file"
        type="file"
        onChange={handleFileUpload}
      />
      <label htmlFor="raised-button-file">
        <Button variant="contained" component="span">
          Carica Excel
        </Button>
      </label>
      {isLoading && <CircularProgress sx={{ ml: 2 }} />}
      {error && <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>}
    </Box>
  );
};

export default ExcelUploader;