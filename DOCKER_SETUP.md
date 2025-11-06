# 🐳 Docker Setup Guide

## Prerequisites

Before you begin, ensure you have:

1. **Docker Desktop** installed
   - Windows: Download from https://www.docker.com/products/docker-desktop
   - Verify: `docker --version` and `docker-compose --version`

2. **Docker Desktop Running**
   - Make sure Docker Desktop is started and running

---

## 🚀 Option 1: Local Development (with Local SQL Server)

Perfect for testing without Azure dependencies.

### Step 1: Build and Start Containers

```bash
# Start all services (app + local SQL Server)
docker-compose up -d

# View logs
docker-compose logs -f
```

### Step 2: Wait for Database to Initialize

The SQL Server takes about 30-60 seconds to start. Wait for this message in logs:
```
SQL Server is now ready for client connections
```

### Step 3: Create Database and Schema

```bash
# Create database
docker exec -it counselor-db /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "YourStrong!Passw0rd" -Q "CREATE DATABASE CounselorScheduler"

# Import schema
docker exec -it counselor-db /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "YourStrong!Passw0rd" -d CounselorScheduler -i /docker-entrypoint-initdb.d/schema.sql
```

### Step 4: Access Application

Open your browser: **http://localhost:8080**

### Step 5: Stop Services

```bash
# Stop and remove containers
docker-compose down

# Stop and remove containers + volumes (clean state)
docker-compose down -v
```

---

## 🌐 Option 2: Production Setup (with Azure SQL)

Use your existing Azure SQL Database in Docker.

### Step 1: Create Production Docker Compose File

Create `.env.docker` file:

```env
NODE_ENV=production
PORT=8080
SQL_SERVER=scmainserver.database.windows.net
SQL_DATABASE=sc-db
SQL_USER=adminuser
SQL_PASSWORD=Admin@user
SQL_ENCRYPT=true
SQL_TRUST_SERVER_CERTIFICATE=false
JWT_SECRET=your-production-secret-here
JWT_EXPIRES_IN=1h
AZURE_OPENAI_ENDPOINT=https://your-openai.openai.azure.com/
AZURE_OPENAI_API_KEY=your-key-here
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
AZURE_OPENAI_API_VERSION=2023-05-15
```

### Step 2: Build Docker Image

```bash
# Build the image
docker build -t counselor-app:latest .

# Or with a specific tag
docker build -t counselor-app:1.0.0 .
```

### Step 3: Run Container with Azure SQL

```bash
# Run container with environment file
docker run -d \
  --name counselor-app \
  -p 8080:8080 \
  --env-file .env.docker \
  counselor-app:latest

# View logs
docker logs -f counselor-app

# Stop container
docker stop counselor-app
docker rm counselor-app
```

---

## 📦 Docker Commands Reference

### Build & Run

```bash
# Build image
docker build -t counselor-app .

# Run container
docker run -d -p 8080:8080 --name counselor-app counselor-app

# Run with environment variables
docker run -d -p 8080:8080 \
  -e NODE_ENV=production \
  -e SQL_SERVER=your-server.database.windows.net \
  --name counselor-app counselor-app
```

### Manage Containers

```bash
# List running containers
docker ps

# List all containers
docker ps -a

# Stop container
docker stop counselor-app

# Start container
docker start counselor-app

# Remove container
docker rm counselor-app

# View logs
docker logs counselor-app
docker logs -f counselor-app  # Follow logs
docker logs --tail 100 counselor-app  # Last 100 lines
```

### Manage Images

```bash
# List images
docker images

# Remove image
docker rmi counselor-app

# Remove unused images
docker image prune

# Remove all unused images
docker image prune -a
```

### Docker Compose Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart a service
docker-compose restart app

# Rebuild services
docker-compose up -d --build

# View running services
docker-compose ps

# Execute command in running container
docker-compose exec app sh
```

---

## 🔧 Troubleshooting

### Issue: Port 8080 Already in Use

```bash
# Find process using port 8080
netstat -ano | findstr :8080

# Kill the process (replace PID)
taskkill /F /PID <PID>

# Or use different port
docker run -d -p 3000:8080 --name counselor-app counselor-app
```

### Issue: Database Connection Failed

```bash
# Check if database container is running
docker ps | grep counselor-db

# Check database logs
docker logs counselor-db

# Test database connection
docker exec -it counselor-db /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "YourStrong!Passw0rd" -Q "SELECT 1"
```

### Issue: Container Keeps Restarting

```bash
# Check logs for errors
docker logs counselor-app

# Check container health
docker inspect counselor-app | grep -A 10 Health
```

### Issue: Build Fails

```bash
# Clear Docker cache and rebuild
docker system prune -a
docker build --no-cache -t counselor-app .
```

---

## 🏗️ Docker Architecture

```
┌─────────────────────────────────────┐
│     Docker Host (Your Machine)      │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   counselor-app Container    │  │
│  │   - Node.js 18 Alpine        │  │
│  │   - App runs on port 8080    │  │
│  │   - Connects to database     │  │
│  └──────────────────────────────┘  │
│              ↓                      │
│  ┌──────────────────────────────┐  │
│  │   counselor-db Container     │  │
│  │   - SQL Server 2022          │  │
│  │   - Port 1433                │  │
│  │   - Persistent volume        │  │
│  └──────────────────────────────┘  │
│                                     │
│  Network: app-network (bridge)      │
└─────────────────────────────────────┘
```

---

## 🎯 Production Deployment Tips

### 1. Use Environment Variables

Never hardcode secrets. Use `.env` files or container orchestration secrets.

### 2. Health Checks

The Dockerfile includes health checks. Monitor them:

```bash
docker inspect counselor-app | grep -A 5 Health
```

### 3. Resource Limits

Set memory and CPU limits:

```bash
docker run -d \
  --memory="512m" \
  --cpus="1.0" \
  -p 8080:8080 \
  counselor-app
```

### 4. Logging

Configure log drivers for production:

```bash
docker run -d \
  --log-driver json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  -p 8080:8080 \
  counselor-app
```

### 5. Multi-Stage Builds

The Dockerfile uses multi-stage builds to minimize image size:
- Builder stage: Installs dependencies
- Production stage: Only includes runtime files

---

## 📊 Image Information

### Current Image Stats

```bash
# Check image size
docker images counselor-app

# Inspect image layers
docker history counselor-app

# View image details
docker inspect counselor-app
```

### Expected Image Size

- **Base (node:18-alpine):** ~180 MB
- **With dependencies:** ~220-250 MB
- **Final production image:** ~220-250 MB

---

## 🔐 Security Best Practices

✅ **Non-root user** - App runs as `nodejs` user (UID 1001)  
✅ **Minimal base image** - Uses Alpine Linux  
✅ **No secrets in image** - Uses environment variables  
✅ **Health checks** - Container self-monitoring  
✅ **Multi-stage build** - Smaller attack surface  

---

## 📚 Additional Resources

- **Docker Documentation:** https://docs.docker.com/
- **Docker Compose:** https://docs.docker.com/compose/
- **Best Practices:** https://docs.docker.com/develop/dev-best-practices/

---

**Ready to containerize? Run `docker-compose up -d` and you're live!** 🚀
