import { test, expect } from '@playwright/test';
import { TodoPage } from './pages/todo-page';

test('add hello todo item', async ({ page }) => {
  const todo = new TodoPage(page);
  await todo.goto();

  await todo.addTodo('hello');

  await expect(todo.todoItem('hello')).toBeVisible();
});

test('add hello and second todos, complete hello, verify completed tab', async ({ page }) => {
  const todo = new TodoPage(page);
  await todo.goto();

  await todo.addTodo('hello');
  await todo.addTodo('second');
  await todo.completeTodo('hello');
  await todo.filterByCompleted();

  await expect(todo.todoItems()).toHaveCount(1);
  await expect(todo.todoItem('hello')).toBeVisible();
  await expect(todo.todoItem('second')).toHaveCount(0);
});
