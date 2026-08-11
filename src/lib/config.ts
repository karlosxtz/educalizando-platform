// Configurações globais da plataforma Educalizando

export const PLATFORM_CONFIG = {
  name: 'Educalizando',
  feePercent: 0,   // 0% de comissão sobre vendas
  feeFixed: 0.99,  // Apenas R$ 0,99 fixo por produto vendido
  currencySymbol: 'R$',
  
  get feeFormatted() {
    return `R$ ${this.feeFixed.toFixed(2).replace('.', ',')} por produto (0% comissão)`;
  }
};
