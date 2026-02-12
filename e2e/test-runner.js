// e2e/test-runner.js - Lightweight E2E Test Framework (Pure Node.js)
const http = require('http');
const { generateToken } = require('../apps/api/auth');

const API_BASE = process.env.API_BASE_URL || 'http://localhost:4000';
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    gray: '\x1b[90m'
};

class TestRunner {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
        this.token = null;
    }

    async setup() {
        console.log(`${colors.blue}Setting up tests...${colors.reset}`);
        // Generate auth token
        this.token = generateToken('test-user', 'test@example.com', 'admin');
        console.log(`${colors.gray}Auth token generated${colors.reset}`);
    }

    test(name, fn) {
        this.tests.push({ name, fn });
    }

    async request(method, path, body = null) {
        return new Promise((resolve, reject) => {
            const url = new URL(path, API_BASE);
            const options = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname + url.search,
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                }
            };

            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        resolve({
                            status: res.statusCode,
                            headers: res.headers,
                            data: parsed
                        });
                    } catch (err) {
                        resolve({
                            status: res.statusCode,
                            headers: res.headers,
                            data: data
                        });
                    }
                });
            });

            req.on('error', reject);

            if (body) {
                req.write(JSON.stringify(body));
            }

            req.end();
        });
    }

    async run() {
        await this.setup();

        console.log(`${colors.blue}\n🧪 Running ${this.tests.length} tests...\n${colors.reset}`);

        for (const test of this.tests) {
            try {
                await test.fn(this);
                this.passed++;
                console.log(`${colors.green}✓${colors.reset} ${test.name}`);
            } catch (err) {
                this.failed++;
                console.log(`${colors.red}✗${colors.reset} ${test.name}`);
                console.log(`  ${colors.red}${err.message}${colors.reset}`);
                if (err.stack) {
                    console.log(`  ${colors.gray}${err.stack.split('\n').slice(1).join('\n')}${colors.reset}`);
                }
            }
        }

        console.log(`\n${colors.blue}Test Results:${colors.reset}`);
        console.log(`  ${colors.green}Passed: ${this.passed}${colors.reset}`);
        console.log(`  ${colors.red}Failed: ${this.failed}${colors.reset}`);
        console.log(`  Total: ${this.tests.length}`);

        const coverage = this.tests.length > 0 ? Math.round((this.passed / this.tests.length) * 100) : 0;
        console.log(`  ${coverage >= 90 ? colors.green : coverage >= 70 ? colors.yellow : colors.red}Coverage: ${coverage}%${colors.reset}\n`);

        return this.failed === 0;
    }

    expect(actual) {
        return {
            toBe: (expected) => {
                if (actual !== expected) {
                    throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
                }
            },
            toEqual: (expected) => {
                const actualStr = JSON.stringify(actual);
                const expectedStr = JSON.stringify(expected);
                if (actualStr !== expectedStr) {
                    throw new Error(`Expected ${expectedStr} but got ${actualStr}`);
                }
            },
            toContain: (expected) => {
                if (!actual || !actual.includes(expected)) {
                    throw new Error(`Expected to contain ${JSON.stringify(expected)}`);
                }
            },
            toBeGreaterThan: (expected) => {
                if (actual <= expected) {
                    throw new Error(`Expected ${actual} to be greater than ${expected}`);
                }
            },
            toBeTruthy: () => {
                if (!actual) {
                    throw new Error(`Expected truthy value but got ${actual}`);
                }
            },
            toBeFalsy: () => {
                if (actual) {
                    throw new Error(`Expected falsy value but got ${actual}`);
                }
            },
            toHaveProperty: (property) => {
                if (!actual || !(property in actual)) {
                    throw new Error(`Expected to have property ${property}`);
                }
            }
        };
    }
}

module.exports = TestRunner;
