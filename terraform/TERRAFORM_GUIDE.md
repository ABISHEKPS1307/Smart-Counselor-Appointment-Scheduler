# 🏗️ Terraform Deployment Guide

## 📋 Prerequisites

Before running Terraform, ensure you have:

1. ✅ **Terraform installed** (v1.5.0+)
   - Current version: v1.13.4 ✅
   - Download: https://developer.hashicorp.com/terraform/install

2. ✅ **Azure CLI installed and logged in**
   ```bash
   az --version
   az login
   az account show
   ```

3. ✅ **Correct Azure subscription selected**
   ```bash
   az account list --output table
   az account set --subscription "<subscription-id>"
   ```

4. ✅ **Contributor role** on the subscription

---

## 🚀 Quick Start (5 Steps)

### Step 1: Configure Variables

Edit `terraform.tfvars` and update:

```hcl
sql_admin_password = "YourSecurePassword123!"  # CHANGE THIS!
allowed_ip_addresses = ["YOUR_PUBLIC_IP/32"]   # Add your IP
```

Get your IP: https://www.whatismyip.com/

### Step 2: Initialize Terraform

```bash
cd terraform
terraform init
```

This downloads required providers (azurerm, random).

### Step 3: Plan Deployment

```bash
terraform plan -out=tfplan
```

Review the resources that will be created (~20 resources).

### Step 4: Apply Infrastructure

```bash
terraform apply tfplan
```

Type `yes` to confirm. This takes ~10-15 minutes.

### Step 5: Save Outputs

```bash
terraform output > deployment-info.txt
terraform output -json > deployment-info.json
```

---

## 📦 Resources Created

Terraform will create the following Azure resources:

### Core Infrastructure
- ✅ **Resource Group** - Container for all resources
- ✅ **App Service Plan** (Linux, B1) - Hosts the web app
- ✅ **App Service** (Node.js 18) - Your application
- ✅ **SQL Server** - Database server
- ✅ **SQL Database** (S0 tier) - Application database
- ✅ **SQL Firewall Rules** - Network access control

### Container & Registry
- ✅ **Azure Container Registry** (Basic) - Docker image storage

### Security & Secrets
- ✅ **Key Vault** - Secure secrets storage
- ✅ **Managed Identity** - For App Service
- ✅ **RBAC Assignments** - Key Vault access
- ✅ **Key Vault Secrets** - SQL password, JWT secret

### Monitoring
- ✅ **Application Insights** - Telemetry and monitoring

### Total: ~20 Azure resources

---

## 💰 Cost Estimate

**Monthly costs (approximate):**

| Resource | SKU | Est. Cost/Month |
|----------|-----|-----------------|
| App Service Plan | B1 (Basic) | ~$13 |
| SQL Database | S0 (Standard) | ~$15 |
| Container Registry | Basic | ~$5 |
| Key Vault | Standard | ~$0.03 |
| Application Insights | | ~$2.88 |
| **Total** | | **~$36/month** |

**💡 Tip:** Use Free tier options for development to reduce costs.

---

## 🔧 Terraform Commands Reference

### Initialization
```bash
# Initialize (first time only)
terraform init

# Upgrade providers
terraform init -upgrade
```

### Planning
```bash
# Create execution plan
terraform plan

# Save plan to file
terraform plan -out=tfplan

# Show plan details
terraform show tfplan
```

### Deployment
```bash
# Apply saved plan
terraform apply tfplan

# Apply with auto-approval (CAREFUL!)
terraform apply -auto-approve

# Apply specific resource
terraform apply -target=azurerm_resource_group.main
```

### State Management
```bash
# List resources in state
terraform state list

# Show specific resource
terraform state show azurerm_linux_web_app.main

# Remove resource from state (doesn't delete it)
terraform state rm azurerm_linux_web_app.main
```

### Outputs
```bash
# Show all outputs
terraform output

# Show specific output
terraform output app_service_url

# JSON format
terraform output -json > outputs.json
```

### Destruction
```bash
# Destroy all resources (CAREFUL!)
terraform destroy

# Destroy specific resource
terraform destroy -target=azurerm_linux_web_app.main

# Destroy with auto-approval (VERY CAREFUL!)
terraform destroy -auto-approve
```

### Validation & Formatting
```bash
# Validate configuration
terraform validate

# Format code
terraform fmt

# Format recursively
terraform fmt -recursive
```

---

## 📝 Step-by-Step Deployment

### Phase 1: Pre-Deployment

```bash
# 1. Navigate to terraform directory
cd d:\appointment_scheduler\terraform

# 2. Verify Azure login
az account show

# 3. Get your public IP
curl https://api.ipify.org

# 4. Update terraform.tfvars with your IP and password
notepad terraform.tfvars
```

### Phase 2: Initialize

```bash
# Initialize Terraform
terraform init

# Expected output:
# - Downloading azurerm provider ~3.80.0
# - Downloading random provider ~3.5.0
# - Terraform has been successfully initialized!
```

### Phase 3: Plan

```bash
# Create execution plan
terraform plan -out=tfplan

# Review output:
# - Green (+) = Resources to be created
# - Review resource names, SKUs, costs
# - Verify no unexpected changes
```

### Phase 4: Apply

```bash
# Apply the plan
terraform apply tfplan

# What happens:
# 1. Creates resource group (30s)
# 2. Creates SQL Server (1-2 min)
# 3. Creates database (2-3 min)
# 4. Creates Key Vault (1 min)
# 5. Creates App Service Plan & App (2-3 min)
# 6. Creates Container Registry (1-2 min)
# 7. Creates Application Insights (30s)
# 8. Configures access policies (1 min)
# Total: ~10-15 minutes
```

### Phase 5: Post-Deployment

```bash
# 1. Save outputs
terraform output > deployment-info.txt

# 2. View application URL
terraform output app_service_url

# 3. Initialize database
# (See DATABASE_SETUP.md)

# 4. Build and push Docker image
# (See DOCKER_SETUP.md)
```

---

## 🗄️ Database Initialization

After Terraform completes, initialize the database:

```bash
# Get SQL Server FQDN
$SQL_SERVER = terraform output -raw sql_server_fqdn
$SQL_DB = terraform output -raw sql_database_name

# Connect and run schema
sqlcmd -S $SQL_SERVER `
       -d $SQL_DB `
       -U sqladmin `
       -P "YourPassword123!" `
       -i ../sql/schema.sql

# Or use Azure Data Studio / SSMS
```

---

## 🐳 Docker Image Deployment

After infrastructure is ready:

```bash
# 1. Get ACR name
$ACR_NAME = terraform output -raw acr_name

# 2. Login to ACR
az acr login --name $ACR_NAME

# 3. Build and tag image
docker build -t $ACR_NAME.azurecr.io/counselor-app:latest ..

# 4. Push to ACR
docker push $ACR_NAME.azurecr.io/counselor-app:latest

# 5. Deploy to App Service
$APP_NAME = terraform output -raw app_service_name
$RG_NAME = terraform output -raw resource_group_name

az webapp config container set `
  --name $APP_NAME `
  --resource-group $RG_NAME `
  --docker-custom-image-name $ACR_NAME.azurecr.io/counselor-app:latest

# 6. Restart App Service
az webapp restart --name $APP_NAME --resource-group $RG_NAME
```

---

## 🔐 Managing Secrets

### Add Azure OpenAI Secrets

```bash
# Get Key Vault name
$KV_NAME = terraform output -raw key_vault_name

# Add OpenAI endpoint
az keyvault secret set `
  --vault-name $KV_NAME `
  --name "AZURE-OPENAI-ENDPOINT" `
  --value "https://your-resource.openai.azure.com/"

# Add OpenAI API key
az keyvault secret set `
  --vault-name $KV_NAME `
  --name "AZURE-OPENAI-API-KEY" `
  --value "your-api-key-here"
```

### View Secrets

```bash
# List all secrets
az keyvault secret list --vault-name $KV_NAME --output table

# Get specific secret
az keyvault secret show --vault-name $KV_NAME --name JWT-SECRET
```

---

## 🐛 Troubleshooting

### Issue: Provider Registration Failed

**Error:** `Provider Microsoft.xxx is not registered`

**Solution:**
```bash
az provider register --namespace Microsoft.Web
az provider register --namespace Microsoft.Sql
az provider register --namespace Microsoft.ContainerRegistry
az provider register --namespace Microsoft.KeyVault
az provider register --namespace Microsoft.Insights
```

### Issue: Resource Name Already Exists

**Error:** `Resource name already taken`

**Solution:** Edit `terraform.tfvars` and change:
- `acr_name` (must be globally unique)
- `sql_server_name` (must be globally unique)
- `app_service_name` (must be globally unique)

Or let Terraform add random suffix automatically.

### Issue: Insufficient Permissions

**Error:** `Authorization failed`

**Solution:** Ensure you have Contributor role:
```bash
az role assignment list --assignee $(az account show --query user.name -o tsv)
```

### Issue: State Lock

**Error:** `State is locked`

**Solution:**
```bash
# Force unlock (use carefully!)
terraform force-unlock <LOCK_ID>
```

### Issue: Plan Shows Unexpected Changes

**Solution:**
```bash
# Refresh state
terraform refresh

# Re-plan
terraform plan
```

---

## 🔄 Updating Infrastructure

### Modify Configuration

1. Edit `terraform.tfvars` or `.tf` files
2. Run `terraform plan` to preview changes
3. Run `terraform apply` to apply changes

### Example: Scale App Service

```hcl
# In terraform.tfvars
sku_size = "B2"  # Changed from B1
```

```bash
terraform plan -out=tfplan
terraform apply tfplan
```

---

## 🗑️ Cleanup / Destroy

### Destroy All Resources

```bash
# Plan destruction
terraform plan -destroy

# Destroy (CAREFUL - deletes everything!)
terraform destroy

# Or with auto-approval (VERY CAREFUL!)
terraform destroy -auto-approve
```

### Destroy Specific Resources

```bash
# Just the App Service
terraform destroy -target=azurerm_linux_web_app.main

# Just the database
terraform destroy -target=azurerm_mssql_database.main
```

---

## 📊 Monitoring After Deployment

### Application Insights

```bash
# Get App Insights URL
terraform output app_insights_name

# View in Azure Portal
az monitor app-insights component show `
  --app $(terraform output -raw app_insights_name) `
  --resource-group $(terraform output -raw resource_group_name)
```

### Application Logs

```bash
# Stream logs
az webapp log tail `
  --name $(terraform output -raw app_service_name) `
  --resource-group $(terraform output -raw resource_group_name)
```

---

## 📚 Additional Resources

- **Terraform Azure Provider:** https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs
- **Azure Naming Conventions:** https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/azure-best-practices/resource-naming
- **Terraform Best Practices:** https://www.terraform-best-practices.com/

---

## ✅ Post-Deployment Checklist

- [ ] Infrastructure deployed successfully
- [ ] Database schema initialized
- [ ] Docker image built and pushed to ACR
- [ ] App Service configured with container
- [ ] Azure OpenAI secrets added to Key Vault
- [ ] Firewall rules configured for your IP
- [ ] Application accessible at App Service URL
- [ ] Application Insights collecting telemetry
- [ ] Secrets stored securely in Key Vault
- [ ] Documentation updated with URLs and credentials

---

**Ready to deploy? Run `terraform init` to get started!** 🚀
