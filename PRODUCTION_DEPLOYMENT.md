# 🚀 Smart Counselor Appointment Scheduler - Production Deployment

## ✅ Deployment Status: SUCCESSFUL

**Deployed:** November 8, 2025  
**Environment:** Azure App Service (CloudProjectNew)  
**Runtime:** Node.js 22 LTS  
**Database:** Azure SQL Database

---

## 🌐 Application URLs

### Production
**Azure App Service:**  
https://counselor-scheduler-123-bjayctaaejfccyas.centralindia-01.azurewebsites.net

**API Health Check:**  
https://counselor-scheduler-123-bjayctaaejfccyas.centralindia-01.azurewebsites.net/api/health

**API Documentation:**  
https://counselor-scheduler-123-bjayctaaejfccyas.centralindia-01.azurewebsites.net/api-docs

### Local Development
**Server:** http://localhost:8080  
**API Docs:** http://localhost:8080/api-docs  
**Health Check:** http://localhost:8080/api/health

---

## 🏗️ Infrastructure (CloudProjectNew Resource Group)

### Azure Resources

| Resource | Name | Type | Purpose |
|----------|------|------|---------|
| **App Service** | counselor-scheduler-123 | Linux Web App | Application hosting |
| **SQL Server** | scmainserver | Azure SQL Server | Database server |
| **SQL Database** | sc-db | Azure SQL Database | Application data |
| **Storage Account** | scfrontend | Azure Storage | Frontend assets |

### Configuration

**App Service:**
- Runtime: NODE|22-lts
- Region: Central India
- Startup Command: `node src/server.js`
- Deployment Method: ZIP Deploy via GitHub Actions

**SQL Database:**
- Server: scmainserver.database.windows.net
- Database: sc-db
- Firewall Rules:
  - Local Development: 157.51.148.205
  - Azure Services: 0.0.0.0 (allows App Service)

---

## 🔄 Deployment Workflow

### Automatic Deployment (GitHub Actions)

**Trigger:** Push to `main` branch or manual workflow dispatch

**Process:**
1. Checkout code
2. Install Node.js 22
3. Install production dependencies (`npm ci --production`)
4. Create deployment package (src, public, sql, node_modules, package.json)
5. Login to Azure with Service Principal
6. Configure App Service runtime and startup
7. Set environment variables
8. Deploy ZIP package
9. Restart application

**Workflow File:** `.github/workflows/azure-deploy.yml`

### Manual Deployment

```bash
# 1. Build deployment package
npm ci --production
zip -r deploy.zip src public sql node_modules package.json

# 2. Deploy to Azure
az webapp deployment source config-zip \
  --resource-group CloudProjectNew \
  --name counselor-scheduler-123 \
  --src deploy.zip

# 3. Restart app
az webapp restart \
  --resource-group CloudProjectNew \
  --name counselor-scheduler-123
```

---

## 🔐 Environment Variables

### Production (Azure App Service)

Configured via GitHub Actions workflow:

| Variable | Source | Purpose |
|----------|--------|---------|
| `NODE_ENV` | Hardcoded | Environment mode |
| `PORT` | Hardcoded | Server port |
| `SQL_SERVER` | Hardcoded | Database server |
| `SQL_DATABASE` | Hardcoded | Database name |
| `SQL_USER` | Hardcoded | Database user |
| `SQL_PASSWORD` | GitHub Secret | Database password |
| `SQL_ENCRYPT` | Hardcoded | SQL encryption |
| `SQL_TRUST_SERVER_CERTIFICATE` | Hardcoded | SQL certificate |
| `JWT_SECRET` | GitHub Secret | JWT signing key |
| `JWT_EXPIRES_IN` | Hardcoded | Token expiration |
| `AZURE_OPENAI_ENDPOINT` | Hardcoded | OpenAI endpoint |
| `AZURE_OPENAI_API_KEY` | Hardcoded | OpenAI API key |

### Required GitHub Secrets

1. **AZURE_CREDENTIALS** - Azure Service Principal (JSON)
2. **SQL_PASSWORD** - Database password
3. **JWT_SECRET** - JWT signing secret

---

## 🧪 Testing & Verification

### Health Check

```bash
# Production
curl https://counselor-scheduler-123-bjayctaaejfccyas.centralindia-01.azurewebsites.net/api/health

# Expected Response:
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-11-08T..."
}
```

### API Endpoints

```bash
# Register User
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "fullName": "Test User",
  "role": "student"
}

# Login
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

# Get Appointments (requires auth)
GET /api/appointments
Authorization: Bearer <jwt_token>
```

---

## 💻 Local Development

### Prerequisites
- Node.js 22+
- npm
- Azure SQL Database access
- Git

### Setup

```bash
# 1. Clone repository
git clone https://github.com/ABISHEKPS1307/Smart-Counselor-Appointment-Scheduler.git
cd Smart-Counselor-Appointment-Scheduler

# 2. Install dependencies
npm install

# 3. Configure environment
# Edit .env file with your settings

# 4. Start server
npm start

# Server will be available at http://localhost:8080
```

### Environment File (.env)

```ini
NODE_ENV=development
PORT=8080
SQL_SERVER=scmainserver.database.windows.net
SQL_DATABASE=sc-db
SQL_USER=adminuser
SQL_PASSWORD=Admin@user
SQL_ENCRYPT=true
SQL_TRUST_SERVER_CERTIFICATE=false
JWT_SECRET=dev-secret-key-change-in-production-12345678
JWT_EXPIRES_IN=1h
AZURE_OPENAI_ENDPOINT=https://placeholder.openai.azure.com/
AZURE_OPENAI_API_KEY=placeholder
```

---

## 📊 Monitoring & Logs

### View Azure Logs

```bash
# Tail logs in real-time
az webapp log tail \
  --resource-group CloudProjectNew \
  --name counselor-scheduler-123

# Download logs
az webapp log download \
  --resource-group CloudProjectNew \
  --name counselor-scheduler-123 \
  --log-file logs.zip
```

### Check App Status

```bash
# Get app status
az webapp show \
  --resource-group CloudProjectNew \
  --name counselor-scheduler-123 \
  --query "{name:name, state:state, defaultHostName:defaultHostName}"

# Restart app
az webapp restart \
  --resource-group CloudProjectNew \
  --name counselor-scheduler-123
```

---

## 🔧 Troubleshooting

### App Not Responding

```bash
# 1. Check logs
az webapp log tail --resource-group CloudProjectNew --name counselor-scheduler-123

# 2. Verify configuration
az webapp config show --resource-group CloudProjectNew --name counselor-scheduler-123

# 3. Restart app
az webapp restart --resource-group CloudProjectNew --name counselor-scheduler-123
```

### Database Connection Issues

```bash
# Check firewall rules
az sql server firewall-rule list \
  --resource-group CloudProjectNew \
  --server scmainserver

# Add IP to firewall
az sql server firewall-rule create \
  --resource-group CloudProjectNew \
  --server scmainserver \
  --name "NewIP" \
  --start-ip-address YOUR_IP \
  --end-ip-address YOUR_IP
```

### Deployment Failures

1. Check GitHub Actions logs
2. Verify all secrets are set correctly
3. Ensure Service Principal has correct permissions
4. Check Azure App Service deployment logs

---

## 📦 Project Structure

```
appointment_scheduler/
├── .github/
│   └── workflows/
│       └── azure-deploy.yml       # GitHub Actions deployment workflow
├── src/
│   ├── config.js                  # Application configuration
│   ├── server.js                  # Entry point
│   ├── app.js                     # Express app setup
│   ├── middleware/                # Custom middleware
│   ├── models/                    # Database models
│   ├── routes/                    # API routes
│   ├── services/                  # Business logic
│   ├── telemetry.js              # App Insights
│   └── utils/                     # Utility functions
├── public/                        # Static frontend files
├── sql/
│   └── schema.sql                # Database schema
├── Dockerfile                     # Docker configuration (optional)
├── package.json                   # Dependencies
├── .env                          # Environment variables (local)
├── .gitignore                    # Git ignore rules
└── README.md                     # Project documentation
```

---

## 🔒 Security Considerations

### Production Security

✅ **Implemented:**
- SQL connection encryption enabled
- Environment variables for sensitive data
- JWT-based authentication
- Azure SQL firewall rules
- HTTPS enabled (Azure default)

⚠️ **Recommendations:**
- Rotate JWT_SECRET regularly
- Enable Azure Key Vault for secrets
- Configure Application Insights for monitoring
- Implement rate limiting in production
- Add Azure AD authentication
- Enable CORS with specific origins
- Regular security audits

---

## 📝 Maintenance

### Regular Tasks

**Weekly:**
- Review application logs
- Monitor database performance
- Check for security updates

**Monthly:**
- Update npm dependencies
- Review and rotate secrets
- Backup database
- Review firewall rules

**Quarterly:**
- Security audit
- Performance optimization
- Cost optimization review

### Updating Dependencies

```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Test locally
npm test
npm start

# Deploy to production
git add package*.json
git commit -m "chore: update dependencies"
git push origin main
```

---

## 📚 Additional Resources

- **Azure Documentation:** https://docs.microsoft.com/azure
- **Node.js Best Practices:** https://github.com/goldbergyoni/nodebestpractices
- **Express.js Guide:** https://expressjs.com/
- **GitHub Actions:** https://docs.github.com/actions

---

## 📞 Support

For issues or questions:
1. Check application logs
2. Review this deployment guide
3. Check GitHub Issues
4. Contact development team

---

## ✅ Deployment Checklist

### Initial Setup
- [x] Azure resources created
- [x] Database schema deployed
- [x] Firewall rules configured
- [x] GitHub repository setup
- [x] GitHub Actions workflow configured
- [x] GitHub secrets added
- [x] Application deployed
- [x] Health check verified

### Post-Deployment
- [x] Application accessible
- [x] Database connectivity verified
- [x] API endpoints tested
- [x] Local development working
- [x] Documentation updated
- [x] Monitoring configured

---

**Deployment successful! Application is live and ready for use.** 🎉

**Last Updated:** November 8, 2025  
**Version:** 1.0.0  
**Status:** Production
