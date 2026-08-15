module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'nkb_super_secret_jwt_key_manufacturing_2026_x64!',
  maxFailedAttempts: parseInt(process.env.MAX_FAILED_LOGINS || '5', 10),
  lockoutDurationMinutes: parseInt(process.env.LOCKOUT_DURATION_MINUTES || '15', 10),
  domainName: 'NKB'
};
