/**
 * Converte um array de objetos em uma string CSV e dispara o download no navegador.
 */
export function downloadCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    alert("Não há dados para exportar.");
    return;
  }

  // 1. Extrair os cabeçalhos das chaves do primeiro objeto
  const headers = Object.keys(data[0]);

  // 2. Mapear as linhas de dados, escapando vírgulas e aspas duplas
  const csvRows = data.map(row => {
    return headers.map(fieldName => {
      let cellData = row[fieldName] === null || row[fieldName] === undefined ? '' : String(row[fieldName]);
      // Escapar aspas duplas e envolver em aspas se contiver vírgula, aspa ou quebra de linha
      cellData = cellData.replace(/"/g, '""');
      if (cellData.search(/("|,|\n)/g) >= 0) {
        cellData = `"${cellData}"`;
      }
      return cellData;
    }).join(',');
  });

  // 3. Montar a string final do CSV com BOM (para o Excel ler acentos do UTF-8 corretamente)
  const csvString = [headers.join(','), ...csvRows].join('\r\n');
  const BOM = '\uFEFF';
  const finalCsv = BOM + csvString;

  // 4. Criar o Blob e disparar o download
  const blob = new Blob([finalCsv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
