import { useState, useMemo, FC } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Typography,
  TextField,
  Box,
  Button
} from '@mui/material';
import { Transaction } from '../types';

const excelNumberToDate = (excelNumber: number) => {
  const startDate = new Date(1900, 0, 1);
  const daysOffset = excelNumber - 2;
  const resultDate = new Date(startDate.setDate(startDate.getDate() + daysOffset));
  return resultDate;
}

interface TransactionTableProps {
  transactions: Transaction[];
}

const TransactionTable: FC<TransactionTableProps> = ({ transactions }) => {
  const [filters, setFilters] = useState({
    operazione: '',
    importoMin: '',
    importoMax: '',
    dataMin: '',
    dataMax: ''
  });

  const resetFilters = () => {
    setFilters({
      operazione: '',
      importoMin: '',
      importoMax: '',
      dataMin: '',
      dataMax: ''
    });
  };

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value
    }));
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      return (
        transaction.operazione.toLowerCase().includes(filters.operazione.toLowerCase()) &&
        (filters.importoMin === '' || transaction.importo >= parseFloat(filters.importoMin)) &&
        (filters.importoMax === '' || transaction.importo <= parseFloat(filters.importoMax)) &&
        (filters.dataMin === '' || excelNumberToDate(transaction.data) >= new Date(filters.dataMin)) &&
        (filters.dataMax === '' || excelNumberToDate(transaction.data) <= new Date(filters.dataMax))
      );
    });
  }, [transactions, filters]);

  if (!transactions || transactions.length === 0) {
    return <Typography>Nessuna transazione disponibile.</Typography>;
  }

  const headers = Object.keys(transactions[0]);

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          name="operazione"
          label="Operazione"
          value={filters.operazione}
          onChange={handleFilterChange}
        />
        <TextField
          name="importoMin"
          label="Importo Min"
          type="number"
          value={filters.importoMin}
          onChange={handleFilterChange}
        />
        <TextField
          name="importoMax"
          label="Importo Max"
          type="number"
          value={filters.importoMax}
          onChange={handleFilterChange}
        />
        <TextField
          name="dataMin"
          label="Data Min"
          type="date"
          value={filters.dataMin}
          onChange={handleFilterChange}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          name="dataMax"
          label="Data Max"
          type="date"
          value={filters.dataMax}
          onChange={handleFilterChange}
          InputLabelProps={{ shrink: true }}
        />
        <Button variant="contained" onClick={resetFilters}>Reset</Button>
      </Box>
      <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label="tabella transazioni">
          <TableHead>
            <TableRow>
              {headers.map((header) => (
                <TableCell key={header} sx={{ fontWeight: 'bold' }}>
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTransactions.map((transaction, index) => (
              <TableRow key={index} sx={{ '&:nth-of-type(odd)': { backgroundColor: 'action.hover' } }}>
                {headers.map((header) => (
                  <TableCell key={`${index}-${header}`}>
                    {header === 'importo' 
                      ? `€ ${transaction[header].toFixed(2)}`:
                      header === 'data' 
                      ? excelNumberToDate(transaction[header]).toLocaleDateString()
                      : transaction[header]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default TransactionTable;