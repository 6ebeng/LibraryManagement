const Book = require('../models/book')
const mongoose = require("mongoose");
const { errorMessages } = require('../utils/errorMessages');

const getBook = async (req, res) => {
  const bookId = req.params.id;

  // Validate book ID format
  if (!mongoose.Types.ObjectId.isValid(bookId)) {
    return res.status(400).json({
      success: false, 
      message: errorMessages.book.invalidData
    });
  }

  Book.findById(bookId, (err, book) => {
    if (err) {
      console.error('Database error fetching book:', err);
      return res.status(500).json({
        success: false, 
        message: errorMessages.general.databaseError
      });
    }

    if (!book) {
      return res.status(404).json({
        success: false, 
        message: errorMessages.book.notFound
      });
    }

    return res.status(200).json({
      success: true,
      book
    });
  });
}

const getAllBooks = async (req, res) => {
  Book.aggregate([{
    $lookup: {
      from: "authors",
      localField: "authorId",
      foreignField: "_id",
      as: "author"
    },
  },
    {
      $unwind: "$author"
    },
    {
      $lookup: {
        from: "genres",
        localField: "genreId",
        foreignField: "_id",
        as: "genre"
      },

    },
    {
      $unwind: "$genre"
    },]).exec((err, books) => {
    if (err) {
      console.error('Database error fetching books:', err);
      return res.status(500).json({
        success: false, 
        message: errorMessages.general.databaseError
      });
    }

    return res.status(200).json({
      success: true,
      booksList: books
    });
  });
}

const addBook = async (req, res) => {
  // Validate required fields
  if (!req.body.title) {
    return res.status(400).json({
      success: false, 
      message: errorMessages.book.titleRequired
    });
  }

  if (!req.body.authorId) {
    return res.status(400).json({
      success: false, 
      message: errorMessages.book.authorRequired
    });
  }

  if (!req.body.genreId) {
    return res.status(400).json({
      success: false, 
      message: errorMessages.book.genreRequired
    });
  }

  if (!req.body.isbn) {
    return res.status(400).json({
      success: false, 
      message: errorMessages.book.isbnRequired
    });
  }

  // Validate ObjectId formats
  if (!mongoose.Types.ObjectId.isValid(req.body.authorId) || 
      !mongoose.Types.ObjectId.isValid(req.body.genreId)) {
    return res.status(400).json({
      success: false, 
      message: errorMessages.book.invalidData
    });
  }

  const newBook = {
    ...req.body,
    genreId: mongoose.Types.ObjectId(req.body.genreId),
    authorId: mongoose.Types.ObjectId(req.body.authorId)
  }
  
  // Check for duplicate ISBN
  Book.findOne({ isbn: req.body.isbn }, (err, existingBook) => {
    if (err) {
      console.error('Database error checking ISBN:', err);
      return res.status(500).json({
        success: false, 
        message: errorMessages.general.databaseError
      });
    }

    if (existingBook) {
      return res.status(400).json({
        success: false, 
        message: errorMessages.book.duplicateISBN
      });
    }

    Book.create(newBook, (err, book) => {
      if (err) {
        console.error('Error creating book:', err);
        return res.status(400).json({
          success: false, 
          message: errorMessages.book.createFailed
        });
      }

      return res.status(200).json({
        success: true,
        newBook: book,
        message: `Book "${book.title}" has been successfully added to the library`
      });
    })
  });
}

const updateBook = async (req, res) => {
  const bookId = req.params.id
  const updatedBook = req.body

  // Validate book ID format
  if (!mongoose.Types.ObjectId.isValid(bookId)) {
    return res.status(400).json({
      success: false, 
      message: errorMessages.book.invalidData
    });
  }

  // If updating author or genre, validate their IDs
  if (updatedBook.authorId && !mongoose.Types.ObjectId.isValid(updatedBook.authorId)) {
    return res.status(400).json({
      success: false, 
      message: errorMessages.book.invalidData
    });
  }

  if (updatedBook.genreId && !mongoose.Types.ObjectId.isValid(updatedBook.genreId)) {
    return res.status(400).json({
      success: false, 
      message: errorMessages.book.invalidData
    });
  }

  Book.findByIdAndUpdate(bookId, updatedBook, { new: true }, (err, book) => {
    if (err) {
      console.error('Error updating book:', err);
      return res.status(500).json({
        success: false, 
        message: errorMessages.book.updateFailed
      });
    }

    if (!book) {
      return res.status(404).json({
        success: false, 
        message: errorMessages.book.notFound
      });
    }

    return res.status(200).json({
      success: true,
      updatedBook: book,
      message: 'Book information has been successfully updated'
    });
  })
}

const deleteBook = async (req, res) => {
  const bookId = req.params.id

  // Validate book ID format
  if (!mongoose.Types.ObjectId.isValid(bookId)) {
    return res.status(400).json({
      success: false, 
      message: errorMessages.book.invalidData
    });
  }

  // TODO: Check if book has active borrowals before deleting
  // For now, proceed with deletion

  Book.findByIdAndDelete(bookId, (err, book) => {
    if (err) {
      console.error('Error deleting book:', err);
      return res.status(500).json({
        success: false, 
        message: errorMessages.book.deleteFailed
      });
    }

    if (!book) {
      return res.status(404).json({
        success: false, 
        message: errorMessages.book.notFound
      });
    }

    return res.status(200).json({
      success: true,
      deletedBook: book,
      message: `Book "${book.title}" has been successfully removed from the library`
    });
  })
}

module.exports = {
  getBook,
  getAllBooks,
  addBook,
  updateBook,
  deleteBook
}
