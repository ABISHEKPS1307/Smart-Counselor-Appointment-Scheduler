# =============================================================================
# Main Terraform Configuration for Smart Counselor Appointment Scheduler
# Creates Azure infrastructure: App Service, SQL Database, Key Vault, ACR, etc.
# =============================================================================

# Generate random suffix for globally unique resource names
resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

# =============================================================================
# Resource Group
# =============================================================================

resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.location
  tags     = var.tags
}

# =============================================================================
# Application Insights (Monitoring & Observability)
# =============================================================================

resource "azurerm_application_insights" "main" {
  name                = "${var.app_insights_name}-${random_string.suffix.result}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  application_type    = "Node.JS"
  tags                = var.tags
}

# =============================================================================
# Azure Container Registry (ACR)
# =============================================================================

resource "azurerm_container_registry" "main" {
  name                = "${var.acr_name}${random_string.suffix.result}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Basic"
  admin_enabled       = true
  tags                = var.tags
}

# =============================================================================
# App Service Plan
# =============================================================================

resource "azurerm_service_plan" "main" {
  name                = "${var.app_service_plan_name}-${random_string.suffix.result}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  os_type             = "Linux"
  sku_name            = "B1"
  tags                = var.tags
}

# =============================================================================
# App Service (Web App)
# =============================================================================

resource "azurerm_linux_web_app" "main" {
  name                = "${var.app_service_name}-${random_string.suffix.result}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  service_plan_id     = azurerm_service_plan.main.id
  https_only          = true
  tags                = var.tags

  site_config {
    always_on = false # Set to true for production

    application_stack {
      node_version = "18-lts"
    }
  }

  app_settings = {
    "NODE_ENV"                     = "production"
    "PORT"                         = "8080"
    "WEBSITES_PORT"                = "8080"
    "WEBSITE_NODE_DEFAULT_VERSION" = "18-lts"

    # Application Insights
    "APPINSIGHTS_INSTRUMENTATIONKEY" = azurerm_application_insights.main.instrumentation_key
    "APPINSIGHTS_CONNECTION_STRING"  = azurerm_application_insights.main.connection_string

    # Key Vault reference (requires Managed Identity)
    "AZURE_KEY_VAULT_NAME" = azurerm_key_vault.main.name

    # Database connection (using Key Vault references)
    "SQL_SERVER"                   = azurerm_mssql_server.main.fully_qualified_domain_name
    "SQL_DATABASE"                 = var.sql_database_name
    "SQL_USER"                     = var.sql_admin_username
    "SQL_PASSWORD"                 = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.sql_password.id})"
    "SQL_ENCRYPT"                  = "true"
    "SQL_TRUST_SERVER_CERTIFICATE" = "false"

    # JWT Configuration (using Key Vault reference)
    "JWT_SECRET"     = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.jwt_secret.id})"
    "JWT_EXPIRES_IN" = "1h"

    # Azure OpenAI (using Key Vault reference)
    # NOTE: You need to manually add AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY to Key Vault
    "AZURE_OPENAI_DEPLOYMENT_NAME" = "gpt-4"
    "AZURE_OPENAI_API_VERSION"     = "2023-05-15"

    # Container Registry (for Docker deployments)
    "DOCKER_REGISTRY_SERVER_URL"      = "https://${azurerm_container_registry.main.login_server}"
    "DOCKER_REGISTRY_SERVER_USERNAME" = azurerm_container_registry.main.admin_username
    "DOCKER_REGISTRY_SERVER_PASSWORD" = azurerm_container_registry.main.admin_password
  }

  identity {
    type = "SystemAssigned"
  }

  logs {
    application_logs {
      file_system_level = "Information"
    }

    http_logs {
      file_system {
        retention_in_days = 7
        retention_in_mb   = 35
      }
    }
  }
}

# =============================================================================
# Azure SQL Server
# =============================================================================

resource "azurerm_mssql_server" "main" {
  name                         = "${var.sql_server_name}-${random_string.suffix.result}"
  resource_group_name          = azurerm_resource_group.main.name
  location                     = azurerm_resource_group.main.location
  version                      = "12.0"
  administrator_login          = var.sql_admin_username
  administrator_login_password = var.sql_admin_password
  minimum_tls_version          = "1.2"
  tags                         = var.tags

  azuread_administrator {
    login_username = "AzureAD Admin"
    object_id      = data.azurerm_client_config.current.object_id
  }
}

# =============================================================================
# Azure SQL Database
# =============================================================================

resource "azurerm_mssql_database" "main" {
  name           = var.sql_database_name
  server_id      = azurerm_mssql_server.main.id
  collation      = "SQL_Latin1_General_CP1_CI_AS"
  sku_name       = var.sql_sku_name
  zone_redundant = false
  tags           = var.tags

  # Backup retention
  short_term_retention_policy {
    retention_days = 7
  }
}

# =============================================================================
# SQL Server Firewall Rules
# =============================================================================

# Allow Azure services to access SQL Server
resource "azurerm_mssql_firewall_rule" "allow_azure_services" {
  name             = "AllowAzureServices"
  server_id        = azurerm_mssql_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

# Allow specific IP addresses (add your public IP for management)
resource "azurerm_mssql_firewall_rule" "allowed_ips" {
  count            = length(var.allowed_ip_addresses)
  name             = "AllowedIP-${count.index}"
  server_id        = azurerm_mssql_server.main.id
  start_ip_address = split("/", var.allowed_ip_addresses[count.index])[0]
  end_ip_address   = split("/", var.allowed_ip_addresses[count.index])[0]
}

# =============================================================================
# Azure Key Vault
# =============================================================================

data "azurerm_client_config" "current" {}

resource "azurerm_key_vault" "main" {
  name                       = "${var.key_vault_name}-${random_string.suffix.result}"
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = "standard"
  soft_delete_retention_days = 7
  purge_protection_enabled   = false
  tags                       = var.tags

  # Enable RBAC authorization (recommended)
  enable_rbac_authorization = true
}

# Grant Key Vault access to App Service Managed Identity
resource "azurerm_role_assignment" "app_service_kv_secrets" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_linux_web_app.main.identity[0].principal_id
}

# Grant Key Vault access to current user/service principal (for Terraform)
resource "azurerm_role_assignment" "current_user_kv_admin" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Administrator"
  principal_id         = data.azurerm_client_config.current.object_id
}

# =============================================================================
# Key Vault Secrets
# =============================================================================

# SQL Password
resource "azurerm_key_vault_secret" "sql_password" {
  name         = "SQL-PASSWORD"
  value        = var.sql_admin_password
  key_vault_id = azurerm_key_vault.main.id
  tags         = var.tags

  depends_on = [azurerm_role_assignment.current_user_kv_admin]
}

# JWT Secret
resource "azurerm_key_vault_secret" "jwt_secret" {
  name         = "JWT-SECRET"
  value        = random_string.jwt_secret.result
  key_vault_id = azurerm_key_vault.main.id
  tags         = var.tags

  depends_on = [azurerm_role_assignment.current_user_kv_admin]
}

# Generate random JWT secret
resource "random_string" "jwt_secret" {
  length  = 64
  special = true
}

# NOTE: You must manually add Azure OpenAI secrets to Key Vault:
# - AZURE-OPENAI-ENDPOINT
# - AZURE-OPENAI-API-KEY

# =============================================================================
# Optional: Private Endpoint for SQL Server (Production)
# Uncomment to enable private endpoint connectivity
# =============================================================================

# resource "azurerm_virtual_network" "main" {
#   name                = "counselor-vnet"
#   address_space       = ["10.0.0.0/16"]
#   location            = azurerm_resource_group.main.location
#   resource_group_name = azurerm_resource_group.main.name
# }
#
# resource "azurerm_subnet" "private_endpoints" {
#   name                 = "private-endpoints-subnet"
#   resource_group_name  = azurerm_resource_group.main.name
#   virtual_network_name = azurerm_virtual_network.main.name
#   address_prefixes     = ["10.0.1.0/24"]
#
#   enforce_private_link_endpoint_network_policies = true
# }
#
# resource "azurerm_private_endpoint" "sql" {
#   name                = "sql-private-endpoint"
#   location            = azurerm_resource_group.main.location
#   resource_group_name = azurerm_resource_group.main.name
#   subnet_id           = azurerm_subnet.private_endpoints.id
#
#   private_service_connection {
#     name                           = "sql-privateserviceconnection"
#     private_connection_resource_id = azurerm_mssql_server.main.id
#     subresource_names              = ["sqlServer"]
#     is_manual_connection           = false
#   }
# }

# =============================================================================
# Outputs
# =============================================================================

output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.main.name
}

output "app_service_url" {
  description = "URL of the App Service"
  value       = "https://${azurerm_linux_web_app.main.default_hostname}"
}

output "app_service_name" {
  description = "Name of the App Service"
  value       = azurerm_linux_web_app.main.name
}

output "sql_server_fqdn" {
  description = "Fully qualified domain name of SQL Server"
  value       = azurerm_mssql_server.main.fully_qualified_domain_name
}

output "sql_database_name" {
  description = "Name of the SQL Database"
  value       = azurerm_mssql_database.main.name
}

output "acr_login_server" {
  description = "Login server of the Azure Container Registry"
  value       = azurerm_container_registry.main.login_server
}

output "acr_name" {
  description = "Name of the Azure Container Registry"
  value       = azurerm_container_registry.main.name
}

output "key_vault_name" {
  description = "Name of the Key Vault"
  value       = azurerm_key_vault.main.name
}

output "app_insights_instrumentation_key" {
  description = "Application Insights instrumentation key"
  value       = azurerm_application_insights.main.instrumentation_key
  sensitive   = true
}

output "app_insights_connection_string" {
  description = "Application Insights connection string"
  value       = azurerm_application_insights.main.connection_string
  sensitive   = true
}
