const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')

// Compile isolated presentation components for server-side markup assertions.
require.extensions['.tsx'] = (module, filename) => {
  const result = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  })
  module._compile(result.outputText, filename)
}
require.extensions['.css'] = () => {}
const AdminShell = require('../src/AdminShell.tsx').default
const AccessHome = require('../src/AccessHome.tsx').default
const Overview = require('../src/Overview.tsx').default
const ManagementOverview = require('../src/ManagementOverview.tsx').default
const noop = () => {}
const shared = { current: 'dashboard', userName: 'Usuário de teste', role: 'Administrador', canAccess: () => true, onNavigate: noop, onSignOut: noop, onPassword: noop, onTerminal: noop, canEdit: true, savedAt: '', readOnly: false, onWorkspace: noop }
const render = (component, props) => renderToStaticMarkup(React.createElement(component, props))
function navigation(html) { return html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/)[1] }

test('management displays financial tabs without the access menu or terminal action', () => {
  const html = render(AdminShell, { ...shared, workspace: 'gestao' })
  const nav = navigation(html)
  for (const label of ['Funcionários', 'Diárias', 'Fechamentos', 'Pagamentos']) assert.ok(nav.includes(label))
  assert.ok(!nav.includes('Entradas e saídas'))
  assert.ok(!html.includes('Abrir terminal facial'))
})
test('access menu contains entry/exit monitoring without financial tabs', () => {
  const html = render(AdminShell, { ...shared, workspace: 'acesso' })
  const nav = navigation(html)
  assert.ok(nav.includes('Entradas e saídas'))
  assert.ok(html.includes('Abrir terminal facial'))
  for (const label of ['Funcionários', 'Diárias', 'Fechamentos', 'Pagamentos']) assert.ok(!nav.includes(label))
})
test('workspace menus still enforce existing screen permissions', () => {
  const html = render(AdminShell, { ...shared, workspace: 'gestao', canAccess: screen => ['dashboard', 'funcionarios'].includes(screen), canEdit: false, readOnly: true })
  assert.ok(navigation(html).includes('Funcionários'))
  assert.ok(!navigation(html).includes('Pagamentos'))
  assert.ok(!navigation(html).includes('Fechamentos'))
})
test('entry page exposes the two workspaces and the independent terminal', () => {
  const html = render(AccessHome, { onAdmin: noop, onAccess: noop, onTerminal: noop })
  for (const label of ['Gestão de diaristas', 'Controle de acesso', 'Abrir totem facial']) assert.ok(html.includes(label))
})
test('access overview shows empty activity honestly and contains no financial actions', () => {
  const html = render(Overview, { name: 'Teste', employees: [], records: [], canAccess: screen => ['ponto', 'auditoria'].includes(screen), canEdit: true, onNavigate: noop, onTerminal: noop })
  assert.ok(html.includes('Nenhum registro hoje'))
  assert.ok(!html.includes('Pagamentos'))
  assert.ok(!html.includes('Fechamento'))
})
test('management overview has no terminal action and hides finance for restricted profiles', () => {
  const html = render(ManagementOverview, { name: 'Teste', active: 0, dailyPending: 0, dailyValue: 'R$ 0,00', paymentsPending: 1, paymentsValue: 'R$ 999,99', closing: { periodo: 'Teste', status: 'Pendente', pagamento: 'Teste' }, dailyCount: 0, forecast: 'R$ 888,88', progress: 0, canAccess: screen => ['funcionarios', 'listaDiaristas', 'diarias'].includes(screen), onNavigate: noop, lists: [] })
  assert.ok(html.includes('Nenhuma escala para hoje'))
  assert.ok(!html.includes('Abrir terminal'))
  assert.ok(!html.includes('R$ 999,99'))
  assert.ok(!html.includes('R$ 888,88'))
})
