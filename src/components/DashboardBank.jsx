import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid, Brush } from 'recharts';
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
import ExcelUploader from './ExcelUploader';
import CSVUploader from './CSVUploader';
import TransactionTable from './TransactionTable';
import Grid from '@mui/material/Grid2';
import GraficoSpeseSalario from './GraficoLineaSpeseSalario';
import { set } from 'date-fns';

const transazioni = [
    { data: '17.10.2024', descrizione: 'Tigros', categoria: 'Altre uscite', importo: -13.89 },
    { data: '16.10.2024', descrizione: 'Prelievo Sportello Banca Del Gruppo', categoria: 'Prelievi', importo: -40.00 },
    { data: '16.10.2024', descrizione: 'Prelievo BANCOMAT Su Banche Del Gruppo', categoria: 'Prelievi', importo: -40.00 },
    { data: '16.10.2024', descrizione: 'Esselunga Legcantoni P', categoria: 'Generi alimentari e supermercato', importo: -15.91 },
    { data: '15.10.2024', descrizione: 'Pagamento Effettuato Su Pos Estero', categoria: 'Altre uscite', importo: -22.42 },
    { data: '15.10.2024', descrizione: 'Google YouTube Member', categoria: 'Altre uscite', importo: -4.99 },
    { data: '15.10.2024', descrizione: 'Addebito diretto disposto a favore di Save the Children Italia ETS MANDATO 11396578', categoria: 'Donazioni', importo: -30.00 },
    { data: '14.10.2024', descrizione: 'Pagamento A2A SPA CS57V', categoria: 'Gas & energia elettrica', importo: -78.00 },
    { data: '12.10.2024', descrizione: 'Iperstaroil Rescaldina', categoria: 'Carburanti', importo: -50.00 },
    { data: '12.10.2024', descrizione: 'Ads Vallescrivia Ovest Arquata Scriv', categoria: 'Ristoranti e bar', importo: -24.93 },
    { data: '12.10.2024', descrizione: 'Mcd Castelnuovo Scr.es Castelnuovo S', categoria: 'Ristoranti e bar', importo: -9.10 },
    { data: '12.10.2024', descrizione: 'Aspit Genova Ovest Genova Aerop.', categoria: 'Pedaggi e Telepass', importo: -0.40 },
    { data: '12.10.2024', descrizione: 'Miser Direz.entrata Terrazzano Ba', categoria: 'Pedaggi e Telepass', importo: -3.40 },
    { data: '12.10.2024', descrizione: 'Miser Direz. Uscita Terrazzano Ba', categoria: 'Pedaggi e Telepass', importo: -3.40 },
    { data: '12.10.2024', descrizione: 'Aspit Milano Ovest Genova Ovest', categoria: 'Pedaggi e Telepass', importo: -11.10 },
    { data: '12.10.2024', descrizione: 'Miser Genova Aerop. Milano Ovest', categoria: 'Pedaggi e Telepass', importo: -11.20 },
    { data: '11.10.2024', descrizione: 'Il Gusto Della Puglia Desio', categoria: 'Generi alimentari e supermercato', importo: -6.50 },
    { data: '11.10.2024', descrizione: 'Il Gelato Di Peppy Snc Legnano', categoria: 'Generi alimentari e supermercato', importo: -8.00 },
    { data: '11.10.2024', descrizione: 'Coop Legnano Legnano', categoria: 'Generi alimentari e supermercato', importo: -15.11 },
    { data: '11.10.2024', descrizione: 'Prelievo Sportello Banca Del Gruppo', categoria: 'Prelievi', importo: -20.00 },
    { data: '11.10.2024', descrizione: 'Ricarica Carta Prepagata', categoria: 'Ricarica carte', importo: -120.00 },
    { data: '10.10.2024', descrizione: 'Stipendio O Pensione', categoria: 'Stipendi e pensioni', importo: 1907.00 }
];

const stipendio = 1607.00;

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

const excelNumberToDate = (excelNumber) => {
    console.log(excelNumber);
    const startDate = new Date(1900, 0, 1); // Data di inizio (1 gennaio 1900)
    const daysOffset = excelNumber - 2; // Offset dei giorni (perché 1 gennaio 1900 è 1 in Excel)
    const resultDate = new Date(startDate.setDate(startDate.getDate() + daysOffset));
    return resultDate;
  }

const SpeseMensiliDashboard = () => {
    const [speseFuture, setSpeseFuture] = useState(0);
    const [nuovaSpesa, setNuovaSpesa] = useState('');
    const [transactions, setTransactions] = useState([]);
    const [stipendio, setStipendio] = useState(0);



    const handleCSVExtractedData = (data) => {
        console.log(data);
        // Qui puoi aggiornare lo stato della tua applicazione con i dati estratti
    };

    const handleEXCELDataExtracted = (data) => {
        console.log(data);
        setStipendio(data.filter(item => item.operazione === 'Stipendio O Pensione')[0].importo);
        setTransactions(data);
    };

    const totaleSpese = transactions.reduce((sum, item) => item.importo < 0 ? sum + Math.abs(item.importo) : sum, 0);
    const totaleSpeseConFuture = totaleSpese + speseFuture;
    const rimanente = stipendio - totaleSpeseConFuture;

    const handleAggiungiSpesa = () => {
        const spesa = parseFloat(nuovaSpesa);
        if (!isNaN(spesa) && spesa > 0) {
            setSpeseFuture(prevSpese => prevSpese + spesa);
            setNuovaSpesa('');
        }
    };

    const resetSpeseFuture = () => {
        setSpeseFuture(0);
    };

    const categorieAggregate = transactions.reduce((acc, item) => {
        if (item.importo < 0) {
            if (!acc[item.categoria]) {
                acc[item.categoria] = 0;
            }
            acc[item.categoria] += Math.abs(item.importo);
        }
        return acc;
    }, {});

    const dataGrafico = Object.entries(categorieAggregate).map(([name, value]) => ({
        name,
        value
    }));

    const RADIAN = Math.PI / 180;
    // const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    //     const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    //     const x = cx + radius * Math.cos(-midAngle * RADIAN);
    //     const y = cy + radius * Math.sin(-midAngle * RADIAN);

    //     return (
    //         <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
    //             {`${(percent * 100).toFixed(0)}%`}
    //         </text>
    //     );
    // };

    const CustomTooltip = ({ active, payload, label }) => {
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
        .filter(item => item.importo < 0) // Filtriamo solo le spese (importi negativi)
        .sort((a, b) => a.data - b.data) // Ordiniamo per data
        .map(item => ({
            data: excelNumberToDate(item.data).toLocaleDateString(),
            spesa: Math.abs(item.importo) // Convertiamo in valore positivo per il grafico
        }));


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
                <GraficoSpeseSalario datagraficeLineare={datagraficeLineare} stipendio={stipendio}/>)}

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