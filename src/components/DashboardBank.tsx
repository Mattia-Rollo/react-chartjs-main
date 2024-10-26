import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    Box,
    createTheme,
    TextField,
    Button,
    ThemeProvider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ExcelUploader  from './ExcelUploader';
import TransactionTable from './TransactionTable';
import GraficoSpeseSalario from './GraficoLineaSpeseSalario';
import { Transaction } from '../types';



interface CategorieAggregate {
    [key: string]: number;
}

interface PieChartData {
    name: string;
    value: number;
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
        name: string;
        value: number;
    }>;
    label?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d88484'];

const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#dc004e',
        },
    },
});

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    '&.MuiTableCell-head': {
        backgroundColor: theme.palette.grey[200],
        color: theme.palette.common.black,
        fontWeight: 'bold',
    },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': {
        backgroundColor: theme.palette.action.hover,
    },
    '&:last-child td, &:last-child th': {
        border: 0,
    },
}));

const excelNumberToDate = (excelNumber: number): Date => {
    const startDate = new Date(1900, 0, 1);
    const daysOffset = excelNumber - 2;
    return new Date(startDate.setDate(startDate.getDate() + daysOffset));
};

const SpeseMensiliDashboard = (): JSX.Element => {
    const [speseFuture, setSpeseFuture] = useState<number>(0);
    const [nuovaSpesa, setNuovaSpesa] = useState<string>('');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stipendio, setStipendio] = useState<number>(0);

    const handleEXCELDataExtracted = (data: Transaction[]) => {
        const stipendioTransaction = data.find(item => item.operazione === 'Stipendio O Pensione');
        setStipendio(stipendioTransaction ? stipendioTransaction.importo : 0);
        setTransactions(data);
    };

    const totaleSpese = transactions.reduce((sum, item) => 
        item.importo < 0 ? sum + Math.abs(item.importo) : sum, 0);
    const totaleSpeseConFuture = totaleSpese + speseFuture;
    const rimanente = stipendio - totaleSpeseConFuture;

    const handleAggiungiSpesa = (): void => {
        const spesa = parseFloat(nuovaSpesa);
        if (!isNaN(spesa) && spesa > 0) {
            setSpeseFuture(prevSpese => prevSpese + spesa);
            setNuovaSpesa('');
        }
    };

    const resetSpeseFuture = (): void => {
        setSpeseFuture(0);
    };

    const categorieAggregate: CategorieAggregate = transactions.reduce((acc: CategorieAggregate, item) => {
        if (item.importo < 0) {
            if (!acc[item.categoria]) {
                acc[item.categoria] = 0;
            }
            acc[item.categoria] += Math.abs(item.importo);
        }
        return acc;
    }, {});

    const dataGrafico: PieChartData[] = Object.entries(categorieAggregate).map(([name, value]) => ({
        name,
        value
    }));

    const CustomTooltip = ({ active, payload }: CustomTooltipProps): JSX.Element | null => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip" style={{ backgroundColor: '#fff', padding: '5px', border: '1px solid #ccc' }}>
                    <p className="label">{`${payload[0].name} : €${payload[0].value.toFixed(2)}`}</p>
                </div>
            );
        }
        return null;
    };

    const datagraficeLineare = transactions
        .filter(item => item.importo < 0)
        .sort((a, b) => a.data - b.data)
        .map(item => ({
            data: excelNumberToDate(item.data).toLocaleDateString(),
            spesa: Math.abs(item.importo)
        }));

    // Il resto del codice del render rimane sostanzialmente uguale
    // Ho rimosso solo la parte commentata del renderCustomizedLabel
    return (
        <ThemeProvider theme={theme}>
            <Box sx={{ p: 2 }}>
                <Typography variant="h4" gutterBottom color="primary">Dashboard Spese Mensili</Typography>

                <ExcelUploader onDataExtracted={handleEXCELDataExtracted} />
                {transactions.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="h5" gutterBottom>
                            Transazioni Caricate
                        </Typography>
                        <TransactionTable transactions={transactions} />
                    </Box>
                )}


                {/* <CSVUploader onDataExtracted={handleCSVExtractedData} /> */}
                {/* grafico a torta e tabella riassuntiva */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                    {dataGrafico.length > 0 && (
                    <Box sx={{ flexGrow: 1, minWidth: 300, flexBasis: '45%' }}>
                        <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
                            <Typography variant="h6" gutterBottom color="primary">Grafico a Torta delle Spese</Typography>
                            <ResponsiveContainer width="100%" height={600}>
                                <PieChart>
                                    <Pie
                                        data={dataGrafico}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        // label={renderCustomizedLabel}
                                        outerRadius={150}
                                        fill="#8884d8"
                                        dataKey="value"
                                        nameKey="name"
                                    >
                                        {dataGrafico.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Box>)}
                    
                    {dataGrafico.length > 0 && (
                    <Box sx={{ flexGrow: 1, minWidth: 300, flexBasis: '45%' }}>
                        <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
                            <Typography variant="h6" gutterBottom color="primary">Tabella Riassuntiva</Typography>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <StyledTableCell>Descrizione</StyledTableCell>
                                            <StyledTableCell align="right">Importo</StyledTableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        <StyledTableRow>
                                            <TableCell>Stipendio</TableCell>
                                            <TableCell align="right">€{stipendio.toFixed(2)}</TableCell>
                                        </StyledTableRow>
                                        <StyledTableRow>
                                            <TableCell>Totale Spese Attuali</TableCell>
                                            <TableCell align="right">€{totaleSpese.toFixed(2)}</TableCell>
                                        </StyledTableRow>
                                        <StyledTableRow>
                                            <TableCell>Spese Future</TableCell>
                                            <TableCell align="right">€{speseFuture.toFixed(2)}</TableCell>
                                        </StyledTableRow>
                                        <StyledTableRow>
                                            <TableCell><strong>Totale Spese</strong></TableCell>
                                            <TableCell align="right"><strong>€{totaleSpeseConFuture.toFixed(2)}</strong></TableCell>
                                        </StyledTableRow>
                                        <StyledTableRow>
                                            <TableCell><strong>Rimanente</strong></TableCell>
                                            <TableCell align="right"><strong>€{rimanente.toFixed(2)}</strong></TableCell>
                                        </StyledTableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <Box sx={{ flexGrow: 1 }}>
                                <Box sx={{ display: 'flex', gap: 2, mt: 2, alignItems: 'center' }}>
                                    <TextField
                                        label="Aggiungi spesa futura"
                                        type="number"
                                        value={nuovaSpesa}
                                        onChange={(e) => setNuovaSpesa(e.target.value)}
                                        size="small"
                                        sx={{ flexGrow: 1, height: '3rem' }}
                                    />
                                    <Button
                                        variant="contained"
                                        onClick={handleAggiungiSpesa}
                                        sx={{ flexGrow: 1, height: 'auto' }}
                                    >
                                        Aggiungi
                                    </Button>
                                    <Button
                                        variant="contained"
                                        onClick={resetSpeseFuture}
                                        sx={{ flexGrow: 1, height: 'auto' }}
                                    >
                                        Resetta
                                    </Button>
                                </Box>
                            </Box>
                        </Paper>
                    </Box>)}
                </Box>

                {/* grafico lineare */}
                {datagraficeLineare.length > 0 && (
                <GraficoSpeseSalario datagraficeLineare={datagraficeLineare} stipendio={stipendio}/>
                )}

                {/* tabella transazioni */}
                {transactions.length > 0 && (
                <Box sx={{ mt: 2 }}>
                    <Paper elevation={3} sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom color="primary">Dettaglio Transazioni</Typography>
                        <TableContainer sx={{ maxHeight: 440 }}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <StyledTableCell>Data</StyledTableCell>
                                        <StyledTableCell>Operazione</StyledTableCell>
                                        <StyledTableCell>Categoria</StyledTableCell>
                                        <StyledTableCell align="right">Importo</StyledTableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {transactions.map((item, index) => (
                                        <StyledTableRow key={index}>
                                            <TableCell>{excelNumberToDate(item.data).toLocaleDateString()}</TableCell>
                                            <TableCell>{item.operazione}</TableCell>
                                            <TableCell>{item.categoria}</TableCell>
                                            <TableCell
                                                align="right"
                                                sx={{
                                                    color: item.importo < 0 ? 'secondary.main' : 'primary.main'
                                                }}
                                            >
                                                €{item.importo.toFixed(2)}
                                            </TableCell>
                                        </StyledTableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Box>
                )}
            </Box>
        </ThemeProvider>
    );
};

export default SpeseMensiliDashboard;