const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  adProvider: process.env.AD_PROVIDER || (process.env.NODE_ENV === 'test' ? 'mock' : 'mock'),
  expectedToken: process.env.AD_SERVICE_EXPECTED_TOKEN || process.env.SERVICE_AUTH_TOKEN || '',
  domain: process.env.AD_DOMAIN || 'NKB.LOCAL',
  serviceAccount: process.env.AD_SERVICE_ACCOUNT || 'svc-nkb-auth',
  servicePassword: process.env.AD_SERVICE_PASSWORD || '',
  ldapsUri: process.env.LDAPS_URI || 'ldaps://dc01.nkb.local:636',
  baseDn: process.env.AD_BASE_DN || 'DC=NKB,DC=LOCAL',
  tlsRejectUnauthorized: process.env.AD_TLS_REJECT_UNAUTHORIZED !== 'false'
};

// Fail-closed validation for production
if (config.nodeEnv === 'production') {
  if (!config.expectedToken || config.expectedToken === 'CHANGE_ME') {
    throw new Error('[FATAL] AD Identity Service cannot start in production: AD_SERVICE_EXPECTED_TOKEN is missing or unset.');
  }
  if (config.adProvider === 'active-directory') {
    if (!config.servicePassword || !config.ldapsUri) {
      throw new Error('[FATAL] AD Identity Service cannot start in production: AD service credentials or LDAPS_URI missing.');
    }
  }
}

module.exports = config;
