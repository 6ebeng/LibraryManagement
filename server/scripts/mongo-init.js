// MongoDB initialization script
// This runs when the MongoDB container starts for the first time

db = db.getSiblingDB('library_management');

// Create collections if they don't exist
db.createCollection('users');
db.createCollection('books');
db.createCollection('authors');
db.createCollection('genres');

print('MongoDB initialized with library_management database and collections');
