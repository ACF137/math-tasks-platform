import { derivative, evaluate, format, simplify } from 'mathjs';
import type { Solution } from './types';

const fmt = (n: unknown): string => format(n as number, { precision: 10 });

export function solveExpression(expr: string): Solution {
  const query = expr.trim();
  if (!query) throw new Error('Введите выражение.');
  return { query, result: fmt(evaluate(query)), steps: [] };
}

export function solveQuadratic(a: number, b: number, c: number): Solution {
  if ([a, b, c].some(Number.isNaN)) throw new Error('Заполните a, b и c числами.');
  const query = `${a}x² + ${b}x + ${c} = 0`;

  if (a === 0) {
    if (b === 0) throw new Error('При a = 0 и b = 0 в уравнении нет переменной.');
    return { query, result: `x = ${fmt(-c / b)}`, steps: ['a = 0, уравнение линейное: x = −c / b'] };
  }

  const d = b * b - 4 * a * c;
  const steps = [`Дискриминант D = b² − 4ac = ${fmt(d)}`];

  if (d > 0) {
    const s = Math.sqrt(d);
    steps.push('D > 0: два корня, x = (−b ± √D) / 2a');
    return { query, result: `x₁ = ${fmt((-b + s) / (2 * a))}, x₂ = ${fmt((-b - s) / (2 * a))}`, steps };
  }
  if (d === 0) {
    steps.push('D = 0: один корень, x = −b / 2a');
    return { query, result: `x = ${fmt(-b / (2 * a))}`, steps };
  }
  steps.push('D < 0: действительных корней нет, есть комплексные');
  return {
    query,
    result: `x = ${fmt(-b / (2 * a))} ± ${fmt(Math.sqrt(-d) / (2 * a))}i`,
    steps,
  };
}

export function solveDerivative(f: string, variable: string): Solution {
  const fn = f.trim();
  const v = variable.trim() || 'x';
  if (!fn) throw new Error('Введите функцию.');
  const result = simplify(derivative(fn, v)).toString();
  return { query: `d/d${v} [ ${fn} ]`, result, steps: [] };
}
