// Export CSV lisible par Excel : séparateur « ; », BOM UTF-8 pour les accents.
function escapeCell(value) {
  const s = value === null || value === undefined ? '' : String(value)
  return /[";\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}

export function timestamp() {
  const now = new Date()
  const pad = (n) => (n < 10 ? '0' : '') + n
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}h${pad(now.getMinutes())}`
}

export function downloadBlob(blob, filename) {
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(link.href), 1000)
}

export function downloadCsv(filename, header, rows) {
  const lines = [header, ...rows].map((row) => row.map(escapeCell).join(';'))
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  downloadBlob(blob, filename)
}
