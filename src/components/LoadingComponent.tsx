import { Box, LinearProgress, Typography } from '@mui/material';
import { useState, useEffect } from 'react';

interface LoadingFallbackProps {
  delay?: number; // in millisecondi
}

export const LoadingFallback = ({ delay = 2000 }: LoadingFallbackProps) => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Caricamento');
  
  const updateInterval = 30; // Aggiorniamo ogni 30ms per un movimento fluido

  useEffect(() => {
    const startTime = Date.now();

    // Progress animation
    const timer = setInterval(() => {
      const elapsedTime = Date.now() - startTime;
      const newProgress = Math.min((elapsedTime / delay) * 100, 100);
      
      setProgress(newProgress);

      // Fermiamo il timer quando raggiungiamo il 100%
      if (newProgress === 100) {
        clearInterval(timer);
      }
    }, updateInterval);

    // Loading text animation
    const textTimer = setInterval(() => {
      setLoadingText((currentText) => {
        if (currentText === 'Caricamento...') return 'Caricamento';
        return currentText + '.';
      });
    }, 500);

    return () => {
      clearInterval(timer);
      clearInterval(textTimer);
    };
  }, [delay]); // Aggiungiamo delay alle dipendenze

  return (
    <Box 
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100%',
        position: 'fixed',
        top: 0,
        left: 0,
        background: 'rgba(255, 255, 255, 0.95)',
        zIndex: 9999,
        transition: 'all 0.3s ease-in-out'
      }}
    >
      <Box 
        sx={{ 
          width: '300px',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          alignItems: 'center'
        }}
      >
        <LinearProgress 
          variant="determinate" 
          value={progress}
          sx={{
            width: '100%',
            height: 8,
            borderRadius: 4,
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              backgroundImage: 'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)',
              transition: 'transform 0.03s linear',
            },
            backgroundColor: 'rgba(0,0,0,0.05)'
          }}
        />
        <Typography 
          variant="body1" 
          sx={{ 
            color: '#666',
            fontWeight: 500,
            minWidth: 100,
            textAlign: 'center'
          }}
        >
          {loadingText}
        </Typography>
      </Box>
    </Box>
  );
};