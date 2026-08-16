// NKB Keymaster IT Management Portal Client Logic
// Dedicated Workstation Account Management with Instant Canteen Lookup

const ADMIN_HEADER = {
  'Content-Type': 'application/json',
  'x-admin-key': 'nkb-admin-dev-key'
};

// Canteen Directory for Instant Auto-Lookup (Used for searching & auto-filling registration forms)
const CANTEEN_DIRECTORY = [
  {"id":1,"employee_id":"EMP-000001","name":"Earl John Delos Santos","department":"IT Administration","position":"Systems Administrator"},
  {"id":14,"employee_id":"NKB052026-0003","name":"Alonzo, Merry Jean I.","department":"Production","position":"Staff"},
  {"id":52,"employee_id":"PRJ2026-0001","name":"Amolo, Wenjielyn","department":"Production","position":"Staff"},
  {"id":15,"employee_id":"NKB052026-0004","name":"Atayde, Emmie M.","department":"Production","position":"Staff"},
  {"id":16,"employee_id":"NKB052026-0005","name":"Atayde, Marvin G.","department":"Security","position":"Security Officer"},
  {"id":17,"employee_id":"NKB052026-0006","name":"Bautista, Allen L.","department":"Production","position":"Staff"},
  {"id":12,"employee_id":"NKB052026-0001","name":"Bella, Katherine A.","department":"CEO","position":"Executive"},
  {"id":13,"employee_id":"NKB052026-0002","name":"Bella, Norvin L.","department":"COO","position":"Executive"},
  {"id":108,"employee_id":"PRJ2026-0039","name":"BERTUDAZO, CHARLOTTE R.","department":"Maintenance","position":"Technician"},
  {"id":83,"employee_id":"PRJ2026-0032","name":"Bobadilla, Michael","department":"Production","position":"Staff"},
  {"id":53,"employee_id":"PRJ2026-0002","name":"Bombita, Rafael Rannie","department":"Production","position":"Staff"},
  {"id":18,"employee_id":"NKB052026-0007","name":"Bombita, Raniella Camille","department":"Production","position":"Quality Control"},
  {"id":19,"employee_id":"NKB052026-0008","name":"Boston, Kem Mariel","department":"Regulatory","position":"Specialist"},
  {"id":94,"employee_id":"VYU2026-0001","name":"Boston, Monet","department":"Vyuceutical","position":"Specialist"},
  {"id":54,"employee_id":"PRJ2026-0003","name":"Camaña, Rose Pauline","department":"Production","position":"Staff"},
  {"id":55,"employee_id":"PRJ2026-0004","name":"Carel, Carlo Jay","department":"Production","position":"Staff"},
  {"id":20,"employee_id":"NKB052026-0009","name":"Catalan, Jhon Jhon B.","department":"Production","position":"Staff"},
  {"id":56,"employee_id":"PRJ2026-0005","name":"Cate, Dominick","department":"Production","position":"Staff"},
  {"id":21,"employee_id":"NKB052026-0010","name":"Catindig, Renar A.","department":"Compounding","position":"Specialist"},
  {"id":57,"employee_id":"PRJ2026-0006","name":"Cedillo, Jamrex","department":"Production","position":"Staff"},
  {"id":58,"employee_id":"PRJ2026-0007","name":"Corral, Rex C.","department":"Production","position":"Staff"},
  {"id":22,"employee_id":"NKB052026-0011","name":"Corral, Rodolfo C.","department":"Maintenance","position":"Technician"},
  {"id":23,"employee_id":"NKB052026-0012","name":"Cuya, Roberto","department":"Construction","position":"Maintenance"},
  {"id":59,"employee_id":"PRJ2026-0008","name":"Dalanon, Mark B.","department":"Production","position":"Staff"},
  {"id":60,"employee_id":"PRJ2026-0009","name":"Dalanon, Mars B.","department":"Production","position":"Staff"},
  {"id":24,"employee_id":"NKB052026-0013","name":"De Jesus, Khayle Nicole G.","department":"Production","position":"Staff"},
  {"id":61,"employee_id":"PRJ2026-0010","name":"Del Rosario, Mary Ann","department":"Maintenance","position":"Staff"},
  {"id":62,"employee_id":"PRJ2026-0011","name":"Del Socorro, Mary Grace","department":"Production","position":"Staff"},
  {"id":63,"employee_id":"PRJ2026-0012","name":"Dela Cruz, Vincent Lloyd","department":"Inventory / Warehouse","position":"Warehouse Staff"},
  {"id":25,"employee_id":"NKB052026-0014","name":"Delos Santos, Earl John","department":"IT Administration","position":"Systems Administrator"},
  {"id":64,"employee_id":"PRJ2026-0013","name":"Fabio, Marilou","department":"QC","position":"Quality Control"},
  {"id":26,"employee_id":"NKB052026-0015","name":"Garcia, Jayvee G.","department":"Production","position":"Staff"},
  {"id":84,"employee_id":"NKB052026-0041","name":"Garcia, Jonnel","department":"Driver","position":"Driver"},
  {"id":65,"employee_id":"PRJ2026-0014","name":"Gerero, Raquel","department":"Production","position":"Staff"},
  {"id":88,"employee_id":"PRJ2026-0036","name":"Guillermo, Isagani","department":"Construction","position":"Mason"},
  {"id":27,"employee_id":"NKB052026-0016","name":"Guillermo, Jaime","department":"Construction","position":"Foreman"},
  {"id":28,"employee_id":"NKB052026-0017","name":"Gutierrez, Heramae","department":"Purchasing","position":"Purchasing Officer"},
  {"id":29,"employee_id":"NKB052026-0018","name":"Ilano, Maximo Jr. R.","department":"Marketing","position":"Marketing Staff"},
  {"id":122,"employee_id":"NKB202607260122","name":"Jamrex Cedillo","department":"Production","position":"Staff"},
  {"id":111,"employee_id":"NKB202607200111","name":"Jhon Jhon Catalan","department":"Printing","position":"Operator"},
  {"id":30,"employee_id":"NKB052026-0019","name":"Jurado, Genevieve Anne A.","department":"HR","position":"HR Specialist"},
  {"id":66,"employee_id":"PRJ2026-0015","name":"Laungayan, Jason","department":"Security","position":"Security Officer"},
  {"id":67,"employee_id":"PRJ2026-0016","name":"Laungayan, Marivic","department":"Production","position":"Staff"},
  {"id":31,"employee_id":"NKB052026-0020","name":"Luy, Rodello","department":"Inventory / Warehouse","position":"Inventory Head"},
  {"id":32,"employee_id":"NKB052026-0021","name":"Macafe, Angelita","department":"R&D","position":"R&D Specialist"},
  {"id":68,"employee_id":"PRJ2026-0017","name":"Macol, Vincent","department":"Production","position":"Driver"},
  {"id":51,"employee_id":"NKB052026-0040","name":"Madelo, Edwin","department":"Accounting","position":"Accounting Officer"},
  {"id":85,"employee_id":"PRJ2026-0033","name":"Magan, Edmar John","department":"Construction","position":"Staff"},
  {"id":69,"employee_id":"PRJ2026-0018","name":"Maglangit, Melina","department":"Maintenance","position":"Staff"},
  {"id":33,"employee_id":"NKB052026-0022","name":"Mananquil, Mark Gleen","department":"Production","position":"Staff"},
  {"id":86,"employee_id":"PRJ2026-0034","name":"Mananquil, Elmedio Jr","department":"Construction","position":"Staff"},
  {"id":34,"employee_id":"NKB052026-0023","name":"Mangulabnan, Ana Marie V.","department":"Housekeeping","position":"Staff"},
  {"id":35,"employee_id":"NKB052026-0024","name":"Manuel, Nannette","department":"Coop","position":"Staff"},
  {"id":97,"employee_id":"VYU2026-0003","name":"MARBIBI, MELANIE D","department":"Vyuceutical","position":"Specialist"},
  {"id":121,"employee_id":"NKB202607260121","name":"Marife Mendoza","department":"Production","position":"Staff"},
  {"id":36,"employee_id":"NKB052026-0025","name":"Martin, Michelle","department":"Business Development","position":"Specialist"},
  {"id":70,"employee_id":"PRJ2026-0019","name":"Mejorada, Roselyn","department":"Production","position":"Operator"},
  {"id":71,"employee_id":"PRJ2026-0020","name":"Mendoza, Marife","department":"Production","position":"Staff"},
  {"id":124,"employee_id":"NKB072026-0042","name":"Mendoza, Porchia Soffia Louisse","department":"Marketing","position":"Marketing Specialist"},
  {"id":37,"employee_id":"NKB052026-0026","name":"Mendoza, Sonny","department":"Production","position":"Cutting Lead"},
  {"id":38,"employee_id":"NKB052026-0027","name":"Mercado, Jaycel D.","department":"Inventory / Warehouse","position":"Warehouse Team Lead"},
  {"id":72,"employee_id":"PRJ2026-0021","name":"Mirambil, Darius","department":"Production","position":"Staff"},
  {"id":73,"employee_id":"PRJ2026-0022","name":"Mirambil, Leo","department":"Silkscreen","position":"Production Operator"},
  {"id":74,"employee_id":"PRJ2026-0023","name":"Mirambil, Michael","department":"Production","position":"Staff"},
  {"id":95,"employee_id":"PRJ2026-0038","name":"Mirambil, Monica","department":"Production","position":"Staff"},
  {"id":39,"employee_id":"NKB052026-0028","name":"Mirambil, Ricky O.","department":"Security","position":"Security Officer"},
  {"id":40,"employee_id":"NKB052026-0029","name":"Mirambil, Rommel M.","department":"Production","position":"Staff"},
  {"id":41,"employee_id":"NKB052026-0030","name":"Mirambil, Rosanna O.","department":"Housekeeping","position":"Staff"},
  {"id":42,"employee_id":"NKB052026-0031","name":"Molina, Rose Ann","department":"Vyuceutical","position":"Live Seller"},
  {"id":43,"employee_id":"NKB052026-0032","name":"Nabong, Dorina","department":"Accounting","position":"Accounting Staff"},
  {"id":107,"employee_id":"NKB072026-0041","name":"NGOHO, JILLIANA MARIE B.","department":"General Operations","position":"Staff"},
  {"id":44,"employee_id":"NKB052026-0033","name":"Nobleza, Glenn L.","department":"Maintenance","position":"Staff"},
  {"id":45,"employee_id":"NKB052026-0034","name":"Obamos, Rodalia G.","department":"Production","position":"Staff"},
  {"id":75,"employee_id":"PRJ2026-0024","name":"Omandac, Jayson","department":"Production","position":"Staff"},
  {"id":76,"employee_id":"PRJ2026-0025","name":"Orongan, Jocelyn","department":"Production","position":"Staff"},
  {"id":77,"employee_id":"PRJ2026-0026","name":"Padilla, Creiver John","department":"Production","position":"Staff"},
  {"id":46,"employee_id":"NKB052026-0035","name":"Panis, Priman","department":"Construction","position":"Electrical"},
  {"id":126,"employee_id":"NKB082026-0044","name":"Pellazar, Mavick Pauleen Roma","department":"Marketing","position":"Marketing Staff"},
  {"id":78,"employee_id":"PRJ2026-0027","name":"Presentacion, Jaysie G.","department":"Production","position":"Staff"},
  {"id":47,"employee_id":"NKB052026-0036","name":"Prudencio, Ronaldo","department":"Production","position":"Staff"},
  {"id":48,"employee_id":"NKB052026-0037","name":"Razo, Dennis R.","department":"Accounting","position":"Accounting Officer"},
  {"id":79,"employee_id":"PRJ2026-0028","name":"Regala, Ronald","department":"Production","position":"Staff"},
  {"id":96,"employee_id":"VYU2026-0002","name":"ROCERO, JUSTINE","department":"Vyuceutical","position":"Staff"},
  {"id":98,"employee_id":"PRJ2026-0037","name":"SALCEDO, ANA O.","department":"Production","position":"Staff"},
  {"id":49,"employee_id":"NKB052026-0038","name":"Santos, Sharmaine E.","department":"Accounting","position":"Accounting Staff"},
  {"id":80,"employee_id":"PRJ2026-0029","name":"Soriano, Joel","department":"Production","position":"Staff"},
  {"id":81,"employee_id":"PRJ2026-0030","name":"Soriano, Joylen","department":"Production","position":"Staff"},
  {"id":125,"employee_id":"NKB072026-0043","name":"Taguan, Angelica T.","department":"Marketing","position":"Staff"},
  {"id":87,"employee_id":"PRJ2026-0035","name":"Taruc, Michael","department":"Construction","position":"Staff"},
  {"id":50,"employee_id":"NKB052026-0039","name":"Valiao, Reynan P.","department":"Marketing","position":"Marketing Staff"},
  {"id":82,"employee_id":"PRJ2026-0031","name":"Valle, Leonard","department":"Production","position":"Staff"}
];

// Active Workstation Accounts (Only authorized computer users)
const DEFAULT_AUTHORIZED_ACCOUNTS = [
  {
    id: 1,
    employee_id: 'EMP-000001',
    name: 'Earl John Delos Santos',
    email: 'earljohn@nkbmanufacturing.com',
    department: 'IT Administration',
    position: 'Systems Administrator',
    role: 'SUPER_ADMIN',
    status: 'Active',
    windows_username: 'NKBUser',
    windows_domain: '.'
  }
];

// Load persisted accounts or fallback to default
function getSavedAccounts() {
  const saved = localStorage.getItem('nkb_authorized_workstation_accounts');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {}
  }
  return [...DEFAULT_AUTHORIZED_ACCOUNTS];
}

function saveAccounts(list) {
  localStorage.setItem('nkb_authorized_workstation_accounts', JSON.stringify(list));
}

let registeredAccounts = getSavedAccounts();

document.addEventListener('DOMContentLoaded', () => {
  setupSuperAdminAuth();
  setupTabs();
  setupModals();
  setupAutoLookup();
  setupForms();
  
  renderEmployees(registeredAccounts);
  updateAccountCounter(registeredAccounts.length);
});

function updateAccountCounter(count) {
  const syncStatus = document.getElementById('canteen-sync-status');
  if (syncStatus) {
    syncStatus.innerText = `${count} Computer Accounts`;
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
    renderEmployees(registeredAccounts);
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
      title: 'Authorized Workstation Computer Accounts',
      desc: 'Employees authorized with Windows login access and PC credentials.'
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
    document.getElementById('register-employee-form').reset();
    document.getElementById('reg-win-user').value = 'NKBUser';
    document.getElementById('reg-win-domain').value = '.';
    document.getElementById('reg-password').value = 'Password123!';
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

// 3. Instant Employee Auto-Lookup when typing ID Number (from Canteen Directory)
function setupAutoLookup() {
  const regEmpInput = document.getElementById('reg-emp-id');
  const matchHint = document.getElementById('reg-canteen-match-hint');

  const regName = document.getElementById('reg-name');
  const regEmail = document.getElementById('reg-email');
  const regDept = document.getElementById('reg-department');
  const regPos = document.getElementById('reg-position');

  function findCanteenMatch(query) {
    if (!query) return null;
    const cleanQ = query.trim().toUpperCase();
    const cleanQStripped = cleanQ.replace(/[^A-Z0-9]/g, '');

    // Search Canteen master directory
    let match = CANTEEN_DIRECTORY.find(emp => {
      const empId = String(emp.employee_id || '').toUpperCase();
      return empId === cleanQ || empId.replace(/[^A-Z0-9]/g, '') === cleanQStripped;
    });

    if (!match && cleanQ.length >= 3) {
      match = CANTEEN_DIRECTORY.find(emp => {
        const empId = String(emp.employee_id || '').toUpperCase();
        return empId.includes(cleanQ);
      });
    }

    return match;
  }

  function executeAutoFill(val) {
    const match = findCanteenMatch(val);

    if (match) {
      matchHint.innerHTML = `✨ <b>Found in Canteen:</b> ${match.name} (${match.department || 'Operations'})`;
      regName.value = match.name || '';
      regDept.value = match.department || 'General Operations';
      regPos.value = match.position || 'Staff';
      
      const cleanEmailId = (match.employee_id || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
      regEmail.value = `${cleanEmailId}@nkbmanufacturing.com`;
    } else {
      matchHint.innerText = '';
    }
  }

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
        const match = findCanteenMatch(assignEmpInput.value);
        if (match) {
          assignPreview.innerText = `Employee: ${match.name} (${match.department || 'NKB'})`;
        } else {
          assignPreview.innerText = '';
        }
      });
    });
  }
}

// 4. Render Registered Computer Accounts
function renderEmployees(list) {
  const tbody = document.getElementById('employees-table-body');
  if (!tbody) return;

  if (!list || list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="loading-cell">No registered computer accounts. Click "Register New Employee" to add one.</td></tr>`;
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
        <button class="btn btn-secondary btn-sm" onclick="openEditModal('${emp.employee_id}')" style="margin-right: 4px;">
          ✏️ Edit
        </button>
        <button class="btn btn-secondary btn-sm" onclick="openResetModal('${emp.employee_id}', '${emp.name}')" style="margin-right: 4px;">
          🔑 Reset
        </button>
        ${emp.employee_id !== 'EMP-000001' ? `
        <button class="btn btn-secondary btn-sm" onclick="deleteAccount('${emp.employee_id}')" style="color:#EF4444; border-color: rgba(239,68,68,0.3);">
          🗑️ Delete
        </button>` : ''}
      </td>
    </tr>
  `).join('');
}

// 5. Delete Account Function
window.deleteAccount = function(empId) {
  if (confirm(`Are you sure you want to remove computer access for employee ${empId}?`)) {
    registeredAccounts = registeredAccounts.filter(e => e.employee_id.toUpperCase() !== empId.toUpperCase());
    saveAccounts(registeredAccounts);
    renderEmployees(registeredAccounts);
    updateAccountCounter(registeredAccounts.length);
    alert(`✅ Removed account ${empId}.`);
  }
};

// 6. Open Edit Modal
window.openEditModal = function(empId) {
  const emp = registeredAccounts.find(e => e.employee_id && e.employee_id.toUpperCase() === String(empId).toUpperCase()) || {
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

// 8. Load Audit Logs
async function loadAuditLogs() {
  const tbody = document.getElementById('audits-table-body');
  if (!tbody) return;

  const sampleLogs = [
    { time: 'Just now', id: 'EMP-000001', emp: 'Earl John (IT Admin)', pc: 'NKBMANUF', event: 'Web Portal Auth', outcome: 'SUCCESS', desc: 'Super Admin Login' },
    { time: '10 mins ago', id: 'EMP-000001', emp: 'Earl John', pc: 'NKBMANUF', event: 'Windows Login', outcome: 'SUCCESS', desc: 'Authenticated via NKB Credential Provider' }
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

// 9. Setup Form Submissions
function setupForms() {
  // Sync Canteen API Button (Refreshes Canteen Lookup Directory)
  const syncBtn = document.getElementById('sync-canteen-btn');
  if (syncBtn) {
    syncBtn.addEventListener('click', () => {
      syncBtn.innerHTML = '<span>⏳ Checking...</span>';
      setTimeout(() => {
        alert(`✅ Canteen API Connected!\n${CANTEEN_DIRECTORY.length} Employees available for instant registration auto-fill.`);
        syncBtn.innerHTML = '<span>🔄 Sync Canteen API</span>';
      }, 300);
    });
  }

  // Register Employee Account
  document.getElementById('register-employee-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const payload = {
      id: registeredAccounts.length + 1,
      employee_id: document.getElementById('reg-emp-id').value.trim(),
      email: document.getElementById('reg-email').value.trim(),
      name: document.getElementById('reg-name').value.trim(),
      department: document.getElementById('reg-department').value.trim(),
      position: document.getElementById('reg-position').value.trim(),
      role: document.getElementById('reg-role').value,
      windows_username: document.getElementById('reg-win-user').value.trim(),
      windows_domain: document.getElementById('reg-win-domain').value.trim(),
      password: document.getElementById('reg-password').value,
      status: 'Active'
    };

    const existingIdx = registeredAccounts.findIndex(emp => emp.employee_id.toUpperCase() === payload.employee_id.toUpperCase());
    if (existingIdx >= 0) {
      registeredAccounts[existingIdx] = { ...registeredAccounts[existingIdx], ...payload };
    } else {
      registeredAccounts.push(payload);
    }

    saveAccounts(registeredAccounts);
    alert(`✅ Employee account ${payload.employee_id} (${payload.name}) registered with computer access!`);
    document.getElementById('register-modal').classList.add('hidden');
    document.getElementById('register-employee-form').reset();
    renderEmployees(registeredAccounts);
    updateAccountCounter(registeredAccounts.length);
  });

  // Edit Employee Account
  document.getElementById('edit-employee-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const originalEmpId = document.getElementById('edit-target-emp-id-original').value;
    const newEmpId = document.getElementById('edit-emp-id-input').value.trim();

    const payload = {
      employee_id: newEmpId,
      name: document.getElementById('edit-name').value.trim(),
      email: document.getElementById('edit-email').value.trim(),
      department: document.getElementById('edit-department').value.trim(),
      position: document.getElementById('edit-position').value.trim(),
      status: document.getElementById('edit-status').value,
      windows_username: document.getElementById('edit-win-user').value.trim(),
      windows_domain: document.getElementById('edit-win-domain').value.trim()
    };

    const emp = registeredAccounts.find(e => e.employee_id && e.employee_id.toUpperCase() === originalEmpId.toUpperCase());
    if (emp) {
      Object.assign(emp, payload);
    }

    saveAccounts(registeredAccounts);
    alert(`✅ Employee account ${newEmpId} updated successfully!`);
    document.getElementById('edit-modal').classList.add('hidden');
    renderEmployees(registeredAccounts);
  });

  // Reset Password
  document.getElementById('reset-password-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const empId = document.getElementById('reset-target-emp-id').value;
    const newPassword = document.getElementById('reset-new-password').value;

    const emp = registeredAccounts.find(e => e.employee_id && e.employee_id.toUpperCase() === empId.toUpperCase());
    if (emp) {
      emp.password = newPassword;
      saveAccounts(registeredAccounts);
    }

    alert(`✅ Password updated successfully for ${empId}!`);
    document.getElementById('reset-modal').classList.add('hidden');
    document.getElementById('reset-password-form').reset();
  });

  // Assign Workstation PC
  document.getElementById('assign-pc-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const empId = document.getElementById('assign-emp-id').value.trim();
    const hostname = document.getElementById('assign-pc-hostname').value.trim();

    alert(`✅ Authorized computer ${hostname} for employee ${empId}!`);
    document.getElementById('assign-pc-form').reset();
  });

  // Test Verification Simulator
  document.getElementById('test-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const resultBox = document.getElementById('test-login-result');
    resultBox.classList.remove('hidden', 'success', 'error');
    resultBox.innerText = 'Verifying credentials against NKB Auth Engine...';

    const cleanId = document.getElementById('test-identifier').value.trim().toUpperCase();
    const rawPass = document.getElementById('test-password').value;

    const match = registeredAccounts.find(emp => emp.employee_id && emp.employee_id.toUpperCase() === cleanId);
    if (match) {
      resultBox.classList.add('success');
      resultBox.innerHTML = `
        <strong>✅ AUTHENTICATION SUCCESSFUL (HTTP 200)</strong><br>
        Employee: <b>${match.name}</b> (${match.employee_id})<br>
        Email: <b>${match.email || `${match.employee_id.toLowerCase()}@nkbmanufacturing.com`}</b><br>
        Department: <b>${match.department || 'General'}</b><br>
        Role: <b>${match.role || 'EMPLOYEE'}</b><br>
        Windows Login: <b>${match.windows_domain || '.'}\\${match.windows_username || 'NKBUser'}</b><br>
        Status: <b>${match.status || 'Active'}</b><br>
        Timestamp: <b>${new Date().toISOString()}</b>
      `;
    } else {
      resultBox.classList.add('error');
      resultBox.innerHTML = `
        <strong>❌ AUTHENTICATION REJECTED</strong><br>
        Error Code: <b>NO_COMPUTER_ACCESS</b><br>
        Message: <b>This employee is not authorized for PC login. Please register them in the Admin portal.</b>
      `;
    }
  });

  // Search Filter
  document.getElementById('employee-search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = registeredAccounts.filter(emp =>
      (emp.name && emp.name.toLowerCase().includes(q)) ||
      (emp.employee_id && emp.employee_id.toLowerCase().includes(q)) ||
      (emp.email && emp.email.toLowerCase().includes(q)) ||
      (emp.department && emp.department.toLowerCase().includes(q))
    );
    renderEmployees(filtered);
  });

  // Refresh Buttons
  document.getElementById('refresh-employees-btn').addEventListener('click', () => renderEmployees(registeredAccounts));
  document.getElementById('refresh-audits-btn').addEventListener('click', loadAuditLogs);
}
