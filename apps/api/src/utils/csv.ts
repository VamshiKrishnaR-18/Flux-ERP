export type CsvColumn<T> = {
  header: string;
  value: (row: T) => unknown;
};

export function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';

  // Prefer stable date serialization
  const str = value instanceof Date ? value.toISOString() : String(value);

  // Escape if contains special CSV chars
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export function buildCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const lines: string[] = [];

  lines.push(columns.map((c) => csvEscape(c.header)).join(','));

  for (const row of rows) {
    lines.push(columns.map((c) => csvEscape(c.value(row))).join(','));
  }

  // Use CRLF for better Excel compatibility
  return lines.join('\r\n');
}

