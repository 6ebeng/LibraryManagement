import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend } from 'k6/metrics';

// Custom trends to track response times for each endpoint
const loginResponseTrend = new Trend('login_response_time');
const getAllBooksResponseTrend = new Trend('get_all_books_response_time');
const addBorrowalResponseTrend = new Trend('add_borrowal_response_time');

// Environment variables for configuration
const BASE_URL = __ENV.K6_HOST || 'http://localhost:8081';
const USER_CREDENTIALS = {
	email: __ENV.USER_EMAIL || 'librarian@example.com',
	password: __ENV.USER_PASSWORD || 'password123',
};

export const options = {
	scenarios: {
		api_response_time: {
			executor: 'per-vu-iterations',
			vus: 1,
			iterations: 1,
			exec: 'apiResponseTime',
			maxDuration: '1m',
		},
		volume_test: {
			executor: 'per-vu-iterations',
			vus: 10,
			iterations: 5,
			exec: 'volumeTest',
			maxDuration: '5m',
			startTime: '1m', // Start after the API response time test
		},
		stress_test: {
			executor: 'ramping-vus',
			startVUs: 0,
			stages: [
				{ duration: '2m', target: 100 }, // Ramp up to 100 users over 2 minutes
				{ duration: '5m', target: 100 }, // Stay at 100 users for 5 minutes
				{ duration: '2m', target: 0 }, // Ramp down to 0 users
			],
			exec: 'stressTest',
			startTime: '6m', // Start after the volume test
		},
		recovery_test: {
			executor: 'per-vu-iterations',
			vus: 1,
			iterations: 1,
			exec: 'recoveryTest',
			startTime: '15m', // Start after the stress test
		},
	},
	thresholds: {
		http_req_failed: ['rate<0.01'], // http errors should be less than 1%
		login_response_time: ['p(95)<250'], // 95% of login requests should be below 250ms
		get_all_books_response_time: ['p(95)<300'], // 95% of get all books requests should be below 300ms
		add_borrowal_response_time: ['p(95)<400'], // 95% of add borrowal requests should be below 400ms
	},
};

// Helper function for login
function login() {
	const res = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify(USER_CREDENTIALS), {
		headers: { 'Content-Type': 'application/json' },
	});
	check(res, { 'login successful': (r) => r.status === 200 });
	loginResponseTrend.add(res.timings.duration);
	return res.json('token');
}

// Test case for API response times
export function apiResponseTime() {
	group('API Response Time Tests', () => {
		const token = login();

		group('TC_PERF_API_001: Get All Books', () => {
			const res = http.get(`${BASE_URL}/api/book/getAll`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			check(res, { 'get all books successful': (r) => r.status === 200 });
			getAllBooksResponseTrend.add(res.timings.duration);
		});

		group('TC_PERF_API_002: Add Borrowal', () => {
			const res = http.post(
				`${BASE_URL}/api/borrowal/add`,
				JSON.stringify({
					bookId: '60d5ec49a4d8f512c8b76384', // Replace with a valid book ID
					memberId: '60d5ec49a4d8f512c8b76385', // Replace with a valid member ID
				}),
				{ headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
			);
			check(res, { 'add borrowal successful': (r) => r.status === 201 });
			addBorrowalResponseTrend.add(res.timings.duration);
		});
		sleep(1);
	});
}

// Test case for volume testing
export function volumeTest() {
	group('Volume Test', () => {
		const token = login();

		for (let i = 0; i < 5; i++) {
			http.get(`${BASE_URL}/api/book/getAll`, { headers: { Authorization: `Bearer ${token}` } });
			sleep(1);
		}
	});
}

// Test case for stress testing
export function stressTest() {
	group('Stress Test', () => {
		const token = login();
		http.get(`${BASE_URL}/api/book/getAll`, { headers: { Authorization: `Bearer ${token}` } });
		sleep(1);
	});
}

// Test case for recovery testing
export function recoveryTest() {
	group('Recovery Test', () => {
		// Simulate a server restart or failure
		// This is a placeholder for actual recovery testing steps
		sleep(60);

		const token = login();
		const res = http.get(`${BASE_URL}/api/book/getAll`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		check(res, { 'system recovered': (r) => r.status === 200 });
	});
}
