import { SystemIcon } from './AdminShell'
import './Overview.css'

type RecordItem = { nome: string; data: string; horario: string; status: string; tipoRegistro?: string; metodo?: string }
type Props = {
  name: string; employees: { nome: string; status: string; facial: string }[];
  records: RecordItem[];


  canAccess: (screen: string) => boolean; canEdit: boolean;
  onNavigate: (screen: string) => void; onTerminal: () => void;
}

export default function Overview(props: Props) {
  const today = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  const todayRecords = props.records.filter(record => record.data === today && record.status === 'Registrado')
  const active = props.employees.filter(employee => employee.status === 'Ativo')
  const enrolled = active.filter(employee => employee.facial === 'Cadastrado').length
  const pendingEnrollment = active.length - enrolled
  const coverage = active.length ? Math.round(enrolled / active.length * 100) : 0
  const recent = [...todayRecords].sort((a, b) => b.horario.localeCompare(a.horario)).slice(0, 6)
  const steps = [
    ['ponto', 'clock', 'Entradas e saídas', 'Consulte os registros de movimentação'],
    ['auditoria', 'shield', 'Auditoria', 'Consulte o histórico de ações no sistema'],
  ].filter(([screen]) => props.canAccess(screen))
  const tasks = [
    { screen: 'ponto', count: todayRecords.length, title: 'Registros de hoje', note: 'Consultar os registros de entrada e saída', icon: 'clock' },
  ].filter(task => props.canAccess(task.screen))
  return <div className="overview">
    <div className="overview-heading"><div><span className="overview-kicker">CONTROLE DE ACESSO</span><h1>Visão geral dos acessos</h1><p>Olá, {props.name.split(' ')[0] || 'usuário'}. Acompanhe a movimentação de pessoas e os registros de presença.</p></div><span className="overview-date"><SystemIcon name="calendar"/>{today}</span></div>
    <section className="overview-hero"><div><span className="overview-kicker">CONTROLE DE ACESSO</span><h2>Cada presença.<br/>Uma operação mais organizada.</h2><p>Identificação facial e registros de entrada e saída em um único fluxo.</p><div className="overview-hero-actions">{props.canEdit && <button onClick={props.onTerminal}><SystemIcon name="face"/>Abrir terminal facial<span>↗</span></button>}{props.canAccess('operacao') && <button className="overview-hero-secondary" onClick={() => props.onNavigate('operacao')}>Ver operação do dia →</button>}</div></div><div className="overview-hero-stat"><SystemIcon name="shield"/><strong>{new Set(todayRecords.map(record => record.nome)).size.toLocaleString('pt-BR')}</strong><span>pessoas com registro hoje</span><small>{todayRecords.length} registro(s) de entrada e saída</small></div></section>
    <div className="overview-metrics">
      {[
        { label: 'Equipe ativa', value: active.length, note: 'Funcionários cadastrados', icon: 'users', color: 'violet' },
        { label: 'Faciais cadastradas', value: enrolled, note: `${pendingEnrollment} cadastro(s) pendente(s)`, icon: 'face', color: 'green' },
        { label: 'Entradas hoje', value: todayRecords.filter(record => record.tipoRegistro === 'Entrada').length, note: 'Registros identificados como entrada', icon: 'activity', color: 'blue' },
        { label: 'Saídas hoje', value: todayRecords.filter(record => record.tipoRegistro === 'Saída').length, note: 'Registros identificados como saída', icon: 'exit', color: 'amber' },
      ].map(metric => <div className="overview-metric" key={metric.label}><span className={`overview-metric-icon ${metric.color}`}><SystemIcon name={metric.icon}/></span><span>{metric.label}</span><strong>{metric.value.toLocaleString('pt-BR')}</strong><small>{metric.note}</small></div>)}
    </div>
    <section className="overview-workflow"><div><span className="overview-kicker">ACOMPANHAMENTO</span><h2>Registros e rastreabilidade</h2></div><div className="overview-workflow-items">{steps.map(([screen, icon, title, note], index) => <button key={screen} onClick={() => props.onNavigate(screen)}><span className="overview-step-number">0{index + 1}</span><SystemIcon name={icon}/><strong>{title}</strong><small>{note}</small><span className="overview-step-arrow">↗</span></button>)}</div></section>
    <div className="overview-columns"><section className="overview-panel"><div className="overview-panel-heading"><div><span className="overview-kicker">MOVIMENTAÇÕES DE HOJE</span><h2>Últimos registros</h2></div>{props.canAccess('ponto') && <button className="overview-link" onClick={() => props.onNavigate('ponto')}>Ver todos →</button>}</div>{recent.length ? <ul className="overview-records">{recent.map((record, index) => <li key={`${record.nome}-${record.horario}-${index}`}><span className="overview-avatar">{record.nome.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('')}</span><div><strong>{record.nome}</strong><small>{record.metodo || 'Método não informado'}</small></div><span className={`overview-record-kind ${record.tipoRegistro === 'Saída' ? 'out' : ''}`}>{record.tipoRegistro || 'Registro'}</span><time>{record.horario}</time></li>)}</ul> : <div className="overview-empty"><SystemIcon name="clock"/><h3>Nenhum registro hoje</h3><p>As entradas e saídas aparecerão aqui após o registro de ponto.</p>{props.canEdit && <button className="overview-link" onClick={props.onTerminal}>Abrir terminal facial →</button>}</div>}</section>
    <section className="overview-panel"><div className="overview-panel-heading"><div><span className="overview-kicker">VISÃO DA EQUIPE</span><h2>Acompanhamento da equipe</h2></div></div><div className="overview-tasks">{tasks.map(task => <button key={task.screen} onClick={() => props.onNavigate(task.screen)}><SystemIcon name={task.icon}/><span><strong>{task.title}</strong><small>{task.note}</small></span><b>{task.count}</b><span>›</span></button>)}</div><div className="overview-coverage"><div><span>Equipe com facial cadastrada</span><strong>{coverage}%</strong></div><progress value={enrolled} max={active.length || 1} aria-label="Equipe com facial cadastrada"/><small>{enrolled} de {active.length} funcionário(s) ativo(s)</small></div></section></div>
  </div>
}
