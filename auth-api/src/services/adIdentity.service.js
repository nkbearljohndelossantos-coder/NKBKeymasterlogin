const http = require('http');
const crypto = require('crypto');

/**
 * AD Identity Service Client in NKB Auth API.
 * Performs authenticated service-to-service HTTP requests to the independent
 * AD Identity Service process (/internal/ad/*) using AUTH_API_AD_SERVICE_TOKEN.
 */
class ADIdentityClient {
  constructor() {
    this.serviceHost = process.env.AD_SERVICE_HOST || '127.0.0.1';
    this.servicePort = parseInt(process.env.AD_SERVICE_PORT || '3001', 10);
    this.serviceToken = process.env.AUTH_API_AD_SERVICE_TOKEN || process.env.SERVICE_AUTH_TOKEN || '';
  }

  setServicePort(port) {
    this.servicePort = port;
  }

  setServiceToken(token) {
    this.serviceToken = token;
  }

  _request(path, body = {}, customToken = null, correlationId = null) {
    return new Promise((resolve, reject) => {
      const payload = JSON.stringify(body);
      const corrId = correlationId || crypto.randomUUID();
      const token = customToken !== null ? customToken : this.serviceToken;

      const options = {
        hostname: this.serviceHost,
        port: this.servicePort,
        path: `/internal/ad${path}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'x-service-token': token,
          'x-caller-id': 'NKB_AUTH_API',
          'x-correlation-id': corrId
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ statusCode: res.statusCode, ...parsed });
          } catch (e) {
            resolve({ success: false, statusCode: res.statusCode, body: data });
          }
        });
      });

      req.on('error', (err) => {
        resolve({
          success: false,
          statusCode: 503,
          error_code: 'SERVICE_UNAVAILABLE',
          message: `AD Identity Service process connection error: ${err.message}`
        });
      });

      req.write(payload);
      req.end();
    });
  }

  async lookupUser(windowsUsername, customToken = null, correlationId = null) {
    return this._request('/user/lookup', { windows_username: windowsUsername }, customToken, correlationId);
  }

  async getAccountStatus(windowsUsername, customToken = null, correlationId = null) {
    return this._request('/user/status', { windows_username: windowsUsername }, customToken, correlationId);
  }

  async enableAccount(windowsUsername, customToken = null, correlationId = null) {
    return this._request('/user/enable', { windows_username: windowsUsername }, customToken, correlationId);
  }

  async disableAccount(windowsUsername, customToken = null, correlationId = null) {
    return this._request('/user/disable', { windows_username: windowsUsername }, customToken, correlationId);
  }

  async resetPassword(windowsUsername, newPassword, customToken = null, correlationId = null) {
    return this._request('/user/password-reset', { windows_username: windowsUsername, new_password: newPassword }, customToken, correlationId);
  }

  async reconcileIdentities(employees, mappings, computers, customToken = null, correlationId = null) {
    return this._request('/reconcile', { employees, mappings, computers }, customToken, correlationId);
  }
}

module.exports = new ADIdentityClient();
