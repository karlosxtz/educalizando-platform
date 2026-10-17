# Carregamento das imagens do painel — 14/10/2026

- Capas dos três produtos mais recentes da loja afetada e logo foram consultadas na API pública: arquivos existentes e HTTP 200 image/webp. Capas da homepage e rota de catálogo também responderam 200.
- Painel de Produtos, revisão de SEO, editor de IA e logo superior da navegação usavam links diretos/legados que redirecionavam o navegador ao MinIO. Agora renderizam CatalogImage, usando a mesma rota de catálogo do avatar que já carregava.
- Nova tentativa automática única em caso de erro, com parâmetro estritamente permitido image_retry=1. Chave de cache continua independente desse parâmetro; outros parâmetros e caminhos privados permanecem rejeitados.
- Sem alterar URLs no banco, substituir capas ou modificar arquivos privados. Aviso legível após falha persistente, em vez de ícone de imagem quebrada.
- Testes: cache, bytes preservados, não encaminhar credenciais, proteção de arquivos privados, nova tentativa limitada e reaproveitamento do cache; IA/SEO, TypeScript, ESLint e tamanho.
- Limite: a consulta pelo servidor não reproduz o navegador/rede original do usuário; a origem exata da falha local não foi confirmada. A correção remove a dependência direta de DNS/acesso ao MinIO no navegador nesses componentes.
