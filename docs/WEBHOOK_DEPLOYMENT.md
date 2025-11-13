# Webhook Server Deployment Guide

This guide covers deploying the API Test Agent Webhook Server for GitHub PR integration. The webhook server enables automatic test generation and execution when developers comment on pull requests.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Architecture Overview](#architecture-overview)
- [Environment Configuration](#environment-configuration)
- [Docker Deployment](#docker-deployment)
- [GitHub Webhook Setup](#github-webhook-setup)
- [Testing the Deployment](#testing-the-deployment)
- [Monitoring and Logs](#monitoring-and-logs)
- [Production Best Practices](#production-best-practices)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Docker** (v20.10+) and **Docker Compose** (v2.0+)
- **GitHub Repository** with admin access to configure webhooks
- **Public URL** for your webhook server (see [Exposing Your Server](#exposing-your-server))

### Required Credentials

1. **GitHub Personal Access Token** with the following scopes:
   - `repo` (full repository access)
   - `write:discussion` (for posting comments)
   - `read:org` (if using organization repositories)

2. **Webhook Secret** - A secure random string for verifying GitHub webhook signatures
   ```bash
   # Generate a secure webhook secret
   openssl rand -hex 32
   ```

3. **OpenAI API Key** (optional, for AI-powered features)
   - Required for self-healing tests
   - Sign up at https://platform.openai.com/

## Architecture Overview

### Components

```
┌─────────────────────────────────────────────────────────┐
│                    GitHub Repository                     │
│         (Pull Requests, Comments, Webhooks)             │
└────────────────────┬────────────────────────────────────┘
                     │ Webhook Events
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Webhook Server (Port 3000)                  │
│  - Signature Verification                               │
│  - Command Parsing                                       │
│  - Permission Checking                                   │
│  - Job Queuing                                           │
└────────────────────┬────────────────────────────────────┘
                     │ Job Queue
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   Job Worker                             │
│  - Pipeline Orchestrator                                 │
│  - Test Generation                                       │
│  - Test Execution                                        │
│  - Self-Healing                                          │
└────────────────────┬────────────────────────────────────┘
                     │ Results
                     ▼
┌─────────────────────────────────────────────────────────┐
│              GitHub PR Comments                          │
│         (Test Results, Coverage, Failures)              │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

1. Developer comments on PR: `@api-test-agent run tests`
2. GitHub sends webhook event to server
3. Server verifies signature and permissions
4. Server parses command and queues job
5. Worker picks up job and executes pipeline
6. Results are posted back to GitHub PR

## Environment Configuration

### 1. Create Environment File

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

### 2. Required Environment Variables

Edit `.env` and set the following required variables:

```bash
# ===== REQUIRED =====

# Webhook Configuration
WEBHOOK_SECRET=your-webhook-secret-here
WEBHOOK_PORT=3000

# GitHub Integration
GITHUB_TOKEN=ghp_your-github-token-here

# ===== OPTIONAL =====

# OpenAI Configuration (for AI features)
OPENAI_API_KEY=sk-your-openai-key-here

# API Configuration
API_BASE_URL=https://api.example.com
OPENAPI_SPEC_PATH=./openapi.yaml

# Email Notifications (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=API Test Agent <noreply@example.com>

# Logging
VERBOSE=true
```

### 3. Environment Variable Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `WEBHOOK_SECRET` | Yes | - | Secret for verifying GitHub webhook signatures |
| `GITHUB_TOKEN` | Yes | - | GitHub personal access token |
| `WEBHOOK_PORT` | No | 3000 | Port for webhook server |
| `OPENAI_API_KEY` | No | - | OpenAI API key for AI features |
| `API_BASE_URL` | No | - | Default API base URL for testing |
| `OPENAPI_SPEC_PATH` | No | ./openapi.yaml | Path to OpenAPI spec |
| `TEST_OUTPUT_DIR` | No | ./tests/generated | Directory for generated tests |
| `SMTP_HOST` | No | - | SMTP server for email notifications |
| `SMTP_PORT` | No | 587 | SMTP server port |
| `SMTP_USER` | No | - | SMTP username |
| `SMTP_PASSWORD` | No | - | SMTP password |
| `EMAIL_FROM` | No | - | Email sender address |
| `VERBOSE` | No | false | Enable verbose logging |

## Docker Deployment

### 1. Build and Start Services

```bash
# Build Docker images
docker-compose -f docker-compose.webhook.yml build

# Start services in detached mode
docker-compose -f docker-compose.webhook.yml up -d

# View logs
docker-compose -f docker-compose.webhook.yml logs -f
```

### 2. Verify Deployment

Check that services are running:

```bash
# Check container status
docker-compose -f docker-compose.webhook.yml ps

# Check health
curl http://localhost:3000/health

# Expected response:
# {
#   "status": "healthy",
#   "uptime": 12345,
#   "version": "1.0.0",
#   "timestamp": "2024-01-15T10:30:00.000Z"
# }
```

### 3. View Logs

```bash
# All services
docker-compose -f docker-compose.webhook.yml logs -f

# Webhook server only
docker-compose -f docker-compose.webhook.yml logs -f webhook-server

# Job worker only
docker-compose -f docker-compose.webhook.yml logs -f job-worker

# Last 100 lines
docker-compose -f docker-compose.webhook.yml logs --tail=100
```

### 4. Manage Services

```bash
# Stop services
docker-compose -f docker-compose.webhook.yml stop

# Restart services
docker-compose -f docker-compose.webhook.yml restart

# Stop and remove containers
docker-compose -f docker-compose.webhook.yml down

# Remove everything including volumes
docker-compose -f docker-compose.webhook.yml down -v
```

## Exposing Your Server

### Option 1: ngrok (Development)

For local development and testing:

```bash
# Install ngrok
brew install ngrok  # macOS
# or download from https://ngrok.com/download

# Start ngrok tunnel
ngrok http 3000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Use this URL in GitHub webhook configuration
```

### Option 2: Cloud Deployment (Production)

Deploy to a cloud provider with a public IP:

#### AWS EC2
```bash
# 1. Launch EC2 instance (Ubuntu 22.04)
# 2. Install Docker and Docker Compose
# 3. Configure security group to allow port 3000
# 4. Set up Elastic IP
# 5. Configure domain (optional)
# 6. Set up SSL/TLS (see Production Best Practices)
```

#### DigitalOcean Droplet
```bash
# 1. Create droplet (Ubuntu 22.04)
# 2. Install Docker and Docker Compose
# 3. Configure firewall
# 4. Point domain to droplet IP
# 5. Set up SSL/TLS with Let's Encrypt
```

#### Heroku
```bash
# 1. Install Heroku CLI
# 2. Create new app
heroku create api-test-agent-webhook

# 3. Set environment variables
heroku config:set WEBHOOK_SECRET=your-secret
heroku config:set GITHUB_TOKEN=your-token

# 4. Deploy
git push heroku main
```

## GitHub Webhook Setup

### 1. Navigate to Repository Settings

1. Go to your GitHub repository
2. Click **Settings** → **Webhooks** → **Add webhook**

### 2. Configure Webhook

Fill in the webhook configuration:

| Field | Value |
|-------|-------|
| **Payload URL** | `https://your-domain.com/webhook` |
| **Content type** | `application/json` |
| **Secret** | Your `WEBHOOK_SECRET` from `.env` |
| **SSL verification** | Enable SSL verification (production) |

### 3. Select Events

Choose which events to receive:

- ✅ **Issue comments** (required)
- ✅ **Pull requests** (optional, for auto-testing)
- ⬜ Other events (not needed)

Or select **Let me select individual events** and choose:
- `issue_comment`
- `pull_request`

### 4. Activate Webhook

- ✅ Check **Active**
- Click **Add webhook**

### 5. Verify Webhook

1. GitHub will send a `ping` event
2. Check webhook "Recent Deliveries" tab
3. Should see a successful delivery (green checkmark)

## Testing the Deployment

### 1. Manual Webhook Test

Send a test webhook using curl:

```bash
# Create test payload
cat > test-webhook.json <<EOF
{
  "action": "created",
  "issue": {
    "number": 123,
    "pull_request": {
      "url": "https://api.github.com/repos/owner/repo/pulls/123"
    }
  },
  "comment": {
    "id": 1,
    "body": "@api-test-agent run tests",
    "user": {
      "login": "testuser",
      "type": "User"
    },
    "html_url": "https://github.com/owner/repo/pull/123#issuecomment-1"
  },
  "repository": {
    "full_name": "owner/repo"
  }
}
EOF

# Generate signature
WEBHOOK_SECRET="your-secret"
PAYLOAD=$(cat test-webhook.json)
SIGNATURE="sha256=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | sed 's/^.* //')"

# Send webhook
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: issue_comment" \
  -H "X-Hub-Signature-256: $SIGNATURE" \
  -d @test-webhook.json

# Expected response:
# {"message":"Webhook processed successfully"}
```

### 2. End-to-End Test

Test the full flow with a real PR:

1. Create a test pull request in your repository
2. Add a comment: `@api-test-agent run tests`
3. Check webhook server logs:
   ```bash
   docker-compose -f docker-compose.webhook.yml logs -f webhook-server
   ```
4. Verify job was queued:
   ```bash
   curl http://localhost:3000/jobs
   ```
5. Check job worker logs:
   ```bash
   docker-compose -f docker-compose.webhook.yml logs -f job-worker
   ```
6. Verify results posted to PR

### 3. Health Check

```bash
# Basic health check
curl http://localhost:3000/health

# Stats endpoint
curl http://localhost:3000/stats

# Jobs list
curl http://localhost:3000/jobs

# Specific job
curl http://localhost:3000/jobs/job-12345
```

## Monitoring and Logs

### Log Files

Logs are stored in the `./logs` directory:

```bash
# View all logs
tail -f logs/*.log

# Webhook server logs
tail -f logs/webhook-server.log

# Job worker logs
tail -f logs/job-worker.log
```

### Container Logs

```bash
# Real-time logs
docker-compose -f docker-compose.webhook.yml logs -f

# Filtered logs
docker-compose -f docker-compose.webhook.yml logs -f | grep ERROR

# Export logs
docker-compose -f docker-compose.webhook.yml logs > webhook-logs.txt
```

### Metrics and Stats

Access the stats endpoint for monitoring:

```bash
curl http://localhost:3000/stats | jq
```

Response:
```json
{
  "totalReceived": 150,
  "totalProcessed": 148,
  "totalRejected": 2,
  "totalQueued": 45,
  "byEventType": {
    "issue_comment": 120,
    "pull_request": 30
  },
  "byAction": {
    "created": 120,
    "opened": 20,
    "synchronize": 10
  },
  "rateLimitHits": 0,
  "signatureFailures": 2,
  "uptime": 86400000,
  "queueSize": 3
}
```

### Health Monitoring

Set up automated health checks:

```bash
#!/bin/bash
# health-check.sh

WEBHOOK_URL="http://localhost:3000/health"
ALERT_EMAIL="admin@example.com"

response=$(curl -s -o /dev/null -w "%{http_code}" "$WEBHOOK_URL")

if [ "$response" != "200" ]; then
  echo "Webhook server is down! HTTP $response" | mail -s "Alert: Webhook Down" "$ALERT_EMAIL"
  exit 1
fi

echo "Webhook server is healthy"
```

### Log Rotation

Configure log rotation to prevent disk space issues:

```bash
# /etc/logrotate.d/api-test-agent
/path/to/AgentBank/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
}
```

## Production Best Practices

### 1. SSL/TLS Configuration

**Never expose webhooks over plain HTTP in production!**

#### Using Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/webhook

server {
    listen 80;
    server_name webhook.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name webhook.example.com;

    ssl_certificate /etc/letsencrypt/live/webhook.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/webhook.example.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Set up Let's Encrypt:
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d webhook.example.com

# Auto-renewal is configured automatically
```

### 2. Security Hardening

#### Environment Variables
- Never commit `.env` to version control
- Use secrets management (AWS Secrets Manager, HashiCorp Vault)
- Rotate tokens and secrets regularly

#### Network Security
```bash
# Firewall rules (UFW)
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw deny 3000/tcp  # Block direct access to webhook server
sudo ufw enable
```

#### Docker Security
- Run containers as non-root user
- Limit container resources
- Use read-only file systems where possible
- Scan images for vulnerabilities

### 3. High Availability

#### Load Balancing

```yaml
# docker-compose.webhook-ha.yml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - webhook-server-1
      - webhook-server-2

  webhook-server-1:
    build:
      context: .
      dockerfile: Dockerfile.webhook
    environment:
      - WEBHOOK_SECRET=${WEBHOOK_SECRET}
      - GITHUB_TOKEN=${GITHUB_TOKEN}
    networks:
      - backend

  webhook-server-2:
    build:
      context: .
      dockerfile: Dockerfile.webhook
    environment:
      - WEBHOOK_SECRET=${WEBHOOK_SECRET}
      - GITHUB_TOKEN=${GITHUB_TOKEN}
    networks:
      - backend

networks:
  backend:
    driver: bridge
```

#### Database for Job Queue

For production, use a persistent job queue (Redis, PostgreSQL):

```bash
# Add Redis to docker-compose.webhook.yml
redis:
  image: redis:7-alpine
  restart: unless-stopped
  volumes:
    - redis-data:/data
  networks:
    - api-test-agent

volumes:
  redis-data:
```

### 4. Scaling

#### Horizontal Scaling

```bash
# Scale job workers
docker-compose -f docker-compose.webhook.yml up -d --scale job-worker=3

# Verify
docker-compose -f docker-compose.webhook.yml ps
```

#### Resource Limits

```yaml
# docker-compose.webhook.yml (add to services)
webhook-server:
  deploy:
    resources:
      limits:
        cpus: '1'
        memory: 512M
      reservations:
        cpus: '0.5'
        memory: 256M
```

### 5. Backup and Recovery

```bash
#!/bin/bash
# backup.sh

# Backup logs
tar -czf "logs-backup-$(date +%Y%m%d).tar.gz" logs/

# Backup job queue (if using persistent storage)
docker exec api-test-agent-webhook pg_dump -U postgres > "db-backup-$(date +%Y%m%d).sql"

# Upload to S3 (optional)
aws s3 cp "logs-backup-$(date +%Y%m%d).tar.gz" s3://your-backup-bucket/
```

### 6. Monitoring and Alerting

#### Prometheus + Grafana

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    volumes:
      - grafana-data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin

volumes:
  prometheus-data:
  grafana-data:
```

## Troubleshooting

### Common Issues

#### 1. Webhook Returns 401 Unauthorized

**Cause**: Invalid GitHub webhook signature

**Solutions**:
```bash
# Verify WEBHOOK_SECRET matches GitHub webhook configuration
echo $WEBHOOK_SECRET

# Check webhook delivery details in GitHub
# Settings → Webhooks → Recent Deliveries → View details

# Restart webhook server
docker-compose -f docker-compose.webhook.yml restart webhook-server
```

#### 2. Job Worker Not Processing Jobs

**Cause**: Worker not started or crashed

**Solutions**:
```bash
# Check worker logs
docker-compose -f docker-compose.webhook.yml logs job-worker

# Check if worker is running
docker-compose -f docker-compose.webhook.yml ps job-worker

# Restart worker
docker-compose -f docker-compose.webhook.yml restart job-worker

# Check job queue
curl http://localhost:3000/jobs
```

#### 3. Tests Not Posting to GitHub

**Cause**: Invalid GitHub token or insufficient permissions

**Solutions**:
```bash
# Verify GitHub token
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user

# Check token scopes
curl -H "Authorization: token $GITHUB_TOKEN" -I https://api.github.com/user \
  | grep X-OAuth-Scopes

# Expected: X-OAuth-Scopes: repo, write:discussion

# Update token in .env and restart
docker-compose -f docker-compose.webhook.yml restart
```

#### 4. Port Already in Use

**Cause**: Another service using port 3000

**Solutions**:
```bash
# Find process using port 3000
lsof -i :3000
# or
netstat -tulpn | grep 3000

# Kill the process
kill -9 <PID>

# Or change webhook port in .env
WEBHOOK_PORT=3001

# Restart
docker-compose -f docker-compose.webhook.yml up -d
```

#### 5. Docker Permission Denied

**Cause**: User not in docker group

**Solutions**:
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Activate changes
newgrp docker

# Verify
docker ps
```

#### 6. Out of Disk Space

**Cause**: Logs or Docker images consuming disk space

**Solutions**:
```bash
# Check disk usage
df -h

# Check Docker disk usage
docker system df

# Clean up Docker
docker system prune -a --volumes

# Clean up logs
rm -f logs/*.log

# Set up log rotation (see Monitoring section)
```

### Debug Mode

Enable verbose logging for debugging:

```bash
# Add to .env
VERBOSE=true
DEBUG=api-test-agent:*

# Restart services
docker-compose -f docker-compose.webhook.yml restart

# View detailed logs
docker-compose -f docker-compose.webhook.yml logs -f
```

### Health Check Script

```bash
#!/bin/bash
# debug.sh - Comprehensive health check

echo "=== Webhook Server Health Check ==="

echo -e "\n1. Container Status:"
docker-compose -f docker-compose.webhook.yml ps

echo -e "\n2. Health Endpoint:"
curl -s http://localhost:3000/health | jq

echo -e "\n3. Stats Endpoint:"
curl -s http://localhost:3000/stats | jq

echo -e "\n4. Job Queue:"
curl -s http://localhost:3000/jobs | jq

echo -e "\n5. Recent Logs (Webhook Server):"
docker-compose -f docker-compose.webhook.yml logs --tail=20 webhook-server

echo -e "\n6. Recent Logs (Job Worker):"
docker-compose -f docker-compose.webhook.yml logs --tail=20 job-worker

echo -e "\n7. Disk Usage:"
df -h | grep -E '^Filesystem|/$'

echo -e "\n8. Docker System:"
docker system df
```

## Additional Resources

- [GitHub Webhooks Documentation](https://docs.github.com/en/webhooks)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [API Test Agent GitHub Repository](https://github.com/your-org/api-test-agent)

## Support

For issues and questions:

- **GitHub Issues**: https://github.com/your-org/api-test-agent/issues
- **Documentation**: https://github.com/your-org/api-test-agent/wiki
- **Email**: support@example.com

---

**Last Updated**: 2024-01-15
**Version**: 1.0.0
