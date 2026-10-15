import { AuthError, type Api } from './api';
import { readImage } from './image';
import { el, h } from './ui';

export function initAdmin(api: Api): { refresh(): void } {
  let unlocked = false;
  const pin = el<HTMLInputElement>('pin');
  const pinMsg = el('pin-msg');
  const msg = el('t-msg');
  const title = el<HTMLTextAreaElement>('t-title');
  const answer = el<HTMLInputElement>('t-answer');
  const expl = el<HTMLTextAreaElement>('t-expl');

  const say = (text: string): void => {
    msg.textContent = text;
  };
  const fail = (e: unknown): void => {
    if (e instanceof AuthError) {
      unlocked = false;
      apply();
      pinMsg.textContent = 'Сессия закончилась, войдите снова.';
    } else {
      say(e instanceof Error ? e.message : 'Что-то пошло не так.');
    }
  };

  async function renderList(): Promise<void> {
    const list = el('admin-list');
    try {
      const tasks = await api.list();
      el('t-count').textContent = String(tasks.length);
      list.replaceChildren();
      if (!tasks.length) list.append(h('li', { class: 'empty' }, 'Заданий нет.'));
      tasks.forEach((t) => {
        const del = h('button', { class: 'ghost danger' }, 'Удалить');
        del.addEventListener('click', async () => {
          if (!confirm('Удалить задание?')) return;
          try {
            await api.remove(t.id);
            await renderList();
          } catch (e) {
            fail(e);
          }
        });
        const info = h(
          'div',
          { class: 'grow' },
          h('strong', {}, t.title || '(условие — картинка)'),
          h('div', { class: 'hint' }, `Ответ: ${t.answer}${t.explanation || t.explanationImage ? ' · есть решение' : ''}`),
        );
        const row = h('li', { class: 'admin-item' });
        if (t.image) row.append(h('img', { class: 'thumb', src: t.image, alt: '' }));
        row.append(info, del);
        list.append(row);
      });
    } catch (e) {
      fail(e);
    }
  }

  function apply(): void {
    el('admin-lock').hidden = unlocked;
    el('admin-panel').hidden = !unlocked;
    if (unlocked) void renderList();
  }

  const unlock = async (): Promise<void> => {
    try {
      if (await api.login(pin.value)) {
        unlocked = true;
        pin.value = '';
        pinMsg.textContent = '';
        apply();
      } else {
        pinMsg.textContent = 'Неверный пароль.';
      }
    } catch (e) {
      pinMsg.textContent = e instanceof Error ? e.message : 'Не удалось войти.';
    }
  };
  el('pin-go').addEventListener('click', () => void unlock());
  pin.addEventListener('keydown', (e) => e.key === 'Enter' && void unlock());
  el('admin-exit').addEventListener('click', () => {
    unlocked = false;
    apply();
  });

  let taskImg: string | undefined;
  let explImg: string | undefined;
  const bindImage = (id: string, set: (v?: string) => void): HTMLInputElement => {
    const input = el<HTMLInputElement>(id);
    const prev = el<HTMLImageElement>(`${id}-prev`);
    input.addEventListener('change', async () => {
      const f = input.files?.[0];
      prev.hidden = true;
      if (!f) return set(undefined);
      try {
        const data = await readImage(f);
        set(data);
        prev.src = data;
        prev.hidden = false;
        say('');
      } catch (e) {
        set(undefined);
        input.value = '';
        say(e instanceof Error ? e.message : 'Не удалось загрузить картинку.');
      }
    });
    return input;
  };
  const imgInput = bindImage('t-img', (v) => (taskImg = v));
  const explImgInput = bindImage('t-expl-img', (v) => (explImg = v));

  el('t-add').addEventListener('click', async () => {
    if (!answer.value.trim() || (!title.value.trim() && !taskImg)) {
      say('Нужны условие (картинка или текст) и правильный ответ.');
      return;
    }
    try {
      await api.add({
        title: title.value.trim(),
        answer: answer.value.trim(),
        explanation: expl.value.trim(),
        image: taskImg,
        explanationImage: explImg,
      });
      title.value = answer.value = expl.value = imgInput.value = explImgInput.value = '';
      taskImg = explImg = undefined;
      el<HTMLImageElement>('t-img-prev').hidden = el<HTMLImageElement>('t-expl-img-prev').hidden = true;
      say('Задание добавлено в общий список.');
      await renderList();
    } catch (e) {
      fail(e);
    }
  });

  return { refresh: apply };
}
