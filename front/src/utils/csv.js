export function parseCSV(text) {
  const lines = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        lines.push(current);
        current = '';
      } else if (ch === '\n' || (ch === '\r' && next === '\n')) {
        lines.push(current);
        current = '';
        if (ch === '\r') i++;
        if (lines.length > 0) {
          lines.push(lines.shift());
        }
      } else if (ch === '\r') {
        lines.push(current);
        current = '';
        lines.push(lines.shift());
      } else {
        current += ch;
      }
    }
  }
  if (current || lines.length > 0) {
    lines.push(current);
  }

  const rows = [];
  let headers = [];
  let row = [];

  for (const line of lines) {
    if (headers.length === 0) {
      headers = line.map(h => h.trim());
    } else {
      row = line;
      if (row.length > 0 && row.some(c => c !== '')) {
        rows.push(row);
      }
    }
  }

  return { headers, rows };
}

export function parseCSVFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < text.length; i++) {
          const ch = text[i];
          const next = text[i + 1];

          if (inQuotes) {
            if (ch === '"' && next === '"') {
              current += '"';
              i++;
            } else if (ch === '"') {
              inQuotes = false;
            } else {
              current += ch;
            }
          } else {
            if (ch === '"') {
              inQuotes = true;
            } else if (ch === ',') {
              lines.push(current);
              current = '';
            } else if (ch === '\n' || (ch === '\r' && next === '\n')) {
              lines.push(current);
              current = '';
              if (ch === '\r') i++;
              lines.push(null);
            } else if (ch === '\r') {
              lines.push(current);
              current = '';
              lines.push(null);
            } else {
              current += ch;
            }
          }
        }
        lines.push(current);

        const rawRows = [];
        let tempRow = [];
        for (const item of lines) {
          if (item === null) {
            rawRows.push(tempRow);
            tempRow = [];
          } else {
            tempRow.push(item);
          }
        }
        if (tempRow.length > 0) rawRows.push(tempRow);

        if (rawRows.length < 2) {
          resolve({ headers: [], rows: [] });
          return;
        }

        const headers = rawRows[0].map(h => h.trim());
        const rows = rawRows.slice(1).filter(r => r.length > 0 && r.some(c => c !== ''));

        resolve({ headers, rows });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsText(file, 'UTF-8');
  });
}

export function rowsToObjects(headers, rows) {
  return rows.map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] !== undefined ? row[i].trim() : '';
    });
    return obj;
  });
}