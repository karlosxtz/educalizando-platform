# Governança do calendário escolar

As datas públicas ficam em `src/lib/school-calendar.ts`. Essa é a única fonte de apresentação do calendário nesta fase; não há tabela de datas nem relação data-produto no banco.

## Como adicionar uma data

1. Confirme dia, mês, classificação e fonte editorial confiável.
2. Verifique se o tema já existe em `SCHOOL_CALENDAR_TAGS`; adicionar uma tag altera apenas opções de cadastro e busca, não marca produtos existentes.
3. Inclua `slug` estável, `searchTerm`, `icon`, `sourceName`, `sourceUrl` quando disponível, `reviewedAt`, `editorialStatus` e `displayOrder`.
4. Use `requer-revisao` quando a data ainda depender de confirmação editorial. Não a classifique como feriado sem fonte normativa apropriada.
5. Não crie associação de produto manualmente aqui. A página usa exclusivamente `products.seasonal_tags` iguais ao `searchTerm` cadastrado pelo criador.
6. Execute TypeScript, testes públicos e build antes de publicar.

## Próxima evolução segura

Uma futura tabela de calendário só deve ser proposta após confirmar schema, RLS, ambiente de teste e responsável editorial. Uma relação `calendar_event_products` exigirá vínculo editorial explícito; busca textual não é associação suficiente.
