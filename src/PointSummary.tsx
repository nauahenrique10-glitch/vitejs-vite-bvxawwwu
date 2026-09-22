import { SystemIcon } from './AdminShell'
type RecordItem = { nome: string; employeeId?: string; data: string; horario: string; status: string; tipoRegistro?: string; metodo?: string; facialVerificada?: boolean }
export default function PointSummary({ records, date, canEdit, onTerminal }: { records: RecordItem[]; date: string; canEdit: boolean; onTerminal: () => void }) {
  const confirmed = records.filter(item => item.status === 'Registrado')
  const people = new Set(confirmed.map(item => item.employeeId || item.nome)).size
  const period = date ? date.split('-').reverse().join('/') : 'Todas as datas'
  const metrics = [
    ['Registros encontrados', records.length, 'Resultado dos filtros abaixo', 'list'],
    ['Entradas registradas', confirmed.filter(item => item.tipoRegistro === 'Entrada').length, 'Eventos de entrada confirmados', 'activity'],
    ['Saídas registradas', confirmed.filter(item => item.tipoRegistro === 'Saída').length, 'Eventos de saída confirmados', 'exit'],
    ['Pessoas com registro', people, 'Trabalhadores distintos no resultado', 'users'],
  ]
  return <><div className="page-header"><div><span className="section-label">CONTROLE DE ACESSO · {period}</span><h1 className="page-title">Entradas e saídas</h1><p className="page-subtitle">Consulte os registros de ponto por trabalhador, data e situação.</p></div>{canEdit && <button className="primary-button" onClick={onTerminal}><SystemIcon name="face"/> Abrir terminal facial</button>}</div><div className="point-metrics">{metrics.map(([title, value, note, icon]) => <div key={title}><SystemIcon name={String(icon)}/><span>{title}</span><strong>{value}</strong><small>{note}</small></div>)}</div><p className="point-summary-note">Os indicadores seguem os filtros. Entradas e saídas são eventos de ponto; não representam a quantidade de pessoas presentes agora.</p></>
}
