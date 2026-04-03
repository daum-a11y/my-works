type CellValue = string | number | boolean | null | undefined;

interface ColumnDefinition<Row> {
  header: string;
  value: (row: Row) => CellValue;
  width?: number;
}

function triggerBrowserDownload(filename: string, buffer: ArrayBuffer) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function downloadExcelFile<Row>(
  filename: string,
  sheetName: string,
  rows: readonly Row[],
  columns: readonly ColumnDefinition<Row>[],
) {
  const { Workbook } = await import('exceljs');
  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  worksheet.columns = columns.map((column) => ({
    header: column.header,
    key: column.header,
    width: column.width ?? 16,
  }));

  rows.forEach((row) => {
    worksheet.addRow(
      Object.fromEntries(columns.map((column) => [column.header, column.value(row)])),
    );
  });

  const buffer = await workbook.xlsx.writeBuffer();
  triggerBrowserDownload(filename, buffer as ArrayBuffer);
}
