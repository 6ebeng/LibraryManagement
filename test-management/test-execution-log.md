# Test Execution Log

## Test Session Information
- **Date**: [Date]
- **Tester**: [Name]
- **Environment**: Development / Test / Production
- **Browser**: Chrome / Firefox / Edge
- **Build Version**: [Version/Commit]

## Test Execution Summary

| Test Case ID | Test Case Name | Status | Comments |
|--------------|----------------|---------|----------|
| TC_AUTH_LOGIN_001 | Login with valid credentials | ✅ Pass | Works as expected |
| TC_AUTH_LOGIN_002 | Login with invalid password | ✅ Pass | Shows error message |
| TC_BOOK_001 | Add New Book - Valid Data | ❌ Fail | Save button not working |
| TC_BOOK_003 | View Book List | ✅ Pass | All books displayed |
| TC_USER_001 | View User List as Librarian | ⏸️ Blocked | Users menu not visible |

## Detailed Test Results

### TC_BOOK_001: Add New Book - Valid Data
**Status**: Failed
**Test Date**: [Date]
**Tester**: [Name]

**Steps Executed**:
1. ✅ Logged in as Librarian
2. ✅ Navigated to Books page
3. ✅ Clicked "Add New Book" button
4. ✅ Filled all required fields
5. ❌ Clicked Save - Nothing happened

**Actual Result**: 
Save button does not respond when clicked. No error message shown.

**Expected Result**: 
Book should be saved and appear in list.

**Screenshots**: 
[Attach screenshot of the issue]

**Severity**: High
**Priority**: High

---

## Defects Found

### DEFECT_001: Save button not working on Add Book form
- **Test Case**: TC_BOOK_001
- **Severity**: High
- **Status**: Open
- **Description**: The Save button on Add New Book form does not respond to clicks
- **Steps to Reproduce**:
  1. Login as Librarian
  2. Go to Books page
  3. Click Add New Book
  4. Fill all fields
  5. Click Save button
- **Expected**: Book is saved
- **Actual**: Nothing happens

---

## Test Metrics

- **Total Test Cases Planned**: 15
- **Test Cases Executed**: 5
- **Test Cases Passed**: 3
- **Test Cases Failed**: 1
- **Test Cases Blocked**: 1
- **Pass Rate**: 60%
- **Defects Found**: 1
- **Critical Defects**: 0
- **High Priority Defects**: 1 