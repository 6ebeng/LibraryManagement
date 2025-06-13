// client/src/sections/@dashboard/book/BookPage.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import BookPage from './BookPage';
import * as api from '../../../utils/api'; 
import { useAuth } from '../../../hooks/useAuth';

// Mocks
jest.mock('../../../utils/api');
jest.mock('../../../hooks/useAuth');

const renderWithRouter = (ui, { route = '/' } = {}) => {
  window.history.pushState({}, 'Test page', route);
  return render(ui, { wrapper: BrowserRouter });
};

describe('BookPage Tests', () => {
  const mockBooks = [
    { _id: '1', name: 'The Lord of the Rings', isbn: '978-0618640157', author: { name: 'J.R.R. Tolkien' }, genre: { name: 'Fantasy' }, isAvailable: true, summary: 'An epic adventure.' },
    { _id: '2', name: "The Hitchhiker's Guide to the Galaxy", isbn: '978-0345391803', author: { name: 'Douglas Adams' }, genre: { name: 'Sci-Fi' }, isAvailable: false, summary: 'A comedic science fiction series.' },
  ];

  beforeEach(() => {
    useAuth.mockReturnValue({ user: { isAdmin: true } });
    api.getAllBooks.mockResolvedValue({ data: { booksList: mockBooks } });
    api.addBook.mockResolvedValue({});
    api.updateBook.mockResolvedValue({});
    api.deleteBook.mockResolvedValue({});
  });

  // TC_BOOK_ADD_001 & TC_BOOK_ADD_002
  test('TC_BOOK_ADD_001 & TC_BOOK_ADD_002: should handle book creation with and without required fields', async () => {
    renderWithRouter(<BookPage />);
    fireEvent.click(screen.getByRole('button', { name: /new book/i }));
    
    // TC_BOOK_ADD_002: Attempt to submit with empty required fields
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => {
      expect(api.addBook).not.toHaveBeenCalled();
    });

    // TC_BOOK_ADD_001: Fill required fields and submit
    fireEvent.change(screen.getByLabelText(/book name/i), { target: { value: 'New Book' } });
    fireEvent.change(screen.getByLabelText(/isbn/i), { target: { value: '1234567890' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => {
      expect(api.addBook).toHaveBeenCalledWith(expect.objectContaining({ name: 'New Book', isbn: '1234567890' }));
    });
  });

  // TC_BOOK_VIEW_001
  test('TC_BOOK_VIEW_001: member should be able to view books', async () => {
    useAuth.mockReturnValue({ user: { isAdmin: false } });
    renderWithRouter(<BookPage />);
    expect(await screen.findByText('The Lord of the Rings')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /new book/i })).not.toBeInTheDocument();
  });

  // TC_BOOK_UPD_001
  test('TC_BOOK_UPD_001: should update a book successfully', async () => {
    renderWithRouter(<BookPage />);
    const moreButton = (await screen.findAllByLabelText(/more-vertical/i))[0];
    fireEvent.click(moreButton);
    fireEvent.click(await screen.findByText(/edit/i));
    
    fireEvent.change(screen.getByLabelText(/summary/i), { target: { value: 'An updated summary.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => {
      expect(api.updateBook).toHaveBeenCalledWith('1', expect.objectContaining({ summary: 'An updated summary.' }));
    });
  });

  // TC_BOOK_DEL_001
  test('TC_BOOK_DEL_001: should delete a book successfully', async () => {
    renderWithRouter(<BookPage />);
    const moreButton = (await screen.findAllByLabelText(/more-vertical/i))[0];
    fireEvent.click(moreButton);
    fireEvent.click(await screen.findByText(/delete/i));
    fireEvent.click(screen.getByRole('button', { name: /yes/i }));
    await waitFor(() => {
      expect(api.deleteBook).toHaveBeenCalledWith('1');
    });
  });
});