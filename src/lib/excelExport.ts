import * as XLSX from 'xlsx';

type CellValue = string | number | boolean | null | undefined;

interface ColumnDefinition<Row> {
  header: string;
  value: (row: Row) => CellValue;
  width?: number;
}

export function downloadExcelFile<Row>(
  filename: string,
  sheetName: string,
  rows: readonly Row[],
  columns: readonly ColumnDefinition<Row>[],
) {
  const worksheet = XLSX.utils.json_to_sheet(
    rows.map((row) =>
      Object.fromEntries(columns.map((column) => [column.header, column.value(row)])),
    ),
    { header: columns.map((column) => column.header) },
  );

  worksheet['!cols'] = columns.map((column) => ({ wch: column.width ?? 16 }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
}
