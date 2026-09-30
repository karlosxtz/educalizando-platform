// Configurações globais da plataforma Educalizando

export const PLATFORM_CONFIG = {
  name: 'Educalizando',
  feePercent: 13,   // Compatibilidade: taxa PIX
  pixFeePercent: 13,
  cardFeePercent: 13, // taxa da plataforma; processamento do cartão é separado por parcela
  feeFixed: 0,      // Sem tarifa fixa adicional
  currencySymbol: 'R$',
  
  get feeFormatted() {
    return `${this.feePercent}% da plataforma; no cartão soma-se a taxa de processamento de 1x a 12x`;
  }
};
