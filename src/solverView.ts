import { solveDerivative, solveExpression, solveQuadratic } from './solvers';
import { el, h } from './ui';
import type { Mode, Solution } from './types';

const MODES: Mode[] = ['calc', 'quad', 'der'];
const MAX_HISTORY = 10;

export function initSolver(): void {
  let mode: Mode = 'calc';
  const history: Solution[] = [];
  const output = el<HTMLDivElement>('output');
  const historyList = el<HTMLUListElement>('history');
  const num = (id: string): number => parseFloat(el<HTMLInputElement>(id).value.replace(',', '.'));
  const text = (id: string): string => el<HTMLInputElement>(id).value;

  const solvers: Record<Mode, () => Solution> = {
    calc: () => solveExpression(text('expr')),
    quad: () => solveQuadratic(num('qa'), num('qb'), num('qc')),
    der: () => solveDerivative(text('fn'), text('variable')),
  };

  function setMode(next: Mode): void {
    mode = next;
    document.querySelectorAll<HTMLButtonElement>('.tabs button').forEach((b) => {
      b.setAttribute('aria-selected', String(b.dataset.mode === next));
    });
    MODES.forEach((m) => (el(`form-${m}`).hidden = m !== next));
    output.hidden = true;
  }

  function showResult(s: Solution): void {
    output.className = '';
    output.replaceChildren(h('div', {}, s.query), h('div', { class: 'res' }, s.result));
    if (s.steps.length) output.append(h('ol', {}, ...s.steps.map((st) => h('li', {}, st))));
    output.hidden = false;
  }

  function renderHistory(): void {
    historyList.replaceChildren();
    if (!history.length) {
      historyList.append(h('li', { class: 'empty' }, 'Здесь появятся ваши решения.'));
      return;
    }
    history.forEach((s) => historyList.append(h('li', {}, `${s.query} → `, h('b', {}, s.result))));
  }

  function solve(): void {
    try {
      const s = solvers[mode]();
      showResult(s);
      history.unshift(s);
      if (history.length > MAX_HISTORY) history.pop();
      renderHistory();
    } catch (e) {
      output.className = 'err';
      output.textContent = e instanceof Error ? e.message : 'Не удалось решить. Проверьте ввод.';
      output.hidden = false;
    }
  }

  document.querySelectorAll<HTMLButtonElement>('.tabs button').forEach((b) => {
    b.addEventListener('click', () => setMode(b.dataset.mode as Mode));
  });
  el('solve').addEventListener('click', solve);
  el('page-solver').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target instanceof HTMLInputElement) solve();
  });
  renderHistory();
}
