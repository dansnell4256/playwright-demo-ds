import { type Locator, type Page } from '@playwright/test';

const URL = 'https://demo.playwright.dev/todomvc';

const LOCATORS = {
  newTodoInput: { role: 'textbox' as const, name: 'What needs to be done?' },
  todoItems: '.todo-list li',
  todoItemLabel: 'label',
  editingItem: '.todo-list li.editing',
  toggleAllCheckbox: '.toggle-all',
  toggleAllLabel: 'label[for="toggle-all"]',
  destroyButton: 'button.destroy',
  editInput: '.edit',
  clearCompletedBtn: { role: 'button' as const, name: 'Clear completed' },
  footer: '.footer',
  todoCount: '.todo-count',
  allFilter: { role: 'link' as const, name: 'All' },
  activeFilter: { role: 'link' as const, name: 'Active' },
  completedFilter: { role: 'link' as const, name: 'Completed' },
  selectedFilter: '.selected',
  mainSection: '.main',
  heading: 'h1',
};

export class TodoPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // --- Navigation ---

  async goto(): Promise<void> {
    await this.page.goto(URL);
  }

  async reload(): Promise<void> {
    await this.page.reload({ waitUntil: 'load' });
  }

  // --- Locator Accessors ---

  inputField(): Locator {
    return this.page.getByRole(LOCATORS.newTodoInput.role, {
      name: LOCATORS.newTodoInput.name,
    });
  }

  todoItems(): Locator {
    return this.page.locator(LOCATORS.todoItems);
  }

  todoItem(text: string): Locator {
    return this.todoItems().filter({ hasText: text });
  }

  nthTodoItem(index: number): Locator {
    return this.todoItems().nth(index);
  }

  todoItemCheckbox(text: string): Locator {
    return this.todoItem(text).getByRole('checkbox');
  }

  toggleAllCheckbox(): Locator {
    return this.page.locator(LOCATORS.toggleAllCheckbox);
  }

  editInputField(): Locator {
    return this.page.locator(LOCATORS.editingItem).locator(LOCATORS.editInput);
  }

  clearCompletedButton(): Locator {
    return this.page.getByRole(LOCATORS.clearCompletedBtn.role, {
      name: LOCATORS.clearCompletedBtn.name,
    });
  }

  footerElement(): Locator {
    return this.page.locator(LOCATORS.footer);
  }

  todoCount(): Locator {
    return this.page.locator(LOCATORS.todoCount);
  }

  allFilterLink(): Locator {
    return this.page.getByRole(LOCATORS.allFilter.role, {
      name: LOCATORS.allFilter.name,
    });
  }

  activeFilterLink(): Locator {
    return this.page.getByRole(LOCATORS.activeFilter.role, {
      name: LOCATORS.activeFilter.name,
    });
  }

  completedFilterLink(): Locator {
    return this.page.getByRole(LOCATORS.completedFilter.role, {
      name: LOCATORS.completedFilter.name,
    });
  }

  selectedFilterLink(): Locator {
    return this.page.locator(LOCATORS.footer).locator(LOCATORS.selectedFilter);
  }

  mainSection(): Locator {
    return this.page.locator(LOCATORS.mainSection);
  }

  // --- Action Methods ---

  async addTodo(text: string): Promise<void> {
    await this.inputField().fill(text);
    await this.inputField().press('Enter');
  }

  async addTodos(texts: readonly string[]): Promise<void> {
    for (const text of texts) {
      await this.addTodo(text);
    }
  }

  async fillNewTodoInput(text: string): Promise<void> {
    await this.inputField().fill(text);
  }

  async pressKeyInNewTodoInput(key: string): Promise<void> {
    await this.inputField().press(key);
  }

  async clickOutsideInput(): Promise<void> {
    await this.page.locator(LOCATORS.heading).click();
  }

  async completeTodo(text: string): Promise<void> {
    await this.todoItemCheckbox(text).check();
  }

  async toggleAll(): Promise<void> {
    await this.page.locator(LOCATORS.toggleAllLabel).click();
  }

  async deleteTodo(text: string): Promise<void> {
    const item = this.todoItem(text);
    await item.hover();
    await item.locator(LOCATORS.destroyButton).click();
  }

  async enterEditMode(text: string): Promise<void> {
    await this.todoItem(text).locator(LOCATORS.todoItemLabel).dblclick();
  }

  async editTodoAndSave(text: string, newText: string): Promise<void> {
    await this.enterEditMode(text);
    const editInput = this.todoItem(text).locator(LOCATORS.editInput);
    await editInput.fill(newText);
    await editInput.press('Enter');
  }

  async editTodoAndCancel(text: string, typedText: string): Promise<void> {
    await this.enterEditMode(text);
    const editInput = this.todoItem(text).locator(LOCATORS.editInput);
    await editInput.fill(typedText);
    await editInput.press('Escape');
  }

  async clearCompleted(): Promise<void> {
    await this.clearCompletedButton().click();
  }

  async filterByAll(): Promise<void> {
    await this.allFilterLink().click();
  }

  async filterByActive(): Promise<void> {
    await this.activeFilterLink().click();
  }

  async filterByCompleted(): Promise<void> {
    await this.completedFilterLink().click();
  }

  async pressTab(): Promise<void> {
    await this.page.keyboard.press('Tab');
  }
}
