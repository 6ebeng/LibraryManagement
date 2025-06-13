# Test Cases - User Management

## Test Case ID: TC_USER_001
**Test Case Name**: View User List as Librarian
**Priority**: High
**Test Type**: Functional

### Preconditions:
- Multiple users exist in the system
- User is logged in as Librarian

### Test Steps:
1. Navigate to Users page
2. Observe the user list

### Expected Result:
- All users are displayed
- User information shown: Name, Email, Role
- Current user is highlighted or marked

### Actual Result:
[To be filled during execution]

### Status:
[ ] Pass [ ] Fail

---

## Test Case ID: TC_USER_002
**Test Case Name**: Add New Member User
**Priority**: High
**Test Type**: Functional

### Preconditions:
- User is logged in as Librarian

### Test Steps:
1. Navigate to Users page
2. Click "Add New User" button
3. Fill in the form:
   - Name: "Test Member"
   - Email: "testmember@test.com"
   - Password: "Test123!"
   - Role: Member
4. Click "Save" button

### Expected Result:
- Success message appears
- New user appears in user list
- User can login with provided credentials

### Actual Result:
[To be filled during execution]

### Status:
[ ] Pass [ ] Fail

---

## Test Case ID: TC_USER_003
**Test Case Name**: Member Cannot Access User Management
**Priority**: High
**Test Type**: Functional, Security

### Preconditions:
- User is logged in as Member

### Test Steps:
1. Try to navigate to Users page via URL
2. Check if Users menu item is visible

### Expected Result:
- Users menu item is not visible to Member
- Direct URL access shows error or redirects
- No user management functionality available

### Actual Result:
[To be filled during execution]

### Status:
[ ] Pass [ ] Fail 