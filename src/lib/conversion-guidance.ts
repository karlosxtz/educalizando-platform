export type ConversionRow={productId:string;title:string;slug:string|null;views:number;carts:number;checkouts:number;purchases:number};
export function conversionGuidance(row:ConversionRow){
  if(row.views>=10&&row.carts===0)return {priority:3,title:'Visitas sem adição ao carrinho registrada',evidence:`${row.views} sessões com visualização e nenhuma adição medida.`,action:'Confira se a capa carrega, mostre uma prévia e explique o conteúdo. Isso é uma hipótese de melhoria, não uma causa comprovada.',href:`/dashboard/produtos/novo?edit=${row.productId}`};
  if(row.carts>=5&&row.checkouts===0)return {priority:2,title:'Interesse no carrinho, sem início de checkout medido',evidence:`${row.carts} sessões com adição e nenhum checkout medido.`,action:'Teste no celular o caminho do carrinho até o checkout e confira a clareza do preço e da licença. Diferenças de consentimento ou sessão também podem afetar os números.',href:`/produto/${row.slug||row.productId}`};
  if(row.checkouts>=5&&row.purchases===0)return {priority:2,title:'Checkouts medidos sem compra paga no período',evidence:`${row.checkouts} sessões com checkout e nenhum pedido pago deste material no período.`,action:'Confira pedidos pendentes e o fluxo de compra em ambiente de teste. Não conclua que há falha no pagamento somente por estes indicadores.',href:'/dashboard/pedidos'};
  return null;
}
