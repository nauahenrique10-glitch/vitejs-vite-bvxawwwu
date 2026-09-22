import { SystemIcon } from './AdminShell'
import './Overview.css'

type Props = {
  name: string; active: number; dailyPending: number; dailyValue: string;
  paymentsPending: number; paymentsValue: string;
  closing: { periodo: string; status: string; pagamento: string };
  dailyCount: number; forecast: string; progress: number;
  canAccess: (screen: string) => boolean; onNavigate: (screen: string) => void;
  lists: { data: string; local: string; diaristas: string[] }[];
}

export default function ManagementOverview(props: Props) {
  const today = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  const isoToday = today.split('/').reverse().join('-')
  const todayLists = props.lists.filter(list => list.data === isoToday)
  const assigned = new Set(todayLists.flatMap(list => list.diaristas)).size
  const finance = props.canAccess('pagamentos')
  const stages = [
    ['funcionarios', 'users', 'Equipe', 'Cadastros e dados dos diaristas'],
    ['listaDiaristas', 'calendar', 'Escalas', 'Planejamento de cada operação'],
    ['diarias', 'wallet', 'Diárias', 'Conferência dos dias trabalhados'],
    ['fechamentos', 'check', 'Fechamento', 'Consolidação e aprovação do período'],
    ['pagamentos', 'wallet', 'Pagamentos', 'Acompanhamento dos repasses'],
  ].filter(([screen]) => props.canAccess(screen))
  const metrics = [
    { label: 'Diaristas ativos', value: props.active, note: 'Equipe cadastrada', icon: 'users', color: 'violet' },
    { label: 'Escalados hoje', value: assigned, note: `${todayLists.length} lista(s) na data de hoje`, icon: 'calendar', color: 'green' },
    ...(props.canAccess('diarias') ? [{ label: 'Diárias pendentes', value: props.dailyPending, note: props.dailyValue, icon: 'clock', color: 'amber' }] : []),
    ...(finance ? [{ label: 'Pagamentos pendentes', value: props.paymentsPending, note: props.paymentsValue, icon: 'wallet', color: 'blue' }] : []),
  ]
  return <div className="overview management-overview">
    <div className="overview-heading"><div><span className="overview-kicker">GESTÃO DE DIARISTAS</span><h1>Sua operação, sob controle.</h1><p>Olá, {props.name.split(' ')[0] || 'usuário'}. Equipes, diárias e fechamentos em um só lugar.</p></div><span className="overview-date"><SystemIcon name="calendar"/>{today}</span></div>
    <section className="overview-hero"><div><span className="overview-kicker">PLANEJAR · CONFERIR · GERENCIAR</span><h2>Da escala ao pagamento.<br/>Clareza em cada etapa.</h2><p>Acompanhe a equipe e organize as rotinas da operação com informações do período.</p><div className="overview-hero-actions">{props.canAccess('operacao') && <button onClick={() => props.onNavigate('operacao')}><SystemIcon name="activity"/>Ver operação do dia<span>↗</span></button>}{props.canAccess('listaDiaristas') && <button className="overview-hero-secondary" onClick={() => props.onNavigate('listaDiaristas')}>Consultar escalas →</button>}</div></div><div className="overview-hero-stat"><SystemIcon name="users"/><strong>{assigned}</strong><span>diaristas escalados hoje</span><small>Planejamento da equipe · {today}</small></div></section>
    <div className="overview-metrics">{metrics.map(metric => <div className="overview-metric" key={metric.label}><span className={`overview-metric-icon ${metric.color}`}><SystemIcon name={metric.icon}/></span><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.note}</small></div>)}</div>
    <section className="overview-workflow"><span className="overview-kicker">ROTINA DE GESTÃO</span><h2>Cada etapa, no lugar certo</h2><div className="overview-workflow-items">{stages.map(([screen, icon, title, note], index) => <button key={screen} onClick={() => props.onNavigate(screen)}><span className="overview-step-number">0{index + 1}</span><SystemIcon name={icon}/><strong>{title}</strong><small>{note}</small><span className="overview-step-arrow">↗</span></button>)}</div></section>
    <div className="overview-columns"><section className="overview-panel"><div className="overview-panel-heading"><div><span className="overview-kicker">PLANEJAMENTO DO DIA</span><h2>Escalas de hoje</h2></div>{props.canAccess('listaDiaristas') && <button className="overview-link" onClick={() => props.onNavigate('listaDiaristas')}>Ver listas →</button>}</div>{todayLists.length ? <ul className="overview-records">{todayLists.map((list, index) => <li key={`${list.local}-${index}`}><span className="overview-avatar"><SystemIcon name="calendar"/></span><div><strong>{list.local || 'Local não informado'}</strong><small>{today}</small></div><span className="overview-record-kind">{list.diaristas.length} diarista(s)</span></li>)}</ul> : <div className="overview-empty"><SystemIcon name="calendar"/><h3>Nenhuma escala para hoje</h3><p>As listas cadastradas para esta data aparecerão aqui.</p>{props.canAccess('listaDiaristas') && <button className="overview-link" onClick={() => props.onNavigate('listaDiaristas')}>Organizar lista do dia →</button>}</div>}</section>
    <section className="overview-panel"><div className="overview-panel-heading"><div><span className="overview-kicker">CONFERÊNCIA</span><h2>Próximas ações</h2></div></div><div className="overview-tasks">{props.canAccess('diarias') && <button onClick={() => props.onNavigate('diarias')}><SystemIcon name="clock"/><span><strong>Conferir diárias pendentes</strong><small>{props.dailyValue} aguardando conferência</small></span><b>{props.dailyPending}</b><span>›</span></button>}{finance && <button onClick={() => props.onNavigate('pagamentos')}><SystemIcon name="wallet"/><span><strong>Acompanhar pagamentos</strong><small>{props.paymentsValue} pendentes</small></span><b>{props.paymentsPending}</b><span>›</span></button>}{props.canAccess('relatorios') && <button onClick={() => props.onNavigate('relatorios')}><SystemIcon name="chart"/><span><strong>Consultar relatórios</strong><small>Consolide os resultados da operação</small></span><span>›</span></button>}</div>{props.canAccess('fechamentos') && <div className="overview-coverage"><div><span>Diárias aprovadas no período</span><strong>{props.progress}%</strong></div><progress value={props.progress} max={100} aria-label="Diárias aprovadas no período"/><small>{props.closing.periodo}</small></div>}</section></div>
    {props.canAccess('fechamentos') && <section className="overview-closing"><div><span className="overview-kicker">FECHAMENTO DO PERÍODO</span><h2>{props.closing.periodo}</h2><span>{props.closing.status}</span></div><div><small>Diárias no período</small><strong>{props.dailyCount}</strong></div><div><small>Valor previsto</small><strong>{props.forecast}</strong></div><div><small>Pagamento previsto</small><strong>{props.closing.pagamento}</strong></div><button className="overview-link" onClick={() => props.onNavigate('fechamentos')}>Conferir fechamento →</button></section>}
  </div>
}
