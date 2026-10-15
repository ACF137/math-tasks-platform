import { ADMIN_PIN } from './config';
import { checkAnswer } from './checker';
import { loadTasks, newId, saveTasks } from './storage';
import type { Task } from './types';

export interface PublicTask {
  id: string;
  title: string;
  image?: string;
}
export interface Verdict {
  ok: boolean;
  answer: string;
  explanation: string;
  explanationImage?: string;
}
export type NewTask = Omit<Task, 'id'>;

export interface Api {
  mode: 'server' | 'local';
  random(exclude: string[]): Promise<{ task: PublicTask | null; cycled: boolean }>;
  check(id: string, answer: string): Promise<Verdict>;
  login(password: string): Promise<boolean>;
  list(): Promise<Task[]>;
  add(task: NewTask): Promise<void>;
  remove(id: string): Promise<void>;
}

export class AuthError extends Error {}


const FULL = 'Не хватило места в браузере: уменьшите картинки или удалите часть заданий.';

const localApi: Api = {
  mode: 'local',
  async random(exclude) {
    const all = loadTasks();
    if (!all.length) return { task: null, cycled: false };
    let pool = all.filter((t) => !exclude.includes(t.id));
    const cycled = !pool.length;
    if (cycled) pool = all;
    const t = pool[Math.floor(Math.random() * pool.length)];
    return { task: { id: t.id, title: t.title, image: t.image }, cycled };
  },
  async check(id, answer) {
    const t = loadTasks().find((x) => x.id === id);
    if (!t) throw new Error('Задание не найдено.');
    return { ok: checkAnswer(answer, t.answer), answer: t.answer, explanation: t.explanation, explanationImage: t.explanationImage };
  },
  async login(password) {
    return password === ADMIN_PIN;
  },
  async list() {
    return loadTasks();
  },
  async add(task) {
    if (!saveTasks([...loadTasks(), { id: newId(), ...task }])) throw new Error(FULL);
  },
  async remove(id) {
    saveTasks(loadTasks().filter((t) => t.id !== id));
  },
};

const TOKEN_KEY = 'math-solver:token';
let token = '';
try {
  token = sessionStorage.getItem(TOKEN_KEY) ?? '';
} catch {

}

async function req<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (token) headers.authorization = `Bearer ${token}`;
  let r: Response;
  try {
    r = await fetch(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new Error('Нет связи с сервером.');
  }
  const data = (await r.json().catch(() => ({}))) as { error?: string };
  if (r.status === 401) throw new AuthError(data.error ?? 'Войдите заново.');
  if (!r.ok) throw new Error(data.error ?? `Ошибка ${r.status}`);
  return data as T;
}

const serverApi: Api = {
  mode: 'server',
  random: (exclude) => req(`api/random?exclude=${encodeURIComponent(exclude.join(','))}`),
  check: (id, answer) => req('api/check', 'POST', { id, answer }),
  async login(password) {
    try {
      const { token: t } = await req<{ token: string }>('api/login', 'POST', { password });
      token = t;
      try {
        sessionStorage.setItem(TOKEN_KEY, t);
      } catch {
      }
      return true;
    } catch (e) {
      if (e instanceof AuthError) return false;
      throw e;
    }
  },
  list: () => req('api/admin/tasks'),
  async add(task) {
    await req('api/admin/tasks', 'POST', task);
  },
  async remove(id) {
    await req(`api/admin/tasks/${encodeURIComponent(id)}`, 'DELETE');
  },
};

export async function createApi(): Promise<Api> {
  if (location.protocol.startsWith('http')) {
    try {
      const r = await fetch('api/ping');
      const d = (await r.json()) as { server?: boolean };
      if (d.server === true) return serverApi;
    } catch {
    }
  }
  return localApi;
}
