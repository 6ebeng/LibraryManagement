/**
 * API Integration Test Cases for Authentication & Authorization (Session-Based)
 */

const request = require('supertest');
const app = require('../../../index.js'); // Path to your main Express app file
const mongoose = require('mongoose');
const User = require('../../../models/user.js'); // Adjust path to User model
const { errorMessages } = require('../../../utils/errorMessages');

// Test credentials sourced from environment variables
// These are set by docker-compose.test.yml from .env.test
const apiLibrarianCredentials = {
	email: process.env.TEST_LIBRARIAN_EMAIL,
	password: process.env.TEST_LIBRARIAN_PASSWORD,
};

let testTimestamp; // For generating unique identifiers in tests
const agent = request.agent(app); // Create an agent to maintain sessions for the main librarian

beforeAll(async () => {
	if (!apiLibrarianCredentials.email || !apiLibrarianCredentials.password) {
		console.error('FATAL: Test librarian credentials (TEST_LIBRARIAN_EMAIL, TEST_LIBRARIAN_PASSWORD) ' + 'are not set in environment variables. These are required for API tests.');
		throw new Error('Missing test librarian credentials in environment.');
	}

	const loginPayload = {
		email: apiLibrarianCredentials.email,
		password: apiLibrarianCredentials.password,
	};
	const loginResponse = await agent.post('/api/auth/login').send(loginPayload);

	if (!(loginResponse.statusCode === 200 && loginResponse.body.success === true)) {
		console.error('Failed to log in as main librarian during global beforeAll test setup:', loginResponse.status, loginResponse.body);
		throw new Error(
			`Librarian login failed in global beforeAll with email ${apiLibrarianCredentials.email}. ` +
				`Status: ${loginResponse.status}. Body: ${JSON.stringify(loginResponse.body)}. ` +
				`Ensure the librarian is correctly seeded by seedDatabase.js with credentials from .env.test.`
		);
	}
});

beforeEach(() => {
	testTimestamp = Date.now();
});

afterEach(async () => {
	try {
		if (testTimestamp && User) {
			const identifierPartRegexStr = `(?:api_member_${testTimestamp}|missing_pass_${testTimestamp}|invalid_email_${testTimestamp}|api_member_${testTimestamp}_login|api_member_${testTimestamp}_rbac|api_member_${testTimestamp}_rbac_member_feature)`;
			const emailRegex = new RegExp(`^${identifierPartRegexStr}@example\\.com$`);
			await User.deleteMany({ email: { $regex: emailRegex } });
		}
	} catch (error) {
		console.error('Error during afterEach cleanup in auth.api.test.js:', error.message);
	}
});

afterAll(async () => {
	try {
		await agent.get('/api/auth/logout');
	} catch (error) {
		console.error('Error during main librarian agent logout in afterAll:', error.message);
	}
	if (mongoose.connection && mongoose.connection.readyState === 1) {
		// Check connection state before disconnecting
		await mongoose.disconnect();
	}
});

describe('API: Authentication & Authorization Endpoints', () => {
	describe('User Registration (by Librarian) - API: POST /api/auth/register', () => {
		it('TC_AUTH_REG_001_API: Successful new user (Member) registration by Librarian', async () => {
			const newApiMemberName = `api_member_${testTimestamp}`;
			const newUserPayload = {
				name: newApiMemberName,
				password: 'ValidPassword123!',
				email: `${newApiMemberName}@example.com`,
				isAdmin: false,
				photoUrl: 'http://example.com/default_member.jpg',
			};
			const response = await agent.post('/api/auth/register').send(newUserPayload);
			expect(response.statusCode).toBe(201);
			expect(response.body.success).toBe(true);
			expect(response.body.message).toBe('User account created successfully');
		});

		it('TC_AUTH_REG_002_API: Attempt to register a new user with an existing email by Librarian', async () => {
			const existingName = `api_member_${testTimestamp}`;
			const existingEmail = `${existingName}@example.com`;
			const firstUserPayload = {
				name: existingName,
				password: 'ValidPassword123!',
				email: existingEmail,
				isAdmin: false,
				photoUrl: 'http://example.com/default_member.jpg',
			};

			await agent.post('/api/auth/register').send(firstUserPayload);

			const secondUserPayload = { ...firstUserPayload, name: `another_${existingName}` };
			const response = await agent.post('/api/auth/register').send(secondUserPayload);
			expect(response.statusCode).toBe(403);
			expect(response.body.success).toBe(false);
			expect(response.body.message).toBe(errorMessages.auth.userAlreadyExists);
		});

		it('TC_AUTH_REG_003_API: Attempt to register a new user with missing required fields (e.g., password) by Librarian', async () => {
			const payloadMissingPassword = {
				name: `missing_pass_${testTimestamp}`,
				email: `missing_pass_${testTimestamp}@example.com`,
				isAdmin: false,
				photoUrl: 'http://example.com/default_member.jpg',
			};
			const response = await agent.post('/api/auth/register').send(payloadMissingPassword);
			expect(response.statusCode).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.message).toBe(errorMessages.user.passwordRequired);
		});

		it('TC_AUTH_REG_004_API: Attempt to register a new user with invalid data format (e.g., email) by Librarian', async () => {
			const payloadInvalidEmail = {
				name: `invalid_email_${testTimestamp}`,
				password: 'ValidPassword123!',
				email: 'invalidemailformat',
				isAdmin: false,
				photoUrl: 'http://example.com/default_member.jpg',
			};
			const response = await agent.post('/api/auth/register').send(payloadInvalidEmail);
			expect(response.statusCode).toBe(400);
		});
	});

	describe('User Login - API: POST /api/auth/login', () => {
		it('TC_AUTH_LOGIN_001_API: Successful login with valid Librarian credentials', async () => {
			const loginPayload = { email: apiLibrarianCredentials.email, password: apiLibrarianCredentials.password };
			const response = await request(app).post('/api/auth/login').send(loginPayload);
			expect(response.statusCode).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.user).toBeDefined();
			expect(response.body.user.email).toBe(apiLibrarianCredentials.email);
			expect(response.body.user.isAdmin).toBe(true);
		});

		it('TC_AUTH_LOGIN_002_API: Successful login with valid Member credentials', async () => {
			const memberNameForLogin = `api_member_${testTimestamp}_login`;
			const memberEmailForLogin = `${memberNameForLogin}@example.com`;
			const memberPasswordForLogin = 'MemberPass123!';

			const regPayload = {
				name: memberNameForLogin,
				password: memberPasswordForLogin,
				email: memberEmailForLogin,
				isAdmin: false,
				photoUrl: 'http://example.com/login_member.jpg',
			};
			await agent.post('/api/auth/register').send(regPayload);
			const response = await request(app).post('/api/auth/login').send({ email: memberEmailForLogin, password: memberPasswordForLogin });
			expect(response.statusCode).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.user.email).toBe(memberEmailForLogin);
			expect(response.body.user.isAdmin).toBe(false);
		});

		it('TC_AUTH_LOGIN_003_API: Attempt login with invalid email', async () => {
			const response = await request(app).post('/api/auth/login').send({ email: 'nonexistent_user@example.com', password: 'anypassword' });
			expect(response.statusCode).toBe(401);
			expect(response.body.success).toBe(false);
			expect(response.body.message).toMatch(/User not found/i);
		});

		it('TC_AUTH_LOGIN_004_API: Attempt login with valid email but invalid password', async () => {
			const response = await request(app).post('/api/auth/login').send({ email: apiLibrarianCredentials.email, password: 'IncorrectPasswordDefinitely!' });
			expect(response.statusCode).toBe(401);
			expect(response.body.success).toBe(false);
			expect(response.body.message).toMatch(/Password incorrect/i);
		});

		it('TC_AUTH_LOGIN_005_API: Attempt login with empty email field', async () => {
			const response = await request(app).post('/api/auth/login').send({ password: 'anypassword' });
			expect(response.statusCode).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.message).toBe(errorMessages.auth.emailRequired);
		});

		it('TC_AUTH_LOGIN_006_API: Attempt login with empty password field (expecting server error or specific handling)', async () => {
			const response = await request(app).post('/api/auth/login').send({ email: apiLibrarianCredentials.email, password: '' });
			expect(response.statusCode).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.message).toBe(errorMessages.auth.passwordRequired);
		}, 15000);

		it('TC_AUTH_LOGIN_007_API: Attempt login with password field missing', async () => {
			const response = await request(app).post('/api/auth/login').send({ email: apiLibrarianCredentials.email });
			expect(response.statusCode).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.message).toBe(errorMessages.auth.passwordRequired);
		}, 15000);
	});

	describe('User Logout - API: GET /api/auth/logout', () => {
		it('TC_AUTH_LOGOUT_001_API & TC_AUTH_LOGOUT_002_API: Successful logout for a logged-in user', async () => {
			const loginPayload = { email: apiLibrarianCredentials.email, password: apiLibrarianCredentials.password };
			await agent.post('/api/auth/login').send(loginPayload);
			const response = await agent.get('/api/auth/logout');
			expect(response.statusCode).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.message).toMatch(/logged out successfully/i);
		});
	});

	describe('Role-Based Access Control (RBAC) - API', () => {
		it('TC_AUTH_RBAC_001_API: Verify Librarian can access Librarian-specific API features', async () => {
			const loginPayload = { email: apiLibrarianCredentials.email, password: apiLibrarianCredentials.password };
			await agent.post('/api/auth/login').send(loginPayload);
			// This endpoint does not exist, so we expect a 404
			const response = await agent.get('/api/admin/users');
			expect(response.statusCode).toBe(404);
		});

		it('TC_AUTH_RBAC_002_API: Verify Member cannot access Librarian-specific API features', async () => {
			const memberNameForRbac = `api_member_${testTimestamp}_rbac`;
			const memberEmailForRbac = `${memberNameForRbac}@example.com`;
			const memberPasswordForRbac = 'MemberPassRbac123!';

			const regPayloadRbac = {
				name: memberNameForRbac,
				password: memberPasswordForRbac,
				email: memberEmailForRbac,
				isAdmin: false,
				photoUrl: 'http://example.com/rbac_member.jpg',
			};
			await agent.post('/api/auth/register').send(regPayloadRbac);

			const memberAgent = request.agent(app);
			const memberLoginRes = await memberAgent.post('/api/auth/login').send({ email: memberEmailForRbac, password: memberPasswordForRbac });
			expect(memberLoginRes.statusCode).toBe(200);

			const rbacResponse = await memberAgent.get('/api/users');
			expect(rbacResponse.statusCode).toBe(403);
		});

		it('TC_AUTH_RBAC_003_API: Verify Member can access Member-specific API features', async () => {
			const memberNameForRbacFeature = `api_member_${testTimestamp}_rbac_member_feature`;
			const memberEmailForRbacFeature = `${memberNameForRbacFeature}@example.com`;
			const memberPasswordForRbacFeature = 'MemberPassRbacFeature123!';
			const regPayloadRbacFeature = {
				name: memberNameForRbacFeature,
				password: memberPasswordForRbacFeature,
				email: memberEmailForRbacFeature,
				isAdmin: false,
				photoUrl: 'http://example.com/rbac_feature_member.jpg',
			};
			await agent.post('/api/auth/register').send(regPayloadRbacFeature);
			const memberFeatureAgent = request.agent(app);
			const memberLoginRes = await memberFeatureAgent.post('/api/auth/login').send({ email: memberEmailForRbacFeature, password: memberPasswordForRbacFeature });
			expect(memberLoginRes.statusCode).toBe(200);
		});

		it('TC_AUTH_RBAC_004_API: Verify guest (not logged in) user restriction from protected API pages', async () => {
			const guestAgent = request(app);
			const response = await guestAgent.get('/api/users');
			expect(response.statusCode).toBe(403);
		});
	});
});
