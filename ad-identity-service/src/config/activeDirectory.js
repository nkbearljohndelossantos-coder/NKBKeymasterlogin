const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  adProvider: process.env.AD_PROVIDER || 'mock',
  expectedToken: process.env.AD_SERVICE_EXPECTED_TOKEN || process.env.SERVICE_AUTH_TOKEN || 'nkb-ad-service-secret-token-2026!',
  domain: process.env.AD_DOMAIN || 'NKB.LOCAL',
  serviceAccount: process.env.AD_SERVICE_ACCOUNT || 'svc-nkb-auth',
  servicePassword: process.env.AD_SERVICE_PASSWORD || '',
  ldapsUri: process.env.LDAPS_URI || 'ldaps://dc01.nkb.local:636',
  baseDn: process.env.AD_BASE_DN || 'DC=NKB,DC=LOCAL',
  tlsRejectUnauthorized: process.env.AD_TLS_REJECT_UNAUTHORIZED !== 'false'
};

module.exports = config;
