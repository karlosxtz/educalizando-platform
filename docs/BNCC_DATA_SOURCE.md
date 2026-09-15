# Fonte dos dados da BNCC

O catálogo de habilidades usado pela Educalizando foi importado do projeto aberto
[`bncc-dev/bncc-dados`](https://github.com/bncc-dev/bncc-dados), versão **2026.07.1**.
O conjunto mantém rastreabilidade aos documentos oficiais do MEC e do CNE e é
distribuído sob a licença **Creative Commons Attribution 4.0 (CC BY 4.0)**.

O catálogo importado reúne:

- objetivos de aprendizagem da Educação Infantil;
- habilidades do Ensino Fundamental;
- habilidades do Ensino Médio;
- complemento de Computação à Educação Básica.

O script `scripts/generate-bncc-migration.py` transforma os arquivos CSV da fonte
na migration do Supabase. A fonte clonada em `tmp/bncc-dados` é somente um insumo
local e não deve ser publicada junto com a aplicação.
