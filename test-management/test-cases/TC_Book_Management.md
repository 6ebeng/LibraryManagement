# Test Cases - Book Management

## Test Case ID: TC_BOOK_001
**Test Case Name**: Add New Book - Valid Data
**Priority**: High
**Test Type**: Functional

### Preconditions:
- User is logged in as Librarian
- At least one Author and one Genre exist in the system

### Test Steps:
1. Navigate to Books page
2. Click "Add New Book" button
3. Fill in the form:
   - Title: "Test Book Title"
   - Author: Select existing author
   - Genre: Select existing genre
   - ISBN: "978-1234567890"
   - Publish Date: "2024-01-01"
   - Description: "This is a test book"
4. Click "Save" button

### Expected Result:
- Success message appears
- Book is added to the books list
- Book details match entered data

### Actual Result: 
[To be filled during execution]

### Status: 
[ ] Pass [ ] Fail

---

## Test Case ID: TC_BOOK_002
**Test Case Name**: Add New Book - Missing Required Fields
**Priority**: High
**Test Type**: Functional

### Preconditions:
- User is logged in as Librarian

### Test Steps:
1. Navigate to Books page
2. Click "Add New Book" button
3. Leave Title field empty
4. Fill other fields with valid data
5. Click "Save" button

### Expected Result:
- Error message: "Title is required"
- Book is NOT added to the system
- Form remains open with entered data

### Actual Result:
[To be filled during execution]

### Status:
[ ] Pass [ ] Fail

---

## Test Case ID: TC_BOOK_003
**Test Case Name**: View Book List
**Priority**: High
**Test Type**: Functional

### Preconditions:
- At least 3 books exist in the system
- User is logged in (any role)

### Test Steps:
1. Navigate to Books page
2. Observe the book list

### Expected Result:
- All books are displayed in a table/list
- Each book shows: Title, Author, Genre, Availability
- Books are properly formatted

### Actual Result:
[To be filled during execution]

### Status:
[ ] Pass [ ] Fail

---

## Test Case ID: TC_BOOK_004
**Test Case Name**: Search Books by Title
**Priority**: Medium
**Test Type**: Functional

### Preconditions:
- Multiple books exist in the system
- User is logged in (any role)

### Test Steps:
1. Navigate to Books page
2. Enter "Test" in search box
3. Press Enter or click Search

### Expected Result:
- Only books containing "Test" in title are displayed
- Search results update dynamically
- Clear search shows all books again

### Actual Result:
[To be filled during execution]

### Status:
[ ] Pass [ ] Fail

---

## Test Case ID: TC_BOOK_005
**Test Case Name**: Update Book Information
**Priority**: Medium
**Test Type**: Functional

### Preconditions:
- At least one book exists
- User is logged in as Librarian

### Test Steps:
1. Navigate to Books page
2. Click Edit icon/button for a book
3. Change the description
4. Click "Update" button

### Expected Result:
- Success message appears
- Book information is updated
- Updated data appears in book list

### Actual Result:
[To be filled during execution]

### Status:
[ ] Pass [ ] Fail 