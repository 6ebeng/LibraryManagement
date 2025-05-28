#!/bin/bash

# Base URL for your API
API_URL="http://localhost:8080/api"

# --- Login Librarian and get token ---
echo "Logging in as Librarian..."
LOGIN_PAYLOAD='{
  "email": "mainlibrarian@example.com",
  "password": "Password123!"
}'

# Send login request and extract token (requires 'jq' for JSON parsing)
# Make sure you have jq installed: sudo apt-get install jq / brew install jq
TOKEN_RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d "$LOGIN_PAYLOAD")

AUTH_TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.token')

if [ -z "$AUTH_TOKEN" ] || [ "$AUTH_TOKEN" == "null" ]; then
  echo "Login failed or token not found!"
  echo "Response: $TOKEN_RESPONSE"
  exit 1
fi
echo "Login successful. Token obtained."

# --- Create Authors ---
echo "Creating Authors..."
AUTHOR1_PAYLOAD='{
  "name": "George Orwell",
  "bio": "English novelist, essayist, journalist and critic.",
  "birthDate": "1903-06-25",
  "nationality": "British"
}'
AUTHOR1_RESPONSE=$(curl -s -X POST "${API_URL}/authors" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -d "$AUTHOR1_PAYLOAD")
AUTHOR1_ID=$(echo "$AUTHOR1_RESPONSE" | jq -r '._id') # Adjust if the ID field name is different
echo "Created Author George Orwell with ID: $AUTHOR1_ID"
# Add more authors similarly...

# --- Create Genres ---
echo "Creating Genres..."
GENRE1_PAYLOAD='{
  "name": "Dystopian"
}'
GENRE1_RESPONSE=$(curl -s -X POST "${API_URL}/genres" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -d "$GENRE1_PAYLOAD")
GENRE1_ID=$(echo "$GENRE1_RESPONSE" | jq -r '._id') # Adjust if the ID field name is different
echo "Created Genre Dystopian with ID: $GENRE1_ID"
# Add more genres similarly...

# --- Create Books ---
echo "Creating Books..."
BOOK1_PAYLOAD=$(cat <<EOF
{
  "title": "Nineteen Eighty-Four",
  "author": "${AUTHOR1_ID}",
  "genre": "${GENRE1_ID}",
  "ISBN": "978-0451524935",
  "description": "A dystopian social science fiction novel and cautionary tale.",
  "publicationDate": "1949-06-08",
  "publisher": "Secker & Warburg",
  "coverImage": "http://example.com/images/1984.jpg",
  "pageCount": 328,
  "language": "English",
  "totalCopies": 5,
  "availableCopies": 5
}
EOF
)
curl -s -X POST "${API_URL}/books" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -d "$BOOK1_PAYLOAD"
echo "Created Book: Nineteen Eighty-Four"
# Add more books similarly...

echo "Data population script finished."