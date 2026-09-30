// Configurações globais da plataforma Educalizando

export const PLATFORM_CONFIG = {
  name: 'Educalizando',
  feePercent: 13,   // Compatibilidade: taxa PIX
  pixFeePercent: 13,
  cardFeePercent: 18.99,
  feeFixed: 0,      // Sem tarifa fixa adicional
  currencySymbol: 'R$',
  
  get feeFormatted() {
    return `${this.pixFeePercent}% no PIX ou ${String(this.cardFeePercent).replace('.', ',')}% no cartão à vista`;
  }
};
