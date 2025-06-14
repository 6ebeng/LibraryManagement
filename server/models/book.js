// server/models/book.js

const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	isbn: {
		type: String,
		required: true,
	},
	// FIX: Added ref to Author model
	authorId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Author',
		required: false,
	},
	// FIX: Added ref to Genre model
	genreId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Genre',
		required: false,
	},
	isAvailable: {
		type: Boolean,
		default: true,
	},
	summary: {
		type: String,
		required: false,
	},
	photoUrl: {
		type: String,
		required: false,
	},
});

module.exports = mongoose.model('Book', bookSchema);
