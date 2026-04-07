import { type Page, type Locator } from '@playwright/test';

const URL = 'https://demo.playwright.dev/todomvc';
const LOCATORS = {
  input: { role: 'textbox' as const, name: 'What needs to be done?' },
  todoList: '.todo-list',
  todoItem: 'listitem' as const,
  toggleTodo: 'Toggle Todo',
  completedFilter: { role: 'link' as const, name: 'Completed' },
};

export class TodoPage {
  readonly page: Page;
  private readonly input: Locator;
  private readonly todoList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.input = page.getByRole(LOCATORS.input.role, { name: LOCATORS.input.name });
    this.todoList = page.locator(LOCATORS.todoList);
  }

  async goto() {
    await this.page.goto(URL);
  }

  async addTodo(text: string) {
    await this.input.fill(text);
    await this.input.press('Enter');
  }

  async completeTodo(text: string) {
    await this.todoList
      .getByRole(LOCATORS.todoItem)
      .filter({ hasText: text })
      .getByLabel(LOCATORS.toggleTodo)
      .click();
  }

  async filterByCompleted() {
    await this.page.getByRole(LOCATORS.completedFilter.role, { name: LOCATORS.completedFilter.name }).click();
  }

  todoItems(): Locator {
    return this.todoList.getByRole(LOCATORS.todoItem);
  }

  todoItem(text: string): Locator {
    return this.todoList.getByRole(LOCATORS.todoItem).filter({ hasText: text });
  }
}
