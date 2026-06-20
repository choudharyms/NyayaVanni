import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SearchBar from './SearchBar';

describe('SearchBar Component', () => {
  it('renders input with default placeholder', () => {
    render(<SearchBar onSearch={() => {}} />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  it('calls onSearch when typing', () => {
    const handleSearch = vi.fn();
    render(<SearchBar onSearch={handleSearch} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: 'test query' } });

    expect(handleSearch).toHaveBeenCalledWith('test query');
    expect(input.value).toBe('test query');
  });

  it('clears input when clear button is clicked', () => {
    const handleSearch = vi.fn();
    render(<SearchBar onSearch={handleSearch} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: 'test query' } });

    const clearButton = screen.getByRole('button');
    fireEvent.click(clearButton);

    expect(handleSearch).toHaveBeenCalledWith('');
    expect(input.value).toBe('');
  });
});
