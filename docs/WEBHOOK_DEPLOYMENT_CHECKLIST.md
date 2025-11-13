# Webhook Server Deployment Checklist

Quick reference checklist for deploying the API Test Agent Webhook Server.

## Pre-Deployment Checklist

### 1. Prerequisites
- [ ] Docker installed (v20.10+)
- [ ] Docker Compose installed (v2.0+)
- [ ] GitHub repository with admin access
- [ ] Public URL or domain for webhook server

### 2. Generate Required Secrets

```bash
# Generate webhook secret
openssl rand -hex 32
# Save this as WEBHOOK_SECRET

# Create GitHub Personal Access Token
# Go to: GitHub Settings → Developer Settings → Personal Access Tokens
# Scopes needed: repo, write:discussion, read:org
```

### 3. Environment Configuration

- [ ] Copy `.env.example` to `.env`
- [ ] Set `WEBHOOK_SECRET` (from step 2)
- [ ] Set `GITHUB_TOKEN` (from step 2)
- [ ] Set `OPENAI_API_KEY` (optional, for AI features)
- [ ] Set `API_BASE_URL` (your API endpoint)
- [ ] Configure SMTP settings (optional, for email notifications)

## Deployment Steps

### Development Deployment

```bash
# 1. Build the project
npm run build

# 2. Start webhook server locally
npm run webhook:dev

# 3. Expose with ngrok (in another terminal)
ngrok http 3000

# 4. Copy ngrok URL for GitHub webhook configuration
```

### Production Deployment (Docker)

```bash
# 1. Build Docker images
npm run docker:webhook:build
# Or: docker-compose -f docker-compose.webhook.yml build

# 2. Start services
npm run docker:webhook:up
# Or: docker-compose -f docker-compose.webhook.yml up -d

# 3. Verify services are running
docker-compose -f docker-compose.webhook.yml ps

# 4. Check health
curl http://localhost:3000/health

# 5. View logs
npm run docker:webhook:logs
# Or: docker-compose -f docker-compose.webhook.yml logs -f
```

## GitHub Webhook Configuration

### 1. Navigate to Repository Settings
- [ ] Go to repository → Settings → Webhooks → Add webhook

### 2. Configure Webhook
| Field | Value |
|-------|-------|
| Payload URL | `https://your-domain.com/webhook` |
| Content type | `application/json` |
| Secret | Your `WEBHOOK_SECRET` |
| SSL verification | ✅ Enable (production) |

### 3. Select Events
- [ ] Issue comments
- [ ] Pull requests (optional)

### 4. Activate
- [ ] Check "Active"
- [ ] Click "Add webhook"

### 5. Test
- [ ] Check "Recent Deliveries" tab
- [ ] Verify ping event succeeded (green checkmark)

## Testing Checklist

### 1. Health Check
```bash
curl http://localhost:3000/health
# Expected: {"status":"healthy",...}
```

### 2. Stats Endpoint
```bash
curl http://localhost:3000/stats
# Expected: Statistics JSON
```

### 3. End-to-End Test
- [ ] Create test PR in repository
- [ ] Comment: `@api-test-agent run tests`
- [ ] Check webhook server logs
- [ ] Verify job was queued
- [ ] Check job worker logs
- [ ] Verify results posted to PR

### 4. Manual Webhook Test
```bash
# See WEBHOOK_DEPLOYMENT.md for full test payload example
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: issue_comment" \
  -H "X-Hub-Signature-256: sha256=..." \
  -d @test-webhook.json
```

## Production Hardening Checklist

### 1. SSL/TLS
- [ ] Set up reverse proxy (Nginx, Caddy, Traefik)
- [ ] Install SSL certificate (Let's Encrypt)
- [ ] Force HTTPS redirect
- [ ] Enable HSTS headers

### 2. Security
- [ ] Never commit `.env` to version control
- [ ] Use secrets management (AWS Secrets Manager, Vault)
- [ ] Configure firewall rules
- [ ] Block direct access to port 3000
- [ ] Enable GitHub webhook signature verification
- [ ] Rotate tokens and secrets regularly

### 3. Monitoring
- [ ] Set up health check monitoring
- [ ] Configure log aggregation
- [ ] Set up alerting (email, Slack, PagerDuty)
- [ ] Monitor disk space
- [ ] Track webhook stats

### 4. Backup
- [ ] Configure log rotation
- [ ] Back up job queue (if using persistent storage)
- [ ] Back up configuration files

### 5. Scaling
- [ ] Configure resource limits
- [ ] Set up horizontal scaling for workers
- [ ] Use persistent job queue (Redis, PostgreSQL)
- [ ] Configure load balancing (if needed)

## Common Commands

### Docker Commands
```bash
# Build
npm run docker:webhook:build

# Start
npm run docker:webhook:up

# Stop
npm run docker:webhook:down

# Restart
npm run docker:webhook:restart

# Logs
npm run docker:webhook:logs

# Shell access
docker exec -it api-test-agent-webhook sh

# Clean up
docker-compose -f docker-compose.webhook.yml down -v
```

### Development Commands
```bash
# Build TypeScript
npm run build

# Run webhook server (dev)
npm run webhook:dev

# Run webhook server (production)
npm run webhook:start

# Type check
npm run typecheck

# Lint
npm run lint
```

### Debugging Commands
```bash
# Check container status
docker-compose -f docker-compose.webhook.yml ps

# Health check
curl http://localhost:3000/health

# Stats
curl http://localhost:3000/stats | jq

# Job queue
curl http://localhost:3000/jobs | jq

# Specific job
curl http://localhost:3000/jobs/job-12345 | jq

# Server logs
docker-compose -f docker-compose.webhook.yml logs webhook-server

# Worker logs
docker-compose -f docker-compose.webhook.yml logs job-worker

# Follow logs
docker-compose -f docker-compose.webhook.yml logs -f
```

## Troubleshooting Quick Reference

| Issue | Quick Fix |
|-------|-----------|
| 401 Unauthorized | Verify `WEBHOOK_SECRET` matches GitHub webhook |
| Worker not processing | Check worker logs, restart worker |
| Tests not posting to GitHub | Verify `GITHUB_TOKEN` and scopes |
| Port already in use | Kill process on port 3000 or change `WEBHOOK_PORT` |
| Docker permission denied | Add user to docker group: `sudo usermod -aG docker $USER` |
| Out of disk space | Clean up Docker: `docker system prune -a` |
| Webhook timeouts | Check network connectivity, firewall rules |
| Jobs stuck in queue | Restart job worker |

## Support Resources

- **Full Documentation**: [WEBHOOK_DEPLOYMENT.md](./WEBHOOK_DEPLOYMENT.md)
- **GitHub Webhooks Docs**: https://docs.github.com/en/webhooks
- **Docker Compose Docs**: https://docs.docker.com/compose/

---

**Version**: 1.0.0
**Last Updated**: 2024-01-15
