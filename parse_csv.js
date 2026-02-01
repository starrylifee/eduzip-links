import fs from 'fs';
import path from 'path';

const csvPath = 'edzip_full_data_1.csv';
const outputPath = 'src/data.json';

try {
  const csv = fs.readFileSync(csvPath, 'utf8');
  const lines = csv.split(/\r?\n/);
  const headers = lines[0].split(',').map(h => h.trim());

  const result = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].trim();
    if (!row) continue;

    let insideQuotes = false;
    let currentVal = '';
    const values = [];

    for (let char of row) {
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentVal.trim());
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    values.push(currentVal.trim());

    const obj = {};
    headers.forEach((h, index) => {
      // Clean data: remove wrapping quotes if any
      let val = values[index] || '';
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1);
      }
      obj[h] = val;
    });
    result.push(obj);
  }

  if (!fs.existsSync('src')) {
    fs.mkdirSync('src');
  }

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`Successfully converted ${result.length} items to ${outputPath}`);
} catch (err) {
  console.error('Error processing CSV:', err);
}
