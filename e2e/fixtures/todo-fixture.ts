import { test as base } from '@playwright/test';
import { TodoPage } from '../pages/todo-page';

type TodoFixtures = {
  todo: TodoPage;
};

export const test = base.extend<TodoFixtures>({
  todo: async ({ page }, use) => {
    const todoPage = new TodoPage(page);
    await use(todoPage);
  },
});

export { expect } from '@playwright/test';
