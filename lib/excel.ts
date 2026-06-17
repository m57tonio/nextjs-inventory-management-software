import * as XLSX from 'xlsx';

/**
 * Build an .xlsx byte array from a header row + data rows.
 * Numbers stay numeric in Excel. Returns Uint8Array so it is
 * directly usable as a Response body (BodyInit / BufferSource).
 */
export function buildXlsx(
  headers: string[],
  rows: (string | number | null | undefined)[][],
  sheetName = 'Report',
): ArrayBuffer {
  const ws  = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb  = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  // Copy into a fresh ArrayBuffer so the return type is unambiguously ArrayBuffer
  // (not the ArrayBuffer | SharedArrayBuffer union of buf.buffer).
  const ab = new ArrayBuffer(buf.byteLength);
  new Uint8Array(ab).set(buf);
  return ab;
}

/** Content-Disposition header value for a file download. */
export function xlsxDisposition(filename: string) {
  return `attachment; filename="${filename}.xlsx"`;
}
