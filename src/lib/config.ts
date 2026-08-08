// Configurações globais da plataforma Educalizando

export const PLATFORM_CONFIG = {
  name: 'Educalizando',
  feePercent: 9.9, // Porcentagem da comissão por venda (ex: 9.9%)
  feeFixed: 1.00,  // Valor fixo por venda em Reais (ex: R$ 1,00)
  currencySymbol: 'R$',
  
  // Formatador auxiliar de exibição da taxa
  get feeFormatted() {
    return `${this.feePercent.toString().replace('.', ',')}% + R$ ${this.feeFixed.toFixed(2).replace('.', ',')}`;
  }
};
