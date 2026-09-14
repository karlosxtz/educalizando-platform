// Configurações globais da plataforma Educalizando

export const PLATFORM_CONFIG = {
  name: 'Educalizando',
  feePercent: 13,   // 13% de taxa sobre cada venda
  feeFixed: 0,      // Sem tarifa fixa adicional
  currencySymbol: 'R$',
  
  get feeFormatted() {
    return `${this.feePercent}% por venda (sem tarifa fixa)`;
  }
};
