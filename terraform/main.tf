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
  skip_provider_registration = true
}

# Data sources for existing resources
data "azurerm_resource_group" "existing" {
  name = var.resource_group_name
}

data "azurerm_container_registry" "acr" {
  name                = var.acr_name
  resource_group_name = var.resource_group_name
}

# Container Apps Environment
resource "azurerm_container_app_environment" "main" {
  name                = var.container_env_name
  location            = var.location
  resource_group_name = data.azurerm_resource_group.existing.name
}

# Container App
resource "azurerm_container_app" "main" {
  name                         = var.container_app_name
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = data.azurerm_resource_group.existing.name
  revision_mode                = "Single"

  template {
    min_replicas = var.min_replicas
    max_replicas = var.max_replicas

    container {
      name   = var.container_app_name
      image  = "${data.azurerm_container_registry.acr.login_server}/${var.image_name}:latest"
      cpu    = var.cpu
      memory = var.memory

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "PORT"
        value = "8080"
      }

      env {
        name  = "SQL_SERVER"
        value = var.sql_server
      }

      env {
        name  = "SQL_DATABASE"
        value = var.sql_database
      }

      env {
        name  = "SQL_USER"
        value = var.sql_user
      }

      env {
        name  = "SQL_ENCRYPT"
        value = "true"
      }

      env {
        name  = "SQL_TRUST_SERVER_CERTIFICATE"
        value = "false"
      }

      env {
        name  = "JWT_EXPIRES_IN"
        value = "1h"
      }

      env {
        name  = "AZURE_OPENAI_ENDPOINT"
        value = "https://placeholder.openai.azure.com/"
      }

      env {
        name  = "AZURE_OPENAI_API_KEY"
        value = "placeholder"
      }

      env {
        name        = "SQL_PASSWORD"
        secret_name = "sql-password"
      }

      env {
        name        = "JWT_SECRET"
        secret_name = "jwt-secret"
      }
    }
  }

  secret {
    name  = "sql-password"
    value = var.sql_password
  }

  secret {
    name  = "jwt-secret"
    value = var.jwt_secret
  }

  registry {
    server               = data.azurerm_container_registry.acr.login_server
    username             = data.azurerm_container_registry.acr.admin_username
    password_secret_name = "acr-password"
  }

  secret {
    name  = "acr-password"
    value = var.acr_password
  }

  ingress {
    external_enabled = true
    target_port      = 8080
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }
}

# Outputs
output "container_app_url" {
  value       = "https://${azurerm_container_app.main.ingress[0].fqdn}"
  description = "Container App URL"
}

output "container_app_fqdn" {
  value       = azurerm_container_app.main.ingress[0].fqdn
  description = "Container App FQDN"
}

output "acr_login_server" {
  value       = data.azurerm_container_registry.acr.login_server
  description = "ACR Login Server"
}
