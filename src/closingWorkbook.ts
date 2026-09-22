import ExcelJS from 'exceljs'

export type ClosingDaily = { id?: string; employeeId?: string; nome: string; funcao: string; data: string; status: string; diariaBase: number; adicional: number; vt: number; vr: number; valor: number }
type ClosingExport = { periodo: string; pagamento: string; status: string; dates: Date[]; records: ClosingDaily[]; dailyRecordIds?: string[] }
const moneyFormat = '#,##0.00;[Red](#,##0.00);"–"'
const sum = (records: ClosingDaily[], value: (record: ClosingDaily) => number) => records.reduce((total, record) => total + Math.round(value(record) * 100), 0) / 100
const workerKey = (record: ClosingDaily) => record.employeeId || `nome:${record.nome}`
const iso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const fromBR = (date: string) => date.split('/').reverse().join('-')
const utcDate = (date: Date) => new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))

export function approvedClosingRecords(input: ClosingExport) {
  if (!input.dates.length) return []
  const first = iso(input.dates[0])
  const last = iso(input.dates[input.dates.length - 1])
  const links = input.dailyRecordIds ? new Set(input.dailyRecordIds) : null
  return input.records.filter(record => record.status === 'Aprovada' && fromBR(record.data) >= first && fromBR(record.data) <= last && (!links || Boolean(record.id && links.has(record.id))))
}

export function buildClosingWorkbook(input: ClosingExport) {
  const records = approvedClosingRecords(input)
  const book = new ExcelJS.Workbook()
  book.creator = 'Gestão Sindical'
  book.created = new Date()
  book.calcProperties.fullCalcOnLoad = true
  const sheet = book.addWorksheet('Fechamento', { views: [{ state: 'frozen', xSplit: 2, ySplit: 6, showGridLines: false }], pageSetup: { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 } })
  const source = book.addWorksheet('Lançamentos', { views: [{ state: 'frozen', ySplit: 4, showGridLines: false }] })
  const color = { ink: '473253', muted: '8F7B9A', violet: '563765', border: 'EAE2EE', pale: 'F4EFF8', green: 'EAF3ED' }
  const header = (row: ExcelJS.Row) => {
    row.height = 34
    row.eachCell(cell => { cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color.violet } }; cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true } })
  }
  source.mergeCells('A1:I1'); source.getCell('A1').value = 'Diárias aprovadas do fechamento'
  source.mergeCells('A2:I2'); source.getCell('A2').value = `${input.periodo} — valores em reais (R$)`
  source.mergeCells('A3:I3'); source.getCell('A3').value = 'Fonte: registros aprovados no sistema, respeitando os vínculos deste fechamento.'
  source.getRow(4).values = ['Código do trabalhador', 'Trabalhador', 'Função', 'Data', 'Base', 'Adicional', 'VT', 'VR', 'Total']
  header(source.getRow(4))
  source.columns.forEach((column, index) => { column.width = [25, 32, 24, 14, 15, 15, 14, 14, 16][index] })
  records.forEach(record => {
    const [day, month, year] = record.data.split('/').map(Number)
    const row = source.addRow([workerKey(record), record.nome, record.funcao, new Date(Date.UTC(year, month - 1, day)), record.diariaBase, record.adicional, record.vt, record.vr, record.valor])
    row.height = 25; row.getCell(4).numFmt = 'dd/mm/yyyy'
    for (let c = 5; c <= 9; c++) row.getCell(c).numFmt = moneyFormat
  })
  source.autoFilter = { from: 'A4', to: `I${Math.max(4, source.rowCount)}` }
  const lastSource = Math.max(5, records.length + 4)
  const sourceRange = (col: string) => `'Lançamentos'!$${col}$5:$${col}$${lastSource}`
  const lastCol = input.dates.length + 8
  const lastLetter = sheet.getColumn(lastCol).letter
  sheet.mergeCells(1, 2, 1, lastCol); sheet.getCell('B1').value = 'GESTÃO SINDICAL — FECHAMENTO DE DIARISTAS'
  sheet.mergeCells(2, 2, 2, lastCol); sheet.getCell('B2').value = `DHL Mogi Mirim · ${input.periodo}`
  sheet.mergeCells(3, 2, 3, lastCol); sheet.getCell('B3').value = `Situação: ${input.status} · Pagamento previsto: ${input.pagamento}`
  sheet.mergeCells(4, 2, 4, lastCol); sheet.getCell('B4').value = 'Valores em reais (R$). Somente diárias aprovadas vinculadas ao fechamento. Detalhamento na aba Lançamentos.'
  sheet.getRow(5).height = 12
  const labels = ['Código', 'Trabalhador', 'Função', ...input.dates.map(utcDate), 'Diárias', 'Base + adicional', 'VT', 'VR', 'Total']
  sheet.getRow(6).values = labels; header(sheet.getRow(6)); sheet.getRow(6).height = 40
  sheet.getColumn(1).hidden = true; sheet.getColumn(2).width = 32; sheet.getColumn(3).width = 23
  input.dates.forEach((date, index) => {
    const col = index + 4; sheet.getColumn(col).width = 12; sheet.getCell(6, col).numFmt = 'dd"/"mm ddd'
    if (date.getDay() === 0 || date.getDay() === 6) sheet.getCell(6, col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '877397' } }
  })
  for (let col = input.dates.length + 4; col <= lastCol; col++) sheet.getColumn(col).width = col === lastCol ? 19 : 16
  const workers = [...new Set(records.map(workerKey))].map(key => ({ key, rows: records.filter(record => workerKey(record) === key) })).sort((a, b) => a.rows[0].nome.localeCompare(b.rows[0].nome, 'pt-BR'))
  workers.forEach(({ key, rows }, index) => {
    const r = index + 7
    sheet.getRow(r).height = 29
    sheet.getCell(r, 1).value = key; sheet.getCell(r, 2).value = rows[0].nome; sheet.getCell(r, 3).value = rows[0].funcao
    input.dates.forEach((date, index) => {
      const col = index + 4
      const letter = sheet.getColumn(col).letter
      sheet.getCell(r, col).value = { formula: `SUMIFS(${sourceRange('I')},${sourceRange('A')},$A${r},${sourceRange('D')},${letter}$6)`, result: sum(rows.filter(record => fromBR(record.data) === iso(date)), item => item.valor) }
      sheet.getCell(r, col).numFmt = moneyFormat
    })
    let c = input.dates.length + 4
    sheet.getCell(r, c++).value = { formula: `COUNTIFS(${sourceRange('A')},$A${r})`, result: rows.length }
    sheet.getCell(r, c++).value = { formula: `SUMIFS(${sourceRange('E')},${sourceRange('A')},$A${r})+SUMIFS(${sourceRange('F')},${sourceRange('A')},$A${r})`, result: sum(rows, item => item.diariaBase + item.adicional) }
    sheet.getCell(r, c++).value = { formula: `SUMIFS(${sourceRange('G')},${sourceRange('A')},$A${r})`, result: sum(rows, item => item.vt) }
    sheet.getCell(r, c++).value = { formula: `SUMIFS(${sourceRange('H')},${sourceRange('A')},$A${r})`, result: sum(rows, item => item.vr) }
    sheet.getCell(r, c).value = { formula: `SUM(D${r}:${sheet.getColumn(input.dates.length + 3).letter}${r})`, result: sum(rows, item => item.valor) }
    for (let col = input.dates.length + 5; col <= lastCol; col++) sheet.getCell(r, col).numFmt = moneyFormat
  })
  const totalRow = workers.length + 7
  sheet.getCell(totalRow, 2).value = 'TOTAL DO PERÍODO'
  for (let col = 4; col <= lastCol; col++) {
    const letter = sheet.getColumn(col).letter
    const cached = workers.reduce((value, _, index) => value + Number(sheet.getCell(index + 7, col).result || 0), 0)
    sheet.getCell(totalRow, col).value = { formula: workers.length ? `SUM(${letter}7:${letter}${totalRow - 1})` : '0', result: Math.round(cached * 100) / 100 }
    if (col !== input.dates.length + 4) sheet.getCell(totalRow, col).numFmt = moneyFormat
  }
  sheet.getRow(totalRow).height = 32
  sheet.autoFilter = { from: 'B6', to: `${lastLetter}${Math.max(6, totalRow - 1)}` }
  sheet.pageSetup.printTitlesRow = '1:6'; sheet.pageSetup.printTitlesColumn = 'B:C'
  sheet.pageSetup.printArea = `B1:${lastLetter}${totalRow}`
  sheet.headerFooter.oddFooter = '&LGestão Sindical&R Página &P de &N'
  for (const target of [sheet, source]) {
    target.eachRow((row, rowNumber) => row.eachCell(cell => {
      if (rowNumber <= 3) { cell.font = { name: 'Arial', size: rowNumber === 1 ? 14 : 10, bold: rowNumber === 1, color: { argb: rowNumber === 1 ? color.ink : color.muted } }; row.height = rowNumber === 1 ? 31 : 24; return }
      if ((target === sheet && rowNumber === 6) || (target === source && rowNumber === 4)) return
      cell.font = { name: 'Arial', size: 10, color: { argb: color.ink } }
      cell.alignment = { vertical: 'middle', horizontal: cell.type === ExcelJS.ValueType.Number || cell.type === ExcelJS.ValueType.Formula ? 'right' : 'left' }
      cell.border = { bottom: { style: 'hair', color: { argb: color.border } } }
      if (rowNumber % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FAF8FC' } }
    }))
  }
  for (let col = 1; col <= lastCol; col++) {
    const cell = sheet.getCell(totalRow, col)
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color.pale } }
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: color.ink } }
  }
  return book
}
