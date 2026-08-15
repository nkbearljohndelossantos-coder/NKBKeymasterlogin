const adUserService = require('./adUser.service');

class ADReconciliationService {
  /**
   * Reconcile Identities in DETECT_ONLY Mode
   * Identifies inconsistencies across NKB application data and Active Directory DS state
   * without making automatic destructive modifications to Active Directory.
   */
  async reconcile(nkbEmployees = [], nkbMappings = [], nkbComputers = [], correlationId = null) {
    const discrepancies = [];
    let matchedCount = 0;

    for (const emp of nkbEmployees) {
      const mapping = nkbMappings.find(m => m.employee_id === emp.employee_id);
      const winUsername = mapping ? mapping.windows_username.toUpperCase() : emp.employee_id.toUpperCase();
      const adUser = await adUserService.lookupUser(winUsername);

      // 1. Missing AD Account Check
      if (!adUser) {
        discrepancies.push({
          type: 'MISSING_AD_ACCOUNT',
          employee_id: emp.employee_id,
          email: emp.email,
          windows_username: winUsername,
          issue: `No Active Directory account found matching Windows username ${winUsername}`
        });
        continue;
      }

      // 2. Email / Mapping Check
      if (adUser.email.toLowerCase() !== emp.email.toLowerCase()) {
        discrepancies.push({
          type: 'EMAIL_MISMATCH',
          employee_id: emp.employee_id,
          nkb_email: emp.email,
          ad_email: adUser.email,
          issue: `NKB email (${emp.email}) does not match AD email (${adUser.email})`
        });
      }

      // 3. Status Discrepancy Checks
      const isNkbDisabled = emp.status === 'Disabled';
      const isAdDisabled = adUser.status === 'Disabled';

      if (isNkbDisabled && !isAdDisabled) {
        discrepancies.push({
          type: 'STATUS_MISMATCH_NKB_DISABLED_AD_ENABLED',
          employee_id: emp.employee_id,
          nkb_status: emp.status,
          ad_status: adUser.status,
          issue: `Employee is disabled in NKB API but Active Directory account is Enabled!`
        });
      } else if (!isNkbDisabled && isAdDisabled) {
        discrepancies.push({
          type: 'STATUS_MISMATCH_NKB_ENABLED_AD_DISABLED',
          employee_id: emp.employee_id,
          nkb_status: emp.status,
          ad_status: adUser.status,
          issue: `Employee is Active in NKB API but Active Directory account is Disabled!`
        });
      } else {
        matchedCount++;
      }
    }

    return {
      success: true,
      status: 'COMPLETED',
      mode: 'DETECT_ONLY',
      correlation_id: correlationId,
      timestamp: new Date().toISOString(),
      summary: {
        total_checked: nkbEmployees.length,
        matched: matchedCount,
        discrepancies_found: discrepancies.length
      },
      discrepancies
    };
  }
}

module.exports = new ADReconciliationService();
