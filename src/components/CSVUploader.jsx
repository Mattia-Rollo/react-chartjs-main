import React, { useState } from 'react';
import { Button, Typography, Box, CircularProgress } from '@mui/material';

const CSVUploader = ({ onDataExtracted }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const parseCSV = (text) => {
    const lines = text.split('\n');
    const headers = lines[0].split(',');
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '') continue;
      const values = lines[i].split(',');
      const entry = {};
      for (let j = 0; j < headers.length; j++) {
        let value = values[j];
        if (headers[j] === 'Importo') {
          value = parseFloat(value.replace('"', '').replace(',', '.'));
        }
        entry[headers[j].trim()] = value;
      }
      data.push(entry);
    }

    return data;
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    setIsLoading(true);
    setError(null);

    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const data = parseCSV(text);
        onDataExtracted(data);
      } catch (err) {
        setError('Errore durante l\'elaborazione del file. Assicurati che sia un file CSV valido.');
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setError('Errore durante la lettura del file.');
      setIsLoading(false);
    };

    if (file) {
      reader.readAsText(file);
    }
  };

  return (
    <Box sx={{ my: 2 }}>
      <Typography variant="h6" gutterBottom>Carica File CSV Estratto Conto</Typography>
      <input
        accept=".csv"
        style={{ display: 'none' }}
        id="raised-button-file"
        type="file"
        onChange={handleFileUpload}
      />
      <label htmlFor="raised-button-file">
        <Button variant="contained" component="span">
          Carica CSV
        </Button>
      </label>
      {isLoading && <CircularProgress sx={{ ml: 2 }} />}
      {error && <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>}
    </Box>
  );
};

export default CSVUploader;