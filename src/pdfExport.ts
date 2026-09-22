import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'
import { approvedClosingRecords, closingWorkers, type ClosingExport } from './closingData'
const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
export function buildTablePDF(title: string, subtitle: string, headers: string[], rows: string[][], totals?: string[]) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  autoTable(doc, {
    head: [headers], body: rows, foot: totals ? [totals] : undefined, showFoot: 'lastPage',
    startY: 43, margin: { top: 43, bottom: 19, left: 16, right: 16 },
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 4, textColor: [48, 42, 59], overflow: 'linebreak' },
    headStyles: { fillColor: [47, 37, 63], textColor: [255, 255, 255], fontSize: 9 }, footStyles: { fillColor: [235, 230, 241], textColor: [47, 37, 63], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 247, 250] }, rowPageBreak: 'avoid',
    didDrawPage: () => {
      doc.setFillColor(47, 37, 63); doc.rect(16, 14, 10, 2, 'F')
      doc.setTextColor(47, 37, 63); doc.setFont('helvetica', 'bold'); doc.setFontSize(19); doc.text(title, 16, 26)
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(95, 87, 105); doc.text(subtitle, 16, 34)
    },
  })
  const count = doc.getNumberOfPages()
  for (let page = 1; page <= count; page++) {
    doc.setPage(page); doc.setDrawColor(225, 221, 231); doc.line(16, 195, 281, 195)
    doc.setFontSize(8); doc.setTextColor(95, 87, 105); doc.text('Gestão de diaristas | Documento gerado pelo sistema', 16, 201); doc.text(`Página ${page} de ${count}`, 281, 201, { align: 'right' })
  }
  return doc
}
const decimal = (value: number) => value === 0 ? '-' : value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export function closingPDFMatrix(input: ClosingExport, dates = input.dates) {
  const workers = closingWorkers(input)
  const records = approvedClosingRecords(input)
  const dayValues = workers.map(worker => dates.map(date => records.filter(record =>
    (record.employeeId || `nome:${record.nome}`) === worker.key &&
    record.data === `${String(date.getDate()).padStart(2,'0')}/${String(date.getMonth()+1).padStart(2,'0')}/${date.getFullYear()}`
  ).reduce((sum, record) => sum + Math.round(record.valor * 100), 0) / 100))
  const total = (values: number[]) => values.reduce((sum, value) => sum + Math.round(value * 100), 0) / 100
  return {
    headers: ['Trabalhador / função', ...dates.map(date => `${String(date.getDate()).padStart(2,'0')}/${String(date.getMonth()+1).padStart(2,'0')}`), 'Diárias', 'Base + adicional', 'VT', 'VR', 'Total do período'],
    rows: workers.map((worker,index) => [`${worker.nome}\n${worker.funcao}`, ...dayValues[index].map(decimal), String(worker.quantidade), decimal(worker.base), decimal(worker.vt), decimal(worker.vr), decimal(worker.total)]),
    totals: ['TOTAL DO PERÍODO', ...dates.map((_,index) => decimal(total(dayValues.map(row => row[index])))), String(workers.reduce((sum,worker) => sum+worker.quantidade,0)), ...(['base','vt','vr','total'] as const).map(key => decimal(total(workers.map(worker => worker[key]))))],
  }
}
export function buildClosingPDF(input: ClosingExport) {
  if (!input.dates.length) throw new Error('Selecione um período válido para exportar a planilha.')
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' })
  // Keep a full fortnight on one page width, with readable columns and repeated row headers.
  for (let offset = 0; offset < input.dates.length; offset += 16) {
    if (offset) doc.addPage()
    const dates = input.dates.slice(offset, offset + 16)
    const matrix = closingPDFMatrix(input, dates)
    const width = doc.internal.pageSize.getWidth()
    const dayWidth = (width - 24 - 58 - 97) / dates.length
    const columnStyles: Record<number, { cellWidth: number; halign: 'left' | 'right' | 'center' }> = { 0: { cellWidth: 58, halign: 'left' } }
    dates.forEach((_, index) => { columnStyles[index+1] = { cellWidth: dayWidth, halign: 'right' } })
    ;[16,24,18,18,21].forEach((size,index) => { columnStyles[dates.length+1+index] = { cellWidth:size,halign:'right' } })
    autoTable(doc, {
      theme: 'grid', head: [matrix.headers], body: matrix.rows, foot: [matrix.totals], showFoot: 'lastPage',
      startY: 39, margin: { top: 39, bottom: 18, left: 12, right: 12 }, columnStyles,
      styles: { font: 'helvetica', fontSize: 8, cellPadding: 2, textColor: [48,42,59], lineColor: [218,212,225], lineWidth: .15, overflow: 'linebreak', valign: 'middle' },
      headStyles: { fillColor: [47,37,63], textColor: [255,255,255], fontSize: 8, halign:'center', minCellHeight: 12 },
      footStyles: { fillColor: [232,225,240], textColor: [47,37,63], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249,248,251] }, rowPageBreak: 'avoid',
      didParseCell: data => {
        if (data.section === 'head' && data.column.index > 0 && data.column.index <= dates.length && [0,6].includes(dates[data.column.index-1].getDay())) data.cell.styles.fillColor = [105,89,123]
        if (data.section === 'body' && data.column.index === matrix.headers.length-1) { data.cell.styles.fillColor = [240,235,246]; data.cell.styles.fontStyle = 'bold' }
      },
      didDrawPage: () => {
        doc.setTextColor(47,37,63); doc.setFont('helvetica','bold'); doc.setFontSize(18); doc.text('Fechamento da quinzena',12,18)
        doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.text(`${input.periodo} | ${input.status} | Pagamento previsto: ${input.pagamento}`,12,26)
        doc.setFontSize(8); doc.setTextColor(95,87,105); doc.text(`Valores em reais (R$). Somente diárias aprovadas vinculadas. Colunas de ${matrix.headers[1]} a ${matrix.headers[dates.length]}. Totais referentes ao período completo.`,12,33)
      },
    })
  }
  const pages = doc.getNumberOfPages()
  for (let page=1;page<=pages;page++) {
    doc.setPage(page)
    const width=doc.internal.pageSize.getWidth(), height=doc.internal.pageSize.getHeight()
    doc.setDrawColor(218,212,225); doc.line(12,height-13,width-12,height-13)
    doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(95,87,105)
    doc.text('Gestão de diaristas | Planilha de fechamento',12,height-8)
    doc.text(`Página ${page} de ${pages}`,width-12,height-8,{align:'right'})
  }
  return doc
}
