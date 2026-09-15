"""Gera a migration da BNCC a partir do dataset auditado bncc-dev/bncc-dados."""

from __future__ import annotations

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "tmp" / "bncc-dados"
CSV_DIR = SOURCE / "derivados" / "csv"
OUTPUT = ROOT / "supabase" / "migrations" / "20260915_import_complete_bncc.sql"


def sql(value: str | None) -> str:
    if not value:
        return "NULL"
    return "'" + value.replace("'", "''") + "'"


def collect_names(value: object, names: dict[str, str]) -> None:
    if isinstance(value, dict):
        item_id = value.get("id")
        item_name = value.get("nome")
        if isinstance(item_id, str) and isinstance(item_name, str):
            names[item_id] = item_name
        for child in value.values():
            collect_names(child, names)
    elif isinstance(value, list):
        for child in value:
            collect_names(child, names)


def load_rows(filename: str) -> list[dict[str, str]]:
    with (CSV_DIR / filename).open(encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


structure = json.loads((SOURCE / "dados" / "bncc-2018" / "estrutura.json").read_text(encoding="utf-8"))
names: dict[str, str] = {}
collect_names(structure, names)

for row in load_rows("componentes-curriculares.csv"):
    names[row["id"]] = row["nome"]

records: dict[str, tuple[str, str, str, str]] = {}

for row in load_rows("objetivos-ei.csv"):
    code = row["codigo"].strip()
    records[code] = (
        code.lower(),
        row["texto"].strip(),
        names.get(row["grupo_etario"], "Educação Infantil"),
        names.get(row["campo_experiencias"], "Educação Infantil"),
    )

for row in load_rows("habilidades-ef.csv"):
    code = row["codigo"].strip()
    years = row["anos"].strip()
    grade = f"{years.replace(' | ', ', ')}º ano(s) do Ensino Fundamental" if years else "Ensino Fundamental"
    records[code] = (
        code.lower(),
        row["texto"].strip(),
        grade,
        names.get(row["componente"], "Ensino Fundamental"),
    )

for row in load_rows("habilidades-em.csv"):
    code = row["codigo"].strip()
    subject = names.get(row["componente"]) or names.get(row["area"], "Ensino Médio")
    records[code] = (code.lower(), row["texto"].strip(), "Ensino Médio", subject)

for row in load_rows("computacao.csv"):
    code = row["codigo"].strip()
    stage = row["etapa"].strip()
    if stage == "EI":
        grade = names.get(row["grupo_etario"], "Educação Infantil")
    elif stage == "EF":
        years = row["anos"].strip()
        grade = f"{years.replace(' | ', ', ')}º ano(s) do Ensino Fundamental" if years else "Ensino Fundamental"
    else:
        grade = "Ensino Médio"
    eixo = names.get(row["eixo"], row["eixo"].replace("co-eixo-", "").replace("-", " ").title())
    records[code] = (code.lower(), row["texto"].strip(), grade, f"Computação — {eixo}")

values = []
for code, (slug, description, grade, subject) in sorted(records.items()):
    values.append(f"  ({sql(code)}, {sql(slug)}, {sql(description)}, {sql(grade)}, {sql(subject)})")

header = """-- Catálogo completo da BNCC para Educação Infantil, Ensino Fundamental e Ensino Médio,
-- acrescido do complemento de Computação à Educação Básica.
-- Fonte: https://github.com/bncc-dev/bncc-dados (versão 2026.07.1, CC BY 4.0),
-- com rastreabilidade aos documentos oficiais do MEC/CNE.
-- Esta migration pode ser executada novamente: códigos existentes são atualizados.

INSERT INTO public.bncc_skills (code, slug, description, grade_level, subject)
VALUES
"""
footer = """
ON CONFLICT (code) DO UPDATE SET
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  grade_level = EXCLUDED.grade_level,
  subject = EXCLUDED.subject;
"""
OUTPUT.write_text(header + ",\n".join(values) + footer, encoding="utf-8")
print(f"Gerados {len(records)} códigos em {OUTPUT}")
