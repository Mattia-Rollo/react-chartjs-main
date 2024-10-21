import React, { useState } from 'react';
import { Button, Typography, Box, CircularProgress } from '@mui/material';
import * as XLSX from 'xlsx';

const ExcelUploader = ({ onDataExtracted }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const parseImporto = (value) => {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const cleanedValue = value.replace(/[^0-9,.-]/g, '');
      return parseFloat(cleanedValue.replace(',', '.'));
    }
    return 0;
  };

  const findAndVerifyHeaderRow = (sheet) => {
    const range = XLSX.utils.decode_range(sheet['!ref']);
    for (let row = range.s.r; row <= range.e.r; row++) {
      const cell1 = sheet[XLSX.utils.encode_cell({ r: row, c: 0 })];
      const cell2 = sheet[XLSX.utils.encode_cell({ r: row, c: 1 })];
      const cell3 = sheet[XLSX.utils.encode_cell({ r: row, c: 2 })];

      if (cell1 && cell2 && cell3 &&
          cell1.v === 'Data' &&
          cell2.v === 'Operazione' &&
          cell3.v === 'Dettagli') {
        return row;
      }
    }
    throw new Error("Intestazioni 'Data', 'Operazione', 'Dettagli' non trovate nel foglio nell'ordine corretto.");
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      setIsLoading(true);
      setError(null);

      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const startingRow = findAndVerifyHeaderRow(worksheet);
        
        // Converti il foglio in JSON, iniziando dalla riga trovata
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          range: startingRow
        });

        const headers = jsonData[0];
        const transactions = jsonData.slice(1)
          .filter(row => row.some(cell => cell !== ''))
          .map(row => {
            const transaction = {};
            headers.forEach((header, index) => {
              if (header === 'Importo') {
                transaction[header.toLowerCase().trim()] = parseImporto(row[index]);
              } else {
                transaction[header.toLowerCase().trim()] = row[index];
              }
            });
            return transaction;
          });

        console.log(`Processed ${transactions.length} rows of data, starting from row ${startingRow + 1}.`);
        onDataExtracted(transactions);
      } catch (err) {
        setError(err.message || 'Errore durante l\'elaborazione del file. Assicurati che sia un file Excel valido.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setError('Errore durante la lettura del file.');
      setIsLoading(false);
    };

    if (file) {
      reader.readAsArrayBuffer(file);
    }
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