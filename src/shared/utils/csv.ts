/**
 * CSV utility functions for parsing and generating CSV files
 */

/**
 * Escape CSV field value
 */
function escapeCsvField(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  const stringValue = String(value);
  
  // If value contains comma, newline, or quote, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

/**
 * Generate CSV from array of objects
 */
export function generateCSV<T extends Record<string, any>>(
  data: T[],
  headers: Array<{ key: keyof T; label: string }>
): string {
  if (data.length === 0) {
    return headers.map(h => escapeCsvField(h.label)).join(',');
  }

  const headerRow = headers.map(h => escapeCsvField(h.label)).join(',');
  const dataRows = data.map(row => {
    return headers.map(header => {
      const value = row[header.key];
      
      // Handle arrays (e.g., images, metaKeywords)
      if (Array.isArray(value)) {
        return escapeCsvField(value.join('; '));
      }
      
      // Handle objects (e.g., dimensions)
      if (value && typeof value === 'object') {
        return escapeCsvField(JSON.stringify(value));
      }
      
      return escapeCsvField(value);
    }).join(',');
  });

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Parse CSV string to array of objects
 */
export function parseCSV<T extends Record<string, any>>(
  csvContent: string,
  headers: Array<{ key: keyof T; label: string }>
): T[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length === 0) {
    return [];
  }

  // Parse header row to find column indices
  const headerLine = lines[0];
  const headerColumns = parseCSVLine(headerLine);
  const columnMap = new Map<string, number>();
  
  headerColumns.forEach((col, index) => {
    const normalizedCol = col.trim().toLowerCase();
    columnMap.set(normalizedCol, index);
  });

  // Map headers to column indices
  const headerIndices = headers.map(header => {
    const normalizedLabel = header.label.toLowerCase();
    return columnMap.get(normalizedLabel) ?? -1;
  });

  // Parse data rows
  const results: T[] = [];
  for (let i = 1; i < lines.length; i++) {
    const columns = parseCSVLine(lines[i]);
    const row: any = {};
    
    headers.forEach((header, index) => {
      const colIndex = headerIndices[index];
      if (colIndex >= 0 && colIndex < columns.length) {
        let value = columns[colIndex].trim();
        
        // Handle empty values
        if (value === '') {
          row[header.key] = undefined;
          return;
        }
        
        // Try to parse as JSON (for objects/arrays)
        if (value.startsWith('{') || value.startsWith('[')) {
          try {
            row[header.key] = JSON.parse(value);
            return;
          } catch {
            // Not valid JSON, treat as string
          }
        }
        
        // Handle semicolon-separated arrays
        if (value.includes(';')) {
          row[header.key] = value.split(';').map(v => v.trim()).filter(v => v);
          return;
        }
        
        // Try to parse as number
        if (!isNaN(Number(value)) && value !== '') {
          const numValue = Number(value);
          if (Number.isInteger(numValue)) {
            row[header.key] = numValue;
          } else {
            row[header.key] = numValue;
          }
          return;
        }
        
        // Try to parse as boolean
        if (value.toLowerCase() === 'true') {
          row[header.key] = true;
          return;
        }
        if (value.toLowerCase() === 'false') {
          row[header.key] = false;
          return;
        }
        
        // Default to string
        row[header.key] = value;
      }
    });
    
    results.push(row as T);
  }

  return results;
}

/**
 * Parse a single CSV line handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add last field
  result.push(current);
  
  return result;
}

