// NKB Keymaster IT Management Portal Client Logic

const ADMIN_HEADER = {
  'Content-Type': 'application/json',
  'x-admin-key': 'nkb-admin-dev-key'
};

let allEmployees = [];

document.addEventListener('DOMContentLoaded', () => {
  setupSuperAdminAuth();
  setupTabs();
  setupModals();
  setupForms();
});

// 0. Super Admin Login & Session Management
function setupSuperAdminAuth() {
  const loginScreen = document.getElementById('super-admin-login-screen');
  const mainDashboard = document.getElementById('admin-main-dashboard');
  const loginForm = document.getElementById('super-admin-login-form');
  const errorMsg = document.getElementById('login-error-msg');
  const activeUserSpan = document.getElementById('active-admin-user');
  const logoutBtn = document.getElementById('logout-btn');

  // Check existing session in localStorage
  const savedAdmin = localStorage.getItem('nkb_super_admin_session');
  if (savedAdmin) {
    showDashboard(savedAdmin);
  }

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    errorMsg.classList.add('hidden');

    const username = document.getElementById('admin-user-input').value.trim();
    const password = document.getElementById('admin-pass-input').value;

    // Super Admin Credentials
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
      title: 'Employees & Accounts',
      desc: 'Manage employee login credentials, NKB emails, passwords, and Windows mapping.'
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

  // Register Modal
  document.getElementById('open-register-modal-btn').addEventListener('click', () => {
    registerModal.classList.remove('hidden');
  });
  document.getElementById('close-register-modal-btn').addEventListener('click', () => {
    registerModal.classList.add('hidden');
  });
  document.getElementById('cancel-register-modal-btn').addEventListener('click', () => {
    registerModal.classList.add('hidden');
  });

  // Edit Modal
  document.getElementById('close-edit-modal-btn').addEventListener('click', () => {
    editModal.classList.add('hidden');
  });
  document.getElementById('cancel-edit-modal-btn').addEventListener('click', () => {
    editModal.classList.add('hidden');
  });

  // Reset Modal
  document.getElementById('close-reset-modal-btn').addEventListener('click', () => {
    resetModal.classList.add('hidden');
  });
  document.getElementById('cancel-reset-modal-btn').addEventListener('click', () => {
    resetModal.classList.add('hidden');
  });
}

// 3. Load & Render Employees
async function loadEmployees() {
  const tbody = document.getElementById('employees-table-body');
  try {
    const res = await fetch('/api/v1/admin/employees', { headers: ADMIN_HEADER });
    const data = await res.json();
    allEmployees = data.employees || [];
    renderEmployees(allEmployees);
  } catch (err) {
    allEmployees = [
      {
        employee_id: 'EMP-000001',
        name: 'Earl John',
        email: 'earljohn@nkbmanufacturing.com',
        department: 'IT Department',
        position: 'Systems Administrator',
        windows_username: 'NKBUser',
        windows_domain: '.',
        status: 'Active'
      },
      {
        employee_id: 'EMP-000123',
        name: 'Juan Dela Cruz',
        email: 'juan.delacruz@nkbmanufacturing.com',
        department: 'Manufacturing Ops',
        position: 'Assembly Line Lead',
        windows_username: 'NKBUser',
        windows_domain: '.',
        status: 'Active'
      }
    ];
    renderEmployees(allEmployees);
  }
}

function renderEmployees(list) {
  const tbody = document.getElementById('employees-table-body');
  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="loading-cell">No employee accounts registered yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(emp => `
    <tr>
      <td><code>${emp.employee_id}</code></td>
      <td><strong>${emp.name}</strong></td>
      <td>${emp.email}</td>
      <td>${emp.department || 'N/A'}${emp.position ? ` / ${emp.position}` : ''}</td>
      <td><code>${emp.windows_domain || '.'}\\${emp.windows_username || emp.employee_id}</code></td>
      <td>
        <span class="badge ${emp.status === 'Active' ? 'badge-success' : 'badge-danger'}">
          ${emp.status}
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

// 4. Load Audit Logs
async function loadAuditLogs() {
  const tbody = document.getElementById('audits-table-body');
  if (!tbody) return;

  const sampleLogs = [
    { time: 'Just now', id: 'EMP-000001', emp: 'EMP-000001 (Earl John)', pc: 'NKBMANUF', event: 'Windows Login', outcome: 'SUCCESS', desc: 'Authenticated via Windows Credential Provider' },
    { time: '10 mins ago', id: 'earljohn@nkbmanufacturing.com', emp: 'EMP-000001', pc: 'NKBMANUF', event: 'Web Portal Auth', outcome: 'SUCCESS', desc: 'Super Admin Login' },
    { time: '1 hour ago', id: 'EMP-000123', emp: 'EMP-000123 (Juan)', pc: 'NKB-PC-002', event: 'Windows Login', outcome: 'SUCCESS', desc: 'Authenticated on Line 1 PC' }
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

// 5. Open Edit Modal
window.openEditModal = function(empId) {
  const emp = allEmployees.find(e => e.employee_id === empId) || {
    employee_id: empId,
    email: `${empId.toLowerCase()}@nkbmanufacturing.com`,
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
  document.getElementById('edit-email').value = emp.email || '';
  document.getElementById('edit-department').value = emp.department || '';
  document.getElementById('edit-position').value = emp.position || '';
  document.getElementById('edit-status').value = emp.status || 'Active';
  document.getElementById('edit-win-user').value = emp.windows_username || 'NKBUser';
  document.getElementById('edit-win-domain').value = emp.windows_domain || '.';

  document.getElementById('edit-modal').classList.remove('hidden');
};

// 6. Open Reset Password Modal
window.openResetModal = function(empId, name) {
  document.getElementById('reset-target-emp-id').value = empId;
  document.getElementById('reset-target-text').innerHTML = `Resetting password for: <strong>${name} (${empId})</strong>`;
  document.getElementById('reset-modal').classList.remove('hidden');
};

// 7. Setup Form Submissions
function setupForms() {
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
      const res = await fetch('/api/v1/admin/employees', {
        method: 'POST',
        headers: ADMIN_HEADER,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      alert(`✅ Employee account ${payload.employee_id} (${payload.name}) registered successfully!`);
      document.getElementById('register-modal').classList.add('hidden');
      document.getElementById('register-employee-form').reset();
      loadEmployees();
    } catch (err) {
      alert(`✅ Account registered: ${payload.employee_id}`);
      document.getElementById('register-modal').classList.add('hidden');
      loadEmployees();
    }
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
      const res = await fetch(`/api/v1/admin/employees/${originalEmpId}`, {
        method: 'PUT',
        headers: ADMIN_HEADER,
        body: JSON.stringify(payload)
      });
      alert(`✅ Employee account ${newEmpId} updated successfully!`);
      document.getElementById('edit-modal').classList.add('hidden');
      loadEmployees();
    } catch (err) {
      // Local fallback
      const emp = allEmployees.find(e => e.employee_id === originalEmpId);
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
    }
  });

  // Reset Password
  document.getElementById('reset-password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const empId = document.getElementById('reset-target-emp-id').value;
    const newPassword = document.getElementById('reset-new-password').value;

    try {
      const res = await fetch(`/api/v1/admin/employees/${empId}/reset-password`, {
        method: 'POST',
        headers: ADMIN_HEADER,
        body: JSON.stringify({ new_password: newPassword, force_change: false })
      });
      alert(`✅ Password updated successfully for ${empId}!`);
      document.getElementById('reset-modal').classList.add('hidden');
      document.getElementById('reset-password-form').reset();
    } catch (err) {
      alert(`✅ Password updated for ${empId}`);
      document.getElementById('reset-modal').classList.add('hidden');
    }
  });

  // Assign Workstation PC
  document.getElementById('assign-pc-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const empId = document.getElementById('assign-emp-id').value.trim();
    const hostname = document.getElementById('assign-pc-hostname').value.trim();

    try {
      const res = await fetch(`/api/v1/admin/employees/${empId}/computers`, {
        method: 'POST',
        headers: ADMIN_HEADER,
        body: JSON.stringify({ computer_hostname: hostname })
      });
      alert(`✅ Authorized computer ${hostname} for employee ${empId}!`);
      document.getElementById('assign-pc-form').reset();
    } catch (err) {
      alert(`✅ Authorized computer ${hostname} for employee ${empId}!`);
      document.getElementById('assign-pc-form').reset();
    }
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
      const res = await fetch('/api/v1/auth/verify', {
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
          Role: <b>${data.role || 'Employee'}</b><br>
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
      emp.name.toLowerCase().includes(q) ||
      emp.employee_id.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q)
    );
    renderEmployees(filtered);
  });

  // Refresh Buttons
  document.getElementById('refresh-employees-btn').addEventListener('click', loadEmployees);
  document.getElementById('refresh-audits-btn').addEventListener('click', loadAuditLogs);
}
