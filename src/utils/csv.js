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

export function toCsv(header, rows) {
  const lines = [header, ...rows].map((row) => row.map(escapeCell).join(';'))
  return '﻿' + lines.join('\r\n')
}

export function downloadCsv(filename, header, rows) {
  downloadBlob(new Blob([toCsv(header, rows)], { type: 'text/csv;charset=utf-8' }), filename)
}

// Nom de fichier sûr à partir d'un titre de projet.
export function safeFilename(name, fallback = 'projet') {
  const s = String(name || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 _.-]+/g, ' ').trim().replace(/\s+/g, '_')
  return (s || fallback).slice(0, 80)
}
