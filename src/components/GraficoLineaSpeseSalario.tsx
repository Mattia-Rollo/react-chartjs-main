import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    Brush
} from 'recharts';
import { GraficoSpeseSalarioProps } from '../types';


const GraficoSpeseSalario: React.FC<GraficoSpeseSalarioProps> = ({ dataGraficoLineare, stipendio }) => {
    const [stipendioIniziale] = useState(stipendio);
    const [datiCompleti, setDatiCompleti] = useState<Array<{ importo: number; stipendio: string }>>([]);

    useEffect(() => {
        console.log("Dati ricevuti:", dataGraficoLineare);
        
        if (!Array.isArray(dataGraficoLineare) || dataGraficoLineare.length === 0) {
            console.log("I dati ricevuti non sono un array valido o sono vuoti");
            return;
        }

        // Analizziamo la struttura del primo elemento per capire come sono formattati i dati
        const primoElemento = dataGraficoLineare[0];
        console.log("Struttura del primo elemento:", primoElemento);

        let stipendioCorrente = stipendioIniziale;
        const datiConStipendio = dataGraficoLineare.map((item, index) => {
            let importo = 0;
            if (typeof item.importo === 'number') {
                importo = item.importo;
            } else if (typeof item.spesa === 'number') {
                importo = item.spesa;
            } else if (typeof item.amount === 'number') {
                importo = item.amount;
            } else {
                console.log(`Elemento ${index} non ha un importo valido:`, item);
                // Cerca di convertire qualsiasi proprietà numerica in importo
                for (let key in item) {
                    if (typeof item[key] === 'number') {
                        importo = item[key];
                        console.log(`Usando ${key} come importo:`, importo);
                        break;
                    }
                }
            }

            stipendioCorrente = Math.max(0, stipendioCorrente - importo);
            return {
                ...item,
                importo: importo,
                stipendio: stipendioCorrente.toFixed(2)
            };
        });

        console.log("Dati elaborati:", datiConStipendio);
        setDatiCompleti(datiConStipendio);
    }, [dataGraficoLineare, stipendioIniziale]);

    if (!Array.isArray(datiCompleti) || datiCompleti.length === 0) {
        return <Typography>Nessun dato disponibile per il grafico</Typography>;
    }

    return (
        <Box sx={{ mt: 2 }}>
            <Paper elevation={3} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom color="primary">Andamento Spese e Stipendio nel Tempo</Typography>
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart
                        data={datiCompleti}
                        margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="data" />
                        <YAxis
                            yAxisId="left"
                            label={{ value: 'Spese (€)', angle: -90, position: 'insideLeft' }}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            domain={[0, 1800]}
                            label={{ value: 'Stipendio (€)', angle: 90, position: 'insideRight' }}
                        />
                        <Tooltip />
                        <Legend />
                        <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="importo"
                            name="Spese"
                            stroke="#8884d8"
                            // activeDot={{ r: 8 }}
                        />
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="stipendio"
                            name="Stipendio"
                            stroke="#82ca9d"
                            // activeDot={{ r: 8 }}
                        />
                        <Brush dataKey="data" height={30} stroke="#8884d8" />
                    </LineChart>
                </ResponsiveContainer>
            </Paper>
        </Box>
    );
};

export default GraficoSpeseSalario;