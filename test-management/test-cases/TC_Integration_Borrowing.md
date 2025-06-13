# Test Cases - Integration Testing: Borrowing Workflow

## Test Case ID: TC_INT_001
**Test Case Name**: Complete Borrowing Workflow
**Priority**: High
**Test Type**: Integration

### Preconditions:
- Librarian account exists
- Member account exists
- At least one available book exists

### Test Steps:
1. **Login as Member**
   - Navigate to login page
   - Enter member credentials
   - Click login

2. **Search and Find Book**
   - Navigate to Books page
   - Search for an available book
   - Verify book shows as "Available"

3. **Borrow Book**
   - Click "Borrow" button on the book
   - Confirm borrowing action
   - Note the due date shown

4. **Verify Borrowing**
   - Navigate to "My Borrowals" page
   - Verify book appears in list
   - Check status shows as "Borrowed"
   - Check due date is correct

5. **Verify Book Status**
   - Go back to Books page
   - Find the same book
   - Verify it now shows as "Not Available"

### Expected Result:
- Member can successfully borrow a book
- Book status changes from Available to Not Available
- Borrowal record is created with correct due date
- Member can view their borrowal history

### Actual Result:
[To be filled during execution]

### Status:
[ ] Pass [ ] Fail

---

## Test Case ID: TC_INT_002
**Test Case Name**: Return Book Workflow
**Priority**: High
**Test Type**: Integration

### Preconditions:
- Member has at least one borrowed book
- User is logged in as Member

### Test Steps:
1. **Navigate to Borrowals**
   - Go to "My Borrowals" page
   - Find a borrowed book

2. **Return Book**
   - Click "Return" button
   - Confirm return action

3. **Verify Return**
   - Check borrowal status changes to "Returned"
   - Note the return date

4. **Verify Book Availability**
   - Navigate to Books page
   - Find the returned book
   - Verify status is "Available" again

### Expected Result:
- Book is successfully returned
- Borrowal status updates to "Returned"
- Book becomes available for borrowing again
- Return date is recorded

### Actual Result:
[To be filled during execution]

### Status:
[ ] Pass [ ] Fail 