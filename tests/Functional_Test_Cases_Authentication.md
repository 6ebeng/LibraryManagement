# Functional Test Cases: Authentication & Authorization

**Document Version:** 1.0
**Creation Date:** 2025-05-30
**Author:** Sara and Ravyar (as Non-Coder/Specification Expert)
**Phase:** 2
**Task:** 2.1 Functional: Authentication Test Design (Detailed Test Cases)
**Basis:** Software Requirements Specification (SRS) & Test Design `I_A_Functional_Authentication_Test_Design.md`
**Methodology:** Black-Box Testing

This document provides detailed test cases for the Authentication and Authorization functionalities of the Library Management System.

---

## 1. User Registration (Librarian Creating Users)

**Overall Precondition for this section:** A user with 'Librarian' role is logged into the system and has navigated to the user creation interface.

### TC_AUTH_REG_001: Successful Member Creation

- **Test Scenario:** Successful creation of a new 'Member' user.
- **Test Objective:** To verify that a librarian can successfully create a new user with the 'Member' role using valid and complete information as per SRS.
- **Priority:** High
- **Preconditions:**
  1.  Librarian is logged in.
  2.  Librarian is on the 'Create User' page/form.
- **Test Steps:**
  1.  Enter a unique username in the 'Username' field.
  2.  Enter a valid password in the 'Password' field.
  3.  Re-enter the same password in the 'Confirm Password' field (if applicable).
  4.  Enter a valid and unique email address in the 'Email' field (if applicable as per SRS).
  5.  Select 'Member' from the 'Role' dropdown/selection.
  6.  Fill in any other mandatory fields (e.g., First Name, Last Name) with valid data as per SRS.
  7.  Click the 'Create User' / 'Submit' / 'Save' button.
- **Test Data:**
  - Username: `testmember` + `[timestamp]` (e.g., `testmember20250530080000`)
  - Password: `ValidPassword123!`
  - Confirm Password: `ValidPassword123!`
  - Email: `testmember` + `[timestamp]` + `@example.com`
  - Role: Member
  - Other fields: (e.g., First Name: `TestM`, Last Name: `UserM`)
- **Expected Result:**
  1.  A success message (e.g., "User created successfully," "Member account created") is displayed.
  2.  The new user account is created in the system with the 'Member' role and the entered details.
  3.  The form clears, or the page redirects to a user list or the new user's profile, as per system design.
  4.  The newly created member account can be used to log in (verified in Login test cases).

### TC_AUTH_REG_002: Successful Librarian Creation

- **Test Scenario:** Successful creation of a new 'Librarian' user.
- **Test Objective:** To verify that a librarian can successfully create a new user with the 'Librarian' role using valid and complete information.
- **Priority:** High
- **Preconditions:**
  1.  Librarian is logged in.
  2.  Librarian is on the 'Create User' page/form.
- **Test Steps:**
  1.  Enter a unique username in the 'Username' field.
  2.  Enter a valid password in the 'Password' field.
  3.  Re-enter the same password in the 'Confirm Password' field (if applicable).
  4.  Enter a valid and unique email address in the 'Email' field (if applicable as per SRS).
  5.  Select 'Librarian' from the 'Role' dropdown/selection.
  6.  Fill in any other mandatory fields with valid data as per SRS.
  7.  Click the 'Create User' / 'Submit' / 'Save' button.
- **Test Data:**
  - Username: `testlibrarian` + `[timestamp]`
  - Password: `ValidPasswordLib1!`
  - Confirm Password: `ValidPasswordLib1!`
  - Email: `testlibrarian` + `[timestamp]` + `@example.com`
  - Role: Librarian
  - Other fields: (e.g., First Name: `TestL`, Last Name: `UserL`)
- **Expected Result:**
  1.  A success message is displayed.
  2.  The new user account is created with the 'Librarian' role.
  3.  The newly created librarian account can be used to log in (verified in Login test cases).

### TC_AUTH_REG_003: Username Uniqueness Violation

- **Test Scenario:** Attempt to create a user with an existing username.
- **Test Objective:** To verify that the system prevents the creation of a new user if the chosen username already exists.
- **Priority:** High
- **Preconditions:**
  1.  Librarian is logged in.
  2.  Librarian is on the 'Create User' page/form.
  3.  An existing user (e.g., `existinguser`) is already in the system.
- **Test Steps:**
  1.  Enter the username `existinguser` in the 'Username' field.
  2.  Fill all other mandatory fields with valid data.
  3.  Select a role (e.g., 'Member').
  4.  Click the 'Create User' / 'Submit' / 'Save' button.
- **Test Data:**
  - Username: `existinguser` (pre-existing username)
  - Password: `AnyPassword123!`
  - Email: `unique_email` + `[timestamp]` + `@example.com`
  - Role: Member
- **Expected Result:**
  1.  An appropriate error message is displayed (e.g., "Username already exists," "This username is taken").
  2.  The new user account is NOT created.
  3.  The form retains the entered data (or as per system design for usability).

### TC_AUTH_REG_004: Email Uniqueness Violation (Conditional)

- **Test Scenario:** Attempt to create a user with an existing email (if SRS mandates email uniqueness).
- **Test Objective:** To verify that the system prevents user creation if the email is already in use and SRS specifies email uniqueness.
- **Priority:** Medium (Conditional on SRS)
- **Preconditions:**
  1.  Librarian is logged in.
  2.  Librarian is on the 'Create User' page/form.
  3.  An existing user has email `existing@example.com`.
  4.  SRS mandates unique email addresses.
- **Test Steps:**
  1.  Enter a unique username.
  2.  Enter `existing@example.com` in the 'Email' field.
  3.  Fill all other mandatory fields with valid data.
  4.  Click the 'Create User' / 'Submit' / 'Save' button.
- **Test Data:**
  - Username: `anotheruser` + `[timestamp]`
  - Password: `AnyPassword123!`
  - Email: `existing@example.com` (pre-existing email)
  - Role: Member
- **Expected Result:**
  1.  An appropriate error message (e.g., "Email already in use") is displayed.
  2.  The new user account is NOT created.
  - **Note:** If SRS does not mandate unique emails, this test is N/A or expected result changes to successful creation.

### TC_AUTH_REG_005: Missing Required Fields (Iterative)

- **Test Scenario:** Attempt to create a user by omitting one or more mandatory fields.
- **Test Objective:** To verify that the system validates for the presence of all required fields and prompts the user accordingly.
- **Priority:** High
- **Preconditions:**
  1.  Librarian is logged in.
  2.  Librarian is on the 'Create User' page/form.
- **Test Steps (Iterative - perform for each mandatory field identified in SRS):**
  1.  Fill in all fields with valid data _except_ for one mandatory field (e.g., leave 'Username' blank).
  2.  Click the 'Create User' / 'Submit' / 'Save' button.
  3.  Observe the result.
  4.  Repeat for other mandatory fields (e.g., Password, Role, etc.).
- **Test Data (Example iteration - Username missing):**
  - Username: (blank)
  - Password: `ValidPassword123!`
  - Email: `test` + `[timestamp]` + `@example.com`
  - Role: Member
- **Expected Result (for each iteration):**
  1.  An appropriate error message is displayed, indicating which mandatory field is missing (e.g., "Username is required," "Please select a role").
  2.  The user account is NOT created.
  3.  The cursor might focus on the missing field.

### TC_AUTH_REG_006: Invalid Data Formats (Iterative)

- **Test Scenario:** Attempt to create a user with data in invalid formats.
- **Test Objective:** To verify that the system validates data formats for fields like email, password (if complexity rules exist), etc.
- **Priority:** High
- **Preconditions:**
  1.  Librarian is logged in.
  2.  Librarian is on the 'Create User' page/form.
- **Test Steps (Iterative - perform for fields with format validation as per SRS):**
  1.  **Email Format:**
      a. Enter an invalid email (e.g., `testuser`, `testuser@`, `testuser@domain`, `testuser@domain.c`).
      b. Fill other fields with valid data.
      c. Click 'Create User'.
  2.  **Password Complexity (if SRS defines rules like min length, char types):**
      a. Enter a password that violates a rule (e.g., too short, no uppercase, no number, no special character).
      b. Fill other fields with valid data.
      c. Click 'Create User'.
  3.  **Other fields with specific formats (e.g., phone number if specified in SRS).**
- **Test Data (Example iteration - Invalid Email):**
  - Username: `formatuser` + `[timestamp]`
  - Password: `ValidPassword123!`
  - Email: `invalidemailformat`
  - Role: Member
- **Expected Result (for each iteration):**
  1.  An appropriate error message is displayed, indicating the format violation (e.g., "Invalid email format," "Password does not meet complexity requirements").
  2.  The user account is NOT created.

### TC_AUTH_REG_007: Boundary Values for Fields (Conditional)

- **Test Scenario:** Test fields with defined length constraints using values at, below, and above boundaries.
- **Test Objective:** To verify system handles field length constraints correctly.
- **Priority:** Medium (Conditional on SRS defining specific length constraints)
- **Preconditions:**
  1.  Librarian is logged in.
  2.  Librarian is on the 'Create User' page/form.
  3.  SRS defines length constraints (e.g., Username: min 5, max 20 chars; Password: min 8, max 30 chars).
- **Test Steps (Iterative for each field with length constraints):**
  - **For Username (assuming min 5, max 20):**
    1.  Test min-1: Enter a 4-char username. Click 'Create User'.
    2.  Test min: Enter a 5-char username. Click 'Create User'. (Other fields valid)
    3.  Test max: Enter a 20-char username. Click 'Create User'. (Other fields valid)
    4.  Test max+1: Enter a 21-char username. Click 'Create User'.
- **Test Data (Example for Username min-1):**
  - Username: `abcd`
  - Other fields: Valid data
- **Expected Result:**
  1.  For `min-1` and `max+1` (invalid lengths): An appropriate error message is displayed. User not created.
  2.  For `min` and `max` (valid lengths): User creation proceeds if all other data is valid (or fails for other reasons, but not due to this field's length).

---

## 2. User Login

**Overall Precondition for this section:** User is on the Login page of the system.

### TC_AUTH_LOG_001: Successful Login - Member

- **Test Scenario:** Login with valid credentials for an existing 'Member' user.
- **Test Objective:** To verify that a registered member can successfully log into the system.
- **Priority:** High
- **Preconditions:**
  1.  A 'Member' user account exists (e.g., created via TC_AUTH_REG_001).
  2.  User is on the Login page.
- **Test Steps:**
  1.  Enter the Member's valid username in the 'Username' field.
  2.  Enter the Member's valid password in the 'Password' field.
  3.  Click the 'Login' / 'Sign In' button.
- **Test Data:**
  - Username: `[valid_member_username]` (e.g., from TC_AUTH_REG_001)
  - Password: `[valid_member_password]` (e.g., from TC_AUTH_REG_001)
- **Expected Result:**
  1.  User is successfully authenticated.
  2.  User is redirected to the Member dashboard or their designated landing page as per SRS.
  3.  Member-specific UI elements/options are visible.

### TC_AUTH_LOG_002: Successful Login - Librarian

- **Test Scenario:** Login with valid credentials for an existing 'Librarian' user.
- **Test Objective:** To verify that a registered librarian can successfully log into the system.
- **Priority:** High
- **Preconditions:**
  1.  A 'Librarian' user account exists (e.g., created via TC_AUTH_REG_002 or a default admin).
  2.  User is on the Login page.
- **Test Steps:**
  1.  Enter the Librarian's valid username in the 'Username' field.
  2.  Enter the Librarian's valid password in the 'Password' field.
  3.  Click the 'Login' / 'Sign In' button.
- **Test Data:**
  - Username: `[valid_librarian_username]`
  - Password: `[valid_librarian_password]`
- **Expected Result:**
  1.  User is successfully authenticated.
  2.  User is redirected to the Librarian dashboard or their designated landing page as per SRS.
  3.  Librarian-specific UI elements/options are visible.

### TC_AUTH_LOG_003: Invalid Password

- **Test Scenario:** Attempt to log in with a valid username but an incorrect password.
- **Test Objective:** To verify that the system denies access for incorrect password attempts.
- **Priority:** High
- **Preconditions:**
  1.  A user account (e.g., Member `testmember`) exists with a known password.
  2.  User is on the Login page.
- **Test Steps:**
  1.  Enter the valid username (e.g., `testmember`) in the 'Username' field.
  2.  Enter an incorrect password (e.g., `WrongPassword123!`) in the 'Password' field.
  3.  Click the 'Login' / 'Sign In' button.
- **Test Data:**
  - Username: `[valid_username]`
  - Password: `[incorrect_password]`
- **Expected Result:**
  1.  Login fails.
  2.  An appropriate error message is displayed (e.g., "Invalid username or password," "Login failed").
  3.  User remains on the Login page.
  4.  Password field may be cleared for security.

### TC_AUTH_LOG_004: Invalid Username

- **Test Scenario:** Attempt to log in with a non-existent username.
- **Test Objective:** To verify that the system denies access for non-existent usernames.
- **Priority:** High
- **Preconditions:** User is on the Login page.
- **Test Steps:**
  1.  Enter a non-existent username (e.g., `nonexistentuser123`) in the 'Username' field.
  2.  Enter any password (e.g., `AnyPassword123`) in the 'Password' field.
  3.  Click the 'Login' / 'Sign In' button.
- **Test Data:**
  - Username: `nonexistentuser` + `[timestamp]`
  - Password: `AnyPassword123`
- **Expected Result:**
  1.  Login fails.
  2.  An appropriate error message is displayed (e.g., "Invalid username or password," "User not found").
  3.  User remains on the Login page.

### TC_AUTH_LOG_005: Empty Credentials

- **Test Scenario:** Attempt to log in with empty username, empty password, or both empty.
- **Test Objective:** To verify that the system validates for empty credentials.
- **Priority:** High
- **Preconditions:** User is on the Login page.
- **Test Steps:**
  1.  **Empty Username:** Leave 'Username' blank, enter a password, click 'Login'.
  2.  **Empty Password:** Enter a username, leave 'Password' blank, click 'Login'.
  3.  **Both Empty:** Leave both 'Username' and 'Password' blank, click 'Login'.
- **Test Data:**
  1.  Username: (blank), Password: `AnyPassword123`
  2.  Username: `testuser`, Password: (blank)
  3.  Username: (blank), Password: (blank)
- **Expected Result:**
  1.  For each step, login fails.
  2.  An appropriate error message is displayed indicating the missing field(s) (e.g., "Username is required," "Password is required").
  3.  User remains on the Login page.

### TC_AUTH_LOG_006: Case Sensitivity (Conditional)

- **Test Scenario:** Test login with correct credentials but varying case for username and/or password.
- **Test Objective:** To verify system behavior regarding case sensitivity for credentials, as per SRS.
- **Priority:** Medium (Conditional on SRS specification)
- **Preconditions:**
  1.  A user account exists (e.g., Username: `TestUser`, Password: `TestPassword1`).
  2.  User is on the Login page.
  3.  SRS specifies case sensitivity rules (e.g., username is case-insensitive, password is case-sensitive).
- **Test Steps (assuming username case-insensitive, password case-sensitive as an example):**
  1.  **Username case variation:** Enter `testuser` (lowercase) for Username, `TestPassword1` for Password. Click 'Login'.
  2.  **Password case variation:** Enter `TestUser` for Username, `testpassword1` (lowercase) for Password. Click 'Login'.
- **Test Data:**
  - Actual Username: `TestUser`, Actual Password: `TestPassword1`
  1.  Input: Username: `testuser`, Password: `TestPassword1`
  2.  Input: Username: `TestUser`, Password: `testpassword1`
- **Expected Result (based on example sensitivity):**
  1.  Login succeeds (username `testuser` matches `TestUser`).
  2.  Login fails (password `testpassword1` does not match `TestPassword1`). An error message like "Invalid username or password" is shown.
  - **Note:** Adjust expected results based on actual SRS rules for case sensitivity.

### TC_AUTH_LOG_007: Login with Disabled/Locked Account (Conditional)

- **Test Scenario:** Attempt to log in with credentials for an account that has been administratively disabled or locked.
- **Test Objective:** To verify that disabled/locked accounts cannot log in.
- **Priority:** Medium (Conditional on system having this feature as per SRS)
- **Preconditions:**
  1.  A user account exists and has been marked as 'disabled' or 'locked' by an administrator.
  2.  User is on the Login page.
- **Test Steps:**
  1.  Enter the username of the disabled/locked account.
  2.  Enter the correct password for that account.
  3.  Click the 'Login' / 'Sign In' button.
- **Test Data:**
  - Username: `[disabled_user_username]`
  - Password: `[disabled_user_password]`
- **Expected Result:**
  1.  Login fails.
  2.  An appropriate error message is displayed (e.g., "Account is disabled," "Account has been locked").
  3.  User remains on the Login page.

### TC_AUTH_LOG_008: "Remember Me" Functionality (Conditional)

- **Test Scenario:** Test the "Remember Me" functionality on the login form.
- **Test Objective:** To verify that if "Remember Me" is checked, the session persists across browser closures as per SRS.
- **Priority:** Low (Conditional on system having this feature as per SRS)
- **Preconditions:**
  1.  A user account exists.
  2.  The Login page has a "Remember Me" checkbox.
  3.  User is on the Login page.
- **Test Steps:**
  1.  Enter valid username and password.
  2.  Check the "Remember Me" checkbox.
  3.  Click 'Login'. Verify successful login.
  4.  Close the browser completely.
  5.  Re-open the browser and navigate to the application's main URL or a protected page.
- **Test Data:**
  - Username: `[valid_username]`
  - Password: `[valid_password]`
- **Expected Result:**
  1.  After re-opening the browser and navigating to the app, the user is still logged in (i.e., does not see the login page but is taken to their dashboard or the requested protected page).
  - **Note:** The exact mechanism (cookie, token) and duration of "Remember Me" should align with SRS. A counter-test without checking "Remember Me" should result in requiring login after browser restart.

---

## 3. User Logout

### TC_AUTH_OUT_001: Successful Logout - Member

- **Test Scenario:** A logged-in 'Member' user initiates the logout process.
- **Test Objective:** To verify that a member can successfully log out and their session is terminated.
- **Priority:** High
- **Preconditions:**
  1.  A 'Member' user is logged into the system.
- **Test Steps:**
  1.  Click the 'Logout' / 'Sign Out' link/button.
- **Test Data:** N/A
- **Expected Result:**
  1.  The user's session is terminated.
  2.  The user is redirected to the Login page or a public home page (as per SRS).
  3.  Attempting to access member-specific pages (e.g., using browser back button or direct URL) should redirect to the login page or show an access denied message.

### TC_AUTH_OUT_002: Successful Logout - Librarian

- **Test Scenario:** A logged-in 'Librarian' user initiates the logout process.
- **Test Objective:** To verify that a librarian can successfully log out and their session is terminated.
- **Priority:** High
- **Preconditions:**
  1.  A 'Librarian' user is logged into the system.
- **Test Steps:**
  1.  Click the 'Logout' / 'Sign Out' link/button.
- **Test Data:** N/A
- **Expected Result:**
  1.  The user's session is terminated.
  2.  The user is redirected to the Login page or a public home page (as per SRS).
  3.  Attempting to access librarian-specific pages should redirect to the login page or show an access denied message.

### TC_AUTH_OUT_003: Accessing Authenticated Pages After Logout (Browser Back Button)

- **Test Scenario:** After logging out, attempt to use the browser's back button to navigate to a previously accessed authenticated page.
- **Test Objective:** To verify that previously accessed authenticated pages are not accessible via browser history after logout.
- **Priority:** High
- **Preconditions:**
  1.  A user was logged in, navigated to an authenticated page (e.g., `/dashboard`).
  2.  The user has logged out successfully.
- **Test Steps:**
  1.  After logout (and redirection to login/home page), click the browser's 'Back' button.
- **Test Data:** N/A
- **Expected Result:**
  1.  The user is NOT shown the content of the previous authenticated page.
  2.  The user is redirected to the Login page or shown an appropriate error/access denied message.
  3.  No sensitive information from the previous page is displayed.

### TC_AUTH_OUT_004: Session Expiry and Logout (Conditional)

- **Test Scenario:** An authenticated session is left idle beyond the defined automatic session timeout period.
- **Test Objective:** To verify that the system automatically logs out the user or requires re-authentication after session expiry due to inactivity, as per SRS.
- **Priority:** Medium (Conditional on SRS defining automatic session timeout)
- **Preconditions:**
  1.  A user is logged in.
  2.  SRS defines an automatic session timeout period (e.g., 30 minutes of inactivity).
- **Test Steps:**
  1.  Log in to the system.
  2.  Leave the session idle (no user interaction with the application) for a duration exceeding the defined timeout period (e.g., 31 minutes).
  3.  Attempt to perform an action that requires authentication (e.g., navigate to another protected page, click a button on the current page).
- **Test Data:** N/A
- **Expected Result:**
  1.  The user is automatically logged out and redirected to the Login page.
  2.  OR, upon the next action, the system requires re-authentication (shows login prompt).
  3.  An informative message about session expiry may be displayed.

---

## 4. Role-Based Access Control (RBAC)

### TC_AUTH_RBAC_001: Librarian Access to Librarian-Specific Features

- **Test Scenario:** A logged-in Librarian attempts to access features designated solely for Librarians.
- **Test Objective:** To verify that Librarians can access all their intended functionalities.
- **Priority:** High
- **Preconditions:**
  1.  A 'Librarian' user is logged into the system.
  2.  SRS defines specific features/pages for Librarians (e.g., `/admin/users`, `/admin/settings`, `/books/manage`).
- **Test Steps (Iterative for each Librarian-specific feature/URL):**
  1.  Navigate to or interact with a Librarian-specific feature/URL (e.g., User Management page, Add New Book page, System Settings).
- **Test Data:**
  - Librarian credentials.
  - List of Librarian-specific URLs/features from SRS.
- **Expected Result:**
  1.  Access is granted to the feature/page.
  2.  All UI elements related to the feature are visible and functional as per SRS.

### TC_AUTH_RBAC_002: Member Access to Member-Specific Features

- **Test Scenario:** A logged-in Member attempts to access features designated for Members.
- **Test Objective:** To verify that Members can access all their intended functionalities.
- **Priority:** High
- **Preconditions:**
  1.  A 'Member' user is logged into the system.
  2.  SRS defines specific features/pages for Members (e.g., `/myprofile`, `/borrowhistory`, `/books/search`).
- **Test Steps (Iterative for each Member-specific feature/URL):**
  1.  Navigate to or interact with a Member-specific feature/URL (e.g., View Borrow History, Search Books, Update Profile).
- **Test Data:**
  - Member credentials.
  - List of Member-specific URLs/features from SRS.
- **Expected Result:**
  1.  Access is granted to the feature/page.
  2.  All UI elements related to the feature are visible and functional as per SRS.

### TC_AUTH_RBAC_003: Member Attempting to Access Librarian-Specific Features

- **Test Scenario:** A logged-in Member attempts to access features or pages designated for Librarians.
- **Test Objective:** To verify that Members are denied access to Librarian-only functionalities.
- **Priority:** High
- **Preconditions:**
  1.  A 'Member' user is logged into the system.
  2.  SRS defines specific features/pages for Librarians (e.g., `/admin/users`).
- **Test Steps (Iterative for each Librarian-specific feature/URL):**
  1.  Attempt to navigate directly to a Librarian-specific URL (e.g., type `/admin/users` in the browser address bar).
  2.  If any UI element for a Librarian feature is mistakenly visible to a Member, attempt to click/use it.
- **Test Data:**
  - Member credentials.
  - List of Librarian-specific URLs/features from SRS.
- **Expected Result:**
  1.  Access is denied.
  2.  An appropriate error message (e.g., "Access Denied," "You do not have permission to view this page") is displayed.
  3.  OR, the user is redirected to a safe page (e.g., their dashboard or the login page).

### TC_AUTH_RBAC_004: Librarian Access to Member Functionality (Shared Features)

- **Test Scenario:** A logged-in Librarian attempts to use features also available to Members.
- **Test Objective:** To verify that Librarians can perform actions typically available to Members if this is intended behavior (e.g., searching books).
- **Priority:** Medium
- **Preconditions:**
  1.  A 'Librarian' user is logged into the system.
  2.  SRS defines shared functionalities (e.g., book search).
- **Test Steps (Iterative for each shared feature):**
  1.  Attempt to use a shared feature (e.g., perform a book search using the same interface a member would use).
- **Test Data:**
  - Librarian credentials.
  - List of shared features from SRS.
- **Expected Result:**
  1.  The Librarian can successfully use the shared functionality, and the behavior aligns with SRS.

### TC_AUTH_RBAC_005: Unauthenticated User Access to Protected Pages

- **Test Scenario:** An unauthenticated (anonymous) user attempts to directly access URLs that require authentication.
- **Test Objective:** To verify that protected pages are not accessible to unauthenticated users.
- **Priority:** High
- **Preconditions:**
  1.  User is not logged in (is anonymous).
  2.  SRS defines protected pages/URLs (e.g., `/dashboard`, `/myprofile`, `/admin/users`).
- **Test Steps (Iterative for several protected URLs of different roles):**
  1.  Open a new browser session (or incognito window) to ensure no active session.
  2.  Attempt to navigate directly to a protected URL (e.g., `/myprofile`).
- **Test Data:**
  - List of protected URLs from SRS.
- **Expected Result:**
  1.  Access is denied.
  2.  The user is redirected to the Login page.
  3.  An informative message may be displayed on the login page (e.g., "Please log in to access this page").

### TC_AUTH_RBAC_006: Unauthenticated User Access to Public Pages (Conditional)

- **Test Scenario:** An unauthenticated (anonymous) user attempts to access pages defined as public in the SRS.
- **Test Objective:** To verify that public pages are accessible to unauthenticated users.
- **Priority:** Medium (Conditional on system having public pages as per SRS)
- **Preconditions:**
  1.  User is not logged in.
  2.  SRS defines public pages (e.g., `/about`, `/contact`, main landing page).
- **Test Steps (Iterative for each public URL):**
  1.  Open a new browser session.
  2.  Attempt to navigate directly to a public URL (e.g., `/about`).
- **Test Data:**
  - List of public URLs from SRS.
- **Expected Result:**
  1.  Access is granted.
  2.  The content of the public page is displayed correctly.

### TC_AUTH_RBAC_007: Data Access Restrictions Based on Role (High-Level)

- **Test Scenario:** Verify that users can only view/manipulate data according to their role's permissions.
- **Test Objective:** To ensure data visibility and modification capabilities strictly adhere to role permissions defined in SRS.
- **Priority:** High
- **Preconditions:**
  1.  Multiple users with different roles (Member A, Member B, Librarian) exist with associated data (e.g., borrowal history).
- **Test Steps:**
  1.  **Member A:** Log in as Member A. Navigate to "My Borrowal History".
  2.  **Librarian:** Log in as Librarian. Navigate to a section where all borrowals can be viewed (if such a feature exists).
  3.  **Member B:** Log in as Member B. Navigate to "My Borrowal History".
- **Test Data:**
  - Member A credentials, Member B credentials, Librarian credentials.
  - Pre-existing borrowal data for Member A and Member B.
- **Expected Result:**
  1.  Member A can only see their own borrowal history. Member A cannot see Member B's or other members' borrowal history.
  2.  Librarian can see borrowal history for Member A, Member B, and potentially all users (as per SRS).
  3.  Member B can only see their own borrowal history.
  - **Note:** This is a high-level test case. Specific feature tests (e.g., for Borrowal Management) will cover detailed data access for those features. This TC focuses on the authentication/authorization aspect of data segregation.

---

**End of Test Cases for Authentication & Authorization**
