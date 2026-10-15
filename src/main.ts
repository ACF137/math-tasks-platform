import './style.css';
import { initAdmin } from './adminView';
import { createApi } from './api';
import { initSolver } from './solverView';
import { initStudent } from './studentView';
import { el } from './ui';
import type { Page } from './types';

const PAGES: Page[] = ['tasks', 'solver', 'admin'];

async function boot(): Promise<void> {
  const api = await createApi();

  initSolver();
  const student = initStudent(api);
  const admin = initAdmin(api);

  function showPage(page: Page): void {
    PAGES.forEach((p) => (el(`page-${p}`).hidden = p !== page));
    document.querySelectorAll<HTMLButtonElement>('.nav button').forEach((b) => {
      b.setAttribute('aria-selected', String(b.dataset.page === page));
    });
    if (page === 'tasks') student.show();
    if (page === 'admin') admin.refresh();
  }

  document.querySelectorAll<HTMLButtonElement>('.nav button').forEach((b) => {
    b.addEventListener('click', () => showPage(b.dataset.page as Page));
  });
  showPage('tasks');
}

void boot();
