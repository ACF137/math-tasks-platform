import { evaluate } from 'mathjs';

type Val = number | string;

const parts = (s: string): string[] =>
  s.split(';').map((p) => p.trim()).filter(Boolean);

function toVal(s: string): Val {
  const t = s.replace(/(\d),(\d)/g, '$1.$2');
  try {
    const v: unknown = evaluate(t);
    if (typeof v === 'number' && Number.isFinite(v)) return v;
  } catch {
  }
  return t.toLowerCase().replace(/\s+/g, ' ');
}

function same(a: Val, b: Val): boolean {
  if (typeof a === 'number' && typeof b === 'number') {
    return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
  }
  return a === b;
}


export function checkAnswer(user: string, correct: string): boolean {
  const u = parts(user).map(toVal);
  const c = parts(correct).map(toVal);
  if (!u.length || u.length !== c.length) return false;
  const used = new Set<number>();
  return c.every((cv) => {
    const i = u.findIndex((uv, idx) => !used.has(idx) && same(uv, cv));
    if (i === -1) return false;
    used.add(i);
    return true;
  });
}
