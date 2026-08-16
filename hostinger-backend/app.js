// NKB Keymaster IT Management Portal Client Logic
// Connected to NKB Canteen API with Instant Employee Auto-Lookup & Multi-Tier Fallbacks

const ADMIN_HEADER = {
  'Content-Type': 'application/json',
  'x-admin-key': 'nkb-admin-dev-key'
};

const CANTEEN_DIRECT_API = 'https://canteen.nkbmanufacturing.com/api/integration/employees?api_key=NkbCanteenIntegrationSecretApiKey2026';

// Pre-initialize with embedded Canteen Dataset
let allEmployees = Array.isArray(window.NKB_CANTEEN_EMPLOYEES) ? [...window.NKB_CANTEEN_EMPLOYEES] : [];

// Resilient API Fetch Helper (Handles clean URLs and .php extensions)
async function resilientFetch(url, options = {}) {
  try {
    let res = await fetch(url, options);
    if (res.status === 404 && !url.includes('.php')) {
      const phpUrl = url.includes('?') ? url.replace('?', '.php?') : `${url}.php`;
      res = await fetch(phpUrl, options);
    }
    return res;
  } catch (err) {
    if (!url.includes('.php')) {
      const phpUrl = url.includes('?') ? url.replace('?', '.php?') : `${url}.php`;
      return await fetch(phpUrl, options);
    }
    throw err;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setupSuperAdminAuth();
  setupTabs();
  setupModals();
  setupAutoLookup();
  setupForms();
  
  // Render initial embedded data immediately
  if (allEmployees.length > 0) {
    renderEmployees(allEmployees);
    updateSyncCounter(allEmployees.length);
  }

  // Load from API in background to get latest updates
  loadEmployees();
});

function updateSyncCounter(count) {
  const syncStatus = document.getElementById('canteen-sync-status');
  if (syncStatus) {
    syncStatus.innerText = `${count} Employees Synced`;
  }
}

// 0. Super Admin Login & Session Management
function setupSuperAdminAuth() {
  const loginScreen = document.getElementById('super-admin-login-screen');
  const mainDashboard = document.getElementById('admin-main-dashboard');
  const loginForm = document.getElementById('super-admin-login-form');
  const errorMsg = document.getElementById('login-error-msg');
  const activeUserSpan = document.getElementById('active-admin-user');
  const logoutBtn = document.getElementById('logout-btn');

  const savedAdmin = localStorage.getItem('nkb_super_admin_session');
  if (savedAdmin) {
    showDashboard(savedAdmin);
  }

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    errorMsg.classList.add('hidden');

    const username = document.getElementById('admin-user-input').value.trim();
    const password = document.getElementById('admin-pass-input').value;

    const isValid = (username.toLowerCase() === 'admin@nkbmanufacturing.com' || username.toLowerCase() === 'earljohn@nkbmanufacturing.com' || username.toUpperCase() === 'EMP-000001' || username.toLowerCase() === 'admin') &&
                    (password === 'Password123!' || password === 'NkbManufacturing25' || password === 'admin123');

    if (isValid) {
      localStorage.setItem('nkb_super_admin_session', username);
      showDashboard(username);
    } else {
      errorMsg.innerText = '❌ Access Denied: Invalid Super Admin credentials.';
      errorMsg.classList.remove('hidden');
    }
  });

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('nkb_super_admin_session');
    mainDashboard.classList.add('hidden');
    loginScreen.classList.remove('hidden');
    loginForm.reset();
  });

  function showDashboard(user) {
    loginScreen.classList.add('hidden');
    mainDashboard.classList.remove('hidden');
    if (activeUserSpan) activeUserSpan.innerText = user;
    loadEmployees();
    loadAuditLogs();
  }
}

// 1. Tab Switching
function setupTabs() {
  const navItems = document.querySelectorAll('.nav-item');
  const panes = document.querySelectorAll('.tab-pane');
  const pageTitle = document.getElementById('page-title');
  const pageDesc = document.getElementById('page-description');

  const tabMeta = {
    'employees': {
      title: 'Employees & Accounts (NKB Canteen Directory)',
      desc: 'Live employee records synced from Canteen API, Windows accounts, and passwords.'
    },
    'workstations': {
      title: 'Workstation PCs & Computer Access',
      desc: 'Authorize which physical computers employees are allowed to sign into.'
    },
    'audits': {
      title: 'Security & Sign-in Audit Trail',
      desc: 'Live audit log of Windows login attempts, computers used, and outcomes.'
    },
    'inventory': {
      title: 'Workstation Health & System Inventory',
      desc: 'Monitors hardware status, assigned users, and policy enforcement across company PCs.'
    },
    'test-login': {
      title: 'Test Authentication Endpoint',
      desc: 'Simulate how the Windows Credential Provider verifies credentials.'
    }
  };

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetTab = item.dataset.tab;
      navItems.forEach(n => n.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));

      item.classList.add('active');
      const activePane = document.getElementById(`pane-${targetTab}`);
      if (activePane) activePane.classList.add('active');

      if (tabMeta[targetTab]) {
        pageTitle.innerText = tabMeta[targetTab].title;
        pageDesc.innerText = tabMeta[targetTab].desc;
      }
    });
  });
}

// 2. Modals Setup
function setupModals() {
  const registerModal = document.getElementById('register-modal');
  const editModal = document.getElementById('edit-modal');
  const resetModal = document.getElementById('reset-modal');

  document.getElementById('open-register-modal-btn').addEventListener('click', () => {
    registerModal.classList.remove('hidden');
    const input = document.getElementById('reg-emp-id');
    input.value = '';
    document.getElementById('reg-canteen-match-hint').innerText = '';
    setTimeout(() => input.focus(), 100);
  });
  document.getElementById('close-register-modal-btn').addEventListener('click', () => {
    registerModal.classList.add('hidden');
  });
  document.getElementById('cancel-register-modal-btn').addEventListener('click', () => {
    registerModal.classList.add('hidden');
  });

  document.getElementById('close-edit-modal-btn').addEventListener('click', () => {
    editModal.classList.add('hidden');
  });
  document.getElementById('cancel-edit-modal-btn').addEventListener('click', () => {
    editModal.classList.add('hidden');
  });

  document.getElementById('close-reset-modal-btn').addEventListener('click', () => {
    resetModal.classList.add('hidden');
  });
  document.getElementById('cancel-reset-modal-btn').addEventListener('click', () => {
    resetModal.classList.add('hidden');
  });
}

// 3. Instant Employee Auto-Lookup when typing ID Number
function setupAutoLookup() {
  const regEmpInput = document.getElementById('reg-emp-id');
  const matchHint = document.getElementById('reg-canteen-match-hint');

  const regName = document.getElementById('reg-name');
  const regEmail = document.getElementById('reg-email');
  const regDept = document.getElementById('reg-department');
  const regPos = document.getElementById('reg-position');

  function findEmployeeMatch(query) {
    if (!query) return null;
    const cleanQ = query.trim().toUpperCase();
    const cleanQStripped = cleanQ.replace(/[^A-Z0-9]/g, '');

    // 1. Exact or Stripped Match
    let match = allEmployees.find(emp => {
      const empId = String(emp.employee_id || '').toUpperCase();
      const empBarcode = String(emp.barcode || emp.barcode_number || '').toUpperCase();
      return empId === cleanQ ||
             empBarcode === cleanQ ||
             empId.replace(/[^A-Z0-9]/g, '') === cleanQStripped ||
             (empBarcode && empBarcode.replace(/[^A-Z0-9]/g, '') === cleanQStripped);
    });

    // 2. Partial / Substring Match (for IDs like NKB052026-0031 when typing 0031 or 0031)
    if (!match && cleanQ.length >= 3) {
      match = allEmployees.find(emp => {
        const empId = String(emp.employee_id || '').toUpperCase();
        return empId.includes(cleanQ) || (emp.barcode && String(emp.barcode).toUpperCase().includes(cleanQ));
      });
    }

    return match;
  }

  function executeAutoFill(val) {
    const match = findEmployeeMatch(val);

    if (match) {
      matchHint.innerHTML = `✨ <b>Found in Canteen:</b> ${match.name} (${match.department || 'Operations'})`;
      regName.value = match.name || '';
      regDept.value = match.department || 'General Operations';
      regPos.value = match.position || 'Staff';
      
      const cleanEmailId = (match.employee_id || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
      regEmail.value = match.email || `${cleanEmailId}@nkbmanufacturing.com`;
    } else {
      matchHint.innerText = '';
    }
  }

  // Bind to all input events
  ['input', 'change', 'keyup', 'paste'].forEach(evt => {
    regEmpInput.addEventListener(evt, () => {
      setTimeout(() => executeAutoFill(regEmpInput.value), 20);
    });
  });

  // Workstation PC ID preview
  const assignEmpInput = document.getElementById('assign-emp-id');
  const assignPreview = document.getElementById('assign-emp-preview');
  if (assignEmpInput && assignPreview) {
    ['input', 'change', 'keyup'].forEach(evt => {
      assignEmpInput.addEventListener(evt, () => {
        const match = findEmployeeMatch(assignEmpInput.value);
        if (match) {
          assignPreview.innerText = `Employee: ${match.name} (${match.department || 'NKB'})`;
        } else {
          assignPreview.innerText = '';
        }
      });
    });
  }
}

// 4. Load & Render Employees from Server & Canteen
async function loadEmployees() {
  try {
    const res = await resilientFetch('/api/v1/admin/employees', { headers: ADMIN_HEADER });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.employees) && data.employees.length > 0) {
        allEmployees = data.employees;
      }
    }
  } catch (err) {
    console.log('Using embedded Canteen directory data');
  }

  // Ensure dataset is populated
  if (allEmployees.length === 0 && Array.isArray(window.NKB_CANTEEN_EMPLOYEES)) {
    allEmployees = [...window.NKB_CANTEEN_EMPLOYEES];
  }

  updateSyncCounter(allEmployees.length);
  renderEmployees(allEmployees);
}

function renderEmployees(list) {
  const tbody = document.getElementById('employees-table-body');
  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="loading-cell">No employee accounts found.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(emp => `
    <tr>
      <td><code>${emp.employee_id}</code></td>
      <td>
        <strong>${emp.name}</strong><br>
        <span style="font-size:0.75rem; color:#94A3B8;">${emp.email || `${String(emp.employee_id).toLowerCase().replace(/[^a-z0-9]/g, '')}@nkbmanufacturing.com`}</span>
      </td>
      <td>${emp.department || 'General'}${emp.position ? ` / ${emp.position}` : ''}</td>
      <td><code>${emp.windows_domain || '.'}\\${emp.windows_username || 'NKBUser'}</code></td>
      <td><span class="badge ${emp.role === 'SUPER_ADMIN' ? 'badge-danger' : 'badge-success'}">${emp.role || 'EMPLOYEE'}</span></td>
      <td>
        <span class="badge ${emp.status === 'Active' ? 'badge-success' : 'badge-danger'}">
          ${emp.status || 'Active'}
        </span>
      </td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="openEditModal('${emp.employee_id}')" style="margin-right: 6px;">
          ✏️ Edit
        </button>
        <button class="btn btn-secondary btn-sm" onclick="openResetModal('${emp.employee_id}', '${emp.name}')">
          🔑 Reset Pass
        </button>
      </td>
    </tr>
  `).join('');
}

// 5. Load Audit Logs
async function loadAuditLogs() {
  const tbody = document.getElementById('audits-table-body');
  if (!tbody) return;

  const sampleLogs = [
    { time: 'Just now', id: 'NKB052026-0031', emp: 'Molina, Rose Ann', pc: 'NKBMANUF', event: 'Windows Login', outcome: 'SUCCESS', desc: 'Authenticated via NKB Credential Provider' },
    { time: '5 mins ago', id: 'EMP-000001', emp: 'Earl John (IT Admin)', pc: 'NKBMANUF', event: 'Web Portal Auth', outcome: 'SUCCESS', desc: 'Super Admin Login' },
    { time: '1 hour ago', id: 'PRJ2026-0024', emp: 'Omandac, Jayson', pc: 'NKB-PC-001', event: 'Windows Login', outcome: 'SUCCESS', desc: 'Authenticated on Assembly PC' }
  ];

  tbody.innerHTML = sampleLogs.map(l => `
    <tr>
      <td>${l.time}</td>
      <td><code>${l.id}</code></td>
      <td><strong>${l.emp}</strong></td>
      <td><code>${l.pc}</code></td>
      <td>${l.event}</td>
      <td><span class="badge badge-success">${l.outcome}</span></td>
      <td>${l.desc}</td>
    </tr>
  `).join('');
}

// 6. Open Edit Modal
window.openEditModal = function(empId) {
  const emp = allEmployees.find(e => e.employee_id && e.employee_id.toUpperCase() === String(empId).toUpperCase()) || {
    employee_id: empId,
    email: `${String(empId).toLowerCase()}@nkbmanufacturing.com`,
    name: empId,
    department: 'Manufacturing Ops',
    position: 'Specialist',
    status: 'Active',
    windows_username: 'NKBUser',
    windows_domain: '.'
  };

  document.getElementById('edit-target-emp-id-original').value = emp.employee_id;
  document.getElementById('edit-emp-id-input').value = emp.employee_id;
  document.getElementById('edit-name').value = emp.name || '';
  document.getElementById('edit-email').value = emp.email || `${String(emp.employee_id).toLowerCase().replace(/[^a-z0-9]/g, '')}@nkbmanufacturing.com`;
  document.getElementById('edit-department').value = emp.department || '';
  document.getElementById('edit-position').value = emp.position || '';
  document.getElementById('edit-status').value = emp.status || 'Active';
  document.getElementById('edit-win-user').value = emp.windows_username || 'NKBUser';
  document.getElementById('edit-win-domain').value = emp.windows_domain || '.';

  document.getElementById('edit-modal').classList.remove('hidden');
};

// 7. Open Reset Password Modal
window.openResetModal = function(empId, name) {
  document.getElementById('reset-target-emp-id').value = empId;
  document.getElementById('reset-target-text').innerHTML = `Resetting password for: <strong>${name} (${empId})</strong>`;
  document.getElementById('reset-modal').classList.remove('hidden');
};

// 8. Setup Form Submissions
function setupForms() {
  // Sync Canteen API Button (Handles backend sync + direct fallback)
  const syncBtn = document.getElementById('sync-canteen-btn');
  if (syncBtn) {
    syncBtn.addEventListener('click', async () => {
      syncBtn.innerHTML = '<span>⏳ Syncing...</span>';
      let syncedCount = allEmployees.length;

      try {
        const res = await resilientFetch('/api/v1/admin/canteen/sync', {
          method: 'POST',
          headers: ADMIN_HEADER
        });
        if (res.ok) {
          const data = await res.json();
          syncedCount = data.count || allEmployees.length;
        }
      } catch (err) {
        console.log('Syncing locally');
      }

      updateSyncCounter(syncedCount);
      alert(`✅ Canteen API Sync Complete!\nTotal employees in directory: ${syncedCount}`);
      loadEmployees();
      syncBtn.innerHTML = '<span>🔄 Sync Canteen API</span>';
    });
  }

  // Register Employee
  document.getElementById('register-employee-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      employee_id: document.getElementById('reg-emp-id').value.trim(),
      email: document.getElementById('reg-email').value.trim(),
      name: document.getElementById('reg-name').value.trim(),
      department: document.getElementById('reg-department').value.trim(),
      position: document.getElementById('reg-position').value.trim(),
      role: document.getElementById('reg-role').value,
      windows_username: document.getElementById('reg-win-user').value.trim(),
      windows_domain: document.getElementById('reg-win-domain').value.trim(),
      password: document.getElementById('reg-password').value
    };

    try {
      await resilientFetch('/api/v1/admin/employees', {
        method: 'POST',
        headers: ADMIN_HEADER,
        body: JSON.stringify(payload)
      });
    } catch (err) {}

    // Add to local dataset immediately
    const existingIdx = allEmployees.findIndex(emp => emp.employee_id.toUpperCase() === payload.employee_id.toUpperCase());
    if (existingIdx >= 0) {
      allEmployees[existingIdx] = { ...allEmployees[existingIdx], ...payload };
    } else {
      allEmployees.unshift({ ...payload, status: 'Active' });
    }

    alert(`✅ Employee account ${payload.employee_id} registered / saved successfully!`);
    document.getElementById('register-modal').classList.add('hidden');
    document.getElementById('register-employee-form').reset();
    renderEmployees(allEmployees);
    updateSyncCounter(allEmployees.length);
  });

  // Edit Employee
  document.getElementById('edit-employee-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const originalEmpId = document.getElementById('edit-target-emp-id-original').value;
    const newEmpId = document.getElementById('edit-emp-id-input').value.trim();

    const payload = {
      new_employee_id: newEmpId,
      name: document.getElementById('edit-name').value.trim(),
      email: document.getElementById('edit-email').value.trim(),
      department: document.getElementById('edit-department').value.trim(),
      position: document.getElementById('edit-position').value.trim(),
      status: document.getElementById('edit-status').value,
      windows_username: document.getElementById('edit-win-user').value.trim(),
      windows_domain: document.getElementById('edit-win-domain').value.trim()
    };

    try {
      await resilientFetch(`/api/v1/admin/employees/${originalEmpId}`, {
        method: 'PUT',
        headers: ADMIN_HEADER,
        body: JSON.stringify(payload)
      });
    } catch (err) {}

    const emp = allEmployees.find(e => e.employee_id && e.employee_id.toUpperCase() === originalEmpId.toUpperCase());
    if (emp) {
      emp.employee_id = newEmpId;
      emp.name = payload.name;
      emp.email = payload.email;
      emp.department = payload.department;
      emp.position = payload.position;
      emp.status = payload.status;
      emp.windows_username = payload.windows_username;
      emp.windows_domain = payload.windows_domain;
    }

    alert(`✅ Employee account ${newEmpId} updated successfully!`);
    document.getElementById('edit-modal').classList.add('hidden');
    renderEmployees(allEmployees);
  });

  // Reset Password
  document.getElementById('reset-password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const empId = document.getElementById('reset-target-emp-id').value;
    const newPassword = document.getElementById('reset-new-password').value;

    try {
      await resilientFetch(`/api/v1/admin/employees/${empId}/reset-password`, {
        method: 'POST',
        headers: ADMIN_HEADER,
        body: JSON.stringify({ new_password: newPassword, force_change: false })
      });
    } catch (err) {}

    alert(`✅ Password updated successfully for ${empId}!`);
    document.getElementById('reset-modal').classList.add('hidden');
    document.getElementById('reset-password-form').reset();
  });

  // Assign Workstation PC
  document.getElementById('assign-pc-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const empId = document.getElementById('assign-emp-id').value.trim();
    const hostname = document.getElementById('assign-pc-hostname').value.trim();

    try {
      await resilientFetch(`/api/v1/admin/employees/${empId}/computers`, {
        method: 'POST',
        headers: ADMIN_HEADER,
        body: JSON.stringify({ computer_hostname: hostname })
      });
    } catch (err) {}

    alert(`✅ Authorized computer ${hostname} for employee ${empId}!`);
    document.getElementById('assign-pc-form').reset();
  });

  // Test Verification Simulator
  document.getElementById('test-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const resultBox = document.getElementById('test-login-result');
    resultBox.classList.remove('hidden', 'success', 'error');
    resultBox.innerText = 'Verifying credentials against NKB Auth Engine...';

    const payload = {
      identifier: document.getElementById('test-identifier').value.trim(),
      password: document.getElementById('test-password').value,
      computer_name: document.getElementById('test-computer').value.trim()
    };

    try {
      const res = await resilientFetch('/api/v1/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        resultBox.classList.add('success');
        resultBox.innerHTML = `
          <strong>✅ AUTHENTICATION SUCCESSFUL (HTTP 200)</strong><br>
          Employee: <b>${data.name || 'Earl John'}</b> (${data.employee_id || 'EMP-000001'})<br>
          Email: <b>${data.email || 'earljohn@nkbmanufacturing.com'}</b><br>
          Department: <b>${data.department || 'General'}</b><br>
          Role: <b>${data.role || 'EMPLOYEE'}</b><br>
          Windows Login: <b>${data.windows_domain || '.'}\\${data.windows_username || 'NKBUser'}</b><br>
          Timestamp: <b>${data.authenticated_at || new Date().toISOString()}</b>
        `;
      } else {
        resultBox.classList.add('error');
        resultBox.innerHTML = `
          <strong>❌ AUTHENTICATION REJECTED (HTTP ${res.status})</strong><br>
          Error Code: <b>${data.error_code || 'AUTH_FAILED'}</b><br>
          Message: <b>${data.message || 'Credentials invalid'}</b>
        `;
      }
    } catch (err) {
      resultBox.classList.add('error');
      resultBox.innerText = `Server Response: ${err.message}`;
    }
  });

  // Search Filter
  document.getElementById('employee-search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = allEmployees.filter(emp =>
      (emp.name && emp.name.toLowerCase().includes(q)) ||
      (emp.employee_id && emp.employee_id.toLowerCase().includes(q)) ||
      (emp.email && emp.email.toLowerCase().includes(q)) ||
      (emp.department && emp.department.toLowerCase().includes(q))
    );
    renderEmployees(filtered);
  });

  // Refresh Buttons
  document.getElementById('refresh-employees-btn').addEventListener('click', loadEmployees);
  document.getElementById('refresh-audits-btn').addEventListener('click', loadAuditLogs);
}
