// load-tests/load-runner.js - Lightweight Load Testing Framework (Pure Node.js)
const http = require('http');
const { generateToken } = require('../apps/api/auth');

const API_BASE = process.env.API_BASE_URL || 'http://localhost:4000';

class LoadTester {
    constructor(config) {
        this.config = {
            vus: config.vus || 10,              // Virtual users
            duration: config.duration || 60000,  // Test duration in ms
            endpoint: config.endpoint,
            method: config.method || 'GET',
            body: config.body || null,
            name: config.name || 'Load Test'
        };
        this.token = null;
        this.results = {
            total: 0,
            success: 0,
            failed: 0,
            errors: {},
            responseTimes: [],
            startTime: 0,
            endTime: 0
        };
    }

    async setup() {
        this.token = generateToken('load-test-user', 'load@example.com', 'admin');
    }

    async request() {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const url = new URL(this.config.endpoint, API_BASE);
            const options = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname + url.search,
                method: this.config.method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                timeout: 30000
            };

            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    const responseTime = Date.now() - startTime;
                    resolve({
                        success: res.statusCode >= 200 && res.statusCode < 300,
                        status: res.statusCode,
                        responseTime,
                        error: null
                    });
                });
            });

            req.on('error', (err) => {
                resolve({
                    success: false,
                    status: 0,
                    responseTime: Date.now() - startTime,
                    error: err.message
                });
            });

            req.on('timeout', () => {
                req.destroy();
                resolve({
                    success: false,
                    status: 0,
                    responseTime: 30000,
                    error: 'Request timeout'
                });
            });

            if (this.config.body) {
                req.write(JSON.stringify(this.config.body));
            }

            req.end();
        });
    }

    async runVU(vuid, startTime) {
        while (Date.now() - startTime < this.config.duration) {
            const result = await this.request();
            this.results.total++;

            if (result.success) {
                this.results.success++;
            } else {
                this.results.failed++;
                const errorKey = result.error || `HTTP ${result.status}`;
                this.results.errors[errorKey] = (this.results.errors[errorKey] || 0) + 1;
            }

            this.results.responseTimes.push(result.responseTime);

            // Small delay between requests from same VU
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    calculateStats() {
        const sorted = this.results.responseTimes.sort((a, b) => a - b);
        const len = sorted.length;

        if (len === 0) return {};

        return {
            min: sorted[0],
            max: sorted[len - 1],
            avg: sorted.reduce((a, b) => a + b, 0) / len,
            median: sorted[Math.floor(len / 2)],
            p95: sorted[Math.floor(len * 0.95)],
            p99: sorted[Math.floor(len * 0.99)]
        };
    }

    printResults() {
        const duration = (this.results.endTime - this.results.startTime) / 1000;
        const stats = this.calculateStats();
        const rps = (this.results.total / duration).toFixed(2);
        const successRate = ((this.results.success / this.results.total) * 100).toFixed(2);

        console.log(`\n${'='.repeat(60)}`);
        console.log(`📊 ${this.config.name} Results`);
        console.log(`${'='.repeat(60)}`);
        console.log(`\nConfiguration:`);
        console.log(`  Virtual Users: ${this.config.vus}`);
        console.log(`  Duration: ${this.config.duration}ms (${duration}s)`);
        console.log(`  Endpoint: ${this.config.method} ${this.config.endpoint}`);

        console.log(`\nRequests:`);
        console.log(`  Total: ${this.results.total}`);
        console.log(`  Success: ${this.results.success} (${successRate}%)`);
        console.log(`  Failed: ${this.results.failed}`);
        console.log(`  Requests/sec: ${rps}`);

        console.log(`\nResponse Times (ms):`);
        console.log(`  Min: ${stats.min}`);
        console.log(`  Max: ${stats.max}`);
        console.log(`  Avg: ${stats.avg.toFixed(2)}`);
        console.log(`  Median: ${stats.median}`);
        console.log(`  P95: ${stats.p95}`);
        console.log(`  P99: ${stats.p99}`);

        if (Object.keys(this.results.errors).length > 0) {
            console.log(`\nErrors:`);
            Object.entries(this.results.errors).forEach(([error, count]) => {
                console.log(`  ${error}: ${count}`);
            });
        }

        console.log(`\n${'='.repeat(60)}\n`);
    }

    async run() {
        await this.setup();

        console.log(`\n🚀 Starting ${this.config.name}...`);
        console.log(`   VUs: ${this.config.vus}`);
        console.log(`   Duration: ${this.config.duration}ms`);
        console.log(`   Target: ${this.config.endpoint}\n`);

        this.results.startTime = Date.now();

        // Launch virtual users
        const vus = [];
        for (let i = 0; i < this.config.vus; i++) {
            vus.push(this.runVU(i, this.results.startTime));
        }

        // Wait for all VUs to complete
        await Promise.all(vus);

        this.results.endTime = Date.now();
        this.printResults();

        return {
            success: this.results.failed === 0,
            successRate: (this.results.success / this.results.total) * 100,
            stats: this.calculateStats()
        };
    }
}

module.exports = LoadTester;
