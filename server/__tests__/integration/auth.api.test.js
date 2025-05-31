/**
 * API Integration Test Cases for Authentication & Authorization
 */

const request = require('supertest');
const app = require('../../index.js'); // Path to your main Express app file
const mongoose = require('mongoose');
const User = require('../../models/user'); // Adjust path to User model

// Test credentials sourced from environment variables
// These are set by docker-compose.test.yml from .env.test
const apiLibrarianCredentials = {
	email: process.env.TEST_LIBRARIAN_EMAIL, // Changed from username
	password: process.env.TEST_LIBRARIAN_PASSWORD,
};

let testTimestamp; // For generating unique usernames in tests

beforeAll(async () => {
	// The database connection is managed by the application when it starts within Docker.
	// The seedDatabase.js script (run by docker-compose) ensures the user with TEST_LIBRARIAN_EMAIL is seeded.
	if (!apiLibrarianCredentials.email || !apiLibrarianCredentials.password) {
		console.error('FATAL: Test librarian credentials (TEST_LIBRARIAN_EMAIL, TEST_LIBRARIAN_PASSWORD) ' + 'are not set in environment variables. These are required for API tests.');
		// This will cause tests to fail if Jest is configured to exit on unhandled rejections,
		// or you can explicitly exit or throw to stop tests.
		throw new Error('Missing test librarian credentials in environment.');
	}
});

beforeEach(() => {
	// Generate a new timestamp for each test to help create unique data
	testTimestamp = Date.now();
});

afterEach(async () => {
	// Clean up test-specific data created during each test to ensure test isolation.
	// This targets users created with the unique testTimestamp.
	// Assumes users created IN TESTS have a 'username' field as per registration payloads below.
	try {
		if (testTimestamp && User) {
			// Regex to match usernames created by tests using the testTimestamp
			const usernameRegex = new RegExp(
				`^(api_member_${testTimestamp}|missing_pass_${testTimestamp}|invalid_email_${testTimestamp}|api_member_${testTimestamp}_login|api_member_${testTimestamp}_rbac|api_member_${testTimestamp}_rbac_member_feature)`
			);
			await User.deleteMany({ username: { $regex: usernameRegex } });
		}
	} catch (error) {
		console.error('Error during afterEach cleanup in auth.api.test.js:', error.message);
	}
});

// afterAll(async () => {
//   // No need to disconnect mongoose here if the app handles its own connection lifecycle
//   // and tests are run against an app instance.
// });

describe('API: Authentication & Authorization Endpoints', () => {
	let mainLibrarianToken; // Token for the pre-seeded librarian

	// Log in the main librarian once before running tests that require librarian privileges
	beforeAll(async () => {
		const loginPayload = {
			email: apiLibrarianCredentials.email, // Use email for login
			password: apiLibrarianCredentials.password,
		};
		const loginResponse = await request(app).post('/api/auth/login').send(loginPayload);

		if (loginResponse.statusCode === 200 && loginResponse.body.token) {
			mainLibrarianToken = loginResponse.body.token;
		} else {
			// Log detailed error to help diagnose CI/test environment issues
			console.error('Failed to log in as main librarian during test setup:', loginResponse.status, loginResponse.body);
			throw new Error(
				`Librarian login failed in beforeAll with email ${apiLibrarianCredentials.email}. ` + // Changed to email
					`Status: ${loginResponse.status}. Body: ${JSON.stringify(loginResponse.body)}. ` +
					`Ensure the librarian is correctly seeded by seedDatabase.js with credentials from .env.test.`
			);
		}
	});

	describe('User Registration (by Librarian) - API: POST /api/admin/users/register', () => {
		// These tests create users with 'username', 'email', 'fullName', 'role'.
		// This implies the User model supports these fields.
		it('TC_AUTH_REG_001_API: Successful new user (Member) registration by Librarian', async () => {
			const newApiMemberUsername = `api_member_${testTimestamp}`;
			const newUserPayload = {
				username: newApiMemberUsername, // Tests create users with a username
				password: 'ValidPassword123!', // Standard password for test-created users
				email: `${newApiMemberUsername}@example.com`,
				fullName: 'API Test Member',
				role: 'Member',
			};

			const response = await request(app)
				.post('/api/admin/users/register') // Ensure this is your admin registration endpoint
				.set('Authorization', `Bearer ${mainLibrarianToken}`)
				.send(newUserPayload);

			expect(response.statusCode).toBe(201); // Or 200, depending on your API's success response for creation
			expect(response.body.message).toMatch(/User registered successfully/i); // Adjust expected message if different
			expect(response.body.user).toBeDefined();
			expect(response.body.user.username).toBe(newApiMemberUsername); // Checks username for test-created user
			expect(response.body.user.role).toBe('Member');
		});

		it('TC_AUTH_REG_002_API: Attempt to register a new user with an existing username by Librarian', async () => {
			const existingUsername = `api_member_${testTimestamp}`; // Use the same username pattern for uniqueness
			const firstUserPayload = {
				username: existingUsername,
				password: 'ValidPassword123!',
				email: `${existingUsername}@example.com`, // Unique email based on username
				fullName: 'API Test Member Existing',
				role: 'Member',
			};
			// Register the user first
			await request(app).post('/api/admin/users/register').set('Authorization', `Bearer ${mainLibrarianToken}`).send(firstUserPayload);

			// Attempt to register again with the same username but different email
			const secondUserPayload = { ...firstUserPayload, email: `another_${existingUsername}@example.com` };
			const response = await request(app).post('/api/admin/users/register').set('Authorization', `Bearer ${mainLibrarianToken}`).send(secondUserPayload);

			expect(response.statusCode).toBe(400); // Or 409 (Conflict) if your API uses that for duplicates
			expect(response.body.error).toMatch(/Username already exists/i); // Adjust error message as per your API
		});

		it('TC_AUTH_REG_003_API: Attempt to register a new user with missing required fields (e.g., password) by Librarian', async () => {
			const payloadMissingPassword = {
				username: `missing_pass_${testTimestamp}`, // Test users created with username
				email: `missing_pass_${testTimestamp}@example.com`,
				fullName: 'Test MissingPass',
				role: 'Member',
			}; // Password field is omitted

			const response = await request(app).post('/api/admin/users/register').set('Authorization', `Bearer ${mainLibrarianToken}`).send(payloadMissingPassword);

			expect(response.statusCode).toBe(400);
			expect(response.body.error).toMatch(/Password is required/i); // Adjust error message if different
		});

		it('TC_AUTH_REG_004_API: Attempt to register a new user with invalid data format (e.g., email) by Librarian', async () => {
			const payloadInvalidEmail = {
				username: `invalid_email_${testTimestamp}`, // Test users created with username
				password: 'ValidPassword123!',
				email: 'invalidemailformat', // Clearly invalid email format
				fullName: 'Test InvalidEmail',
				role: 'Member',
			};

			const response = await request(app).post('/api/admin/users/register').set('Authorization', `Bearer ${mainLibrarianToken}`).send(payloadInvalidEmail);

			expect(response.statusCode).toBe(400);
			expect(response.body.error).toMatch(/Invalid email format/i); // Adjust error message if different
		});
	});

	describe('User Login - API: POST /api/auth/login', () => {
		it('TC_AUTH_LOGIN_001_API: Successful login with valid Librarian credentials', async () => {
			const loginPayload = {
				email: apiLibrarianCredentials.email, // Use email for login
				password: apiLibrarianCredentials.password,
			};
			const response = await request(app).post('/api/auth/login').send(loginPayload);
			expect(response.statusCode).toBe(200);
			expect(response.body.token).toBeDefined();
			// Assuming the backend returns the email in the user object if logged in via email
			expect(response.body.user.email).toBe(apiLibrarianCredentials.email);
			expect(response.body.user.role).toBe('Librarian'); // Or 'Admin' if that's the role string used
		});

		it('TC_AUTH_LOGIN_002_API: Successful login with valid Member credentials', async () => {
			const memberUsernameForLogin = `api_member_${testTimestamp}_login`;
			const memberEmailForLogin = `${memberUsernameForLogin}@example.com`;
			const memberPasswordForLogin = 'MemberPass123!';
			// Register a member specifically for this login test to ensure it exists
			// This member is created with a 'username' and 'email'
			await request(app).post('/api/admin/users/register').set('Authorization', `Bearer ${mainLibrarianToken}`).send({
				username: memberUsernameForLogin,
				password: memberPasswordForLogin,
				email: memberEmailForLogin,
				fullName: 'Login Test Member',
				role: 'Member',
			});

			// Login this member using their email (assuming login endpoint supports email for all users)
			const response = await request(app).post('/api/auth/login').send({
				email: memberEmailForLogin, // Login member by email
				password: memberPasswordForLogin,
			});

			expect(response.statusCode).toBe(200);
			expect(response.body.token).toBeDefined();
			expect(response.body.user.email).toBe(memberEmailForLogin); // Check email
			expect(response.body.user.username).toBe(memberUsernameForLogin); // Also check username if returned
			expect(response.body.user.role).toBe('Member');
		});

		it('TC_AUTH_LOGIN_003_API: Attempt login with invalid email', async () => {
			const response = await request(app).post('/api/auth/login').send({ email: 'nonexistent_user@example.com', password: 'anypassword' }); // Use email
			expect(response.statusCode).toBe(401); // Or 400, depending on API
			expect(response.body.error).toMatch(/Invalid email or password/i); // Adjust message
		});

		it('TC_AUTH_LOGIN_004_API: Attempt login with valid email but invalid password', async () => {
			const response = await request(app).post('/api/auth/login').send({ email: apiLibrarianCredentials.email, password: 'IncorrectPasswordDefinitely!' }); // Use email
			expect(response.statusCode).toBe(401); // Or 400
			expect(response.body.error).toMatch(/Invalid email or password/i); // Adjust message
		});

		it('TC_AUTH_LOGIN_005_API: Attempt login with empty email field', async () => {
			const response = await request(app).post('/api/auth/login').send({ password: 'anypassword' }); // Email omitted
			expect(response.statusCode).toBe(400);
			expect(response.body.error).toMatch(/Email is required/i); // Adjust message if login expects email
		});

		it('TC_AUTH_LOGIN_006_API: Attempt login with empty password field', async () => {
			const response = await request(app).post('/api/auth/login').send({ email: apiLibrarianCredentials.email }); // Password omitted
			expect(response.statusCode).toBe(400);
			expect(response.body.error).toMatch(/Password is required/i); // Adjust message
		});
	});

	describe('User Logout - API: POST /api/auth/logout', () => {
		it('TC_AUTH_LOGOUT_001_API & TC_AUTH_LOGOUT_002_API: Successful logout for a logged-in user', async () => {
			// Login the librarian to get a fresh token for this specific test
			const loginForLogoutRes = await request(app).post('/api/auth/login').send({
				email: apiLibrarianCredentials.email, // Use email
				password: apiLibrarianCredentials.password,
			});
			const tokenForLogoutTest = loginForLogoutRes.body.token;
			expect(tokenForLogoutTest).toBeDefined();

			const response = await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${tokenForLogoutTest}`);

			expect(response.statusCode).toBe(200); // Or 204 No Content
			expect(response.body.message).toMatch(/Logged out successfully/i); // Adjust message

			// If your logout is stateful (e.g., token blacklisting):
			// const protectedResponse = await request(app)
			//   .get('/api/admin/users') // An admin protected route
			//   .set('Authorization', `Bearer ${tokenForLogoutTest}`);
			// expect(protectedResponse.statusCode).toBe(401); // Unauthorized because token is now invalid
		});
	});

	describe('Role-Based Access Control (RBAC) - API', () => {
		let rbacLibrarianToken;
		beforeAll(async () => {
			// Ensure a valid librarian token for this block
			const loginResponse = await request(app).post('/api/auth/login').send({
				email: apiLibrarianCredentials.email, // Use email
				password: apiLibrarianCredentials.password,
			});
			if (loginResponse.statusCode === 200 && loginResponse.body.token) {
				rbacLibrarianToken = loginResponse.body.token;
			} else {
				throw new Error('RBAC: Failed to log in as main librarian for test setup.');
			}
		});

		it('TC_AUTH_RBAC_001_API: Verify Librarian can access Librarian-specific API features', async () => {
			const response = await request(app)
				.get('/api/admin/users') // Example: endpoint to list users, typically admin-only
				.set('Authorization', `Bearer ${rbacLibrarianToken}`);
			expect(response.statusCode).toBe(200);
			// Add more specific assertions: e.g., expect(Array.isArray(response.body.users)).toBe(true);
		});

		it('TC_AUTH_RBAC_002_API: Verify Member cannot access Librarian-specific API features', async () => {
			const memberUsernameForRbac = `api_member_${testTimestamp}_rbac`;
			const memberEmailForRbac = `${memberUsernameForRbac}@example.com`;
			const memberPasswordForRbac = 'MemberPassRbac123!';
			// Register a member
			await request(app).post('/api/admin/users/register').set('Authorization', `Bearer ${rbacLibrarianToken}`).send({
				username: memberUsernameForRbac,
				password: memberPasswordForRbac,
				email: memberEmailForRbac,
				fullName: 'RBAC Test Member',
				role: 'Member',
			});
			// Login as member (using email)
			const memberLoginRes = await request(app).post('/api/auth/login').send({
				email: memberEmailForRbac, // Login with email
				password: memberPasswordForRbac,
			});
			const memberToken = memberLoginRes.body.token;
			expect(memberToken).toBeDefined();

			const response = await request(app)
				.get('/api/admin/users') // Attempt to access admin-only endpoint
				.set('Authorization', `Bearer ${memberToken}`);
			expect(response.statusCode).toBe(403); // Forbidden
			expect(response.body.error).toMatch(/Access denied/i); // Adjust as per your API's error message for authorization failure
		});

		it('TC_AUTH_RBAC_003_API: Verify Member can access Member-specific API features', async () => {
			const memberUsernameForRbacFeature = `api_member_${testTimestamp}_rbac_member_feature`;
			const memberEmailForRbacFeature = `${memberUsernameForRbacFeature}@example.com`;
			const memberPasswordForRbacFeature = 'MemberPassRbacFeature123!';
			// Register a member
			await request(app).post('/api/admin/users/register').set('Authorization', `Bearer ${rbacLibrarianToken}`).send({
				username: memberUsernameForRbacFeature,
				password: memberPasswordForRbacFeature,
				email: memberEmailForRbacFeature,
				fullName: 'RBAC Member Feature Test',
				role: 'Member',
			});
			// Login as member (using email)
			const memberLoginRes = await request(app).post('/api/auth/login').send({
				email: memberEmailForRbacFeature, // Login with email
				password: memberPasswordForRbacFeature,
			});
			const memberToken = memberLoginRes.body.token;
			expect(memberToken).toBeDefined();

			const response = await request(app)
				.get('/api/member/borrow-history') // Replace with an actual member-only GET endpoint in your API
				.set('Authorization', `Bearer ${memberToken}`);
			expect(response.statusCode).toBe(200);
			// Add assertions for member-specific data, e.g., expect(response.body.history).toBeDefined();
		});

		it('TC_AUTH_RBAC_004_API: Verify guest (not logged in) user restriction from protected API pages', async () => {
			// Attempt to access Librarian-specific endpoint without any token
			let response = await request(app).get('/api/admin/users');
			expect(response.statusCode).toBe(401); // Unauthorized (no token)

			// Attempt to access Member-specific endpoint without any token
			response = await request(app).get('/api/member/borrow-history');
			expect(response.statusCode).toBe(401); // Unauthorized (no token)
		});
	});
});
