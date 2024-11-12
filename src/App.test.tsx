import React from 'react';
import { render, fireEvent, screen} from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect'; 
import App from './App';
import { Todo } from './interface';


beforeEach(() => {
  const localStorageMock = (() => {
    let store: { [key: string]: string } = {};

    return {
      getItem(key: string) {
        return store[key] || null;
      },
      setItem(key: string, value: string) {
        store[key] = value;
      },
      clear() {
        store = {};
      },
      removeItem(key: string) {
        delete store[key];
      },
    };
  })();

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });
});

afterEach(() => {
  // I'm clearing localStorage in between tests
  window.localStorage.clear();
});

// I'm checking text in title, is correct
test('Test title is correct - app is available', () => {
  render(<App />);
  const title = screen.getByText(/Todo List/i);
  expect(title).toBeInTheDocument();
})

// I'm clicking on a Todo item which should toggle the checked state state
test('Toggling todo item changes its checked state - unchecked->checked', () => {
  render (<App />);
  let todoItem = screen.getByLabelText(/Buy groceries/i);

  // Unchecked at first
  expect(todoItem).not.toBeChecked();

  fireEvent.click(todoItem);
  todoItem = screen.getByLabelText(/Buy groceries/i);
  // Checked, expected
  expect(todoItem).toBeChecked();
  });

// I'm clicking on a Todo item which should toggle the unchecked state 
test('Toggling todo item changes its checked state - checked->unchecked', () => {
    render(<App />);
    const todoItem = screen.getByLabelText(/Ace CoderPad interview/i);

    // Unchecked at first
    expect(todoItem).toBeChecked();

    fireEvent.click(todoItem);

    // Checked, expected
    expect(todoItem).not.toBeChecked();
  });

// This is the Todo list state which should be saved / loaded from local storage
test('Loads todos from localStorage', () => {
    const todos = [
      { id: '1', label: 'Test 1', checked: false },
      { id: '2', label: 'Test 2', checked: true },
      { id: '3', label: 'Test 3', checked: true },
    ];

    window.localStorage.setItem('todos', JSON.stringify(todos));

    const { getByText } = render(<App />);

    // I'm checking if Todos loaded from localStorage
    const todoItem = getByText(/Test 3/i);
    expect(todoItem).toBeInTheDocument();
});


// When modification, the Todo list state should be saved onto local storage
test('Saves todos to localStorage when checked', () => {
  const todos = [
    { id: '1', label: 'Test 1', checked: false },
    { id: '2', label: 'Test 2', checked: true },
    { id: '3', label: 'Test 3', checked: true },
  ];

  window.localStorage.setItem('todos', JSON.stringify(todos));

  render(<App />);

  const todoItem = screen.getByLabelText(/Test 1/i);

  // Unchecked, at first
  expect(todoItem).not.toBeChecked();

  fireEvent.click(todoItem);

  // Checked, expected
  expect(todoItem).toBeChecked();

  const savedTodos = JSON.parse(window.localStorage.getItem('todos') || '[]');
  const changedTodo = savedTodos.find((todo: Todo) => todo.label === 'Test 1');

  expect(changedTodo).toBeDefined();
  expect(changedTodo.checked).toBe(true);
});

// When it comes to modification, the Todo list and should be saved to local storage
test('Saves todos to localStorage when new todo added', async () => {
  window.localStorage.clear();
  render(<App />);

  const input = screen.getByPlaceholderText('Add a new todo item here');
  fireEvent.change(input, { target: { value: 'New Todo Item' } });
  fireEvent.submit(input.closest('form')!);

  const newTodoItem = await screen.findByText(/New Todo Item/i);
  expect(newTodoItem).toBeInTheDocument();

  const savedTodos = JSON.parse(window.localStorage.getItem('todos') || '[]');
  const addedTodo = savedTodos.find((todo: Todo) => todo.label === 'New Todo Item');

  expect(addedTodo).toBeDefined();
  expect(addedTodo.checked).toBe(false);
});


// Items that are checked sinked bottom list automatically
test('Checked items sink to the bottom of the list automatically', () => {

  const todos = [
      { id: '1', label: 'Test 1', checked: false },
      { id: '2', label: 'Test 2', checked: false },
      { id: '3', label: 'Test 3', checked: false },
    ];

  window.localStorage.setItem('todos', JSON.stringify(todos));

  render(<App />);

  // Grabs all listItems
  let listItems = screen.getAllByRole('listitem');

  // At first, verify order
  expect(listItems[0]).toHaveTextContent('Test 1');
  expect(listItems[1]).toHaveTextContent('Test 2');
  expect(listItems[2]).toHaveTextContent('Test 3');


  // Second item reboot computer is being checked
  const item1Checkbox = screen.getByLabelText('Test 1');
  fireEvent.click(item1Checkbox);
  listItems = screen.getAllByRole('listitem');

  // checking count 
  expect(listItems).toHaveLength(3);

  // This verifies reboot computer at the end
  expect(listItems[0]).toHaveTextContent('Test 2');
  expect(listItems[1]).toHaveTextContent('Test 3');
  expect(listItems[2]).toHaveTextContent('Test 1');
});

// Same scenario where checked goes to bottom list auto
test('Checked items does not sink to the bottom of the list automatically because it only one left unchecked on a top', () => {

  const todos = [
      { id: '1', label: 'Test 1', checked: false },
      { id: '2', label: 'Test 2', checked: true },
      { id: '3', label: 'Test 3', checked: true },
    ];

  window.localStorage.setItem('todos', JSON.stringify(todos));

  render(<App />);

  let listItems = screen.getAllByRole('listitem');


  // Same verifying order
  expect(listItems[0]).toHaveTextContent('Test 1');
  expect(listItems[1]).toHaveTextContent('Test 2');
  expect(listItems[2]).toHaveTextContent('Test 3');


  const item1Checkbox = screen.getByLabelText('Test 1');
  fireEvent.click(item1Checkbox);
  // Same getting list 
  listItems = screen.getAllByRole('listitem');

  // Same count check after interactions
  expect(listItems).toHaveLength(3);

  // VThis confirms reboot computer at the bottom
  expect(listItems[0]).toHaveTextContent('Test 1');
  expect(listItems[1]).toHaveTextContent('Test 2');
  expect(listItems[2]).toHaveTextContent('Test 3');
});
