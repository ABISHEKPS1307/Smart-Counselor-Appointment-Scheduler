# Terraform Infrastructure for Smart Counselor Appointment Scheduler

This directory contains Terraform configurations to deploy the complete Azure infrastructure for the Smart Counselor Appointment Scheduler application.

## 📋 Prerequisites

1. **Azure Account**
   - Active Azure subscription
   - Contributor or Owner role

2. **Tools Required**
   - [Terraform](https://www.terraform.io/downloads) >= 1.5.0
   - [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli) >= 2.40.0

3. **Authentication**
   ```bash
   az login
   az account set --subscription "<your-subscription-id>"
   ```

## 🏗️ Infrastructure Components

The Terraform configuration creates the following Azure resources:

- **Resource Group**: Container for all resources
- **App Service Plan**: Linux-based hosting plan (B1 SKU)
- **App Service**: Node.js 18 web application with Managed Identity
- **Azure SQL Server**: SQL Database server with TLS 1.2+
- **Azure SQL Database**: Database instance (S0 SKU)
- **Container Registry**: Private Docker registry for application images
- **Key Vault**: Secure storage for secrets (JWT, SQL password, OpenAI keys)
- **Application Insights**: Monitoring and telemetry
- **Firewall Rules**: SQL Server access control

## 🚀 Quick Start

### 1. Configure Variables

Create a `terraform.tfvars` file:

```hcl
resource_group_name = "counselor-scheduler-rg"
location           = "East US"
environment        = "production"

# SQL Server credentials
sql_admin_username = "sqladmin"
sql_admin_password = "YourStrongP@ssw0rd123!"

# Firewall: Add your public IP for database access
allowed_ip_addresses = ["203.0.113.42"]  # Replace with your IP

# Tags
tags = {
  Project     = "Smart Counselor Scheduler"
  Environment = "Production"
  ManagedBy   = "Terraform"
}
```

**⚠️ Security Note**: Never commit `terraform.tfvars` with sensitive data. Use environment variables instead:

```bash
export TF_VAR_sql_admin_password="YourStrongP@ssw0rd123!"
```

### 2. Initialize Terraform

```bash
cd terraform
terraform init
```

This downloads the required Azure provider plugins.

### 3. Plan Deployment

Review the infrastructure changes:

```bash
terraform plan -out=tfplan
```

This shows all resources that will be created.

### 4. Apply Configuration

Deploy the infrastructure:

```bash
terraform apply tfplan
```

Type `yes` when prompted. Deployment takes approximately 5-10 minutes.

### 5. View Outputs

After successful deployment:

```bash
terraform output
```

This displays important information like URLs, resource names, and connection strings.

## 📊 Resource Naming

Resources are created with unique names using a random 6-character suffix:

- App Service: `counselor-scheduler-app-abc123`
- SQL Server: `counselor-scheduler-sql-abc123`
- Key Vault: `counselor-kv-abc123`
- ACR: `counselorschedulerxyz789`

## 🔐 Security Features

### 1. Managed Identity
The App Service uses a System-Assigned Managed Identity to access:
- Key Vault secrets (no hardcoded credentials)
- Container Registry

### 2. Key Vault Integration
Secrets are automatically injected as environment variables:
```
SQL_PASSWORD = @Microsoft.KeyVault(SecretUri=https://...)
JWT_SECRET   = @Microsoft.KeyVault(SecretUri=https://...)
```

### 3. SQL Server Security
- TLS 1.2+ enforced
- Azure AD authentication enabled
- Firewall rules restrict access
- Short-term backup retention (7 days)

### 4. Network Security
- HTTPS-only enforced on App Service
- SQL Server only accepts encrypted connections

## 🔧 Post-Deployment Steps

### 1. Initialize Database Schema

```bash
# Get SQL Server FQDN
SQL_SERVER=$(terraform output -raw sql_server_fqdn)

# Run schema script
sqlcmd -S $SQL_SERVER \
       -d CounselorScheduler \
       -U sqladmin \
       -P "YourPassword" \
       -i ../sql/schema.sql
```

### 2. Add Azure OpenAI Secrets

```bash
# Get Key Vault name
KV_NAME=$(terraform output -json deployment_summary | jq -r '.key_vault_name')

# Add OpenAI endpoint
az keyvault secret set \
  --vault-name $KV_NAME \
  --name AZURE-OPENAI-ENDPOINT \
  --value "https://your-openai-resource.openai.azure.com/"

# Add OpenAI API key
az keyvault secret set \
  --vault-name $KV_NAME \
  --name AZURE-OPENAI-API-KEY \
  --value "your-openai-api-key"
```

### 3. Build and Deploy Application

```bash
# Get ACR name
ACR_NAME=$(terraform output -json deployment_summary | jq -r '.acr_name')

# Login to ACR
az acr login --name $ACR_NAME

# Build and push Docker image
docker build -t $ACR_NAME.azurecr.io/counselor-app:latest ..
docker push $ACR_NAME.azurecr.io/counselor-app:latest

# Configure App Service to use container
APP_NAME=$(terraform output -json deployment_summary | jq -r '.app_service_name')
RG_NAME=$(terraform output -json deployment_summary | jq -r '.resource_group')

az webapp config container set \
  --name $APP_NAME \
  --resource-group $RG_NAME \
  --docker-custom-image-name $ACR_NAME.azurecr.io/counselor-app:latest \
  --docker-registry-server-url https://$ACR_NAME.azurecr.io
```

## 🔄 Updating Infrastructure

To update existing infrastructure:

```bash
# Modify variables or configuration files
# Then run:
terraform plan -out=tfplan
terraform apply tfplan
```

## 🗑️ Destroying Infrastructure

To remove all resources:

```bash
terraform destroy
```

**⚠️ Warning**: This permanently deletes all data, including databases.

## 📁 File Structure

```
terraform/
├── providers.tf      # Provider configuration and version constraints
├── variables.tf      # Input variable definitions
├── main.tf          # Main resource definitions
├── outputs.tf       # Output value definitions
├── terraform.tfvars # Variable values (DO NOT COMMIT)
└── README.md        # This file
```

## 🔍 Troubleshooting

### Issue: "Resource name already exists"
**Solution**: Resource names must be globally unique. Modify the `random_string` seed or change base names in `variables.tf`.

### Issue: "Insufficient permissions"
**Solution**: Ensure your Azure account has Contributor role:
```bash
az role assignment create \
  --assignee your@email.com \
  --role Contributor \
  --scope /subscriptions/<subscription-id>
```

### Issue: "Key Vault access denied"
**Solution**: RBAC authorization is enabled. The Terraform config automatically grants access to:
- Current user/service principal (Administrator)
- App Service Managed Identity (Secrets User)

### Issue: "SQL firewall blocks connection"
**Solution**: Add your public IP to `allowed_ip_addresses` in `terraform.tfvars`:
```bash
# Get your public IP
curl -s https://ifconfig.me
```

## 🌐 Environment-Specific Deployments

For multiple environments (dev, staging, prod):

### Using Workspaces
```bash
terraform workspace new dev
terraform workspace new prod

terraform workspace select dev
terraform apply -var="environment=dev"

terraform workspace select prod
terraform apply -var="environment=prod"
```

### Using Separate State Files
```bash
# Development
terraform apply -var-file="dev.tfvars" -state="dev.tfstate"

# Production
terraform apply -var-file="prod.tfvars" -state="prod.tfstate"
```

## 🔐 Production Best Practices

1. **Remote State**: Use Azure Storage for Terraform state
   ```hcl
   backend "azurerm" {
     resource_group_name  = "terraform-state-rg"
     storage_account_name = "tfstatestorage"
     container_name       = "tfstate"
     key                  = "counselor.tfstate"
   }
   ```

2. **Private Endpoints**: Enable for SQL Server (uncomment in `main.tf`)

3. **Higher SKUs**: Use Standard or Premium tiers for production
   ```hcl
   sku_name     = "P1v2"  # App Service
   sql_sku_name = "S2"     # SQL Database
   ```

4. **Backup Configuration**: Configure long-term retention for SQL

5. **Network Security**: Implement VNet integration and private endpoints

## 📚 Additional Resources

- [Azure App Service Documentation](https://docs.microsoft.com/en-us/azure/app-service/)
- [Azure SQL Database Documentation](https://docs.microsoft.com/en-us/azure/azure-sql/)
- [Azure Key Vault Documentation](https://docs.microsoft.com/en-us/azure/key-vault/)
- [Terraform Azure Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)

## 🆘 Support

For issues or questions:
1. Check Azure Portal for resource status
2. Review Application Insights logs
3. Verify Key Vault access policies
4. Check SQL Server firewall rules
