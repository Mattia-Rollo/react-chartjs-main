function createJsonFile(data, filename = 'data.json') {
    // Converte la lista di oggetti in formato JSON
    const jsonData = JSON.stringify(data, null, 2);

    // Crea un blob con i dati JSON
    const blob = new Blob([jsonData], { type: 'application/json' });

    // Crea un link temporaneo per il download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;

    // Aggiunge il link al DOM e simula il click per il download
    document.body.appendChild(link);
    link.click();

    // Rimuove il link temporaneo dal DOM
    document.body.removeChild(link);
  }


  createJsonFile(data, 'data.json');