# =============================================================================
# Terraform Outputs
# Consolidates all output values for easy reference
# =============================================================================

output "deployment_summary" {
  description = "Summary of deployed resources"
  value = {
    resource_group    = azurerm_resource_group.main.name
    location          = azurerm_resource_group.main.location
    app_service_url   = "https://${azurerm_linux_web_app.main.default_hostname}"
    app_service_name  = azurerm_linux_web_app.main.name
    sql_server_fqdn   = azurerm_mssql_server.main.fully_qualified_domain_name
    sql_database_name = azurerm_mssql_database.main.name
    acr_login_server  = azurerm_container_registry.main.login_server
    acr_name          = azurerm_container_registry.main.name
    key_vault_name    = azurerm_key_vault.main.name
    app_insights_name = azurerm_application_insights.main.name
  }
}

output "connection_strings" {
  description = "Connection strings for various services"
  value = {
    sql_connection_string          = "Server=tcp:${azurerm_mssql_server.main.fully_qualified_domain_name},1433;Database=${azurerm_mssql_database.main.name};User ID=${var.sql_admin_username};Encrypt=true;TrustServerCertificate=false;Connection Timeout=30;"
    app_insights_connection_string = azurerm_application_insights.main.connection_string
  }
  sensitive = true
}

output "next_steps" {
  description = "Next steps after infrastructure deployment"
  sensitive   = true
  value = <<-EOT
  
  ╔════════════════════════════════════════════════════════════════════════╗
  ║  Infrastructure Deployment Complete!                                   ║
  ╚════════════════════════════════════════════════════════════════════════╝
  
  📋 Next Steps:
  
  1. Initialize the database schema:
     sqlcmd -S ${azurerm_mssql_server.main.fully_qualified_domain_name} \
            -d ${azurerm_mssql_database.main.name} \
            -U ${var.sql_admin_username} \
            -i ../sql/schema.sql
  
  2. Add Azure OpenAI secrets to Key Vault:
     az keyvault secret set --vault-name ${azurerm_key_vault.main.name} \
                           --name AZURE-OPENAI-ENDPOINT \
                           --value "<YOUR_OPENAI_ENDPOINT>"
     
     az keyvault secret set --vault-name ${azurerm_key_vault.main.name} \
                           --name AZURE-OPENAI-API-KEY \
                           --value "<YOUR_OPENAI_KEY>"
  
  3. Build and push Docker image to ACR:
     az acr login --name ${azurerm_container_registry.main.name}
     docker build -t ${azurerm_container_registry.main.login_server}/counselor-app:latest .
     docker push ${azurerm_container_registry.main.login_server}/counselor-app:latest
  
  4. Deploy to App Service:
     az webapp config container set \
       --name ${azurerm_linux_web_app.main.name} \
       --resource-group ${azurerm_resource_group.main.name} \
       --docker-custom-image-name ${azurerm_container_registry.main.login_server}/counselor-app:latest
  
  5. Access your application:
     🌐 https://${azurerm_linux_web_app.main.default_hostname}
  
  📊 Monitoring:
     Application Insights: https://portal.azure.com/#@/resource${azurerm_application_insights.main.id}
  
  🔐 Security:
     Key Vault: https://portal.azure.com/#@/resource${azurerm_key_vault.main.id}
  
  EOT
}
