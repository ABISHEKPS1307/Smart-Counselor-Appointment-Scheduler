# =============================================================================
# Terraform Variables for Smart Counselor Appointment Scheduler
# =============================================================================

variable "resource_group_name" {
  description = "Name of the Azure Resource Group"
  type        = string
  default     = "counselor-scheduler-rg"
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "East US"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "app_service_plan_name" {
  description = "Name of the App Service Plan"
  type        = string
  default     = "counselor-scheduler-plan"
}

variable "app_service_name" {
  description = "Name of the App Service (must be globally unique)"
  type        = string
  default     = "counselor-scheduler-app"
}

variable "sql_server_name" {
  description = "Name of the Azure SQL Server (must be globally unique)"
  type        = string
  default     = "counselor-scheduler-sql"
}

variable "sql_database_name" {
  description = "Name of the SQL Database"
  type        = string
  default     = "CounselorScheduler"
}

variable "sql_admin_username" {
  description = "SQL Server administrator username"
  type        = string
  default     = "sqladmin"
  sensitive   = true
}

variable "sql_admin_password" {
  description = "SQL Server administrator password"
  type        = string
  sensitive   = true
  # Set via environment variable: TF_VAR_sql_admin_password
  # Or use Azure Key Vault data source
}

variable "acr_name" {
  description = "Name of the Azure Container Registry (must be globally unique, alphanumeric only)"
  type        = string
  default     = "counselorscheduler"
}

variable "key_vault_name" {
  description = "Name of the Azure Key Vault (must be globally unique)"
  type        = string
  default     = "counselor-kv"
}

variable "app_insights_name" {
  description = "Name of the Application Insights instance"
  type        = string
  default     = "counselor-scheduler-insights"
}

variable "allowed_ip_addresses" {
  description = "List of IP addresses allowed to access SQL Server (use your public IP for dev)"
  type        = list(string)
  default     = []
  # Example: ["203.0.113.0/24"]
}

variable "enable_private_endpoint" {
  description = "Enable private endpoint for SQL Server (recommended for production)"
  type        = bool
  default     = false
}

variable "sku_tier" {
  description = "SKU tier for App Service Plan"
  type        = string
  default     = "Basic"
  # Options: Free, Basic, Standard, Premium, PremiumV2, PremiumV3
}

variable "sku_size" {
  description = "SKU size for App Service Plan"
  type        = string
  default     = "B1"
  # Free: F1, Basic: B1/B2/B3, Standard: S1/S2/S3, etc.
}

variable "sql_sku_name" {
  description = "SKU for SQL Database"
  type        = string
  default     = "S0"
  # Options: Basic, S0, S1, S2, P1, P2, etc.
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "Smart Counselor Scheduler"
    Environment = "Development"
    ManagedBy   = "Terraform"
  }
}
