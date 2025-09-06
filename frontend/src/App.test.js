// src/App.test.js
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/D-Nothi System/i);
  expect(linkElement).toBeInTheDocument();
});

// Basic smoke test
test('app renders without crashing', () => {
  render(<App />);
});

// Test for login page when not authenticated
test('shows login page when not authenticated', () => {
  render(<App />);
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
});