import { useMemo, useState } from 'react'
type Point = { id?: string; nome: string; funcao: string; data: string; horario: string; tipoRegistro?: string; metodo?: string; status: string }
type Daily = { nome: string; data: string; status: string; valor: number }
type Payment = { nome: string; dataPagamento: string; status: string; valorTotal: number }
const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
export function inReportPeriod(date: string, month: string, half: string) {
  const [day, mm, year] = date.slice(0, 10).split('/')
  return `${year}-${mm}` === month && (half === 'mes' || (half === 'primeira' ? Number(day) <= 15 : Number(day) > 15))
}
export default function PeriodReports({ points, daily, payments, onError }: { points: Point[]; daily: Daily[]; payments: Payment[]; onError: (message: string) => void }) {
  const [month, setMonth] = useState(() => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}` })
  const [half, setHalf] = useState('mes')
  const [busy, setBusy] = useState(false)
  const records = useMemo(() => points.filter(item => item.status === 'Registrado' && inReportPeriod(item.data, month, half)).sort((a,b) => a.data.split('/').reverse().join('-').localeCompare(b.data.split('/').reverse().join('-')) || a.horario.localeCompare(b.horario)), [points, month, half])
  const approved = daily.filter(item => item.status === 'Aprovada' && inReportPeriod(item.data, month, half))
  const paid = payments.filter(item => item.status === 'Pago' && inReportPeriod(item.dataPagamento, month, half))
  const label = `${month.split('-').reverse().join('/')} · ${half === 'mes' ? 'Mês completo' : half === 'primeira' ? '1ª quinzena (01 a 15)' : '2ª quinzena (16 ao último dia)'}`
  const headers = ['Trabalhador','Função','Data','Horário','Movimento','Método']
  const rows = records.map(item => [item.nome,item.funcao,item.data,item.horario,item.tipoRegistro || 'Não informado',item.metodo || 'Sistema'])
  async function exportReport(format: 'pdf' | 'xlsx') {
    setBusy(true)
    try {
      if (format === 'pdf') {
        const { buildTablePDF } = await import('./pdfExport')
        buildTablePDF('Relatório de entradas e saídas', `${label} | ${records.length} eventos confirmados`, headers, rows).save(`entradas-saidas-${month}-${half}.pdf`)
      } else {
        const { default: ExcelJS } = await import('exceljs')
        const book = new ExcelJS.Workbook()
        const tables = [
          { name:'Entradas e saídas', head:headers, rows },
          { name:'Diárias aprovadas', head:['Trabalhador','Data','Valor (R$)'], rows:approved.map(item=>[item.nome,item.data,item.valor]) },
          { name:'Pagamentos realizados', head:['Trabalhador','Pago em','Valor (R$)'], rows:paid.map(item=>[item.nome,item.dataPagamento,item.valorTotal]) },
        ]
        tables.forEach(table => { const sheet = book.addWorksheet(table.name, {views:[{state:'frozen',ySplit:3}]}); sheet.addRow([label]); sheet.addRow([]); sheet.addRow(table.head); sheet.addRows(table.rows); sheet.columns.forEach((column,index)=>{column.width=index===0?34:24}); sheet.getRow(3).eachCell(cell=>{cell.font={bold:true,color:{argb:'FFFFFF'}};cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'30263F'}}});sheet.eachRow(row=>{row.height=26; row.eachCell(cell=>{if(typeof cell.value==='number')cell.numFmt='#,##0.00'})});sheet.autoFilter={from:{row:3,column:1},to:{row:Math.max(3,sheet.rowCount),column:table.head.length}} })
        const buffer = await book.xlsx.writeBuffer(); const url = URL.createObjectURL(new Blob([new Uint8Array(buffer)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})); const link=document.createElement('a');link.href=url;link.download=`relatorio-${month}-${half}.xlsx`;link.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000)
      }
    } catch (error) { onError(error instanceof Error ? error.message : 'Não foi possível exportar o relatório.') } finally { setBusy(false) }
  }
  return <section className="module-page module-relatorios"><div className="page-header"><div><span className="section-label">ANÁLISE POR PERÍODO</span><h1 className="page-title">Relatórios</h1><p className="page-subtitle">Entradas, saídas e valores do período selecionado.</p></div><div className="report-actions"><button disabled={busy || !month} className="secondary-button" onClick={()=>void exportReport('xlsx')}>Exportar Excel</button><button disabled={busy || !month} className="primary-button" onClick={()=>void exportReport('pdf')}>Exportar PDF</button></div></div>
    <div className="period-toolbar"><label>Mês de referência<input type="month" value={month} onChange={event=>setMonth(event.target.value)}/></label><label>Período<select value={half} onChange={event=>setHalf(event.target.value)}><option value="mes">Mês completo</option><option value="primeira">1ª quinzena · dias 01 a 15</option><option value="segunda">2ª quinzena · dia 16 em diante</option></select></label><span>{label}</span></div>
    <div className="report-metrics">{[['Entradas',records.filter(item=>item.tipoRegistro==='Entrada').length,'Eventos confirmados'],['Saídas',records.filter(item=>item.tipoRegistro==='Saída').length,'Eventos confirmados'],['Diárias aprovadas',money(approved.reduce((sum,item)=>sum+item.valor,0)),`${approved.length} diárias pela data trabalhada`],['Pagamentos realizados',money(paid.reduce((sum,item)=>sum+item.valorTotal,0)),'Pela data de confirmação do pagamento']].map(([title,value,note])=><article key={title}><span>{title}</span><strong>{value}</strong><small>{note}</small></article>)}</div>
    <section className="closing-overview"><header><div><h2>Entradas e saídas</h2><p>{label} · {records.length} registros</p></div></header><div className="table-wrapper"><table className="closing-summary-table"><thead><tr>{headers.map(title=><th key={title}>{title}</th>)}</tr></thead><tbody>{rows.map((row,index)=><tr key={records[index].id || index}>{row.map((value,col)=><td key={col}>{value}</td>)}</tr>)}</tbody></table></div>{!rows.length && <p className="empty-filter-result">Nenhuma entrada ou saída confirmada neste período.</p>}</section>
  </section>
}
