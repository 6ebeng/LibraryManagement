// MongoDB initialization script
// This runs when the MongoDB container starts for the first time

const dbName = process.env.MONGO_INITDB_DATABASE || 'LibraryManagement';
db = db.getSiblingDB(dbName);

print(`MongoDB: Initializing database: ${dbName}`);

// Define collections to create
const collections = ['users', 'books', 'authors', 'genres'];
const existingCollections = db.getCollectionNames();

collections.forEach((collectionName) => {
	if (!existingCollections.includes(collectionName)) {
		db.createCollection(collectionName);
		print(`MongoDB: Created '${collectionName}' collection in ${dbName}.`);
	} else {
		print(`MongoDB: '${collectionName}' collection already exists in ${dbName}.`);
	}
});

print(`MongoDB: Finished mongo-init.js for ${dbName}.`);
