# Suggested System Changes

## Overview
This document outlines the changes suggested for the Library Management System as part of the testing project. These changes are designed to improve functionality and user experience while being simple to implement.

## Change 1: Add Book Search Filter by Genre
**Type**: Enhancement
**Priority**: Medium
**Module**: Book Management

### Description:
Add a dropdown filter on the Books page to filter books by genre.

### Justification:
- Improves user experience when browsing books
- Helps users find books of interest quickly
- Simple to implement using existing genre data

### Implementation Details:
1. Add genre dropdown to book list page
2. Filter displayed books based on selection
3. Add "All Genres" option to show all books

### Testing Required:
- Functional testing of filter
- Verify filter works with search
- Test filter persistence on page refresh

---

## Change 2: Add Notes Field to Borrowal Records
**Type**: Enhancement
**Priority**: Low
**Module**: Borrowal Management

### Description:
Add an optional "notes" field when borrowing a book to record special conditions or reminders.

### Justification:
- Allows librarians to track special cases
- Helps members add personal reminders
- Minimal database change required

### Implementation Details:
1. Add notes field to borrowal schema
2. Add text input to borrow dialog
3. Display notes in borrowal history

### Testing Required:
- Test notes are saved correctly
- Verify notes appear in history
- Test character limit validation

---

## Change 3: Improve Error Messages
**Type**: Bug Fix / Enhancement
**Priority**: High
**Module**: All

### Description:
Replace generic error messages with specific, helpful messages throughout the application.

### Justification:
- Current errors like "An error occurred" are not helpful
- Specific messages improve user experience
- Helps in debugging issues

### Examples:
- Change "Login failed" to "Invalid email or password"
- Change "Error saving" to "Book title is required"
- Change "Access denied" to "Only librarians can access this feature"

### Testing Required:
- Test all error scenarios
- Verify messages are clear
- Check message consistency 