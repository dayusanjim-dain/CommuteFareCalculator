
const $ = id => document.getElementById(id);

// SUPABASE CONFIGURATION
const SUPABASE_URL = 'https://riityzwcgfkrqkemozri.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_PfOewCYG3qCbGy3QNfR18g_5G6pQNFW';

const supabaseReady =
  window.supabase &&
  SUPABASE_URL.startsWith('https://') &&
  !SUPABASE_URL.includes('YOUR_') &&
  !SUPABASE_ANON_KEY.includes('YOUR_');

const supabaseClient = supabaseReady
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

let currentUser = null;
let authMode = 'login';
let cloudSaveTimer = null;
let authInitialized = false;
let authGeneration = 0;
let cloudSaveQueue = Promise.resolve();

const defaults = {
  name: 'Compute Fare Calculator',
  currency: '₱',
  theme: 'light',
  rates: {
    Jeepney: 13,
    Bus: 15,
    'UV Express': 15,
    Tricycle: 25,
    Train: 15,
    Other: 0
  },
  discounts: {
    student: 20,
    senior: 20,
    pwd: 20
  }
};

let records = JSON.parse(
  localStorage.getItem('faretrack_records') || '[]'
);

let settings = {
  ...defaults,
  ...(JSON.parse(localStorage.getItem('faretrack_settings') || 'null') || {})
};

settings.rates = {
  ...defaults.rates,
  ...(settings.rates || {})
};

settings.discounts = {
  ...defaults.discounts,
  ...(settings.discounts || {})
};

let expenseChart = null;
let transportChart = null;

const today = () => {
  const d = new Date();

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const money = n =>
  settings.currency +
  Number(n || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const esc = s =>
  String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));


// ==========================================
// LOCAL STORAGE AND SUPABASE CLOUD SAVING
// ==========================================

function saveToCloud(userId, recordsSnapshot, settingsSnapshot) {
  if (!supabaseClient || !userId) {
    return Promise.resolve(false);
  }

  const saveOperation = async () => {
    const { error } = await supabaseClient
      .from('faretrack_data')
      .upsert({
        user_id: userId,
        records: recordsSnapshot,
        settings: settingsSnapshot,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Supabase cloud save failed:', error);
      notify('Cloud save failed: ' + error.message);
      return false;
    }

    console.log('Successfully saved data to Supabase.');
    return true;
  };

  cloudSaveQueue = cloudSaveQueue
    .catch(error => {
      console.error('Previous cloud save error:', error);
    })
    .then(saveOperation);

  return cloudSaveQueue;
}

function save() {
  localStorage.setItem(
    'faretrack_records',
    JSON.stringify(records)
  );

  localStorage.setItem(
    'faretrack_settings',
    JSON.stringify(settings)
  );

  renderAll();

  if (!currentUser || !supabaseClient) return;

  clearTimeout(cloudSaveTimer);

  const userId = currentUser.id;

  const recordsSnapshot = JSON.parse(
    JSON.stringify(records)
  );

  const settingsSnapshot = JSON.parse(
    JSON.stringify(settings)
  );

  cloudSaveTimer = setTimeout(() => {
    saveToCloud(
      userId,
      recordsSnapshot,
      settingsSnapshot
    );
  }, 450);
}


// ==========================================
// NOTIFICATIONS AND THEME
// ==========================================

function notify(msg) {
  const t = $('toast');

  if (!t) {
    console.log(msg);
    return;
  }

  t.textContent = msg;
  t.classList.add('show');

  setTimeout(() => {
    t.classList.remove('show');
  }, 2200);
}

function setTheme(theme) {
  settings.theme = theme;

  document.body.classList.toggle(
    'dark',
    theme === 'dark'
  );

  if ($('themeSelect')) {
    $('themeSelect').value = theme;
  }

  localStorage.setItem(
    'faretrack_settings',
    JSON.stringify(settings)
  );

  if ($('themeToggle')) {
    $('themeToggle').innerHTML =
      theme === 'dark'
        ? '☀ <span>Light mode</span>'
        : '☾ <span>Dark mode</span>';
  }
}

$('themeToggle').onclick = () => {
  setTheme(
    settings.theme === 'dark' ? 'light' : 'dark'
  );

  notify(
    settings.theme === 'dark'
      ? 'Dark mode enabled'
      : 'Light mode enabled'
  );
};


// ==========================================
// NAVIGATION
// ==========================================

function openPage(id) {
  document.querySelectorAll('.page').forEach(p => {
    p.classList.toggle('active', p.id === id);
  });

  document.querySelectorAll('.nav').forEach(b => {
    b.classList.toggle(
      'active',
      b.dataset.page === id
    );
  });

  $('pageTitle').textContent = ({
    dashboard: 'Dashboard',
    calculator: 'Fare Calculator',
    transactions: 'Transactions',
    receipts: 'Receipts',
    reports: 'Reports & Analytics',
    settings: 'Settings'
  })[id] || 'Compute Fare Calculator';

  if (id === 'reports') renderReports();
  if (id === 'settings') loadSettings();
  if (id === 'receipts') renderReceiptList();

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

document.querySelectorAll('.nav').forEach(b => {
  b.onclick = () => openPage(b.dataset.page);
});

document.querySelectorAll('[data-open]').forEach(b => {
  b.onclick = () => openPage(b.dataset.open);
});

$('todayLabel').textContent = new Date().toLocaleDateString(
  'en-PH',
  {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }
);

$('travelDate').value = today();


// ==========================================
// FARE CALCULATOR
// ==========================================

function calculate() {
  const base = Number($('baseFare').value) || 0;
  const extra = Number($('extraFare').value) || 0;

  const pax = Math.max(
    1,
    Number($('passengers').value) || 1
  );

  const key = $('discount').value;

  const rate = key === 'none'
    ? 0
    : Number(settings.discounts[key] || 0);

  const mult =
    $('tripType').value === 'roundtrip' ? 2 : 1;

  const per =
    (base + extra) * mult * (1 - rate / 100);

  const total = per * pax;

  $('totalDisplay').textContent = money(total);
  $('perPassenger').textContent = money(per);
  $('passengerCount').textContent = pax;
  $('discountPercent').textContent = rate + '%';

  $('tripLabel').textContent =
    mult === 2 ? 'Round-Trip' : 'One-Way';

  $('finalTotal').textContent = money(total);

  return {
    base,
    extra,
    pax,
    rate,
    mult,
    per,
    total
  };
}

[
  'baseFare',
  'extraFare',
  'passengers',
  'discount',
  'tripType'
].forEach(id => {
  $(id).addEventListener('input', calculate);
});

$('transport').onchange = () => {
  if (!$('editId').value && $('transport').value) {
    $('baseFare').value =
      settings.rates[$('transport').value] ?? 0;

    calculate();
  }
};

$('fareForm').onsubmit = e => {
  e.preventDefault();

  const c = calculate();

  if (
    !$('travelDate').value ||
    !$('transport').value ||
    !$('origin').value.trim() ||
    !$('destination').value.trim() ||
    c.base < 0 ||
    c.extra < 0 ||
    !Number.isInteger(c.pax) ||
    c.pax < 1 ||
    c.rate < 0 ||
    c.rate > 100
  ) {
    notify('Please check the required fields and values.');
    return;
  }

  const item = {
    id: $('editId').value || String(Date.now()),
    date: $('travelDate').value,
    commuter: $('commuter').value.trim() || 'Guest',
    transport: $('transport').value,
    origin: $('origin').value.trim(),
    destination: $('destination').value.trim(),
    stops: $('stops').value.trim(),
    passengers: c.pax,
    base: c.base,
    extra: c.extra,
    discountKey: $('discount').value,
    discount: c.rate,
    tripType: $('tripType').value,
    total: c.total,
    created: new Date().toISOString()
  };

  const ix = records.findIndex(r => r.id === item.id);

  if (ix >= 0) {
    records[ix] = item;
    notify('Transaction updated.');
  } else {
    records.unshift(item);
    notify('Fare transaction saved.');
  }

  save();
  resetForm();
  openPage('receipts');
  showReceipt(item.id);
};

function resetForm() {
  $('fareForm').reset();
  $('editId').value = '';
  $('travelDate').value = today();
  $('passengers').value = 1;
  $('saveButton').textContent = 'Save transaction';

  calculate();
}

$('clearForm').onclick = () => {
  setTimeout(resetForm, 0);
};


// ==========================================
// DASHBOARD
// ==========================================

const sum = a =>
  a.reduce((s, r) => s + Number(r.total || 0), 0);

function monday(s) {
  const d = new Date(s + 'T12:00:00');

  d.setDate(
    d.getDate() - ((d.getDay() + 6) % 7)
  );

  return d.toISOString().slice(0, 10);
}

function renderDashboard() {
  const t = today();
  const week = monday(t);
  const month = t.slice(0, 7);

  const a = records.filter(r => r.date === t);

  const w = records.filter(
    r => r.date >= week && r.date <= t
  );

  const m = records.filter(
    r => r.date.startsWith(month)
  );

  $('todayTotal').textContent = money(sum(a));
  $('todayTrips').textContent = a.length;
  $('weekTotal').textContent = money(sum(w));
  $('monthTotal').textContent = money(sum(m));

  $('recentRows').innerHTML =
    records.slice(0, 6).map(r => `
      <tr>
        <td>${r.date}</td>
        <td><span class="pill">${esc(r.transport)}</span></td>
        <td>${esc(r.origin)} → ${esc(r.destination)}</td>
        <td>${r.tripType === 'roundtrip' ? 'Round-Trip' : 'One-Way'}</td>
        <td class="fare-cell">${money(r.total)}</td>
      </tr>
    `).join('') ||
    '<tr><td colspan="5" class="empty">No transactions recorded yet.</td></tr>';
}


// ==========================================
// TRANSACTIONS
// ==========================================

function renderTransactions() {
  const q = $('searchBox').value.toLowerCase();
  const d = $('dateFilter').value;
  const t = $('transportFilter').value;

  const a = records.filter(r =>
    (
      !q ||
      [r.commuter, r.origin, r.destination, r.transport]
        .some(v => String(v).toLowerCase().includes(q))
    ) &&
    (!d || r.date === d) &&
    (!t || r.transport === t)
  );

  $('transactionRows').innerHTML =
    a.map(r => `
      <tr>
        <td>${r.date}</td>
        <td>${esc(r.commuter)}</td>
        <td><span class="pill">${esc(r.transport)}</span></td>
        <td>${esc(r.origin)} → ${esc(r.destination)}</td>
        <td>${r.tripType === 'roundtrip' ? 'Round-Trip' : 'One-Way'}</td>
        <td>${r.passengers}</td>
        <td class="fare-cell">${money(r.total)}</td>
        <td>
          <button class="action-btn" data-edit="${esc(r.id)}">Edit</button>
          <button class="action-btn del" data-delete="${esc(r.id)}">Delete</button>
        </td>
      </tr>
    `).join('') ||
    '<tr><td colspan="8" class="empty">No matching transactions.</td></tr>';

  $('recordCount').textContent = a.length + ' record(s)';

  document.querySelectorAll('[data-edit]').forEach(b => {
    b.onclick = () => editRecord(b.dataset.edit);
  });

  document.querySelectorAll('[data-delete]').forEach(b => {
    b.onclick = () => deleteRecord(b.dataset.delete);
  });
}

function editRecord(id) {
  const r = records.find(x => String(x.id) === String(id));

  if (!r) return;

  openPage('calculator');

  $('editId').value = r.id;
  $('commuter').value = r.commuter === 'Guest' ? '' : r.commuter;
  $('travelDate').value = r.date;
  $('transport').value = r.transport;
  $('passengers').value = r.passengers;
  $('origin').value = r.origin;
  $('destination').value = r.destination;
  $('stops').value = r.stops || '';
  $('baseFare').value = r.base;
  $('extraFare').value = r.extra;
  $('discount').value = r.discountKey || 'none';
  $('tripType').value = r.tripType || 'oneway';

  $('saveButton').textContent = 'Update transaction';

  calculate();
}

function deleteRecord(id) {
  if (!confirm('Delete this transaction?')) return;

  records = records.filter(
    r => String(r.id) !== String(id)
  );

  save();
  notify('Transaction deleted.');
}

[
  'searchBox',
  'dateFilter',
  'transportFilter'
].forEach(id => {
  $(id).addEventListener(
    id === 'searchBox' ? 'input' : 'change',
    renderTransactions
  );
});

$('resetFilters').onclick = () => {
  $('searchBox').value = '';
  $('dateFilter').value = '';
  $('transportFilter').value = '';

  renderTransactions();
};


// ==========================================
// CSV EXPORT
// ==========================================

function downloadCsv(rows, name) {
  const csv = rows.map(row =>
    row.map(v =>
      '"' + String(v ?? '').replace(/"/g, '""') + '"'
    ).join(',')
  ).join('\r\n');

  const blob = new Blob(
    ['\ufeff' + csv],
    { type: 'text/csv;charset=utf-8' }
  );

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');

  a.href = url;
  a.download = name;
  a.click();

  URL.revokeObjectURL(url);
}

function csvRows(arr) {
  return [
    [
      'Date',
      'Commuter',
      'Transport',
      'Origin',
      'Destination',
      'Trip Type',
      'Passengers',
      'Base Fare',
      'Additional Fare',
      'Discount %',
      'Total Fare'
    ],
    ...arr.map(r => [
      r.date,
      r.commuter,
      r.transport,
      r.origin,
      r.destination,
      r.tripType === 'roundtrip' ? 'Round-Trip' : 'One-Way',
      r.passengers,
      r.base,
      r.extra,
      r.discount,
      r.total
    ])
  ];
}

$('exportCsv').onclick = () => {
  if (!records.length) {
    notify('No records to export.');
    return;
  }

  downloadCsv(
    csvRows(records),
    'faretrack-transactions.csv'
  );

  notify('CSV exported.');
};


// ==========================================
// RECEIPTS
// ==========================================

function renderReceiptList() {
  $('receiptList').innerHTML =
    records.map(r => `
      <div class="receipt-item">
        <div>
          <b>${esc(r.commuter)}</b><br>
          <span>${r.date} · ${esc(r.transport)} · ${money(r.total)}</span>
        </div>
        <button data-receipt="${esc(r.id)}">Preview</button>
      </div>
    `).join('') ||
    '<p class="empty">No saved transactions yet.</p>';

  document.querySelectorAll('[data-receipt]').forEach(b => {
    b.onclick = () => showReceipt(b.dataset.receipt);
  });
}

function showReceipt(id) {
  const r = records.find(
    x => String(x.id) === String(id)
  );

  if (!r) return;

  openPage('receipts');

  $('receiptPreview').innerHTML = `
    <div class="receipt-head">
      <h2>${esc(settings.name)}</h2>
      <b>FARE RECEIPT</b>
      <p class="receipt-meta">Daily Commuter Fare Record</p>
    </div>

    <p class="receipt-meta">
      Transaction ID: ${esc(r.id)}<br>
      Date: ${r.date}<br>
      Recorded: ${new Date(r.created || Date.now()).toLocaleString()}
    </p>

    <div class="receipt-line">
      <span>Commuter</span>
      <b>${esc(r.commuter)}</b>
    </div>

    <div class="receipt-line">
      <span>Transportation</span>
      <b>${esc(r.transport)}</b>
    </div>

    <div class="receipt-line">
      <span>Route</span>
      <b>${esc(r.origin)} → ${esc(r.destination)}</b>
    </div>

    ${r.stops ? `
      <div class="receipt-line">
        <span>Additional stops</span>
        <b>${esc(r.stops)}</b>
      </div>
    ` : ''}

    <div class="receipt-line">
      <span>Passengers</span>
      <b>${r.passengers}</b>
    </div>

    <div class="receipt-line">
      <span>Base + additional fare</span>
      <b>${money(r.base + r.extra)}</b>
    </div>

    <div class="receipt-line">
      <span>Discount</span>
      <b>${r.discount}%</b>
    </div>

    <div class="receipt-line">
      <span>Trip type</span>
      <b>${r.tripType === 'roundtrip' ? 'Round-Trip (Back and Forth)' : 'One-Way'}</b>
    </div>

    <div class="receipt-line receipt-total">
      <span>TOTAL FARE</span>
      <b>${money(r.total)}</b>
    </div>

    <p class="receipt-meta" style="text-align:center;margin-top:20px">
      Thank you. Keep this receipt for your records.
    </p>

    <button class="primary receipt-print" onclick="window.print()">
      Print / Save as PDF
    </button>
  `;
}


// ==========================================
// REPORTS AND ANALYTICS
// ==========================================

function filteredReport() {
  const from = $('reportFrom').value;
  const to = $('reportTo').value;

  return records.filter(r =>
    (!from || r.date >= from) &&
    (!to || r.date <= to)
  );
}

function renderReports() {
  const arr = filteredReport();
  const total = sum(arr);

  const counts = {};

  arr.forEach(r => {
    counts[r.transport] = (counts[r.transport] || 0) + 1;
  });

  const most = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])[0];

  $('reportTotal').textContent = money(total);
  $('reportTrips').textContent = arr.length;

  $('reportAverage').textContent = money(
    arr.length ? total / arr.length : 0
  );

  $('reportMost').textContent = most ? most[0] : '—';

  const days = {};

  arr.forEach(r => {
    days[r.date] ??= {
      trips: 0,
      one: 0,
      round: 0,
      total: 0
    };

    days[r.date].trips++;

    days[r.date][
      r.tripType === 'roundtrip' ? 'round' : 'one'
    ]++;

    days[r.date].total += Number(r.total);
  });

  const labels = Object.keys(days).sort();

  $('reportRows').innerHTML =
    labels.slice().reverse().map(d => `
      <tr>
        <td>${d}</td>
        <td>${days[d].trips}</td>
        <td>${days[d].one}</td>
        <td>${days[d].round}</td>
        <td class="fare-cell">${money(days[d].total)}</td>
      </tr>
    `).join('') ||
    '<tr><td colspan="5" class="empty">No report data in this date range.</td></tr>';

  if (typeof Chart === 'undefined') return;

  if (expenseChart) expenseChart.destroy();

  expenseChart = new Chart($('expenseChart'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Fare expenses',
        data: labels.map(d => days[d].total),
        backgroundColor: '#6488e8',
        borderRadius: 5
      }]
    },
    options: {
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true }
      },
      responsive: true
    }
  });

  if (transportChart) transportChart.destroy();

  transportChart = new Chart($('transportChart'), {
    type: 'doughnut',
    data: {
      labels: Object.keys(counts),
      datasets: [{
        data: Object.values(counts),
        backgroundColor: [
          '#6488e8',
          '#24ae87',
          '#e7a24e',
          '#9a7be0',
          '#55a9bd',
          '#df7e8b'
        ]
      }]
    },
    options: {
      plugins: {
        legend: { position: 'bottom' }
      },
      responsive: true
    }
  });
}

$('applyReport').onclick = renderReports;

$('printReport').onclick = () => window.print();

$('exportReport').onclick = () => {
  const a = filteredReport();

  if (!a.length) {
    notify('No report data to export.');
    return;
  }

  downloadCsv(csvRows(a), 'faretrack-report.csv');
};


// ==========================================
// SETTINGS
// ==========================================

function loadSettings() {
  $('appName').value = settings.name;
  $('currencySymbol').value = settings.currency;
  $('themeSelect').value = settings.theme;

  $('studentRate').value = settings.discounts.student;
  $('seniorRate').value = settings.discounts.senior;
  $('pwdRate').value = settings.discounts.pwd;

  $('rateInputs').innerHTML =
    Object.entries(settings.rates).map(([k, v]) => `
      <label>
        ${esc(k)} (${esc(settings.currency)})
        <input type="number" min="0" step=".01"
          data-rate="${esc(k)}" value="${v}">
      </label>
    `).join('');
}

function applyBrand() {
  $('appBrand').textContent = settings.name;
  $('footerName').textContent = settings.name;

  document.querySelectorAll(
    '.fare-summary .currency-icon'
  ).forEach(e => {
    e.textContent = settings.currency;
  });
}

$('savePreferences').onclick = () => {
  settings.name =
    $('appName').value.trim() || 'Compute Fare Calculator';

  settings.currency =
    $('currencySymbol').value.trim() || '₱';

  setTheme($('themeSelect').value);

  save();
  applyBrand();

  notify('Preferences saved.');
};

$('saveRates').onclick = () => {
  document.querySelectorAll('[data-rate]').forEach(i => {
    settings.rates[i.dataset.rate] =
      Math.max(0, Number(i.value) || 0);
  });

  save();
  notify('Fare rates saved.');
};

$('saveDiscounts').onclick = () => {
  for (const k of ['student', 'senior', 'pwd']) {
    const v = Number($(k + 'Rate').value);

    if (!Number.isFinite(v) || v < 0 || v > 100) {
      notify('Discount must be between 0 and 100%.');
      return;
    }

    settings.discounts[k] = v;
  }

  save();
  notify('Discount settings saved.');
};


// ==========================================
// BACKUP AND RESTORE
// ==========================================

$('backupData').onclick = () => {
  const blob = new Blob(
    [JSON.stringify({ records, settings }, null, 2)],
    { type: 'application/json' }
  );

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');

  a.href = url;
  a.download = 'faretrack-backup.json';
  a.click();

  URL.revokeObjectURL(url);

  notify('Backup downloaded.');
};

$('restoreData').onchange = async e => {
  const f = e.target.files[0];

  if (!f) return;

  try {
    const d = JSON.parse(await f.text());

    if (
      !Array.isArray(d.records) ||
      !d.settings ||
      !d.settings.rates ||
      !d.settings.discounts
    ) {
      throw Error('Invalid backup');
    }

    if (!confirm('Restore this backup? Current records and settings will be replaced.')) {
      return;
    }

    records = d.records;
    settings = d.settings;

    save();

    setTheme(settings.theme || 'light');
    applyBrand();
    loadSettings();

    notify('Backup restored.');

  } catch (error) {
    console.error(error);
    notify('Invalid backup file.');

  } finally {
    e.target.value = '';
  }
};

$('clearData').onclick = () => {
  if (!confirm('Delete ALL saved transactions? This cannot be undone.')) {
    return;
  }

  records = [];
  save();

  notify('All transactions deleted.');
};


// ==========================================
// RENDER ALL APPLICATION SECTIONS
// ==========================================

function renderAll() {
  renderDashboard();
  renderTransactions();
  renderReceiptList();
  renderReports();
}


// ==========================================
// GOOGLE AUTHENTICATION
// ==========================================

function authMessage(message, isError = false) {
  const el = $('authMessage');

  el.textContent = message;
  el.classList.toggle('error', isError);
}

function showAuthGate(show) {
  $('authGate').classList.toggle('hidden', !show);

  document.body.classList.toggle(
    'auth-locked',
    show
  );
}

function updateAuthPanel() {
  $('authTitle').textContent =
    'Welcome to Compute Fare Calculator';

  $('authDescription').textContent =
    'Continue securely with your Google account to keep your fare records private and synced across devices.';
}

function userDisplayName(user) {
  return (
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email ||
    'Google account'
  );
}


// ==========================================
// LOAD USER DATA FROM SUPABASE
// ==========================================

async function loadUserData(user) {
  if (!user || !supabaseClient) return false;

  const userId = user.id;
  const generation = authGeneration;

  console.log('Loading cloud data for:', userId);

  const { data, error } = await supabaseClient
    .from('faretrack_data')
    .select('records, settings')
    .eq('user_id', userId)
    .maybeSingle();

  // Prevent an old request from replacing another user's data.
  if (
    generation !== authGeneration ||
    currentUser?.id !== userId
  ) {
    return false;
  }

  if (error) {
    console.error('Cloud loading failed:', error);

    notify('Could not load cloud data: ' + error.message);

    return false;
  }

  if (data) {
    records = Array.isArray(data.records)
      ? data.records
      : [];

    settings = {
      ...defaults,
      ...(data.settings || {})
    };

    settings.rates = {
      ...defaults.rates,
      ...(settings.rates || {})
    };

    settings.discounts = {
      ...defaults.discounts,
      ...(settings.discounts || {})
    };

    console.log('Cloud transactions loaded:', records.length);

  } else {
    // First login for this account:
    // Preserve any existing browser records as initial data.
    const localRecords = Array.isArray(records)
      ? records
      : [];

    const localSettings = {
      ...defaults,
      ...settings,
      rates: {
        ...defaults.rates,
        ...(settings.rates || {})
      },
      discounts: {
        ...defaults.discounts,
        ...(settings.discounts || {})
      }
    };

    records = localRecords;
    settings = localSettings;

    const saved = await saveToCloud(
      userId,
      JSON.parse(JSON.stringify(records)),
      JSON.parse(JSON.stringify(settings))
    );

    if (!saved) {
      notify('Account loaded, but initial cloud save failed.');
      return false;
    }

    console.log('Initial account data created.');
  }

  if (
    generation !== authGeneration ||
    currentUser?.id !== userId
  ) {
    return false;
  }

  localStorage.setItem(
    'faretrack_records',
    JSON.stringify(records)
  );

  localStorage.setItem(
    'faretrack_settings',
    JSON.stringify(settings)
  );

  setTheme(settings.theme || 'light');
  applyBrand();
  loadSettings();
  renderAll();
  calculate();

  return true;
}


// ==========================================
// INITIALIZE AUTHENTICATION
// ==========================================

async function initializeAuth() {
  updateAuthPanel();

  if (!supabaseClient) {
    showAuthGate(true);

    authMessage(
      'Setup required: check your Supabase URL and publishable key.',
      true
    );

    $('googleSignIn').disabled = true;
    $('accountButton').disabled = true;

    return;
  }

  // Register listener before checking the existing session.
  // Do not perform Supabase requests directly inside this callback.
  supabaseClient.auth.onAuthStateChange((event, sessionNow) => {
    if (
      event === 'INITIAL_SESSION' ||
      event === 'TOKEN_REFRESHED' ||
      event === 'USER_UPDATED'
    ) {
      return;
    }

    setTimeout(async () => {
      if (event === 'SIGNED_IN' && sessionNow?.user) {
        authGeneration++;

        currentUser = sessionNow.user;

        const loaded = await loadUserData(currentUser);

        if (
          currentUser?.id !== sessionNow.user.id
        ) {
          return;
        }

        if (loaded) {
          showAuthGate(false);

          $('accountEmail').textContent =
            userDisplayName(currentUser);

          $('accountButton').textContent = 'Sign out';
        }

      } else if (event === 'SIGNED_OUT') {
        authGeneration++;

        clearTimeout(cloudSaveTimer);

        currentUser = null;

        records = [];

        settings = {
          ...defaults,
          rates: { ...defaults.rates },
          discounts: { ...defaults.discounts }
        };

        localStorage.removeItem('faretrack_records');
        localStorage.removeItem('faretrack_settings');

        renderAll();
        setTheme('light');
        showAuthGate(true);

        $('accountEmail').textContent = 'Not signed in';
        $('accountButton').textContent = 'Sign in';
      }

    }, 0);
  });

  const {
    data: { session },
    error
  } = await supabaseClient.auth.getSession();

  if (error) {
    console.error('Session error:', error);
    authMessage(error.message, true);
  }

  if (session?.user) {
    authGeneration++;

    currentUser = session.user;

    const loaded = await loadUserData(currentUser);

    if (loaded) {
      showAuthGate(false);

      $('accountEmail').textContent =
        userDisplayName(currentUser);

      $('accountButton').textContent = 'Sign out';
    }

  } else {
    currentUser = null;
    showAuthGate(true);
  }

  authInitialized = true;
}


// ==========================================
// GOOGLE SIGN-IN BUTTON
// ==========================================

$('googleSignIn').onclick = async () => {
  if (!supabaseClient) return;

  const button = $('googleSignIn');

  button.disabled = true;

  authMessage('Connecting to Google...');

  try {
    const redirectTo =
      window.location.origin + window.location.pathname;

    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          prompt: 'select_account'
        }
      }
    });

    if (error) throw error;

  } catch (err) {
    console.error('Google sign-in error:', err);

    authMessage(
      err.message || 'Google sign-in failed. Please try again.',
      true
    );

    button.disabled = false;
  }
};


// ==========================================
// SIGN-OUT WITH CLOUD SAVE
// ==========================================

$('accountButton').onclick = async () => {
  if (!supabaseClient) {
    showAuthGate(true);
    return;
  }

  if (!currentUser) {
    showAuthGate(true);
    return;
  }

  const button = $('accountButton');

  button.disabled = true;

  try {
    clearTimeout(cloudSaveTimer);

    const userId = currentUser.id;

    const recordsSnapshot = JSON.parse(
      JSON.stringify(records)
    );

    const settingsSnapshot = JSON.parse(
      JSON.stringify(settings)
    );

    // Wait for previous saves and save the latest data.
    const saved = await saveToCloud(
      userId,
      recordsSnapshot,
      settingsSnapshot
    );

    if (!saved) {
      notify(
        'Cloud save failed. You have not been signed out. Please try again.'
      );

      return;
    }

    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      console.error('Sign-out error:', error);
      notify(error.message);
    }

  } catch (error) {
    console.error('Sign-out error:', error);
    notify('Unable to sign out: ' + error.message);

  } finally {
    button.disabled = false;
  }
};


// ==========================================
// START APPLICATION
// ==========================================

setTheme(settings.theme || 'light');

applyBrand();

renderAll();

calculate();

initializeAuth();
