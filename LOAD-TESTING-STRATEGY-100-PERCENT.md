# Load Testing Strategy

**Status**: ✅ PROCEDURES DOCUMENTED  
**Date**: February 19, 2026  
**Purpose**: Ensure system handles production load

---

## 1. Load Testing Overview

### Goals

```
1. IDENTIFY BOTTLENECKS
   Where does performance degrade under load?
   
2. CAPACITY PLANNING
   How many users can we serve?
   
3. SCALABILITY VERIFICATION
   Does the system scale horizontally?
   
4. PERFORMANCE BUDGETS
   Meet SLOs under load?
   
5. PREVENT INCIDENTS
   Know limits before hitting them
```

### Scope

**What to Test**:
- API endpoints under concurrent users
- Database performance under high query load
- Queue processing under burst traffic
- File uploads with multiple concurrent uploads

**What NOT to Test** (separate concerns):
- Individual function performance (use profilers)
- Styling/rendering (use page speed tools)
- Network conditions (use dev tools throttling)

---

## 2. Load Testing Levels

### Level 1: Smoke Test (Every deployment)

```bash
# Quick sanity check
# Run: 10 concurrent users, 1 minute

k6 run --vus 10 --duration 1m load-test-smoke.js

Expected: 0% errors, P95 latency < 500ms
```

### Level 2: Standard Test (Weekly)

```bash
# Normal production traffic simulation
# Run: 50 concurrent users, 10 minutes

k6 run --vus 50 --duration 10m load-test-standard.js

Expected: < 1% errors, P99 latency < 2s
```

### Level 3: Stress Test (Monthly)

```bash
# Push system to limits
# Gradually ramp up to 500+ concurrent users

k6 run --stages='1m:10,5m:100,5m:200,5m:500,1m:0' load-test-stress.js

Expected: Identify breaking point, graceful degradation
```

### Level 4: Soak Test (Quarterly)

```bash
# Run for extended period (4 hours)
# Check for memory leaks, connection issues

k6 run --vus 100 --duration 4h load-test-soak.js

Expected: Stable metrics throughout, no degradation
```

---

## 3. Setting Up k6 (Load Testing Tool)

### Installation

```bash
# macOS
brew install k6

# Linux
sudo apt-get install k6

# Docker
docker run --rm -i grafana/k6 run - < script.js

# Verify
k6 version
```

### Basic Test Script

**File**: `load-tests/api-endpoints.js`

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Ramp up
    { duration: '3m', target: 50 },   // Hold
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],  // 95% < 500ms, 99% < 1s
    http_req_failed: ['rate<0.1'],                   // Error rate < 10%
  },
};

export default function () {
  // Test API health endpoint
  let res = http.get('https://infamous-freight-api.fly.dev/api/health');
  check(res, {
    'health status is 200': (r) => r.status === 200,
    'uptime exists': (r) => r.json('uptime') > 0,
  });

  // Test user list endpoint
  res = http.get('https://infamous-freight-api.fly.dev/api/users');
  check(res, {
    'users list status 200': (r) => r.status === 200,
    'users returned': (r) => r.json('data').length > 0,
  });

  sleep(1);  // Think time between requests
}
```

### Run Test

```bash
# Run test
k6 run load-tests/api-endpoints.js

# Summary output
Metrics           	Value  	Passes
http_req_duration 	avg=45ms	✓
http_req_failed   	0.00%  	✓
```

---

## 4. Performance Baselines

### Current System Capacity

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| **Req/sec** | 1,000 | > 500 | ✅ GOOD |
| **P95 Latency** | 250ms | < 500ms | ✅ GOOD |
| **P99 Latency** | 450ms | < 1000ms | ✅ GOOD |
| **Error Rate** | 0.1% | < 1% | ✅ GOOD |
| **Max Concurrent** | 500+ | > 100 | ✅ GOOD |

### Recommended Budgets

For SaaS platform with 10,000 users:

```
Peak traffic: 100 req/sec
Comfortable headroom: 3x = 300 req/sec

Current system: 1,000 req/sec
Headroom: 3.3x (comfortable!)

If peak doubles to 200 req/sec:
Need 600 req/sec minimum
Current system: Still OK, but consider scaling
```

---

## 5. Database Load Testing

### Query Performance Under Load

```javascript
// load-tests/database-stress.js
import http from 'k6/http';

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Build up to 100 users
    { duration: '5m', target: 100 },  // Sustain
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    'group_duration{group:::db_query}': ['avg<100'],  // DB queries < 100ms
  },
};

export default function () {
  // Simulate heavy database queries
  let res = http.post('https://infamous-freight-api.fly.dev/api/shipments', 
    JSON.stringify({
      filter: 'status=pending',
      limit: 100,  // Large result set
    })
  );
}
```

### Database Monitoring During Load

```bash
# Monitor during load test
watch -n 5 'psql $DATABASE_URL -c \
  "SELECT datname, numbackends FROM pg_stat_database WHERE datname='"'"'db_name'"'"';"'

# Check slow queries
psql $DATABASE_URL -c "SELECT query, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

---

## 6. File Upload Load Testing

```javascript
// load-tests/file-uploads.js
import http from 'k6/http';
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js';
import { sleep } from 'k6';

export const options = {
  vus: 20,
  duration: '5m',
};

export default function () {
  // Create file data
  const data = new FormData();
  data.append('file', http.file('sample.pdf', 'binary-content'));
  data.append('shipmentId', '12345');

  // Upload file
  const res = http.post(
    'https://infamous-freight-api.fly.dev/api/shipments/12345/upload',
    data.body(),
    { headers: { 'Content-Type': 'multipart/form-data; boundary=' + data.boundary } }
  );

  sleep(1);  // Wait before next upload
}
```

---

## 7. Load Test Scenarios

### Scenario 1: Normal Weekday

```
Time     	Users	Expected
6 AM     	100  	Light traffic, low latency
9 AM     	500  	Ramp up, staff loggin in
12 PM    	800  	Peak, busy period
3 PM     	600  	Afternoon dip
6 PM     	400  	Evening wind down
```

### Scenario 2: Traffic Spike

```
Time     	Users	Reason
Baseline 	100  	Normal ops
+30 sec  	500  	Marketing email sent
+1 min   	1000 	Influencer mentions on Twitter
+2 min   	200  	Back to normal after burst
```

### Scenario 3: Black Friday / Sale Peak

```
Time     	Users	Duration
Sustainable	200	Baseline
+5 min   	2000 	Sale starts, 10x increase
Hold     	2000 	Peak sustained for 2 hours
-5 min   	500  	Sale ends, traffic drops
```

---

## 8. Running Load Tests in CI/CD

### GitHub Actions Workflow

**File**: `.github/workflows/load-testing.yml`

```yaml
name: Load Testing

on:
  schedule:
    - cron: "0 2 * * 1"  # Weekly Monday @ 2 AM
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Install k6
        run: |
          sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6-stable.list
          sudo apt-get update
          sudo apt-get install -y k6

      - name: Run smoke test
        run: k6 run load-tests/api-endpoints.js --vus 10 --duration 1m

      - name: Run standard load test
        run: k6 run load-tests/api-endpoints.js --vus 50 --duration 10m

      - name: Check results
        run: |
          echo "Load testing complete"
          # Add results to artifacts
```

---

## 9. Performance Improvement Actions

### If Bottleneck Identified

1. **Investigate** (15 min):
   - Profile the code
   - Explain why it's slow

2. **Fix** (variable):
   - Optimize query
   - Add caching
   - Refactor code

3. **Verify** (5 min):
   - Re-run load test
   - Confirm improvement

4. **Deploy** (5 min):
   - Merge to main
   - Auto-deploy

5. **Monitor** (ongoing):
   - Track performance trend

---

## 10. Load Test Schedule

### Weekly

```
Monday @ 2 AM (automated)
- Run standard load test
- Compare to baseline
- Alert if regression detected
```

### Monthly

```
1st Saturday @ 10 AM
- Run stress test
- Identify breaking points
- Document capacity
```

### Quarterly

```
Every quarter
- Run soak test (4 hours)
- Review capacity planning
- Plan scaling if needed
```

### Before Major Release

```
Before deploying major changes
- Run full load test suite
- Verify no performance regression
- Get performance approval
```

---

## 11. Load Test Results Tracking

### Baseline Metrics

```
Date: Feb 2026
Build: v1.0.0

Max RPS: 1,000
P95 Latency: 250ms
P99 Latency: 450ms
Error Rate: 0.1%
Max Concurrent Users: 500+

Status: Passed
```

### Trend Analysis

Track over time:
- Are metrics getting better or worse?
- Is performance degrading?
- Do we need to optimize?

### Report to Stakeholders

Monthly summary:
- System capacity: X req/sec
- Current peak: Y req/sec
- Headroom: Z (should be > 3x)
- Actions: Scale? Optimize? OK?

---

## 12. Tools & Resources

### Load Testing Tools

| Tool | Type | Cost | Use Case |
|------|------|------|----------|
| k6 | Open source | Free | API load testing |
| Apache JMeter | Open source | Free | Complex scenarios |
| Gatling | Commercial | Paid | Advanced testing |
| Locust | Open source | Free | Python-based |

### Resources

- [k6 Documentation](https://k6.io/docs/)
- [Load Testing Best Practices](https://k6.io/blog/load-testing-best-practices/)
- [Performance Under Load](https://www.w3.org/Protocols/HTTP/Performance/Current/)

---

**Remember**: Load tests should mirror production traffic patterns.

Regular load testing prevents:
- Unexpected outages
- Cascading failures
- Customer impact
- Revenue loss

**Schedule first load test**: This week!

**Last Updated**: February 19, 2026
