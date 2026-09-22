export type ClosingDaily = { id?: string; employeeId?: string; nome: string; funcao: string; data: string; status: string; diariaBase: number; adicional: number; vt: number; vr: number; valor: number }
export type ClosingExport = { periodo: string; pagamento: string; status: string; dates: Date[]; records: ClosingDaily[]; dailyRecordIds?: string[] }
const sum = (records: ClosingDaily[], value: (record: ClosingDaily) => number) => records.reduce((total, record) => total + Math.round(value(record) * 100), 0) / 100
const workerKey = (record: ClosingDaily) => record.employeeId || `nome:${record.nome}`
const iso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const fromBR = (date: string) => date.split('/').reverse().join('-')

export function approvedClosingRecords(input: ClosingExport) {
  if (!input.dates.length) return []
  const first = iso(input.dates[0])
  const last = iso(input.dates[input.dates.length - 1])
  const links = input.dailyRecordIds ? new Set(input.dailyRecordIds) : null
  return input.records.filter(record => record.status === 'Aprovada' && fromBR(record.data) >= first && fromBR(record.data) <= last && (!links || Boolean(record.id && links.has(record.id))))
}

export function closingWorkers(input: ClosingExport) {
  const records = approvedClosingRecords(input)
  return [...new Set(records.map(workerKey))].map(key => {
    const rows = records.filter(row => workerKey(row) === key)
    return { key, nome: rows[0].nome, funcao: rows[0].funcao, quantidade: rows.length, base: sum(rows, row => row.diariaBase + row.adicional), vt: sum(rows, row => row.vt), vr: sum(rows, row => row.vr), total: sum(rows, row => row.valor) }
  }).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}
