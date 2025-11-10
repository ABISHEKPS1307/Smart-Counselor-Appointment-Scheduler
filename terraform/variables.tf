variable "resource_group_name" {
  description = "Existing Azure Resource Group name"
  type        = string
  default     = "CloudProjectNew"
}

variable "app_service_plan_name" {
  description = "Existing App Service Plan name"
  type        = string
  default     = "ASP-CloudProjectNew-96f1"
}

variable "app_service_name" {
  description = "Existing App Service name"
  type        = string
  default     = "counselor-scheduler-123"
}

variable "acr_name" {
  description = "Azure Container Registry name (must be globally unique)"
  type        = string
  default     = "counselorsch123acr"
}

variable "docker_image_name" {
  description = "Docker image name"
  type        = string
  default     = "counselor-app"
}

variable "enable_staging_slot" {
  description = "Enable staging slot for blue-green deployment"
  type        = bool
  default     = false
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "centralindia"
}
