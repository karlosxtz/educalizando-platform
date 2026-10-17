/** Translate gateway text/HTML into an actionable message instead of JSON syntax errors. */
export async function readApiJson(response: Response) {
  try {
    const data = await response.json();
    if (!data || typeof data !== 'object') throw new Error('Invalid API response');
    return data;
  } catch {
    if (response.status === 413) throw new Error('O servidor recusou o tamanho do envio. Tente novamente com um arquivo menor.');
    if (response.status === 401) throw new Error('Sua sessão expirou. Entre novamente para continuar.');
    if (response.status === 429) throw new Error('Muitas tentativas. Aguarde um pouco e tente novamente.');
    if (response.status >= 500) throw new Error('A plataforma está temporariamente indisponível. Seus dados preenchidos foram mantidos; tente novamente.');
    throw new Error('A plataforma retornou uma resposta inesperada. Tente novamente.');
  }
}
