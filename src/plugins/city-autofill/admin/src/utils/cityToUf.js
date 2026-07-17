// Chaves já normalizadas: minúsculas, sem acentos, espaços simples.
// Cobre as 27 capitais e os nomes dos 26 estados + DF.
const CITY_TO_UF = {
  // Capitais
  'rio branco': 'AC',
  maceio: 'AL',
  macapa: 'AP',
  manaus: 'AM',
  salvador: 'BA',
  fortaleza: 'CE',
  brasilia: 'DF',
  vitoria: 'ES',
  goiania: 'GO',
  'sao luis': 'MA',
  cuiaba: 'MT',
  'campo grande': 'MS',
  'belo horizonte': 'MG',
  belem: 'PA',
  'joao pessoa': 'PB',
  curitiba: 'PR',
  recife: 'PE',
  teresina: 'PI',
  'rio de janeiro': 'RJ',
  natal: 'RN',
  'porto alegre': 'RS',
  'porto velho': 'RO',
  'boa vista': 'RR',
  florianopolis: 'SC',
  'sao paulo': 'SP',
  aracaju: 'SE',
  palmas: 'TO',

  // Grafias alternativas comuns
  'sao luiz': 'MA',
  floripa: 'SC',

  // Estados
  acre: 'AC',
  alagoas: 'AL',
  amapa: 'AP',
  amazonas: 'AM',
  bahia: 'BA',
  ceara: 'CE',
  'distrito federal': 'DF',
  'espirito santo': 'ES',
  goias: 'GO',
  maranhao: 'MA',
  'mato grosso': 'MT',
  'mato grosso do sul': 'MS',
  'minas gerais': 'MG',
  para: 'PA',
  paraiba: 'PB',
  parana: 'PR',
  pernambuco: 'PE',
  piaui: 'PI',
  'rio grande do norte': 'RN',
  'rio grande do sul': 'RS',
  rondonia: 'RO',
  roraima: 'RR',
  'santa catarina': 'SC',
  sergipe: 'SE',
  tocantins: 'TO',
};

const normalize = (value) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');

export const findUf = (value) =>
  typeof value === 'string' && value ? CITY_TO_UF[normalize(value)] : undefined;
