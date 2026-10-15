import type { Api, PublicTask, Verdict } from './api';
import { el, h } from './ui';

export function initStudent(api: Api): { show(): void } {
  const box = el('task-box');
  const stats = el('stats');
  let seen: string[] = [];
  let right = 0;
  let total = 0;
  let started = false;
  let empty = false;

  const say = (text: string, cls = 'empty'): void => box.replaceChildren(h('p', { class: cls }, text));

  function solutionBlock(v: Verdict): HTMLElement {
    const block = h('div', { class: 'explain' }, h('div', { class: 'res-line' }, `Правильный ответ: ${v.answer}`));
    if (v.explanation || v.explanationImage) {
      block.append(h('div', { class: 'res-line' }, 'Как решается:'));
      if (v.explanation) block.append(h('div', {}, v.explanation));
      if (v.explanationImage) block.append(h('img', { class: 'pic', src: v.explanationImage, alt: 'Решение' }));
    }
    return block;
  }

  function render(task: PublicTask): void {
    const input = h('input', { placeholder: 'Ваш ответ', autocomplete: 'off', 'aria-label': 'Ваш ответ' });
    const hint = h('p', { class: 'hint' }, 'Дроби можно писать как 1/2. Несколько ответов — через «;».');
    const verdict = h('div', { class: 'verdict', role: 'status' });
    const answerBtn = h('button', { class: 'go' }, 'Ответить');
    const nextBtn = h('button', { class: 'go' }, 'Следующее задание');
    const showSol = h('button', { class: 'ghost' }, 'Показать решение');
    nextBtn.hidden = showSol.hidden = true;
    let solution: HTMLElement | null = null;
    let done = false;

    const submit = async (): Promise<void> => {
      if (done) return;
      const value = input.value.trim();
      if (!value) {
        verdict.className = 'verdict bad';
        verdict.textContent = 'Введите ответ.';
        return;
      }
      answerBtn.disabled = true;
      try {
        const v = await api.check(task.id, value);
        done = true;
        total += 1;
        if (v.ok) right += 1;
        stats.textContent = `Верно: ${right} из ${total}`;
        input.disabled = true;
        answerBtn.hidden = true;
        nextBtn.hidden = false;
        solution = solutionBlock(v);
        verdict.className = `verdict ${v.ok ? 'ok' : 'bad'}`;
        verdict.textContent = v.ok ? 'Верно!' : 'Неверно.';
        if (v.ok) {
          solution.hidden = true;
          showSol.hidden = !(v.explanation || v.explanationImage);
        }
        box.append(solution);
        nextBtn.focus();
      } catch (e) {
        answerBtn.disabled = false;
        verdict.className = 'verdict bad';
        verdict.textContent = e instanceof Error ? e.message : 'Не удалось проверить ответ.';
      }
    };

    answerBtn.addEventListener('click', () => void submit());
    input.addEventListener('keydown', (e) => e.key === 'Enter' && void submit());
    nextBtn.addEventListener('click', () => void next());
    showSol.addEventListener('click', () => solution && (solution.hidden = !solution.hidden));

    const card = h('article', { class: 'task' });
    if (task.title) card.append(h('p', { class: 'task-title' }, task.title));
    if (task.image) card.append(h('img', { class: 'pic', src: task.image, alt: 'Условие задания' }));
    card.append(h('div', { class: 'task-row' }, input, answerBtn, nextBtn, showSol), hint, verdict);
    box.replaceChildren(card);
    input.focus();
  }

  async function next(): Promise<void> {
    say('Загружаю задание…');
    try {
      const { task, cycled } = await api.random(seen);
      empty = !task;
      if (!task) return say('Заданий пока нет. Попросите учителя добавить их.');
      if (cycled) seen = [];
      seen.push(task.id);
      render(task);
    } catch (e) {
      say(e instanceof Error ? e.message : 'Не удалось загрузить задание.', 'err-text');
    }
  }

  return {
    show(): void {
      if (!started || empty) {
        started = true;
        void next();
      }
    },
  };
}
