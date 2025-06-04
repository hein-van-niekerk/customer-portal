import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Secure Customer Portal heading', () => {
  render(<App />);
  const headingElement = screen.getByText(/secure customer portal/i);
  expect(headingElement).toBeInTheDocument();
});
