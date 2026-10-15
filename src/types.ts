export type Page = 'solver' | 'tasks' | 'admin';
export type Mode = 'calc' | 'quad' | 'der';

export interface Solution {
  query: string;
  result: string;
  steps: string[];
}

export interface Task {
  id: string;
  title: string;
  answer: string;
  explanation: string;
  image?: string;
  explanationImage?: string;
}
