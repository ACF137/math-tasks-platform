import seed from './seed-tasks.json';
import type { Task } from './types';

const KEY = 'math-solver:tasks';
let cache: Task[] | null = null;

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

const img = (v: unknown): string | undefined =>
  typeof v === 'string' && v.startsWith('data:image/') ? v : undefined;

export function parseTasks(data: unknown): Task[] {
  if (!Array.isArray(data)) throw new Error('Файл должен содержать список заданий.');
  return data.map((item, i) => {
    if (typeof item !== 'object' || item === null) throw new Error(`Задание ${i + 1}: неверный формат.`);
    const r = item as Record<string, unknown>;
    if (typeof r.title !== 'string' || typeof r.answer !== 'string') {
      throw new Error(`Задание ${i + 1}: нужны поля title и answer.`);
    }
    return {
      id: typeof r.id === 'string' ? r.id : newId(),
      title: r.title,
      answer: r.answer,
      explanation: typeof r.explanation === 'string' ? r.explanation : '',
      image: img(r.image),
      explanationImage: img(r.explanationImage),
    };
  });
}

export const builtinTasks = (): Task[] => parseTasks(seed);

export function loadTasks(): Task[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return (cache = parseTasks(JSON.parse(raw)));
  } catch {
  }
  return (cache = builtinTasks());
}

export function saveTasks(tasks: Task[]): boolean {
  cache = tasks;
  try {
    localStorage.setItem(KEY, JSON.stringify(tasks));
    return true;
  } catch {
    return false;
  }
}
