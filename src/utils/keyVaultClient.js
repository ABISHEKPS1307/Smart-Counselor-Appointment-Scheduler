/**
 * Azure Key Vault Client
 * Secure secret retrieval with fallback to environment variables
 */

import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';
import config from '../config.js';
import logger from './logger.js';

let keyVaultClient = null;

/**
 * Initialize Key Vault client if enabled
 */
function initializeKeyVault() {
  if (!config.keyVault.enabled) {
    logger.info('Key Vault not configured, using environment variables');
    return null;
  }
  
  try {
    const keyVaultUrl = `https://${config.keyVault.name}.vault.azure.net`;
    const credential = new DefaultAzureCredential();
    keyVaultClient = new SecretClient(keyVaultUrl, credential);
    logger.info(`Key Vault client initialized: ${keyVaultUrl}`);
    return keyVaultClient;
  } catch (error) {
    logger.error('Failed to initialize Key Vault client', { error: error.message });
    return null;
  }
}

/**
 * Get secret from Key Vault with fallback to environment variable
 * @param {string} secretName - Name of the secret
 * @param {string} envVarName - Environment variable name for fallback
 * @returns {Promise<string>} Secret value
 */
export async function getSecret(secretName, envVarName = null) {
  // Try Key Vault first
  if (keyVaultClient) {
    try {
      const secret = await keyVaultClient.getSecret(secretName);
      logger.debug(`Retrieved secret '${secretName}' from Key Vault`);
      return secret.value;
    } catch (error) {
      logger.warn(`Failed to retrieve '${secretName}' from Key Vault: ${error.message}`);
    }
  }
  
  // Fallback to environment variable
  const envVar = envVarName || secretName;
  const value = process.env[envVar];
  
  if (value) {
    logger.debug(`Using environment variable '${envVar}' as fallback`);
    return value;
  }
  
  logger.error(`Secret '${secretName}' not found in Key Vault or environment variables`);
  return null;
}

/**
 * Get multiple secrets at once
 * @param {Array<{name: string, envVar: string}>} secrets - Array of secret configurations
 * @returns {Promise<Object>} Object with secret values
 */
export async function getSecrets(secrets) {
  const results = {};
  
  await Promise.all(
    secrets.map(async ({ name, envVar }) => {
      results[name] = await getSecret(name, envVar);
    })
  );
  
  return results;
}

// Initialize on module load
initializeKeyVault();

export default {
  getSecret,
  getSecrets
};
