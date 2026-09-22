const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText, filename)
const { calculateLivePix } = require('../src/livePix.ts')
const { buildClosingWorkbook, approvedClosingRecords } = require('../src/closingWorkbook.ts')
const worker = { id: 'a', nome: 'Ana', funcao: 'Operadora', chavePix: 'ana@example.com', titularPix: 'Ana', cidadePix: 'Mogi Mirim' }
const daily = { id: '1', employeeId: 'a', nome: 'Ana', funcao: 'Operadora', data: '01/09/2026', status: 'Aprovada', diariaBase: 100, adicional: 10, vt: 8, vr: 12, valor: 130 }
const period = '01/09/2026 a 15/09/2026'
const calculate = (rows, payments = [], workers = [worker]) => calculateLivePix(workers, rows, payments, period, '2026-09-01', '2026-09-15')

test('PIX includes only approved daily records in the current period, including boundaries', () => {
  const result = calculate([daily, {...daily, data: '15/09/2026'}, {...daily, status: 'Pendente'}, {...daily, status: 'Cancelada'}, {...daily, data: '16/09/2026'}, {...daily, data: '31/08/2026'}])
  assert.equal(result[0].valorTotal, 260)
  assert.equal(result[0].quantidadeDiarias, 2)
  assert.equal(result[0].pix, worker.chavePix)
})
test('PIX subtracts paid and processing amounts without subtracting awaiting payments twice', () => {
  const payment = { employeeId: 'a', nome: 'Ana', periodo: period, valorTotal: 20 }
  const result = calculate([daily], [{...payment, status:'Pago'}, {...payment, status:'Processando'}, {...payment, status:'Aguardando'}, {...payment, status:'Pago', periodo:'outro'}])
  assert.equal(result[0].valorTotal, 90)
  assert.equal(calculate([daily], [{...payment, status:'Pago', valorTotal:200}])[0].valorTotal, 0)
})
test('PIX keeps people with the same name separate and does not assign ambiguous legacy entries', () => {
  const result = calculate([daily, {...daily, employeeId: undefined}], [], [worker, {...worker, id:'b'}])
  assert.equal(result.length, 1)
  assert.equal(result[0].valorTotal, 130)
})
test('PIX updates from fresh approved amounts with exact cents', () => {
  assert.equal(calculate([{...daily, valor:0.1}, {...daily, valor:0.2}])[0].valorTotal, 0.3)
  assert.deepEqual(calculate([{...daily, status:'Pendente'}]), [])
})
test('Excel exports approved linked records, numeric values, formulas and formatted sheets', async () => {
  const input = {periodo:period, pagamento:'20/09/2026', status:'Fechado', dates:[new Date(2026,8,1),new Date(2026,8,2)], records:[daily, {...daily,id:'2',valor:50}, {...daily,id:'3',status:'Pendente'}, {...daily,id:'4'}], dailyRecordIds:['1','2','3']}
  assert.equal(approvedClosingRecords(input).length, 2)
  assert.equal(approvedClosingRecords({...input,dailyRecordIds:[]}).length, 0)
  const book = buildClosingWorkbook(input)
  const sheet = book.getWorksheet('Fechamento')
  assert.equal(sheet.getCell('D7').result, 180)
  assert.match(sheet.getCell('D7').formula, /SUMIFS/)
  assert.equal(sheet.getCell('J7').result, 180)
  assert.equal(sheet.getCell('J8').result, 180)
  assert.equal(sheet.views[0].ySplit, 6)
  assert.equal(book.getWorksheet('Lançamentos').getCell('I5').value, 130)
  assert.ok(book.getWorksheet('Lançamentos').getCell('D5').value instanceof Date)
  const buffer = await book.xlsx.writeBuffer()
  const restored = new (require('exceljs').Workbook)()
  await restored.xlsx.load(buffer)
  assert.equal(restored.getWorksheet('Fechamento').getCell('J7').result, 180)
  assert.ok(restored.getWorksheet('Fechamento').getCell('J7').numFmt.includes('#,##0.00'))
  assert.equal(restored.getWorksheet('Fechamento').pageSetup.orientation, 'landscape')
})
