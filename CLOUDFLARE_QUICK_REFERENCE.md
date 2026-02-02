# Cloudflare Global + Origin API - Quick Reference Card

**Infamous Freight Enterprises** | Infrastructure Team | Phase 9 Enhancement

---

## 🚀 Quick Start (5 Minutes)

### 1. Set Credentials

```bash
export CLOUDFLARE_API_TOKEN="<your-token>"
export CLOUDFLARE_ZONE_ID="<your-zone-id>"
export CLOUDFLARE_ACCOUNT_ID="<your-account-id>"
```

### 2. Run Setup

```bash
chmod +x cloudflare-setup.sh
./cloudflare-setup.sh setup
```

### 3. Verify

```bash
./cloudflare-setup.sh verify
./cloudflare-setup.sh test-health
```

### 4. Test Failover

```bash
chmod +x cloudflare-failover-test.sh
./cloudflare-failover-test.sh quick
```

---

## 📋 Command Reference

| Command                                 | Purpose                 | Time   |
| --------------------------------------- | ----------------------- | ------ |
| `./cloudflare-setup.sh setup`           | Create LB configuration | 3 min  |
| `./cloudflare-setup.sh verify`          | Check configuration     | 1 min  |
| `./cloudflare-setup.sh test-health`     | Test health endpoints   | 1 min  |
| `./cloudflare-setup.sh cleanup`         | Remove configuration    | 1 min  |
| `./cloudflare-failover-test.sh quick`   | Test IAD failover       | 3 min  |
| `./cloudflare-failover-test.sh full`    | Test all origins        | 10 min |
| `./cloudflare-failover-test.sh monitor` | Real-time monitoring    | 5+ min |

---

## 🔑 Get Credentials (3 Steps)

### Step 1: API Token

```
1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Click: Create Token
3. Template: Zone → Edit
4. Select Zone: infamous-freight.com
5. Copy: Token value
```

### Step 2: Zone ID

```
1. Go to: https://dash.cloudflare.com/infamous-freight.com
2. Find: Zone Overview (right side)
3. Copy: Zone ID value
```

### Step 3: Account ID

```
1. Go to: https://dash.cloudflare.com/profile
2. Find: Account Settings
3. Copy: Account ID value
```

---

## 🎯 Health Check

**What Gets Checked**:

```
GET https://api-{region}.fly.dev/api/health

Response (Healthy - 200):
{
  "status": "ok",
  "timestamp": "2026-01-22T10:30:00Z",
  "region": "iad",
  "database": "connected",
  "uptime": 3600
}

Response (Degraded - 503):
{
  "status": "degraded",
  "database": "disconnected"
}
```

**Check All Regions**:

```bash
for r in iad iam ord las; do
  curl -s https://api-$r.fly.dev/api/health | jq '.region'
done
```

---

## 🔄 Failover Behavior

```
Traffic Flow:
Request → iad-primary (100%)
        → [FAIL] → iam-secondary (50%)
        → [FAIL] → ord-tertiary (25%)
        → [FAIL] → las-quaternary (10%)
        → [FAIL] → Error 503
```

**Automatic Triggers**:

- Health check fails 2x in a row
- 30-second check interval
- Instant failover (no manual action)
- Auto-recovery when healthy again

---

## 🛠️ Common Tasks

### Check Origin Status

```bash
curl -s "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/load_balancers" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" | jq '.result[].origins[]'
```

### Disable Region (Maintenance)

```bash
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/load_balancers/{LB_ID}" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  --data '{"origins": [{"name": "iad-primary", "enabled": false}]}'
```

### Change Weight (Traffic %)

```bash
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/load_balancers/{LB_ID}" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  --data '{"origins": [{"name": "iad-primary", "weight": 50}]}'
```

### Monitor Live Traffic

```bash
./cloudflare-failover-test.sh monitor
# Shows real-time region distribution
```

---

## 🚨 Emergency Procedures

### Origin Down

```bash
# 1. Identify affected region
curl https://api.infamous-freight.com/api/health | jq '.region'

# 2. Check reason
curl https://api-iad.fly.dev/api/health -v

# 3. Traffic auto-failsover (no action needed)

# 4. Check status in dashboard
# https://dash.cloudflare.com/infamous-freight.com/analytics/loadbalancer
```

### All Origins Down

```bash
# 1. Check all health endpoints
for r in iad iam ord las; do
  echo "=== Region $r ==="
  curl -v https://api-$r.fly.dev/api/health
done

# 2. Check Fly.io status
flyctl status -a infamous-freight-api

# 3. Restart application
flyctl restart -a infamous-freight-api

# 4. Wait for health checks to pass (30 sec)
```

---

## 📊 Monitoring Dashboard

**URL**: <https://dash.cloudflare.com/infamous-freight.com/analytics/loadbalancer>

**Metrics**:

- Origin health status (🟢 = healthy, 🔴 = down)
- Request distribution (%)
- Failover events (count)
- Response times (ms)
- SSL/TLS status

---

## ✅ Validation Checklist

- [ ] All 4 origins returning 200 from health check
- [ ] DNS resolves api.infamous-freight.com
- [ ] Load balancer visible in Cloudflare dashboard
- [ ] Failover test passes (quick test)
- [ ] No requests timing out
- [ ] Response times < 500ms
- [ ] Traffic distributed across regions
- [ ] Secrets set in Fly.io

---

## 🆘 Troubleshooting

| Problem              | Check                                     | Fix                 |
| -------------------- | ----------------------------------------- | ------------------- |
| Health check failing | `curl https://api-iad.fly.dev/api/health` | Fix app error or DB |
| DNS not resolving    | `dig api.infamous-freight.com`            | Check nameservers   |
| No failover          | `./cloudflare-failover-test.sh quick`     | Verify LB config    |
| High latency         | `./cloudflare-failover-test.sh monitor`   | Check region load   |
| All origins down     | `flyctl status -a infamous-freight-api`   | Restart app         |

---

## 📞 Contacts

- **On-Call**: PagerDuty escalation policy
- **DevOps Lead**: [Name/Channel]
- **Cloudflare Support**: support.cloudflare.com
- **Incident Channel**: #infrastructure-incidents

---

## 📚 Documentation

| Document                                                               | Use Case                   |
| ---------------------------------------------------------------------- | -------------------------- |
| [CLOUDFLARE_GLOBAL_ORIGIN_API.md](CLOUDFLARE_GLOBAL_ORIGIN_API.md)     | **Technical deep-dive**    |
| [CLOUDFLARE_INTEGRATION_RUNBOOK.md](CLOUDFLARE_INTEGRATION_RUNBOOK.md) | **Operational procedures** |
| [cloudflare-setup.sh](cloudflare-setup.sh)                             | **Automated setup**        |
| [cloudflare-failover-test.sh](cloudflare-failover-test.sh)             | **Automated testing**      |
| [CLOUDFLARE_DELIVERY_SUMMARY.md](CLOUDFLARE_DELIVERY_SUMMARY.md)       | **Overview & checklist**   |

---

## 🎓 Training Path

1. **Read**: CLOUDFLARE_DELIVERY_SUMMARY.md (5 min) ← Start here
2. **Watch**: Demo of `cloudflare-setup.sh setup` (3 min)
3. **Read**: CLOUDFLARE_INTEGRATION_RUNBOOK.md (20 min)
4. **Practice**: Run `cloudflare-failover-test.sh quick` (5 min)
5. **Learn**: Monitor `cloudflare-failover-test.sh monitor` (5 min)
6. **Review**: CLOUDFLARE_GLOBAL_ORIGIN_API.md (30 min)

**Total Training Time**: ~70 minutes

---

## 🔐 Security Checklist

- [ ] API token rotated in last 90 days
- [ ] Secrets stored in Fly.io (not in git)
- [ ] WAF rules configured for DDoS
- [ ] Rate limiting enabled on API
- [ ] TLS certificates valid
- [ ] Health checks don't expose sensitive data
- [ ] Access logs enabled
- [ ] Audit trail maintained

---

## 📈 Performance Targets

| Metric                | Target     | Current |
| --------------------- | ---------- | ------- |
| Availability          | 99.99%     | 🟢      |
| Failover Time         | < 60 sec   | 🟢      |
| Health Check Interval | 30 sec     | 🟢      |
| Response Time         | < 500ms    | 🟢      |
| Regions               | 4+         | 🟢      |
| DDoS Protection       | Enterprise | 🟢      |

---

**Version**: 1.0 | **Updated**: 2026-01-22 | **Status**: 🟢 Ready for Production

Print this card and post in your team area! 📌
