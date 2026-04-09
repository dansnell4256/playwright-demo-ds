export const TODO_ITEMS = {
  FIRST: 'buy some cheese',
  SECOND: 'feed the cat',
  THIRD: 'book a doctors appointment',
} as const;

export const DEFAULT_TODOS = [
  TODO_ITEMS.FIRST,
  TODO_ITEMS.SECOND,
  TODO_ITEMS.THIRD,
] as const;
