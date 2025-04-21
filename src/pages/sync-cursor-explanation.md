# Spiegazione Dettagliata del Sync Cursor in uPlot

Il codice implementa un sistema di sincronizzazione tra grafici uPlot, permettendo a più grafici di reagire insieme agli input dell'utente. Ecco una spiegazione approfondita di come funziona:

## 1. Concetto di Sincronizzazione

La sincronizzazione tra grafici permette di:

- Muovere il cursore in modo sincronizzato su tutti i grafici
- Selezionare la stessa serie di dati su tutti i grafici simultaneamente
- Zoomare su tutti i grafici contemporaneamente
- Controllare esattamente quali eventi devono essere sincronizzati

## 2. Classe SyncManager

Il cuore dell'implementazione è la classe `SyncManager`, che gestisce tutte le interazioni tra i grafici:

```typescript
class SyncManager {
  private key: string;                          // Identificatore univoco del gruppo
  private charts: Map<string, uPlot> = new Map(); // Registro dei grafici
  private enabled: boolean = true;              // Stato della sincronizzazione
  
  // ... metodi vari
}
```

### Metodi principali:

- **sub(chart)**: Registra un grafico nel sistema di sincronizzazione
- **unsub(chart)**: Rimuove un grafico dalla sincronizzazione
- **syncZoom(sourceId, minX, maxX)**: Propaga lo zoom da un grafico agli altri
- **createFilter(syncMouseUpDown)**: Crea un filtro per controllare quali eventi sincronizzare

## 3. Funzioni di Corrispondenza (Match Functions)

Due funzioni chiave determinano come gli elementi dei grafici corrispondono tra loro:

```typescript
// Confronta le chiavi di scala (es. "x", "y")
const matchSyncKeys = (own, ext) => own === ext;

// Trova la serie corrispondente in base all'etichetta invece che alla posizione
const matchSeriesIdxs = (sub, pub, pubSeriesIdx) => {
  if (pubSeriesIdx == null) return null;
  const pubSeriesLabel = pub.series[pubSeriesIdx].label;
  return sub.series.findIndex(s => s.label === pubSeriesLabel);
};
```

La funzione `matchSeriesIdxs` è particolarmente importante perché consente di sincronizzare grafici che hanno serie in ordine diverso.

## 4. Configurazione del Cursore

Il cuore della sincronizzazione è la configurazione del cursore passata a ogni grafico:

```typescript
const createSyncCursorOptions = (syncManager, syncMouseUpDown) => {
  return {
    lock: true,                        // Blocca il cursore sull'asse X
    focus: { prox: 16 },               // Distanza per la messa a fuoco delle serie
    sync: {
      key: syncManager.getKey(),       // Chiave di sincronizzazione
      setSeries: true,                 // Sincronizza la serie selezionata
      match: [matchSyncKeys, matchSyncKeys, matchSeriesIdxs],  // Funzioni di corrispondenza
      filters: {
        pub: syncManager.createFilter(syncMouseUpDown),  // Filtro eventi
      }
    },
  };
};
```

## 5. Flusso di Sincronizzazione

Ecco come funziona il processo di sincronizzazione quando l'utente interagisce con un grafico:

1. L'utente muove il cursore o seleziona su un grafico (grafico "publisher")
2. uPlot rileva l'evento e consulta la configurazione del cursore
3. Il sistema filtra l'evento usando `filters.pub` per decidere se propagarlo
4. Se l'evento viene propagato, uPlot cerca gli altri grafici con la stessa chiave `sync.key`
5. Per ogni grafico target (grafico "subscriber"):
   - Usa le funzioni `match` per determinare come mappare le scale e le serie
   - Applica l'evento corrispondente al grafico target

## 6. Sincronizzazione dello Zoom

La sincronizzazione dello zoom è gestita separatamente tramite il plugin personalizzato:

```typescript
hooks: {
  setSelect: (u) => {
    const { left, width } = u.select;
    if (width > 0) {
      // Calcola i valori min/max
      const minX = u.posToVal(left, 'x');
      const maxX = u.posToVal(left + width, 'x');
      
      // Applica lo zoom al grafico corrente
      u.batch(() => {
        u.setScale("x", { min: minX, max: maxX });
      });
      
      // Propaga lo zoom agli altri grafici
      syncManager.syncZoom(id, minX, maxX);
      
      // Resetta la selezione
      u.setSelect({ left: 0, top: 0, width: 0, height: 0 });
    }
  }
}
```

## 7. Controlli UI per la Sincronizzazione

L'interfaccia utente include controlli che permettono all'utente di:

- Attivare/disattivare completamente la sincronizzazione
- Controllare se sincronizzare gli eventi mouseup/mousedown
- Resettare lo zoom su tutti i grafici contemporaneamente

## 8. Flusso Completo di Inizializzazione

Quando il componente viene montato:

1. Si crea un'istanza del `SyncManager` globale
2. Si creano i componenti `TVMChart` con riferimento al `SyncManager`
3. Ogni `TVMChart` registra il suo grafico nel `SyncManager` con `syncManager.sub()`
4. Quando l'utente interagisce con un grafico, la sincronizzazione avviene automaticamente
5. Quando un componente viene smontato, il grafico viene rimosso dal `SyncManager` con `syncManager.unsub()`

Questa architettura assicura che la sincronizzazione funzioni in modo efficiente e che tutte le risorse vengano gestite correttamente durante il ciclo di vita dei componenti.
