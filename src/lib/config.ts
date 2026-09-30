// Configurações globais da plataforma Educalizando

export const PLATFORM_CONFIG = {
  name: 'Educalizando',
  feePercent: 13,   // Compatibilidade: taxa PIX
  pixFeePercent: 13,
  cardFeePercent: 13, // o criador paga apenas a taxa da plataforma
  feeFixed: 0,      // Sem tarifa fixa adicional
  currencySymbol: 'R$',
  
  get feeFormatted() {
    return `${this.feePercent}% da plataforma; juros do cartão são pagos pelo cliente`;
  }
};
