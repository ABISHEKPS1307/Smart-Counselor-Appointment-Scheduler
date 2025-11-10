variable "resource_group_name" {
  description = "Name of the existing resource group"
  type        = string
  default     = "CloudProjectNew"
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "centralindia"
}

variable "acr_name" {
  description = "Name of the existing Azure Container Registry"
  type        = string
  default     = "counselorsch123acr"
}

variable "container_env_name" {
  description = "Name of the Container Apps Environment"
  type        = string
  default     = "counselor-env"
}

variable "container_app_name" {
  description = "Name of the Container App"
  type        = string
  default     = "counselor-app"
}

variable "image_name" {
  description = "Docker image name"
  type        = string
  default     = "counselor-app"
}

variable "cpu" {
  description = "CPU allocation for container"
  type        = number
  default     = 0.5
}

variable "memory" {
  description = "Memory allocation for container"
  type        = string
  default     = "1Gi"
}

variable "min_replicas" {
  description = "Minimum number of replicas"
  type        = number
  default     = 0
}

variable "max_replicas" {
  description = "Maximum number of replicas"
  type        = number
  default     = 1
}

variable "sql_server" {
  description = "SQL Server hostname"
  type        = string
  default     = "scmainserver.database.windows.net"
}

variable "sql_database" {
  description = "SQL Database name"
  type        = string
  default     = "sc-db"
}

variable "sql_user" {
  description = "SQL Database username"
  type        = string
  default     = "adminuser"
}

variable "sql_password" {
  description = "SQL Database password"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT secret key"
  type        = string
  sensitive   = true
}

variable "acr_password" {
  description = "ACR admin password"
  type        = string
  sensitive   = true
}
