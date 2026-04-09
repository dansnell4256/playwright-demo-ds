import { test, expect } from './fixtures/todo-fixture';
import { TODO_ITEMS, DEFAULT_TODOS } from './helpers/test-data';

test.describe('Initial State', () => {
  test('should display an empty input field on page load', async ({ todo }) => {
    await todo.goto();
    await expect(todo.inputField()).toBeVisible();
    await expect(todo.inputField()).toHaveValue('');
  });

  test('should hide main section and footer when there are no todos', async ({ todo }) => {
    await todo.goto();
    await expect(todo.mainSection()).toBeHidden();
    await expect(todo.footerElement()).toBeHidden();
  });

  test('should focus the input field on page load', async ({ todo }) => {
    await todo.goto();
    await expect(todo.inputField()).toBeFocused();
  });
});

test.describe('Adding Todo Items', () => {
  test('should add a single todo', async ({ todo }) => {
    await todo.goto();
    await todo.addTodo(TODO_ITEMS.FIRST);
    await expect(todo.todoItems()).toHaveCount(1);
    await expect(todo.todoItem(TODO_ITEMS.FIRST)).toBeVisible();
  });

  test('should add multiple todos', async ({ todo }) => {
    await todo.goto();
    await todo.addTodos(DEFAULT_TODOS);
    await expect(todo.todoItems()).toHaveCount(3);
    await expect(todo.todoItem(TODO_ITEMS.FIRST)).toBeVisible();
    await expect(todo.todoItem(TODO_ITEMS.SECOND)).toBeVisible();
    await expect(todo.todoItem(TODO_ITEMS.THIRD)).toBeVisible();
  });

  test('should clear the input field after adding a todo', async ({ todo }) => {
    await todo.goto();
    await todo.addTodo(TODO_ITEMS.FIRST);
    await expect(todo.inputField()).toHaveValue('');
  });

  test('should trim whitespace from todo text', async ({ todo }) => {
    await todo.goto();
    await todo.addTodo('   trimmed todo   ');
    await expect(todo.todoItem('trimmed todo')).toBeVisible();
    await expect(todo.todoItems()).toHaveCount(1);
  });

  test('should not add an empty todo', async ({ todo }) => {
    await todo.goto();
    await todo.fillNewTodoInput('');
    await todo.pressKeyInNewTodoInput('Enter');
    await expect(todo.todoItems()).toHaveCount(0);
  });

  test('should retain input value when clicking outside without pressing Enter', async ({ todo }) => {
    await todo.goto();
    await todo.fillNewTodoInput('pending todo');
    await todo.clickOutsideInput();
    await expect(todo.inputField()).toHaveValue('pending todo');
    await expect(todo.todoItems()).toHaveCount(0);
  });

  test('should add a todo while Active filter is selected', async ({ todo }) => {
    await todo.goto();
    await todo.addTodo(TODO_ITEMS.FIRST);
    await todo.filterByActive();
    await todo.addTodo(TODO_ITEMS.SECOND);
    await expect(todo.todoItems()).toHaveCount(2);
    await expect(todo.todoItem(TODO_ITEMS.SECOND)).toBeVisible();
  });

  test('should show main section and footer after adding a todo', async ({ todo }) => {
    await todo.goto();
    await todo.addTodo(TODO_ITEMS.FIRST);
    await expect(todo.mainSection()).toBeVisible();
    await expect(todo.footerElement()).toBeVisible();
  });
});

test.describe('Completing Todos', () => {
  test('should mark a single todo as complete', async ({ todo }) => {
    await todo.goto();
    await todo.addTodo(TODO_ITEMS.FIRST);
    await todo.completeTodo(TODO_ITEMS.FIRST);
    await expect(todo.todoItem(TODO_ITEMS.FIRST)).toHaveClass(/completed/);
  });

  test('should unmark a completed todo', async ({ todo }) => {
    await todo.goto();
    await todo.addTodo(TODO_ITEMS.FIRST);
    await todo.completeTodo(TODO_ITEMS.FIRST);
    await expect(todo.todoItem(TODO_ITEMS.FIRST)).toHaveClass(/completed/);
    await todo.todoItemCheckbox(TODO_ITEMS.FIRST).uncheck();
    await expect(todo.todoItem(TODO_ITEMS.FIRST)).not.toHaveClass(/completed/);
  });

  test('should mark all todos complete individually and toggle-all becomes checked', async ({ todo }) => {
    await todo.goto();
    await todo.addTodos(DEFAULT_TODOS);
    for (const item of DEFAULT_TODOS) {
      await todo.completeTodo(item);
    }
    for (const item of DEFAULT_TODOS) {
      await expect(todo.todoItem(item)).toHaveClass(/completed/);
    }
    await expect(todo.toggleAllCheckbox()).toBeChecked();
  });

  test('should toggle a todo rapidly without errors', async ({ todo }) => {
    await todo.goto();
    await todo.addTodo(TODO_ITEMS.FIRST);
    const checkbox = todo.todoItemCheckbox(TODO_ITEMS.FIRST);
    for (let i = 0; i < 10; i++) {
      await checkbox.click();
    }
    // After 10 clicks (even number), checkbox should be unchecked
    await expect(checkbox).not.toBeChecked();
    await expect(todo.todoItem(TODO_ITEMS.FIRST)).not.toHaveClass(/completed/);
  });

  test('should toggle all todos to complete', async ({ todo }) => {
    await todo.goto();
    await todo.addTodos(DEFAULT_TODOS);
    await todo.toggleAll();
    for (const item of DEFAULT_TODOS) {
      await expect(todo.todoItem(item)).toHaveClass(/completed/);
    }
    await expect(todo.toggleAllCheckbox()).toBeChecked();
  });

  test('should toggle all todos to incomplete', async ({ todo }) => {
    await todo.goto();
    await todo.addTodos(DEFAULT_TODOS);
    await todo.toggleAll();
    await todo.toggleAll();
    for (const item of DEFAULT_TODOS) {
      await expect(todo.todoItem(item)).not.toHaveClass(/completed/);
    }
    await expect(todo.toggleAllCheckbox()).not.toBeChecked();
  });
});

test.describe('Deleting Todos', () => {
  test('should delete a todo', async ({ todo }) => {
    await todo.goto();
    await todo.addTodos(DEFAULT_TODOS);
    await todo.deleteTodo(TODO_ITEMS.SECOND);
    await expect(todo.todoItems()).toHaveCount(2);
    await expect(todo.todoItem(TODO_ITEMS.SECOND)).toBeHidden();
  });

  test('should hide main section and footer when the last todo is deleted', async ({ todo }) => {
    await todo.goto();
    await todo.addTodo(TODO_ITEMS.FIRST);
    await todo.deleteTodo(TODO_ITEMS.FIRST);
    await expect(todo.todoItems()).toHaveCount(0);
    await expect(todo.mainSection()).toBeHidden();
    await expect(todo.footerElement()).toBeHidden();
  });
});

test.describe('Editing Todos', () => {
  test('should enter edit mode on double-click', async ({ todo }) => {
    await todo.goto();
    await todo.addTodo(TODO_ITEMS.FIRST);
    await todo.enterEditMode(TODO_ITEMS.FIRST);
    await expect(todo.todoItem(TODO_ITEMS.FIRST)).toHaveClass(/editing/);
    await expect(todo.editInputField()).toBeVisible();
    await expect(todo.editInputField()).toHaveValue(TODO_ITEMS.FIRST);
  });

  test('should save edited todo on Enter', async ({ todo }) => {
    await todo.goto();
    await todo.addTodo(TODO_ITEMS.FIRST);
    await todo.editTodoAndSave(TODO_ITEMS.FIRST, 'edited todo');
    await expect(todo.todoItem('edited todo')).toBeVisible();
    await expect(todo.todoItems()).toHaveCount(1);
  });

  test('should save edited todo on blur', async ({ todo }) => {
    await todo.goto();
    await todo.addTodo(TODO_ITEMS.FIRST);
    await todo.enterEditMode(TODO_ITEMS.FIRST);
    await todo.editInputField().fill('blur saved todo');
    await todo.clickOutsideInput();
    await expect(todo.todoItem('blur saved todo')).toBeVisible();
    await expect(todo.todoItems()).toHaveCount(1);
  });

  test('should cancel edit on Escape', async ({ todo }) => {
    await todo.goto();
    await todo.addTodo(TODO_ITEMS.FIRST);
    await todo.editTodoAndCancel(TODO_ITEMS.FIRST, 'cancelled edit');
    await expect(todo.todoItem(TODO_ITEMS.FIRST)).toBeVisible();
    await expect(todo.todoItems()).toHaveCount(1);
  });

  test('should remove todo when saving with empty or whitespace-only text', async ({ todo }) => {
    await todo.goto();
    await todo.addTodos([TODO_ITEMS.FIRST, TODO_ITEMS.SECOND]);

    await test.step('save with empty text removes todo', async () => {
      await todo.editTodoAndSave(TODO_ITEMS.FIRST, '');
      await expect(todo.todoItems()).toHaveCount(1);
      await expect(todo.todoItem(TODO_ITEMS.FIRST)).toBeHidden();
    });

    await test.step('save with whitespace-only text removes todo', async () => {
      await todo.editTodoAndSave(TODO_ITEMS.SECOND, '   ');
      await expect(todo.todoItems()).toHaveCount(0);
    });
  });

  test('should preserve todo order after editing', async ({ todo }) => {
    await todo.goto();
    await todo.addTodos(DEFAULT_TODOS);
    await todo.editTodoAndSave(TODO_ITEMS.SECOND, 'edited second');
    await expect(todo.nthTodoItem(0)).toContainText(TODO_ITEMS.FIRST);
    await expect(todo.nthTodoItem(1)).toContainText('edited second');
    await expect(todo.nthTodoItem(2)).toContainText(TODO_ITEMS.THIRD);
  });

  test('should trim edited todo text', async ({ todo }) => {
    await todo.goto();
    await todo.addTodo(TODO_ITEMS.FIRST);
    await todo.editTodoAndSave(TODO_ITEMS.FIRST, '   trimmed edit   ');
    await expect(todo.todoItem('trimmed edit')).toBeVisible();
    await expect(todo.todoItems()).toHaveCount(1);
  });
});

test.describe('Filtering', () => {
  test('should default to All filter', async ({ todo }) => {
    await todo.goto();
    await todo.addTodo(TODO_ITEMS.FIRST);
    await expect(todo.selectedFilterLink()).toHaveText('All');
  });

  test('should show all todos with All filter', async ({ todo }) => {
    await todo.goto();
    await todo.addTodos(DEFAULT_TODOS);
    await todo.completeTodo(TODO_ITEMS.FIRST);
    await todo.filterByAll();
    await expect(todo.todoItems()).toHaveCount(3);
  });

  test('should show only active todos with Active filter', async ({ todo }) => {
    await todo.goto();
    await todo.addTodos(DEFAULT_TODOS);
    await todo.completeTodo(TODO_ITEMS.FIRST);
    await todo.filterByActive();
    await expect(todo.todoItems()).toHaveCount(2);
    await expect(todo.todoItem(TODO_ITEMS.FIRST)).toBeHidden();
    await expect(todo.todoItem(TODO_ITEMS.SECOND)).toBeVisible();
    await expect(todo.todoItem(TODO_ITEMS.THIRD)).toBeVisible();
  });

  test('should show only completed todos with Completed filter', async ({ todo }) => {
    await todo.goto();
    await todo.addTodos(DEFAULT_TODOS);
    await todo.completeTodo(TODO_ITEMS.FIRST);
    await todo.filterByCompleted();
    await expect(todo.todoItems()).toHaveCount(1);
    await expect(todo.todoItem(TODO_ITEMS.FIRST)).toBeVisible();
  });

  test('should highlight the selected filter', async ({ todo }) => {
    await todo.goto();
    await todo.addTodo(TODO_ITEMS.FIRST);

    await todo.filterByActive();
    await expect(todo.selectedFilterLink()).toHaveText('Active');

    await todo.filterByCompleted();
    await expect(todo.selectedFilterLink()).toHaveText('Completed');

    await todo.filterByAll();
    await expect(todo.selectedFilterLink()).toHaveText('All');
  });

  test('should switch between filters correctly', async ({ todo }) => {
    await todo.goto();
    await todo.addTodos(DEFAULT_TODOS);
    await todo.completeTodo(TODO_ITEMS.FIRST);

    await todo.filterByActive();
    await expect(todo.todoItems()).toHaveCount(2);

    await todo.filterByCompleted();
    await expect(todo.todoItems()).toHaveCount(1);

    await todo.filterByAll();
    await expect(todo.todoItems()).toHaveCount(3);
  });
});

test.describe('Clear Completed', () => {
  test('should remove completed todos', async ({ todo }) => {
    await todo.goto();
    await todo.addTodos(DEFAULT_TODOS);
    await todo.completeTodo(TODO_ITEMS.FIRST);
    await todo.completeTodo(TODO_ITEMS.SECOND);
    await todo.clearCompleted();
    await expect(todo.todoItems()).toHaveCount(1);
    await expect(todo.todoItem(TODO_ITEMS.THIRD)).toBeVisible();
  });

  test('should hide Clear Completed button when no completed todos exist', async ({ todo }) => {
    await todo.goto();
    await todo.addTodo(TODO_ITEMS.FIRST);
    await expect(todo.clearCompletedButton()).toBeHidden();
    await todo.completeTodo(TODO_ITEMS.FIRST);
    await expect(todo.clearCompletedButton()).toBeVisible();
    await todo.clearCompleted();
    await expect(todo.clearCompletedButton()).toBeHidden();
  });

  test('should work correctly with Completed filter active', async ({ todo }) => {
    await todo.goto();
    await todo.addTodos(DEFAULT_TODOS);
    await todo.completeTodo(TODO_ITEMS.FIRST);
    await todo.filterByCompleted();
    await expect(todo.todoItems()).toHaveCount(1);
    await todo.clearCompleted();
    await expect(todo.todoItems()).toHaveCount(0);
    await todo.filterByAll();
    await expect(todo.todoItems()).toHaveCount(2);
  });
});

test.describe('Todo Counter', () => {
  test('should display the correct todo count', async ({ todo }) => {
    await todo.goto();
    await todo.addTodo(TODO_ITEMS.FIRST);
    await expect(todo.todoCount()).toContainText('1 item left');
    await todo.addTodo(TODO_ITEMS.SECOND);
    await expect(todo.todoCount()).toContainText('2 items left');
  });

  test('should update count when completing a todo', async ({ todo }) => {
    await todo.goto();
    await todo.addTodos(DEFAULT_TODOS);
    await expect(todo.todoCount()).toContainText('3 items left');
    await todo.completeTodo(TODO_ITEMS.FIRST);
    await expect(todo.todoCount()).toContainText('2 items left');
  });

  test('should update count when deleting a todo', async ({ todo }) => {
    await todo.goto();
    await todo.addTodos(DEFAULT_TODOS);
    await todo.deleteTodo(TODO_ITEMS.FIRST);
    await expect(todo.todoCount()).toContainText('2 items left');
  });

  test('should show correct count regardless of active filter', async ({ todo }) => {
    await todo.goto();
    await todo.addTodos(DEFAULT_TODOS);
    await todo.completeTodo(TODO_ITEMS.FIRST);
    await todo.filterByActive();
    await expect(todo.todoCount()).toContainText('2 items left');
    await todo.filterByCompleted();
    await expect(todo.todoCount()).toContainText('2 items left');
  });
});

test.describe('Persistence', () => {
  test('should persist todos after page reload', async ({ todo }) => {
    await todo.goto();
    await todo.addTodos(DEFAULT_TODOS);
    await todo.reload();
    await expect(todo.todoItems()).toHaveCount(3);
    for (const item of DEFAULT_TODOS) {
      await expect(todo.todoItem(item)).toBeVisible();
    }
  });

  test('should persist completed state after page reload', async ({ todo }) => {
    await todo.goto();
    await todo.addTodos(DEFAULT_TODOS);
    await todo.completeTodo(TODO_ITEMS.FIRST);
    await todo.reload();
    await expect(todo.todoItem(TODO_ITEMS.FIRST)).toHaveClass(/completed/);
    await expect(todo.todoItem(TODO_ITEMS.SECOND)).not.toHaveClass(/completed/);
    await expect(todo.todoItem(TODO_ITEMS.THIRD)).not.toHaveClass(/completed/);
  });

  test('should persist filter view after page reload', async ({ todo }) => {
    await todo.goto();
    await todo.addTodos(DEFAULT_TODOS);
    await todo.completeTodo(TODO_ITEMS.FIRST);
    await todo.filterByCompleted();
    await todo.reload();
    await expect(todo.todoItems()).toHaveCount(1);
    await expect(todo.todoItem(TODO_ITEMS.FIRST)).toBeVisible();
  });
});

test.describe('Keyboard Accessibility', () => {
  test('should allow tab navigation through interactive elements', async ({ todo, browserName }) => {
    test.skip(browserName === 'webkit', 'WebKit does not focus links via Tab by default');
    await todo.goto();
    await todo.addTodo(TODO_ITEMS.FIRST);

    // Input should be focused on page load
    await expect(todo.inputField()).toBeFocused();

    // Tab through the page interactive elements
    for (let i = 0; i < 6; i++) {
      await todo.pressTab();
    }

    // Verify filter links are keyboard-accessible and in sequential tab order
    await todo.allFilterLink().focus();
    await expect(todo.allFilterLink()).toBeFocused();

    await todo.pressTab();
    await expect(todo.activeFilterLink()).toBeFocused();

    await todo.pressTab();
    await expect(todo.completedFilterLink()).toBeFocused();
  });
});
