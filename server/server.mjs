// Сервер без зависимостей (нужен только Node.js 18+).
// Запуск: node server/server.mjs   (пароль учителя: TEACHER_PASSWORD, порт: PORT)
import http from 'node:http';
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import checker from './checker.cjs';

const { checkAnswer } = checker;
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const DATA = path.resolve(process.env.DATA_DIR || path.join(ROOT, '..', 'data'));
const IMG = path.join(DATA, 'img');
const DB = path.join(DATA, 'tasks.json');
const INDEX = path.join(ROOT, '..', 'dist', 'index.html');
const PASSWORD = process.env.TEACHER_PASSWORD || 'teacher';
const MAX_BODY = 25 * 1024 * 1024;
const MAX_IMAGE = 6 * 1024 * 1024;
const EXT = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp' };
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
const tokens = new Set();

class HttpError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

await mkdir(IMG, { recursive: true });
let tasks = existsSync(DB) ? JSON.parse(await readFile(DB, 'utf8')) : [];

let chain = Promise.resolve();
const save = () =>
  (chain = chain.then(async () => {
    const tmp = DB + '.tmp';
    await writeFile(tmp, JSON.stringify(tasks, null, 2));
    await rename(tmp, DB);
  }));

const sha = (s) => createHash('sha256').update(String(s)).digest();
const passOk = (p) => timingSafeEqual(sha(p), sha(PASSWORD));
const url = (name) => (name ? `img/${name}` : undefined);
const pub = (t) => ({ id: t.id, title: t.title, image: url(t.image) });
const full = (t) => ({
  id: t.id,
  title: t.title,
  answer: t.answer,
  explanation: t.explanation,
  image: url(t.image),
  explanationImage: url(t.explanationImage),
});

function json(res, code, body) {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let tooBig = false;
    req.on('data', (c) => {
      if (tooBig) return;
      size += c.length;
      if (size > MAX_BODY) {
        tooBig = true;
        chunks.length = 0;
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => (tooBig ? reject(new HttpError(413, 'Слишком большой запрос.')) : resolve(Buffer.concat(chunks).toString('utf8'))));
    req.on('error', reject);
  });
}

async function readJson(req) {
  const text = await readBody(req);
  try {
    return JSON.parse(text || '{}');
  } catch {
    throw new HttpError(400, 'Неверный JSON.');
  }
}

function requireAuth(req) {
  const m = /^Bearer (.+)$/.exec(req.headers.authorization || '');
  if (!m || !tokens.has(m[1])) throw new HttpError(401, 'Войдите заново.');
}

async function saveImage(dataUrl) {
  if (!dataUrl) return undefined;
  const m = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl));
  if (!m) throw new HttpError(400, 'Нужна картинка PNG, JPG или WebP.');
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > MAX_IMAGE) throw new HttpError(400, 'Картинка слишком большая.');
  const name = randomUUID() + EXT[m[1]];
  await writeFile(path.join(IMG, name), buf);
  return name;
}

async function handle(req, res) {
  const u = new URL(req.url, 'http://localhost');
  const p = u.pathname;
  const method = req.method;

  if (method === 'GET' && (p === '/' || p === '/index.html')) {
    let html;
    try {
      html = await readFile(INDEX);
    } catch {
      throw new HttpError(503, 'Нет dist/index.html — выполните npm run build.');
    }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    return res.end(html);
  }

  if (method === 'GET' && p.startsWith('/img/')) {
    const name = p.slice(5);
    if (!/^[\w-]+\.(png|jpg|webp)$/.test(name)) throw new HttpError(404, 'Не найдено.');
    let buf;
    try {
      buf = await readFile(path.join(IMG, name));
    } catch {
      throw new HttpError(404, 'Не найдено.');
    }
    res.writeHead(200, { 'content-type': MIME[path.extname(name)], 'cache-control': 'public, max-age=31536000, immutable' });
    return res.end(buf);
  }

  if (method === 'GET' && p === '/api/ping') return json(res, 200, { server: true });

  if (method === 'GET' && p === '/api/random') {
    if (!tasks.length) return json(res, 200, { task: null, cycled: false });
    const exclude = new Set((u.searchParams.get('exclude') || '').split(',').filter(Boolean));
    let pool = tasks.filter((t) => !exclude.has(t.id));
    const cycled = !pool.length;
    if (cycled) pool = tasks;
    return json(res, 200, { task: pub(pool[Math.floor(Math.random() * pool.length)]), cycled });
  }

  if (method === 'POST' && p === '/api/check') {
    const b = await readJson(req);
    const t = tasks.find((x) => x.id === b.id);
    if (!t) throw new HttpError(404, 'Задание не найдено.');
    return json(res, 200, {
      ok: checkAnswer(String(b.answer ?? ''), t.answer),
      answer: t.answer,
      explanation: t.explanation,
      explanationImage: url(t.explanationImage),
    });
  }

  if (method === 'POST' && p === '/api/login') {
    const b = await readJson(req);
    if (!passOk(b.password ?? '')) {
      await new Promise((r) => setTimeout(r, 500));
      throw new HttpError(401, 'Неверный пароль.');
    }
    const token = randomUUID();
    tokens.add(token);
    return json(res, 200, { token });
  }

  if (p.startsWith('/api/admin/')) {
    requireAuth(req);
    if (method === 'GET' && p === '/api/admin/tasks') return json(res, 200, tasks.map(full));

    if (method === 'POST' && p === '/api/admin/tasks') {
      const b = await readJson(req);
      const title = String(b.title ?? '').trim();
      const answer = String(b.answer ?? '').trim();
      if (!answer || (!title && !b.image)) throw new HttpError(400, 'Нужны условие (картинка или текст) и ответ.');
      const image = await saveImage(b.image);
      const explanationImage = await saveImage(b.explanationImage);
      const task = { id: randomUUID(), title, answer, explanation: String(b.explanation ?? '').trim(), image, explanationImage };
      tasks.push(task);
      await save();
      return json(res, 200, full(task));
    }

    const m = /^\/api\/admin\/tasks\/([\w-]+)$/.exec(p);
    if (method === 'DELETE' && m) {
      const t = tasks.find((x) => x.id === m[1]);
      if (!t) throw new HttpError(404, 'Задание не найдено.');
      tasks = tasks.filter((x) => x !== t);
      await save();
      for (const f of [t.image, t.explanationImage]) if (f) await unlink(path.join(IMG, f)).catch(() => {});
      return json(res, 200, { ok: true });
    }
  }

  throw new HttpError(404, 'Не найдено.');
}

http
  .createServer(async (req, res) => {
    try {
      await handle(req, res);
    } catch (e) {
      if (e instanceof HttpError) return json(res, e.code, { error: e.message });
      console.error(e);
      json(res, 500, { error: 'Ошибка сервера.' });
    }
  })
  .listen(PORT, () => {
    console.log(`Сайт запущен: http://localhost:${PORT}`);
    console.log(`Данные: ${DATA}`);
    if (!process.env.TEACHER_PASSWORD) {
      console.log('ВНИМАНИЕ: пароль учителя по умолчанию «teacher». Задайте свой: TEACHER_PASSWORD=ваш_пароль node server/server.mjs');
    }
  });
