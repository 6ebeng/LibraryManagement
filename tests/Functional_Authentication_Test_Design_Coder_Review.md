# Functional Test Design: Authentication & Authorization - Coder's Review & Technical Enhancements

**Document Version:** 1.0
**Creation Date:** 2025-05-30
**Author:** 6ebeng (as Coder)
**Phase:** 2
**Task:** 2.1 Functional: Authentication Test Design (Coder's Technical Review & Enhancement)
**Basis:**

- Software Requirements Specification (SRS)
- Existing Functional Test Cases for Authentication (`Functional_Test_Cases_Authentication.md` by Non-Coders)
- Anticipated system architecture and implementation details.

This document provides a coder's perspective on the functional authentication test design. It aims to enhance the existing black-box test cases by adding considerations for technical edge cases, API-level interactions, data integrity, session/token management, and security aspects related to the implementation.

---

## General Coder Considerations for All Authentication Areas:

- **API Response Codes & Bodies:** For every test case involving an API call (registration, login, logout), explicitly define and verify the expected HTTP status codes (200, 201, 400, 401, 403, 409, 500 etc.) and the structure/content of the JSON response body, including specific error messages or codes from the backend.
- **Input Sanitization (Backend):** While the UI might have client-side validation, design tests that bypass UI and directly hit APIs with malicious or malformed inputs in authentication fields (e.g., username, email, password reset tokens) to check for vulnerabilities like SQL Injection, XSS (if these values are ever reflected), or NoSQL injection.
- **Concurrency & Race Conditions:** Consider scenarios where multiple requests related to authentication for the same user might occur concurrently (e.g., multiple login attempts, registration + login, password change + login). While hard to test functionally without specific tools, be mindful of potential areas like account locking or session creation.
- **Database Integrity:** For operations that modify user data (registration, role changes), verify the state of the database directly (if possible during testing) to ensure atomicity, consistency, and correctness beyond what the UI or API response shows.
- **Logging:** Ensure that critical authentication events (successful logins, failed attempts, lockouts, password changes, registration) are being logged appropriately on the backend with sufficient detail for auditing and troubleshooting, but without logging sensitive information like plain-text passwords. (This is a verification point during testing).
- **Idempotency:** For relevant API endpoints (e.g., resending a registration confirmation if the first attempt failed due to network issues), check if they behave idempotently where appropriate.

---

## 1. User Registration (Librarian Creating Users)

**Reference:** Section 1 of `Functional_Test_Cases_Authentication.md`

**Coder's Technical Enhancement Considerations & Additional Test Cases:**

- **TC_AUTH_REG_TECH_001: Transactional Integrity - Partial Creation Failure**

  - **Objective:** Verify that user creation is atomic. If any part of the user creation process fails on the backend (e.g., creating user record succeeds but assigning role fails, or saving to an audit log fails), the entire transaction should roll back.
  - **Method (Conceptual - may require backend instrumentation or specific error injection):** Simulate a failure during a secondary step of user creation (e.g., database constraint violation on a related table after the main user record is inserted but before the transaction commits).
  - **Expected Result:** The user record is not created, or is in a consistent (rolled-back) state. No partially created user data should exist. API should return an appropriate error (e.g., 500 Internal Server Error or a specific business logic error code).

- **TC_AUTH_REG_TECH_002: Password Hashing Verification (Conceptual)**

  - **Objective:** Ensure passwords are not stored in plain text.
  - **Method:** After user creation, inspect the database (if accessible in test environment). The password field for the new user should contain a hashed value, not the plain text password. Verify that different users with the same password have different hashes (indicating use of a salt).
  - **Expected Result:** Password field contains a non-plaintext, salted hash.

- **TC_AUTH_REG_TECH_003: API - Direct Call with Duplicate Username/Email**

  - **Objective:** Verify backend API correctly handles duplicate username/email constraints even if client-side checks are bypassed.
  - **Method:** Use an API client (e.g., Postman) to directly call the user registration API endpoint with data that includes a username or email already existing in the database.
  - **Test Data:** Payload with existing username, payload with existing email.
  - **Expected Result:** API returns a specific error code (e.g., 409 Conflict) and a meaningful error message in the response body. User is not created.

- **TC_AUTH_REG_TECH_004: API - Field Lengths Exceeding Backend Limits**

  - **Objective:** Verify backend gracefully handles inputs exceeding defined database column lengths or backend validation limits, even if UI limits them.
  - **Method:** Using an API client, send registration requests with usernames, emails, or other fields that are excessively long.
  - **Expected Result:** API returns an appropriate error code (e.g., 400 Bad Request) and message. No data truncation or unhandled exceptions.

- **TC_AUTH_REG_TECH_005: Default Role Assignment (If Applicable)**
  - **Objective:** If the role is optional in the API request and a default role should be assigned by the backend, verify this behavior.
  - **Method:** Call the registration API without specifying a role (if the API design allows this).
  - **Expected Result:** User is created with the expected default role as per SRS or backend logic.

---

## 2. User Login

**Reference:** Section 2 of `Functional_Test_Cases_Authentication.md`

**Coder's Technical Enhancement Considerations & Additional Test Cases:**

- **TC_AUTH_LOG_TECH_001: Session Creation & Cookie Attributes**

  - **Objective:** Verify correct session creation and secure cookie attributes.
  - **Method:** After a successful login, use browser developer tools to inspect the session cookie(s) set by the application.
  - **Expected Result:**
    - Session cookie is present.
    - Cookie attributes are secure: `HttpOnly` flag is set, `Secure` flag is set (if HTTPS is used), `SameSite` attribute is appropriately set (e.g., `Lax` or `Strict`).
    - Session ID appears to be a random, high-entropy string.

- **TC_AUTH_LOG_TECH_002: JWT Properties (If JWTs are used)**

  - **Objective:** Verify the structure and security of JSON Web Tokens if they are used for session management.
  - **Method:** After successful login, capture the JWT. Decode it (without verifying signature for this test, just inspect content).
  - **Expected Result:**
    - JWT contains expected claims (e.g., `sub` for user ID, `role`, `exp` for expiry, `iat` for issued at).
    - `exp` claim indicates a reasonable session duration.
    - Sensitive information is not stored directly in the JWT payload unless encrypted or non-critical.
    - The `alg` (algorithm) in the header is an expected strong algorithm (e.g., RS256, ES256, not 'none').

- **TC_AUTH_LOG_TECH_003: Account Lockout Mechanism (Backend Verification)**

  - **Objective:** Verify that the account lockout mechanism (e.g., after N failed login attempts) is enforced by the backend.
  - **Method:**
    1.  Identify a user account.
    2.  Using an API client, send multiple (e.g., N+1) failed login attempts to the login API endpoint for this user.
    3.  Attempt a valid login for the same user via API.
    4.  (If applicable) Check if an administrator can unlock the account, and if the lockout expires after a defined time.
  - **Expected Result:** After N failed attempts, the (N+1)th failed attempt and subsequent valid login attempts (until unlocked or expiry) should return an error indicating the account is locked (e.g., HTTP 403 Forbidden or a specific error code).

- **TC_AUTH_LOG_TECH_004: API Response for Various Login Failures**

  - **Objective:** Ensure the login API returns distinct and correct HTTP status codes and error messages for different failure reasons.
  - **Method:** Use an API client to simulate:
    1.  Invalid username.
    2.  Valid username, invalid password.
    3.  Disabled/locked account (after triggering lockout).
    4.  Malformed request (e.g., missing username or password field in JSON payload).
  - **Expected Result:**
    1.  e.g., 401 Unauthorized (or 400 Bad Request if username format is invalid).
    2.  e.g., 401 Unauthorized.
    3.  e.g., 403 Forbidden with "account locked" message.
    4.  e.g., 400 Bad Request with "missing fields" message.
    - Avoid overly specific error messages that could confirm existence of usernames (e.g., prefer "Invalid username or password" over "User not found" or "Incorrect password").

- **TC_AUTH_LOG_TECH_005: Token Expiry and Refresh (If Applicable)**
  - **Objective:** If using JWTs with expiry and a refresh token mechanism, verify this flow.
  - **Method:**
    1.  Log in and obtain an access token and a refresh token.
    2.  Wait for the access token to expire (or manually set system time forward if possible in test environment).
    3.  Attempt to use the expired access token to access a protected resource.
    4.  Use the refresh token to obtain a new access token.
    5.  Use the new access token to access a protected resource.
    6.  Test using an expired/invalid refresh token.
  - **Expected Result:**
    1.  Request with expired access token fails (e.g., 401 Unauthorized).
    2.  Refresh token successfully yields a new, valid access token.
    3.  New access token grants access.
    4.  Expired/invalid refresh token fails to grant a new access token.

---

## 3. User Logout

**Reference:** Section 3 of `Functional_Test_Cases_Authentication.md`

**Coder's Technical Enhancement Considerations & Additional Test Cases:**

- **TC_AUTH_OUT_TECH_001: Server-Side Session Invalidation**

  - **Objective:** Verify that the session is properly invalidated on the server-side, not just by clearing client-side cookies.
  - **Method:**
    1.  Log in and obtain the session cookie/token.
    2.  Perform the logout action via UI or API.
    3.  Attempt to use the previously obtained session cookie/token to make an API call to a protected endpoint.
  - **Expected Result:** The API call with the old session cookie/token fails with an unauthorized error (e.g., 401 Unauthorized), indicating the session is no longer valid on the server.

- **TC_AUTH_OUT_TECH_002: JWT Blacklisting (If using JWTs and a blacklisting strategy)**
  - **Objective:** If JWTs are used and a blacklisting mechanism is in place for logout (since JWTs are otherwise stateless), verify that a logged-out JWT cannot be reused.
  - **Method:**
    1.  Log in, obtain JWT.
    2.  Call logout API endpoint.
    3.  Immediately try to use the same JWT to access a protected API resource.
  - **Expected Result:** Access is denied (e.g., 401 Unauthorized), even if the JWT's expiry time has not yet passed.

---

## 4. Role-Based Access Control (RBAC)

**Reference:** Section 4 of `Functional_Test_Cases_Authentication.md`

**Coder's Technical Enhancement Considerations & Additional Test Cases:**

- **TC_AUTH_RBAC_TECH_001: API Endpoint Authorization Testing**

  - **Objective:** Directly test API endpoints with tokens/sessions from users with different roles to verify backend authorization logic.
  - **Method:** For each key API endpoint that should be role-restricted:
    1.  Log in as User A (e.g., Member), obtain their token/session. Attempt to call a Librarian-only API endpoint.
    2.  Log in as User B (e.g., Librarian), obtain their token/session. Attempt to call the same Librarian-only API endpoint.
    3.  Attempt to call the API endpoint with an unauthenticated request.
  - **Expected Result:**
    1.  User A's call fails (e.g., 403 Forbidden).
    2.  User B's call succeeds (e.g., 200 OK or other success code).
    3.  Unauthenticated call fails (e.g., 401 Unauthorized).

- **TC_AUTH_RBAC_TECH_002: Role Information in Session/Token**

  - **Objective:** Verify that role information is correctly embedded and utilized from the session data or token claims.
  - **Method:** Inspect the server-side session details (if possible) or decode the JWT after login to confirm the correct role is associated with the session/token.
  - **Expected Result:** The session/token accurately reflects the user's role from the database.

- **TC_AUTH_RBAC_TECH_003: Propagation of Role Changes**
  - **Objective:** If a user's role is changed by an administrator, verify when this change takes effect for an existing active session/token.
  - **Method:**
    1.  User A (Member) logs in, obtains a session/token.
    2.  Administrator changes User A's role from Member to Librarian.
    3.  User A, using their _original_ session/token, attempts to access a Librarian-only resource.
    4.  (Optional) User A logs out and logs back in. Attempts to access Librarian-only resource.
  - **Expected Result:**
    - Ideally, the original session/token should not immediately grant new permissions unless the system re-evaluates roles on each request (less common for JWTs without re-fetching). The SRS should define this behavior. Access may still be denied.
    - After logout and login, the new role should be active, and access to Librarian resources should be granted.
    - If JWTs are used, the claims in the original JWT won't change. The system might require a new token to reflect role changes.

---

**End of Coder's Review and Technical Enhancements for Authentication Test Design**
