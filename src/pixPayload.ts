const somenteDigitos = (valor: string) => valor.replace(/\D/g, '')
function normalizarTextoPix(valor: string, limite: number) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 $%*+\-./:]/g, '')
    .trim()
    .toUpperCase()
    .slice(0, limite)
}

export function normalizarChavePix(tipo: string, chave: string) {
  const valor = String(chave || '').trim()
  const tipoNormalizado = String(tipo || '').toLowerCase()

  if (tipoNormalizado.includes('cpf') || tipoNormalizado.includes('cnpj')) {
    return somenteDigitos(valor)
  }

  if (tipoNormalizado.includes('celular') || tipoNormalizado.includes('telefone')) {
    if (valor.startsWith('+')) return `+${somenteDigitos(valor)}`
    const digitos = somenteDigitos(valor)
    if (digitos.length === 10 || digitos.length === 11) return `+55${digitos}`
    if (digitos.startsWith('55')) return `+${digitos}`
    return valor
  }

  return valor
}

function campoEmv(id: string, valor: string) {
  const tamanho = String(valor.length).padStart(2, '0')
  return `${id}${tamanho}${valor}`
}

function crc16Pix(valor: string) {
  let crc = 0xffff

  for (let i = 0; i < valor.length; i++) {
    crc ^= valor.charCodeAt(i) << 8

    for (let bit = 0; bit < 8; bit++) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0')
}

export function gerarPayloadPixEstatico({
  chave,
  tipoChave,
  titular,
  cidade,
  valor,
  permitirSemValor = false,
}: {
  chave: string
  tipoChave: string
  titular: string
  cidade: string
  valor: number
  permitirSemValor?: boolean
}) {
  const chaveNormalizada = normalizarChavePix(tipoChave, chave)
  const titularNormalizado = normalizarTextoPix(titular, 25)
  const cidadeNormalizada = normalizarTextoPix(cidade, 15)
  const valorNumerico = Number(valor)

  if (!chaveNormalizada || chaveNormalizada === '-') {
    throw new Error('Cadastre uma chave PIX válida para este funcionário.')
  }

  if (!titularNormalizado) {
    throw new Error('Cadastre o titular do PIX para este funcionário.')
  }

  if (!cidadeNormalizada) {
    throw new Error('Cadastre a cidade do titular do PIX para gerar o QR Code.')
  }

  if (!Number.isFinite(valorNumerico) || (valorNumerico <= 0 && !(permitirSemValor && valorNumerico === 0))) {
    throw new Error('O pagamento precisa ter um valor maior que zero.')
  }

  const contaPix = campoEmv('00', 'BR.GOV.BCB.PIX') + campoEmv('01', chaveNormalizada)

  const payloadSemCrc =
    campoEmv('00', '01') +
    campoEmv('26', contaPix) +
    campoEmv('52', '0000') +
    campoEmv('53', '986') +
    (valorNumerico > 0 ? campoEmv('54', valorNumerico.toFixed(2)) : '') +
    campoEmv('58', 'BR') +
    campoEmv('59', titularNormalizado) +
    campoEmv('60', cidadeNormalizada) +
    campoEmv('62', campoEmv('05', '***')) +
    '6304'

  return payloadSemCrc + crc16Pix(payloadSemCrc)
}

