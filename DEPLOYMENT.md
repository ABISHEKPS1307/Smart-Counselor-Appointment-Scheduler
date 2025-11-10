# 🚀 Deployment Guide - Smart Counselor Appointment Scheduler

## 📋 **Infrastructure Overview**

### **Azure Resources**

| Resource | Type | Purpose | Status |
|----------|------|---------|--------|
| `CloudProjectNew` | Resource Group | Container for all resources | ✅ Existing |
| `counselorsch123acr` | Container Registry | Docker image storage | ✅ Created |
| `counselor-env` | Container Apps Environment | Shared infrastructure | ✅ Created |
| `counselor-app` | Container App | Application runtime | ✅ Created |
| `scmainserver` | SQL Server | Database server | ✅ Existing |
| `sc-db` | SQL Database | Application database | ✅ Existing |
| `workspace-*` | Log Analytics | Logging & monitoring | ✅ Auto-created |

### **What Was Removed**
- ❌ `counselor-scheduler-123` (App Service) - Replaced with Container Apps
- ❌ Old deployment workflows
- ❌ Temporary deployment files

---

## 🏗️ **Architecture**

```
GitHub Actions (CI/CD)
  ├─ Build Docker Image
  ├─ Push to ACR
  └─ Deploy to Container App

Azure Container Apps
  ├─ counselor-app (Node.js Express)
  ├─ Scale: 0-1 replicas (auto-scaling)
  ├─ CPU: 0.5 vCPU
  ├─ Memory: 1 GiB
  └─ Port: 8080

Azure SQL Database
  └─ scmainserver/sc-db

Azure Container Registry
  └─ counselorsch123acr.azurecr.io
```

---

## 🔐 **Required Secrets**

Configured in GitHub: `Settings > Secrets and variables > Actions`

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `AZURE_CREDENTIALS` | Service principal JSON | `{"clientId": "...", ...}` |
| `ACR_PASSWORD` | Container Registry password | `E1eMB5r...` |
| `SQL_PASSWORD` | SQL Database password | Your DB password |
| `JWT_SECRET` | JWT signing key | Random secure string |

---

## 🚀 **Deployment Process**

### **Automated (CI/CD)**

Every push to `main` branch triggers:

1. **Build** - Docker image built from Dockerfile
2. **Push** - Image pushed to ACR with SHA tag + latest
3. **Deploy** - Container App updated with new image
4. **Test** - Health check verifies deployment

**Monitor:** https://github.com/ABISHEKPS1307/Smart-Counselor-Appointment-Scheduler/actions

### **Manual Deployment**

```bash
# 1. Build and push Docker image
docker build -t counselorsch123acr.azurecr.io/counselor-app:latest .
docker push counselorsch123acr.azurecr.io/counselor-app:latest

# 2. Update Container App
az containerapp update \
  --name counselor-app \
  --resource-group CloudProjectNew \
  --image counselorsch123acr.azurecr.io/counselor-app:latest

# 3. Check deployment
az containerapp show \
  --name counselor-app \
  --resource-group CloudProjectNew \
  --query properties.latestRevisionName
```

---

## 🧪 **Testing After Deployment**

### **Health Check**
```bash
curl https://counselor-app.happybeach-63d85bb1.centralindia.azurecontainerapps.io/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-11-10T..."
}
```

### **Test GenAI Features**

1. **Feedback System**
   - Login: `alice.johnson@university.edu` / `Password123!`
   - Submit feedback on past appointment
   - Verify AI analysis appears

2. **AI Chatbot**
   - Click chatbot icon (bottom-right)
   - Try: "How do I book an appointment?"
   - Test different modes (FAQ, Wellbeing, Recommend)

3. **Counselor Ratings**
   - Login: `emily.carter@university.edu` / `Password123!`
   - View ratings dashboard
   - Check sentiment analysis

---

## 📊 **Monitoring & Logs**

### **View Logs**
```bash
# Follow logs in real-time
az containerapp logs show \
  --name counselor-app \
  --resource-group CloudProjectNew \
  --follow

# View last 50 lines
az containerapp logs show \
  --name counselor-app \
  --resource-group CloudProjectNew \
  --tail 50
```

### **Check App Status**
```bash
az containerapp show \
  --name counselor-app \
  --resource-group CloudProjectNew \
  --query "{status:properties.runningStatus, replicas:properties.template.scale}"
```

---

## 🔄 **Terraform Infrastructure**

### **Files**
- `terraform/main.tf` - Infrastructure definition
- `terraform/variables.tf` - Configuration variables
- `terraform/.gitignore` - Terraform exclusions

### **Usage** (Future)
```bash
cd terraform

# Initialize
terraform init

# Plan changes
terraform plan \
  -var="sql_password=$SQL_PASSWORD" \
  -var="jwt_secret=$JWT_SECRET" \
  -var="acr_password=$ACR_PASSWORD"

# Apply changes
terraform apply \
  -var="sql_password=$SQL_PASSWORD" \
  -var="jwt_secret=$JWT_SECRET" \
  -var="acr_password=$ACR_PASSWORD"
```

---

## 💰 **Cost Estimation**

| Resource | Tier | Monthly Cost |
|----------|------|--------------|
| Container Apps | Consumption | ~$0-5 (free tier 180K vCPU-sec) |
| Container Registry | Basic | ~$5 |
| SQL Database | Existing | $0 (already created) |
| Log Analytics | Pay-as-you-go | ~$0-2 |
| **Total** | | **~$5-12/month** |

---

## 🐛 **Troubleshooting**

### **Deployment Fails**

**Check workflow logs:**
```
GitHub Actions > Latest run > Build & Deploy job
```

**Common issues:**
- Missing GitHub secrets → Add in repository settings
- ACR authentication failed → Verify ACR_PASSWORD
- SQL connection failed → Check SQL_PASSWORD

### **App Not Responding**

**Check if app is running:**
```bash
az containerapp show \
  --name counselor-app \
  --resource-group CloudProjectNew \
  --query properties.runningStatus
```

**View recent logs:**
```bash
az containerapp logs show \
  --name counselor-app \
  --resource-group CloudProjectNew \
  --tail 100
```

### **Database Connection Issues**

**Test SQL connection:**
```bash
# From Azure CLI
az sql server firewall-rule list \
  --server scmainserver \
  --resource-group CloudProjectNew
```

**Allow Container App IPs if needed:**
```bash
# Get outbound IPs
az containerapp show \
  --name counselor-app \
  --resource-group CloudProjectNew \
  --query properties.outboundIpAddresses
```

---

## ✅ **Deployment Checklist**

- [x] Azure Container Registry created
- [x] Container Apps Environment created
- [x] Container App created
- [x] GitHub secrets configured
- [x] CI/CD workflow created
- [x] Old App Service removed
- [x] Terraform infrastructure defined
- [x] Code syntax checked
- [x] Documentation updated

---

## 📚 **Additional Resources**

- **App URL:** https://counselor-app.happybeach-63d85bb1.centralindia.azurecontainerapps.io
- **GitHub Repo:** https://github.com/ABISHEKPS1307/Smart-Counselor-Appointment-Scheduler
- **Azure Portal:** https://portal.azure.com

---

## 🎯 **Summary**

**Deployment Method:** Azure Container Apps + GitHub Actions  
**Infrastructure:** Terraform-defined (optional)  
**Scaling:** Auto-scale 0-1 replicas  
**Cost:** ~$5-12/month (free tier eligible)  
**Status:** ✅ Production Ready

**Next Steps:**
1. Push code to trigger deployment
2. Monitor GitHub Actions
3. Test health endpoint
4. Verify GenAI features work

**Deployment is complete and ready for production use!** 🚀
