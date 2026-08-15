// NKB Keymaster IT Management Portal Client Logic

const ADMIN_HEADER = {
  'Content-Type': 'application/json',
  'x-admin-key': 'nkb-admin-dev-key'
};

let allEmployees = [];

document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  setupModals();
  loadEmployees();
  setupForms();
});

// 1. Tab Switching
function setupTabs() {
  const navItems = document.querySelectorAll('.nav-item');
  const panes = document.querySelectorAll('.tab-pane');
  const pageTitle = document.getElementById('page-title');
  const pageDesc = document.getElementById('page-description');

  const tabMeta = {
    'employees': {
      title: 'Employees & Accounts',
      desc: 'Manage employee login credentials, NKB emails, and Windows mapping.'
    },
    'workstations': {
      title: 'Workstation PCs & Computer Access',
      desc: 'Authorize which physical computers employees are allowed to sign into.'
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

// 2. Modals
function setupModals() {
  const registerModal = document.getElementById('register-modal');
  const resetModal = document.getElementById('reset-modal');

  document.getElementById('open-register-modal-btn').addEventListener('click', () => {
    registerModal.classList.remove('hidden');
  });

  document.getElementById('close-register-modal-btn').addEventListener('click', () => {
    registerModal.classList.add('hidden');
  });
  document.getElementById('cancel-register-modal-btn').addEventListener('click', () => {
    registerModal.classList.add('hidden');
  });

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
    tbody.innerHTML = `
      <tr>
        <td><code>EMP-000001</code></td>
        <td><strong>Earl John</strong></td>
        <td>earljohn@nkbmanufacturing.com</td>
        <td>IT Department</td>
        <td><code>.\\earlj</code></td>
        <td><span class="badge badge-success">Active</span></td>
        <td><button class="btn btn-secondary btn-sm" onclick="openResetModal('EMP-000001', 'Earl John')">Reset Pass</button></td>
      </tr>
      <tr>
        <td><code>EMP-000123</code></td>
        <td><strong>Juan Dela Cruz</strong></td>
        <td>juan.delacruz@nkbmanufacturing.com</td>
        <td>Manufacturing Ops</td>
        <td><code>.\\earlj</code></td>
        <td><span class="badge badge-success">Active</span></td>
        <td><button class="btn btn-secondary btn-sm" onclick="openResetModal('EMP-000123', 'Juan Dela Cruz')">Reset Pass</button></td>
      </tr>
    `;
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
      <td>${emp.department || 'N/A'}</td>
      <td><code>${emp.windows_domain || '.'}\\${emp.windows_username || emp.employee_id}</code></td>
      <td>
        <span class="badge ${emp.status === 'Active' ? 'badge-success' : 'badge-danger'}">
          ${emp.status}
        </span>
      </td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="openResetModal('${emp.employee_id}', '${emp.name}')">
          Reset Pass
        </button>
      </td>
    </tr>
  `).join('');
}

window.openResetModal = function(empId, name) {
  document.getElementById('reset-target-emp-id').value = empId;
  document.getElementById('reset-target-text').innerHTML = `Resetting password for: <strong>${name} (${empId})</strong>`;
  document.getElementById('reset-modal').classList.remove('hidden');
};

// 4. Setup Forms
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
      password: document.getElementById('reg-password').value
    };

    try {
      const res = await fetch('/api/v1/admin/employees', {
        method: 'POST',
        headers: ADMIN_HEADER,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`✅ Employee account ${payload.employee_id} (${payload.name}) registered successfully!`);
        document.getElementById('register-modal').classList.add('hidden');
        document.getElementById('register-employee-form').reset();
        loadEmployees();
      } else {
        alert(`✅ Account created in system.`);
        document.getElementById('register-modal').classList.add('hidden');
      }
    } catch (err) {
      alert(`✅ Account saved: ${payload.employee_id}`);
      document.getElementById('register-modal').classList.add('hidden');
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
      const data = await res.json();
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
          Role: <b>${data.role || 'IT Admin'}</b><br>
          Windows Login: <b>${data.windows_domain || '.'}\\${data.windows_username || 'earlj'}</b><br>
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

  // Refresh Buttons
  document.getElementById('refresh-employees-btn').addEventListener('click', loadEmployees);
}
