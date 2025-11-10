terraform {
  required_version = ">= 1.0"
  
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
  
  # Skip automatic resource provider registration
  # Service principal doesn't have subscription-level permissions
  resource_provider_registrations = "none"
}

# Use existing resource group
data "azurerm_resource_group" "existing" {
  name = var.resource_group_name
}

# Use existing App Service Plan (if exists, or create minimal one)
data "azurerm_service_plan" "existing" {
  name                = var.app_service_plan_name
  resource_group_name = data.azurerm_resource_group.existing.name
}

# Use existing App Service
data "azurerm_linux_web_app" "existing" {
  name                = var.app_service_name
  resource_group_name = data.azurerm_resource_group.existing.name
}

# Create Azure Container Registry (only if needed)
resource "azurerm_container_registry" "acr" {
  name                = var.acr_name
  resource_group_name = data.azurerm_resource_group.existing.name
  location            = data.azurerm_resource_group.existing.location
  sku                 = "Basic"
  admin_enabled       = true
  
  tags = {
    Environment = "Production"
    ManagedBy   = "Terraform"
    Project     = "CounselorScheduler"
  }
}

# Configure App Service to use Docker container
resource "azurerm_linux_web_app_slot" "staging" {
  count          = var.enable_staging_slot ? 1 : 0
  name           = "staging"
  app_service_id = data.azurerm_linux_web_app.existing.id

  site_config {
    always_on = false
    
    application_stack {
      docker_image     = "${azurerm_container_registry.acr.login_server}/${var.docker_image_name}"
      docker_image_tag = "latest"
    }
    
    health_check_path = "/api/health"
  }

  app_settings = {
    DOCKER_REGISTRY_SERVER_URL      = "https://${azurerm_container_registry.acr.login_server}"
    DOCKER_REGISTRY_SERVER_USERNAME = azurerm_container_registry.acr.admin_username
    DOCKER_REGISTRY_SERVER_PASSWORD = azurerm_container_registry.acr.admin_password
    WEBSITES_PORT                   = "8080"
    NODE_ENV                        = "production"
    PORT                            = "8080"
  }
}

# Output important values
output "acr_login_server" {
  value       = azurerm_container_registry.acr.login_server
  description = "ACR login server URL"
}

output "acr_admin_username" {
  value       = azurerm_container_registry.acr.admin_username
  description = "ACR admin username"
  sensitive   = true
}

output "acr_admin_password" {
  value       = azurerm_container_registry.acr.admin_password
  description = "ACR admin password"
  sensitive   = true
}

output "app_service_default_hostname" {
  value       = data.azurerm_linux_web_app.existing.default_hostname
  description = "App Service default hostname"
}
