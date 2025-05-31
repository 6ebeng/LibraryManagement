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
	email: process.env.TEST_LIBRARIAN_EMAIL,
	password: process.env.TEST_LIBRARIAN_PASSWORD,
};

let testTimestamp; // For generating unique identifiers in tests

beforeAll(async () => {
	// The database connection is managed by the application when it starts within Docker.
	// The seedDatabase.js script (run by docker-compose) ensures the user with TEST_LIBRARIAN_EMAIL is seeded.
	if (!apiLibrarianCredentials.email || !apiLibrarianCredentials.password) {
		console.error('FATAL: Test librarian credentials (TEST_LIBRARIAN_EMAIL, TEST_LIBRARIAN_PASSWORD) ' + 'are not set in environment variables. These are required for API tests.');
		throw new Error('Missing test librarian credentials in environment.');
	}
});

beforeEach(() => {
	// Generate a new timestamp for each test to help create unique data
	testTimestamp = Date.now();
});

afterEach(async () => {
	// Clean up test-specific data created during each test to ensure test isolation.
	// This targets users created with unique emails derived from testTimestamp.
	try {
		if (testTimestamp && User) {
			// Regex to match email local parts created by tests using the testTimestamp
			const identifierPartRegexStr = `(?:api_member_${testTimestamp}|missing_pass_${testTimestamp}|invalid_email_${testTimestamp}|api_member_${testTimestamp}_login|api_member_${testTimestamp}_rbac|api_member_${testTimestamp}_rbac_member_feature)`;
			const emailRegex = new RegExp(`^${identifierPartRegexStr}@example\\.com$`);
			await User.deleteMany({ email: { $regex: emailRegex } });
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
			email: apiLibrarianCredentials.email,
			password: apiLibrarianCredentials.password,
		};
		const loginResponse = await request(app).post('/api/auth/login').send(loginPayload);

		if (loginResponse.statusCode === 200 && loginResponse.body.token) {
			mainLibrarianToken = loginResponse.body.token;
		} else {
			console.error('Failed to log in as main librarian during test setup:', loginResponse.status, loginResponse.body);
			throw new Error(
				`Librarian login failed in beforeAll with email ${apiLibrarianCredentials.email}. ` +
					`Status: ${loginResponse.status}. Body: ${JSON.stringify(loginResponse.body)}. ` +
					`Ensure the librarian is correctly seeded by seedDatabase.js with credentials from .env.test.`
			);
		}
	});

	describe('User Registration (by Librarian) - API: POST /api/admin/users/register', () => {
		it('TC_AUTH_REG_001_API: Successful new user (Member) registration by Librarian', async () => {
			const newApiMemberName = `api_member_${testTimestamp}`;
			const newUserPayload = {
				name: newApiMemberName, // Changed from username to name
				password: 'ValidPassword123!',
				email: `${newApiMemberName}@example.com`, // Email derived from the name/identifier
				// fullName: 'API Test Member', // Retain if your API uses this to populate User.name, otherwise 'name' field above is primary
				role: 'Member',
			};

			const response = await request(app).post('/api/admin/users/register').set('Authorization', `Bearer ${mainLibrarianToken}`).send(newUserPayload);

			expect(response.statusCode).toBe(201);
			expect(response.body.message).toMatch(/User registered successfully/i);
			expect(response.body.user).toBeDefined();
			expect(response.body.user.name).toBe(newApiMemberName); // Expect 'name'
			expect(response.body.user.email).toBe(newUserPayload.email);
			expect(response.body.user.role).toBe('Member');
		});

		it('TC_AUTH_REG_002_API: Attempt to register a new user with an existing email by Librarian', async () => {
			const existingName = `api_member_${testTimestamp}`;
			const existingEmail = `${existingName}@example.com`;

			const firstUserPayload = {
				name: existingName,
				password: 'ValidPassword123!',
				email: existingEmail,
				role: 'Member',
			};
			// Register the user first
			await request(app).post('/api/admin/users/register').set('Authorization', `Bearer ${mainLibrarianToken}`).send(firstUserPayload);

			// Attempt to register again with the same email but different name
			const secondUserPayload = { ...firstUserPayload, name: `another_${existingName}` };
			const response = await request(app).post('/api/admin/users/register').set('Authorization', `Bearer ${mainLibrarianToken}`).send(secondUserPayload);

			expect(response.statusCode).toBe(400); // Or 409 (Conflict)
			// Adjust error message. APIs usually check for unique email first.
			// If name also needs to be unique and is checked, this message might differ.
			expect(response.body.error).toMatch(/Email already exists/i);
		});

		it('TC_AUTH_REG_003_API: Attempt to register a new user with missing required fields (e.g., password) by Librarian', async () => {
			const payloadMissingPassword = {
				name: `missing_pass_${testTimestamp}`,
				email: `missing_pass_${testTimestamp}@example.com`,
				role: 'Member',
			};

			const response = await request(app).post('/api/admin/users/register').set('Authorization', `Bearer ${mainLibrarianToken}`).send(payloadMissingPassword);

			expect(response.statusCode).toBe(400);
			expect(response.body.error).toMatch(/Password is required/i);
		});

		it('TC_AUTH_REG_004_API: Attempt to register a new user with invalid data format (e.g., email) by Librarian', async () => {
			const payloadInvalidEmail = {
				name: `invalid_email_${testTimestamp}`,
				password: 'ValidPassword123!',
				email: 'invalidemailformat',
				role: 'Member',
			};

			const response = await request(app).post('/api/admin/users/register').set('Authorization', `Bearer ${mainLibrarianToken}`).send(payloadInvalidEmail);

			expect(response.statusCode).toBe(400);
			expect(response.body.error).toMatch(/Invalid email format/i);
		});
	});

	describe('User Login - API: POST /api/auth/login', () => {
		it('TC_AUTH_LOGIN_001_API: Successful login with valid Librarian credentials', async () => {
			const loginPayload = {
				email: apiLibrarianCredentials.email,
				password: apiLibrarianCredentials.password,
			};
			const response = await request(app).post('/api/auth/login').send(loginPayload);
			expect(response.statusCode).toBe(200);
			expect(response.body.token).toBeDefined();
			expect(response.body.user.email).toBe(apiLibrarianCredentials.email);
			expect(response.body.user.role).toBe('Librarian');
		});

		it('TC_AUTH_LOGIN_002_API: Successful login with valid Member credentials', async () => {
			const memberNameForLogin = `api_member_${testTimestamp}_login`;
			const memberEmailForLogin = `${memberNameForLogin}@example.com`;
			const memberPasswordForLogin = 'MemberPass123!';

			await request(app).post('/api/admin/users/register').set('Authorization', `Bearer ${mainLibrarianToken}`).send({
				name: memberNameForLogin, // Use name for registration
				password: memberPasswordForLogin,
				email: memberEmailForLogin,
				role: 'Member',
			});

			const response = await request(app).post('/api/auth/login').send({
				email: memberEmailForLogin,
				password: memberPasswordForLogin,
			});

			expect(response.statusCode).toBe(200);
			expect(response.body.token).toBeDefined();
			expect(response.body.user.email).toBe(memberEmailForLogin);
			expect(response.body.user.name).toBe(memberNameForLogin); // Expect 'name'
			expect(response.body.user.role).toBe('Member');
		});

		it('TC_AUTH_LOGIN_003_API: Attempt login with invalid email', async () => {
			const response = await request(app).post('/api/auth/login').send({ email: 'nonexistent_user@example.com', password: 'anypassword' });
			expect(response.statusCode).toBe(401);
			expect(response.body.error).toMatch(/Invalid email or password/i);
		});

		it('TC_AUTH_LOGIN_004_API: Attempt login with valid email but invalid password', async () => {
			const response = await request(app).post('/api/auth/login').send({ email: apiLibrarianCredentials.email, password: 'IncorrectPasswordDefinitely!' });
			expect(response.statusCode).toBe(401);
			expect(response.body.error).toMatch(/Invalid email or password/i);
		});

		it('TC_AUTH_LOGIN_005_API: Attempt login with empty email field', async () => {
			const response = await request(app).post('/api/auth/login').send({ password: 'anypassword' });
			expect(response.statusCode).toBe(400);
			expect(response.body.error).toMatch(/Email is required/i);
		});

		it('TC_AUTH_LOGIN_006_API: Attempt login with empty password field', async () => {
			const response = await request(app).post('/api/auth/login').send({ email: apiLibrarianCredentials.email });
			expect(response.statusCode).toBe(400);
			expect(response.body.error).toMatch(/Password is required/i);
		});
	});

	describe('User Logout - API: POST /api/auth/logout', () => {
		it('TC_AUTH_LOGOUT_001_API & TC_AUTH_LOGOUT_002_API: Successful logout for a logged-in user', async () => {
			const loginForLogoutRes = await request(app).post('/api/auth/login').send({
				email: apiLibrarianCredentials.email,
				password: apiLibrarianCredentials.password,
			});
			const tokenForLogoutTest = loginForLogoutRes.body.token;
			expect(tokenForLogoutTest).toBeDefined();

			const response = await request(app).post('/api/auth/logout').set('Authorization', `Bearer ${tokenForLogoutTest}`);

			expect(response.statusCode).toBe(200);
			expect(response.body.message).toMatch(/Logged out successfully/i);

			// Optional: If your logout blacklists tokens, test accessing a protected route
			// const protectedResponse = await request(app)
			//   .get('/api/admin/users') // An admin protected route
			//   .set('Authorization', `Bearer ${tokenForLogoutTest}`);
			// expect(protectedResponse.statusCode).toBe(401);
		});
	});

	describe('Role-Based Access Control (RBAC) - API', () => {
		let rbacLibrarianToken;
		beforeAll(async () => {
			const loginResponse = await request(app).post('/api/auth/login').send({
				email: apiLibrarianCredentials.email,
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
				.get('/api/admin/users') // Example admin-only endpoint
				.set('Authorization', `Bearer ${rbacLibrarianToken}`);
			expect(response.statusCode).toBe(200);
		});

		it('TC_AUTH_RBAC_002_API: Verify Member cannot access Librarian-specific API features', async () => {
			const memberNameForRbac = `api_member_${testTimestamp}_rbac`;
			const memberEmailForRbac = `${memberNameForRbac}@example.com`;
			const memberPasswordForRbac = 'MemberPassRbac123!';

			await request(app).post('/api/admin/users/register').set('Authorization', `Bearer ${rbacLibrarianToken}`).send({
				name: memberNameForRbac, // Use name
				password: memberPasswordForRbac,
				email: memberEmailForRbac,
				role: 'Member',
			});

			const memberLoginRes = await request(app).post('/api/auth/login').send({
				email: memberEmailForRbac,
				password: memberPasswordForRbac,
			});
			const memberToken = memberLoginRes.body.token;
			expect(memberToken).toBeDefined();

			const response = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${memberToken}`);
			expect(response.statusCode).toBe(403);
			expect(response.body.error).toMatch(/Access denied/i);
		});

		it('TC_AUTH_RBAC_003_API: Verify Member can access Member-specific API features', async () => {
			const memberNameForRbacFeature = `api_member_${testTimestamp}_rbac_member_feature`;
			const memberEmailForRbacFeature = `${memberNameForRbacFeature}@example.com`;
			const memberPasswordForRbacFeature = 'MemberPassRbacFeature123!';

			await request(app).post('/api/admin/users/register').set('Authorization', `Bearer ${rbacLibrarianToken}`).send({
				name: memberNameForRbacFeature, // Use name
				password: memberPasswordForRbacFeature,
				email: memberEmailForRbacFeature,
				role: 'Member',
			});
			const memberLoginRes = await request(app).post('/api/auth/login').send({
				email: memberEmailForRbacFeature,
				password: memberPasswordForRbacFeature,
			});
			const memberToken = memberLoginRes.body.token;
			expect(memberToken).toBeDefined();

			const response = await request(app)
				.get('/api/member/borrow-history') // Replace with an actual member-only GET endpoint
				.set('Authorization', `Bearer ${memberToken}`);
			expect(response.statusCode).toBe(200);
			// e.g., expect(response.body.history).toBeDefined();
		});

		it('TC_AUTH_RBAC_004_API: Verify guest (not logged in) user restriction from protected API pages', async () => {
			let response = await request(app).get('/api/admin/users');
			expect(response.statusCode).toBe(401);

			response = await request(app).get('/api/member/borrow-history');
			expect(response.statusCode).toBe(401);
		});
	});
});
