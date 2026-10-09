export const RECOMMENDED_AGE_OPTIONS = Array.from({ length: 81 }, (_, age) => age);

function normalizeAges(ages: number[]) {
  return [...new Set(ages)]
    .filter((age) => Number.isInteger(age) && age >= 0 && age <= 80)
    .sort((first, second) => first - second);
}

export function formatRecommendedAges(ages: number[]) {
  const normalized = normalizeAges(ages);

  if (normalized.length === 0) return '';
  if (normalized.length === 1) {
    return `${normalized[0]} ${normalized[0] === 1 ? 'ano' : 'anos'}`;
  }

  const isContinuous = normalized.every((age, index) => index === 0 || age === normalized[index - 1] + 1);
  if (isContinuous) return `De ${normalized[0]} a ${normalized.at(-1)} anos`;

  const lastAge = normalized.at(-1);
  return `Idades: ${normalized.slice(0, -1).join(', ')} e ${lastAge} anos`;
}

export function parseRecommendedAges(value?: string | null) {
  if (!value) return [];

  const rangeMatch = value.match(/(?:de\s*)?(\d{1,2})\s*(?:a|até|-)\s*(\d{1,2})/i);
  if (rangeMatch) {
    const first = Number(rangeMatch[1]);
    const last = Number(rangeMatch[2]);
    const start = Math.min(first, last);
    const end = Math.max(first, last);

    if (start >= 0 && end <= 80) {
      return Array.from({ length: end - start + 1 }, (_, index) => start + index);
    }
  }

  return normalizeAges((value.match(/\d{1,2}/g) || []).map(Number));
}
