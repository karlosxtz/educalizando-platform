# Migrações do banco

`supabase/migrations` é a única pasta destinada a migrações automáticas.

## Histórico existente

As migrações até 1 de outubro de 2026 usam prefixos de data com oito dígitos e algumas compartilham o mesmo prefixo. Elas são um histórico já existente e não devem ser renomeadas depois de aplicadas, pois o Supabase registra a versão pelo nome do arquivo.

Os arquivos SQL diretamente dentro de `supabase/` são scripts manuais legados. Eles não fazem parte da sequência automática e não devem ser executados em lote.

## Regra para novas migrações

Toda nova migração deve usar um timestamp UTC exclusivo com 14 dígitos:

```text
YYYYMMDDHHMMSS_descricao_em_snake_case.sql
```

Exemplo: `20261002143000_add_club_renewal_status.sql`.

Nunca altere uma migração que já foi aplicada em produção. Crie uma nova migração corretiva e escreva operações idempotentes quando isso for possível.

Execute `npm run test:migrations` antes de enviar alterações. A verificação preserva o legado conhecido e bloqueia novos nomes ambíguos, timestamps repetidos e SQL solto adicional.
