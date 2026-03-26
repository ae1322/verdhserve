/* ===== VERDASERVE SPA Application ===== */

const API = '';
let currentUser = null;
let currentRole = null;

// ===== API Helpers =====
async function api(path, options = {}) {
    const token = localStorage.getItem('verdaserve_token');
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API}${path}`, { ...options, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
}

// ===== Toast =====
function toast(msg, type = 'success') {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

// ===== Navigation =====
function navigateTo(page, data = {}) {
    window._pageData = data;
    const landing = document.getElementById('landing-page');
    const shell = document.getElementById('app-shell');
    const authContainer = document.getElementById('auth-page-container');

    if (page === 'landing') {
        landing.style.display = 'flex';
        shell.classList.remove('active');
        authContainer.innerHTML = '';
        return;
    }

    if (page.endsWith('-auth')) {
        landing.style.display = 'none';
        shell.classList.remove('active');
        renderAuthPage(page.replace('-auth', ''));
        return;
    }

    // App pages
    landing.style.display = 'none';
    authContainer.innerHTML = '';
    shell.classList.add('active');
    renderPage(page);
}

// ===== Sidebar Setup =====
function setupSidebar(role) {
    const nav = document.getElementById('sidebar-nav');
    const roleLabel = document.getElementById('sidebar-role');
    let items = [];

    if (role === 'user') {
        roleLabel.textContent = 'Customer Panel';
        items = [
            { icon: '🏠', label: 'Dashboard', page: 'user-dashboard' },
            { icon: '📦', label: 'Book Pickup', page: 'book-pickup' },
            { icon: '📍', label: 'My Address', page: 'user-address' },
            { icon: '📋', label: 'My Bookings', page: 'user-bookings' },
            { icon: '🔍', label: 'Track Pickup', page: 'user-tracking' },
        ];
    } else if (role === 'worker') {
        roleLabel.textContent = 'Worker Panel';
        items = [
            { icon: '🏠', label: 'Dashboard', page: 'worker-dashboard' },
            { icon: '🗺️', label: 'Live Map', page: 'worker-tracking' },
            { icon: '🚗', label: 'My Vehicle', page: 'worker-vehicle' },
        ];
    } else if (role === 'admin') {
        roleLabel.textContent = 'Admin Panel';
        items = [
            { icon: '🏠', label: 'Dashboard', page: 'admin-dashboard' },
            { icon: '📦', label: 'All Bookings', page: 'admin-bookings' },
            { icon: '👷', label: 'Workers', page: 'admin-workers' },
        ];
    }

    nav.innerHTML = items.map(i => `
    <button class="nav-item" data-page="${i.page}" onclick="navigateTo('${i.page}')">
      <span class="nav-icon">${i.icon}</span> ${i.label}
    </button>
  `).join('');
}

function setActiveNav(page) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const active = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (active) active.classList.add('active');
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('overlay').classList.toggle('active');
}

// ===== Auth =====
function renderAuthPage(role) {
    const c = document.getElementById('auth-page-container');
    const isWorker = role === 'worker';
    const isAdmin = role === 'admin';
    const showSignup = !isWorker && !isAdmin;

    c.innerHTML = `
    <div class="auth-page">
      <button class="auth-back" onclick="navigateTo('landing')">← Back to Home</button>
      <div class="auth-card">
        <div class="auth-header">
          <div class="brand">🌿 VERDASERVE</div>
          <p>${isAdmin ? 'Admin Login' : isWorker ? 'Worker Login' : 'Customer Portal'}</p>
        </div>
        ${showSignup ? `
          <div class="auth-tabs">
            <button class="auth-tab active" onclick="switchAuthTab('login', '${role}')">Login</button>
            <button class="auth-tab" onclick="switchAuthTab('signup', '${role}')">Sign Up</button>
          </div>
        ` : ''}
        <form id="auth-form" onsubmit="handleAuth(event, '${role}')">
          <div id="signup-fields" class="hidden">
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input class="form-input" type="text" id="auth-name" placeholder="Enter your name">
            </div>
            <div class="form-group">
              <label class="form-label">Phone</label>
              <input class="form-input" type="tel" id="auth-phone" placeholder="Phone number">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input class="form-input" type="email" id="auth-email" placeholder="Enter your email" required>
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input class="form-input" type="password" id="auth-password" placeholder="Enter your password" required>
          </div>
          <button class="btn btn-primary btn-block btn-lg" type="submit" id="auth-submit-btn">Login</button>
        </form>
        ${isAdmin ? `<p class="auth-link" style="font-size:0.75rem;color:#9E9E9E;margin-top:1rem;">Default: admin@verdaserve.com / admin123</p>` : ''}
        ${isWorker ? `<p class="auth-link" style="font-size:0.75rem;color:#9E9E9E;margin-top:1rem;">Demo: ravi@verdaserve.com / worker123</p>` : ''}
      </div>
    </div>
  `;
    window._authMode = 'login';
}

function switchAuthTab(mode, role) {
    window._authMode = mode;
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    const signup = document.getElementById('signup-fields');
    const btn = document.getElementById('auth-submit-btn');
    if (mode === 'signup') {
        signup.classList.remove('hidden');
        btn.textContent = 'Create Account';
    } else {
        signup.classList.add('hidden');
        btn.textContent = 'Login';
    }
}

async function handleAuth(e, role) {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const isSignup = window._authMode === 'signup';

    try {
        let data;
        if (role === 'admin') {
            data = await api('/api/auth/admin-login', { method: 'POST', body: JSON.stringify({ email, password }) });
            currentUser = data.user;
            currentRole = 'admin';
        } else if (role === 'worker') {
            data = await api('/api/auth/worker-login', { method: 'POST', body: JSON.stringify({ email, password }) });
            currentUser = data.worker;
            currentRole = 'worker';
        } else if (isSignup) {
            const name = document.getElementById('auth-name').value;
            const phone = document.getElementById('auth-phone').value;
            if (!name) { toast('Please enter your name', 'error'); return; }
            data = await api('/api/auth/signup', { method: 'POST', body: JSON.stringify({ name, email, password, phone }) });
            currentUser = data.user;
            currentRole = 'user';
        } else {
            data = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
            currentUser = data.user;
            currentRole = 'user';
        }
        localStorage.setItem('verdaserve_token', data.token);
        localStorage.setItem('verdaserve_role', currentRole);
        localStorage.setItem('verdaserve_user', JSON.stringify(currentUser));
        toast(`Welcome, ${currentUser.name}!`);
        setupSidebar(currentRole);
        navigateTo(`${currentRole}-dashboard`);
    } catch (err) {
        toast(err.message, 'error');
    }
}

function logout() {
    localStorage.removeItem('verdaserve_token');
    localStorage.removeItem('verdaserve_role');
    localStorage.removeItem('verdaserve_user');
    currentUser = null;
    currentRole = null;
    navigateTo('landing');
}

// ===== Page Router =====
function renderPage(page) {
    setActiveNav(page);
    const main = document.getElementById('main-content');
    closeSidebarMobile();
    switch (page) {
        case 'user-dashboard': renderUserDashboard(main); break;
        case 'book-pickup': renderBookPickup(main); break;
        case 'user-address': renderUserAddress(main); break;
        case 'user-bookings': renderUserBookings(main); break;
        case 'user-tracking': renderUserTracking(main); break;
        case 'worker-dashboard': renderWorkerDashboard(main); break;
        case 'worker-tracking': renderWorkerTracking(main); break;
        case 'worker-vehicle': renderWorkerVehicle(main); break;
        case 'admin-dashboard': renderAdminDashboard(main); break;
        case 'admin-bookings': renderAdminBookings(main); break;
        case 'admin-workers': renderAdminWorkers(main); break;
        default: main.innerHTML = '<p>Page not found</p>';
    }
}

function closeSidebarMobile() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('overlay').classList.remove('active');
}

// ===== USER PAGES =====

// Dashboard
async function renderUserDashboard(el) {
    el.innerHTML = `
    <div class="page-header">
      <h1>Welcome back, ${currentUser?.name || 'User'} 👋</h1>
      <p>Manage your waste paper pickups and contribute to a greener planet.</p>
    </div>
    <div class="stats-grid" id="user-stats"></div>
    <div style="margin-bottom:2rem;">
      <button class="btn btn-primary btn-lg" onclick="navigateTo('book-pickup')">📦 Book a Pickup</button>
    </div>
    <h2 style="font-size:1.2rem;font-weight:600;margin-bottom:1rem;">Recent Bookings</h2>
    <div class="booking-list" id="user-recent-bookings"><div class="spinner"></div></div>
  `;
    try {
        const { bookings } = await api('/api/bookings/my');
        const stats = document.getElementById('user-stats');
        const total = bookings.length;
        const pending = bookings.filter(b => b.status === 'pending').length;
        const completed = bookings.filter(b => b.status === 'completed').length;
        const totalKg = bookings.reduce((s, b) => s + b.paper_qty, 0);

        stats.innerHTML = `
      <div class="stat-card"><div class="stat-icon green">📦</div><div class="stat-value">${total}</div><div class="stat-label">Total Bookings</div></div>
      <div class="stat-card"><div class="stat-icon orange">⏳</div><div class="stat-value">${pending}</div><div class="stat-label">Pending</div></div>
      <div class="stat-card"><div class="stat-icon blue">✅</div><div class="stat-value">${completed}</div><div class="stat-label">Completed</div></div>
      <div class="stat-card"><div class="stat-icon green">♻️</div><div class="stat-value">${totalKg} kg</div><div class="stat-label">Paper Recycled</div></div>
    `;

        const list = document.getElementById('user-recent-bookings');
        if (bookings.length === 0) {
            list.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><h3>No bookings yet</h3><p>Schedule your first paper pickup today!</p></div>`;
        } else {
            list.innerHTML = bookings.slice(0, 5).map(b => bookingCard(b)).join('');
        }
    } catch (err) { toast(err.message, 'error'); }
}

function bookingCard(b) {
    const statusClass = `badge-${b.status}`;
    const statusText = b.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return `
    <div class="booking-card">
      <div class="booking-info">
        <h4>${b.paper_type.charAt(0).toUpperCase() + b.paper_type.slice(1)} — ${b.paper_qty} kg</h4>
        <div class="booking-meta">
          <span>📅 ${b.preferred_date}</span>
          <span>🕐 ${b.preferred_time}</span>
          <span>📍 ${b.address.substring(0, 30)}...</span>
          ${b.worker_name ? `<span>👷 ${b.worker_name}</span>` : ''}
        </div>
      </div>
      <div style="text-align:right;">
        <span class="badge ${statusClass}">${statusText}</span>
        ${b.status !== 'completed' ? `<br><button class="btn btn-secondary btn-sm" style="margin-top:0.5rem;" onclick="navigateTo('user-tracking', {bookingId: ${b.id}})">Track</button>` : ''}
      </div>
    </div>
  `;
}

// Book Pickup
function renderBookPickup(el) {
    const user = JSON.parse(localStorage.getItem('verdaserve_user') || '{}');
    el.innerHTML = `
    <div class="page-header">
      <h1>📦 Book Paper Pickup</h1>
      <p>Schedule a convenient time for us to collect your waste paper.</p>
    </div>
    <div class="card" style="max-width:600px;">
      <form onsubmit="submitBooking(event)">
        <div class="form-group">
          <label class="form-label">Paper Quantity (kg)</label>
          <input class="form-input" type="number" id="bp-qty" min="1" max="1000" step="0.5" placeholder="e.g. 10" required>
          <input type="range" id="bp-qty-slider" min="1" max="100" value="10" style="width:100%;margin-top:0.5rem;accent-color:var(--green-600);"
            oninput="document.getElementById('bp-qty').value=this.value">
        </div>
        <div class="form-group">
          <label class="form-label">Paper Type</label>
          <select class="form-select" id="bp-type" required>
            <option value="">Select paper type</option>
            <option value="newspaper">📰 Newspaper</option>
            <option value="books">📚 Books</option>
            <option value="mixed">📄 Mixed Paper</option>
            <option value="cardboard">📦 Cardboard</option>
            <option value="office">🏢 Office Paper</option>
          </select>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
          <div class="form-group">
            <label class="form-label">Preferred Date</label>
            <input class="form-input" type="date" id="bp-date" required>
          </div>
          <div class="form-group">
            <label class="form-label">Preferred Time</label>
            <input class="form-input" type="time" id="bp-time" required>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Pickup Address</label>
          <textarea class="form-input" id="bp-address" rows="3" placeholder="Enter your full pickup address" required>${user.address || ''}</textarea>
        </div>
        <button class="btn btn-primary btn-block btn-lg" type="submit">🌱 Schedule Pickup</button>
      </form>
    </div>
  `;
    // Set min date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('bp-date').setAttribute('min', today);
}

async function submitBooking(e) {
    e.preventDefault();
    const booking = {
        paper_qty: parseFloat(document.getElementById('bp-qty').value),
        paper_type: document.getElementById('bp-type').value,
        preferred_date: document.getElementById('bp-date').value,
        preferred_time: document.getElementById('bp-time').value,
        address: document.getElementById('bp-address').value,
    };
    try {
        await api('/api/bookings', { method: 'POST', body: JSON.stringify(booking) });
        toast('Pickup scheduled successfully! 🌱');
        navigateTo('user-dashboard');
    } catch (err) { toast(err.message, 'error'); }
}

// User Address
function renderUserAddress(el) {
    const user = JSON.parse(localStorage.getItem('verdaserve_user') || '{}');
    el.innerHTML = `
    <div class="page-header">
      <h1>📍 My Address</h1>
      <p>Manage your pickup address and location.</p>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;" class="address-grid">
      <div class="card">
        <h3 style="font-weight:600;margin-bottom:1rem;">Address Details</h3>
        <form onsubmit="saveAddress(event)">
          <div class="form-group">
            <label class="form-label">Full Address</label>
            <textarea class="form-input" id="addr-text" rows="4" placeholder="Enter your complete address">${user.address || ''}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Phone</label>
            <input class="form-input" type="tel" id="addr-phone" value="${user.phone || ''}" placeholder="Your phone number">
          </div>
          <p style="font-size:0.8rem;color:var(--grey-500);margin-bottom:1rem;">💡 Click on the map to set your location pin</p>
          <button class="btn btn-primary btn-block" type="submit">💾 Save Address</button>
        </form>
      </div>
      <div class="card">
        <h3 style="font-weight:600;margin-bottom:1rem;">📍 Location</h3>
        <div class="map-container" id="address-map"></div>
      </div>
    </div>
  `;
    setTimeout(() => initAddressMap(user.lat || 28.6139, user.lng || 77.2090), 200);
}

let addressMap, addressMarker;
function initAddressMap(lat, lng) {
    const container = document.getElementById('address-map');
    if (!container) return;
    addressMap = L.map(container).setView([lat, lng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(addressMap);
    addressMarker = L.marker([lat, lng], { draggable: true }).addTo(addressMap);
    addressMap.on('click', (e) => {
        addressMarker.setLatLng(e.latlng);
    });
}

async function saveAddress(e) {
    e.preventDefault();
    const latlng = addressMarker.getLatLng();
    try {
        const data = await api('/api/auth/profile', {
            method: 'PUT',
            body: JSON.stringify({
                address: document.getElementById('addr-text').value,
                phone: document.getElementById('addr-phone').value,
                lat: latlng.lat,
                lng: latlng.lng
            })
        });
        localStorage.setItem('verdaserve_user', JSON.stringify(data.user));
        currentUser = data.user;
        toast('Address saved! 📍');
    } catch (err) { toast(err.message, 'error'); }
}

// User Bookings
async function renderUserBookings(el) {
    el.innerHTML = `
    <div class="page-header">
      <h1>📋 My Bookings</h1>
      <p>View all your paper pickup bookings.</p>
    </div>
    <div class="booking-list" id="all-user-bookings"><div class="spinner"></div></div>
  `;
    try {
        const { bookings } = await api('/api/bookings/my');
        const list = document.getElementById('all-user-bookings');
        if (bookings.length === 0) {
            list.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><h3>No bookings yet</h3><p>Schedule your first pickup!</p></div>`;
        } else {
            list.innerHTML = bookings.map(b => bookingCard(b)).join('');
        }
    } catch (err) { toast(err.message, 'error'); }
}

// User Tracking
async function renderUserTracking(el) {
    const data = window._pageData || {};
    el.innerHTML = `
    <div class="page-header">
      <h1>🔍 Track Pickup</h1>
      <p>Follow the real-time status of your pickup.</p>
    </div>
    <div id="tracking-content"><div class="spinner"></div></div>
  `;

    try {
        const { bookings } = await api('/api/bookings/my');
        const tc = document.getElementById('tracking-content');

        if (data.bookingId) {
            const { booking } = await api(`/api/bookings/${data.bookingId}`);
            tc.innerHTML = renderTrackingDetail(booking);
            setTimeout(() => initTrackingMap(booking), 200);
        } else {
            // Show latest active bookings
            const active = bookings.filter(b => b.status !== 'completed');
            if (active.length === 0) {
                tc.innerHTML = `<div class="empty-state"><div class="empty-icon">✅</div><h3>No active pickups</h3><p>All your pickups are completed!</p></div>`;
            } else {
                tc.innerHTML = `
          <p style="margin-bottom:1rem;color:var(--grey-500);">Select a booking to track:</p>
          <div class="booking-list">${active.map(b => bookingCard(b)).join('')}</div>
        `;
            }
        }
    } catch (err) { toast(err.message, 'error'); }
}

function renderTrackingDetail(b) {
    const steps = ['pending', 'assigned', 'on_the_way', 'completed'];
    const icons = ['📝', '👷', '🚚', '✅'];
    const labels = ['Pending', 'Assigned', 'On the Way', 'Completed'];
    const currentIdx = steps.indexOf(b.status === 'accepted' ? 'assigned' : b.status);
    const fillPercent = currentIdx >= 0 ? (currentIdx / (steps.length - 1)) * 100 : 0;

    return `
    <div class="card" style="margin-bottom:1.5rem;">
      <h3 style="font-weight:600;margin-bottom:0.5rem;">Booking #${b.id}</h3>
      <p style="color:var(--grey-500);font-size:0.85rem;">${b.paper_type} — ${b.paper_qty} kg</p>
      <div class="progress-tracker">
        <div class="progress-fill" style="width:${fillPercent}%"></div>
        ${steps.map((s, i) => `
          <div class="progress-step ${i < currentIdx ? 'completed' : i === currentIdx ? 'active' : ''}">
            <div class="step-circle">${icons[i]}</div>
            <div class="step-label">${labels[i]}</div>
          </div>
        `).join('')}
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;" class="address-grid">
      <div class="card">
        <h3 style="font-weight:600;margin-bottom:1rem;">📦 Pickup Details</h3>
        <div style="font-size:0.9rem;color:var(--grey-700);line-height:2;">
          <p><strong>Date:</strong> ${b.preferred_date}</p>
          <p><strong>Time:</strong> ${b.preferred_time}</p>
          <p><strong>Address:</strong> ${b.address}</p>
          <p><strong>Status:</strong> <span class="badge badge-${b.status}">${b.status.replace(/_/g, ' ')}</span></p>
          ${b.worker_name ? `<p><strong>Worker:</strong> ${b.worker_name}</p>` : '<p style="color:var(--orange-500);">Worker not yet assigned</p>'}
          ${b.worker_phone ? `<p><strong>Worker Phone:</strong> ${b.worker_phone}</p>` : ''}
        </div>
      </div>
      <div class="card">
        <h3 style="font-weight:600;margin-bottom:1rem;">🗺️ Location</h3>
        <div class="map-container" id="tracking-map"></div>
      </div>
    </div>
  `;
}

function initTrackingMap(b) {
    const container = document.getElementById('tracking-map');
    if (!container) return;
    const lat = b.lat || 28.6139;
    const lng = b.lng || 77.2090;
    const map = L.map(container).setView([lat, lng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);
    L.marker([lat, lng]).addTo(map).bindPopup('📍 Pickup Location').openPopup();
}

// ===== WORKER PAGES =====

async function renderWorkerDashboard(el) {
    el.innerHTML = `
    <div class="page-header">
      <h1>Welcome, ${currentUser?.name || 'Worker'} 🚚</h1>
      <p>Manage your assigned paper pickups.</p>
    </div>
    <div class="stats-grid" id="worker-stats"></div>
    <h2 style="font-size:1.2rem;font-weight:600;margin-bottom:1rem;">Assigned Pickups</h2>
    <div class="booking-list" id="worker-pickups"><div class="spinner"></div></div>
  `;
    try {
        const { bookings } = await api('/api/workers/my-pickups');
        const stats = document.getElementById('worker-stats');
        const total = bookings.length;
        const active = bookings.filter(b => !['completed', 'pending'].includes(b.status)).length;
        const completed = bookings.filter(b => b.status === 'completed').length;

        stats.innerHTML = `
      <div class="stat-card"><div class="stat-icon green">📦</div><div class="stat-value">${total}</div><div class="stat-label">Total Assigned</div></div>
      <div class="stat-card"><div class="stat-icon orange">🔄</div><div class="stat-value">${active}</div><div class="stat-label">In Progress</div></div>
      <div class="stat-card"><div class="stat-icon blue">✅</div><div class="stat-value">${completed}</div><div class="stat-label">Completed</div></div>
    `;

        const list = document.getElementById('worker-pickups');
        if (bookings.length === 0) {
            list.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><h3>No pickups assigned</h3><p>New pickups will appear here when assigned.</p></div>`;
        } else {
            list.innerHTML = bookings.map(b => workerBookingCard(b)).join('');
        }
    } catch (err) { toast(err.message, 'error'); }
}

function workerBookingCard(b) {
    const statusClass = `badge-${b.status}`;
    const statusText = b.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    let actionBtns = '';
    if (b.status === 'assigned') {
        actionBtns = `<button class="btn btn-success btn-sm" onclick="updateBookingStatus(${b.id}, 'accepted')">✅ Accept</button>`;
    } else if (b.status === 'accepted') {
        actionBtns = `<button class="btn btn-warning btn-sm" onclick="updateBookingStatus(${b.id}, 'on_the_way')">🚚 On the Way</button>`;
    } else if (b.status === 'on_the_way') {
        actionBtns = `<button class="btn btn-primary btn-sm" onclick="updateBookingStatus(${b.id}, 'completed')">✅ Complete</button>`;
    }

    return `
    <div class="booking-card">
      <div class="booking-info">
        <h4>${b.user_name || 'Customer'} — ${b.paper_qty} kg ${b.paper_type}</h4>
        <div class="booking-meta">
          <span>📅 ${b.preferred_date}</span>
          <span>🕐 ${b.preferred_time}</span>
          <span>📍 ${b.address.substring(0, 40)}...</span>
          <span>📞 ${b.user_phone || 'N/A'}</span>
        </div>
      </div>
      <div style="text-align:right;display:flex;flex-direction:column;gap:0.5rem;align-items:flex-end;">
        <span class="badge ${statusClass}">${statusText}</span>
        ${actionBtns}
        <button class="btn btn-secondary btn-sm" onclick="navigateTo('worker-tracking', {bookingId: ${b.id}})">🗺️ Map</button>
      </div>
    </div>
  `;
}

async function updateBookingStatus(id, status) {
    try {
        await api(`/api/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
        toast(`Status updated to ${status.replace(/_/g, ' ')}! ✅`);
        renderPage('worker-dashboard');
    } catch (err) { toast(err.message, 'error'); }
}

// Worker Live Tracking
async function renderWorkerTracking(el) {
    const data = window._pageData || {};
    el.innerHTML = `
    <div class="page-header">
      <h1>🗺️ Live Tracking</h1>
      <p>Navigate to your pickup locations.</p>
    </div>
    <div class="card">
      <div class="map-container" id="worker-map" style="height:500px;"></div>
    </div>
  `;
    setTimeout(async () => {
        const container = document.getElementById('worker-map');
        if (!container) return;
        const map = L.map(container).setView([28.6139, 77.2090], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(map);

        try {
            const { bookings } = await api('/api/workers/my-pickups');
            const active = bookings.filter(b => b.status !== 'completed');

            if (data.bookingId) {
                const b = bookings.find(b2 => b2.id === data.bookingId);
                if (b && b.lat && b.lng) {
                    map.setView([b.lat, b.lng], 14);
                    L.marker([b.lat, b.lng]).addTo(map).bindPopup(`📦 ${b.user_name}<br>${b.address}<br>${b.paper_qty} kg`).openPopup();
                }
            }

            active.forEach(b => {
                if (b.lat && b.lng) {
                    L.marker([b.lat, b.lng]).addTo(map).bindPopup(`📦 ${b.user_name || 'Customer'}<br>${b.address}<br>${b.paper_qty} kg`);
                }
            });

            // Simulated worker location
            const workerIcon = L.divIcon({ className: '', html: '<div style="font-size:2rem;">🚚</div>', iconSize: [32, 32] });
            L.marker([28.62, 77.21], { icon: workerIcon }).addTo(map).bindPopup('You are here');
        } catch (err) { toast(err.message, 'error'); }
    }, 300);
}

// Worker Vehicle
function renderWorkerVehicle(el) {
    const vehicles = [
        { type: 'bike', icon: '🏍️', name: 'Bike', cap: 'Up to 10 kg' },
        { type: 'auto', icon: '🛺', name: 'Auto', cap: 'Up to 50 kg' },
        { type: 'van', icon: '🚐', name: 'Van', cap: 'Up to 200 kg' },
        { type: 'truck', icon: '🚛', name: 'Truck', cap: '200+ kg' },
    ];
    const current = currentUser?.vehicle_type || 'bike';

    el.innerHTML = `
    <div class="page-header">
      <h1>🚗 Vehicle Selection</h1>
      <p>Choose your vehicle based on the load size.</p>
    </div>
    <div class="card" style="max-width:700px;">
      <h3 style="font-weight:600;margin-bottom:1.5rem;">Select Your Vehicle</h3>
      <div class="vehicle-grid">
        ${vehicles.map(v => `
          <div class="vehicle-card ${v.type === current ? 'selected' : ''}" onclick="selectVehicle('${v.type}', this)">
            <div class="vehicle-icon">${v.icon}</div>
            <div class="vehicle-name">${v.name}</div>
            <div class="vehicle-cap">${v.cap}</div>
          </div>
        `).join('')}
      </div>
      <button class="btn btn-primary btn-block" style="margin-top:1.5rem;" onclick="saveVehicle()">💾 Save Vehicle</button>
    </div>
  `;
    window._selectedVehicle = current;
}

function selectVehicle(type, card) {
    document.querySelectorAll('.vehicle-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    window._selectedVehicle = type;
}

async function saveVehicle() {
    try {
        await api('/api/workers/vehicle', { method: 'PATCH', body: JSON.stringify({ vehicle_type: window._selectedVehicle }) });
        currentUser.vehicle_type = window._selectedVehicle;
        localStorage.setItem('verdaserve_user', JSON.stringify(currentUser));
        toast('Vehicle updated! 🚗');
    } catch (err) { toast(err.message, 'error'); }
}

// ===== ADMIN PAGES =====

async function renderAdminDashboard(el) {
    el.innerHTML = `
    <div class="page-header">
      <h1>⚙️ Admin Dashboard</h1>
      <p>Overview of all operations.</p>
    </div>
    <div class="stats-grid" id="admin-stats"><div class="spinner"></div></div>
    <h2 style="font-size:1.2rem;font-weight:600;margin-bottom:1rem;">Recent Bookings</h2>
    <div id="admin-recent"><div class="spinner"></div></div>
  `;
    try {
        const stats = await api('/api/admin/stats');
        document.getElementById('admin-stats').innerHTML = `
      <div class="stat-card"><div class="stat-icon green">📦</div><div class="stat-value">${stats.total}</div><div class="stat-label">Total Bookings</div></div>
      <div class="stat-card"><div class="stat-icon orange">⏳</div><div class="stat-value">${stats.pending}</div><div class="stat-label">Pending</div></div>
      <div class="stat-card"><div class="stat-icon blue">🔄</div><div class="stat-value">${stats.assigned}</div><div class="stat-label">In Progress</div></div>
      <div class="stat-card"><div class="stat-icon green">✅</div><div class="stat-value">${stats.completed}</div><div class="stat-label">Completed</div></div>
      <div class="stat-card"><div class="stat-icon green">👤</div><div class="stat-value">${stats.totalUsers}</div><div class="stat-label">Users</div></div>
      <div class="stat-card"><div class="stat-icon blue">👷</div><div class="stat-value">${stats.totalWorkers}</div><div class="stat-label">Workers</div></div>
      <div class="stat-card"><div class="stat-icon green">♻️</div><div class="stat-value">${stats.totalPaper} kg</div><div class="stat-label">Paper Collected</div></div>
    `;
        const { bookings } = await api('/api/bookings');
        const rc = document.getElementById('admin-recent');
        if (bookings.length === 0) {
            rc.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><h3>No bookings</h3></div>`;
        } else {
            rc.innerHTML = `<div class="table-container"><table class="table">
        <thead><tr><th>ID</th><th>Customer</th><th>Paper</th><th>Qty</th><th>Date</th><th>Status</th><th>Worker</th></tr></thead>
        <tbody>${bookings.slice(0, 10).map(b => `
          <tr>
            <td>#${b.id}</td>
            <td>${b.user_name || 'N/A'}</td>
            <td>${b.paper_type}</td>
            <td>${b.paper_qty} kg</td>
            <td>${b.preferred_date}</td>
            <td><span class="badge badge-${b.status}">${b.status.replace(/_/g, ' ')}</span></td>
            <td>${b.worker_name || '<em style="color:var(--grey-400)">Unassigned</em>'}</td>
          </tr>
        `).join('')}</tbody>
      </table></div>`;
        }
    } catch (err) { toast(err.message, 'error'); }
}

// Admin All Bookings
async function renderAdminBookings(el) {
    el.innerHTML = `
    <div class="page-header">
      <h1>📦 All Bookings</h1>
      <p>Manage and assign workers to bookings.</p>
    </div>
    <div id="admin-bookings-list"><div class="spinner"></div></div>
  `;
    try {
        const { bookings } = await api('/api/bookings');
        const { workers } = await api('/api/workers');
        const c = document.getElementById('admin-bookings-list');

        if (bookings.length === 0) {
            c.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><h3>No bookings</h3></div>`;
            return;
        }

        c.innerHTML = `<div class="table-container"><table class="table">
      <thead><tr><th>ID</th><th>Customer</th><th>Paper</th><th>Qty</th><th>Date</th><th>Address</th><th>Status</th><th>Assign Worker</th></tr></thead>
      <tbody>${bookings.map(b => `
        <tr>
          <td>#${b.id}</td>
          <td>${b.user_name || 'N/A'}<br><span style="font-size:0.75rem;color:var(--grey-400);">${b.user_email || ''}</span></td>
          <td>${b.paper_type}</td>
          <td>${b.paper_qty} kg</td>
          <td>${b.preferred_date}<br><span style="font-size:0.75rem;">${b.preferred_time}</span></td>
          <td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;">${b.address}</td>
          <td><span class="badge badge-${b.status}">${b.status.replace(/_/g, ' ')}</span></td>
          <td>
            ${b.status === 'pending' ? `
              <select class="form-select" style="width:auto;padding:0.4rem;font-size:0.8rem;" onchange="assignWorker(${b.id}, this.value)">
                <option value="">Select...</option>
                ${workers.map(w => `<option value="${w.id}" ${b.worker_id === w.id ? 'selected' : ''}>${w.name} (${w.vehicle_type})</option>`).join('')}
              </select>
            ` : `${b.worker_name || 'N/A'}`}
          </td>
        </tr>
      `).join('')}</tbody>
    </table></div>`;
    } catch (err) { toast(err.message, 'error'); }
}

async function assignWorker(bookingId, workerId) {
    if (!workerId) return;
    try {
        await api(`/api/bookings/${bookingId}/assign`, { method: 'PATCH', body: JSON.stringify({ worker_id: parseInt(workerId) }) });
        toast('Worker assigned! 👷');
        renderPage('admin-bookings');
    } catch (err) { toast(err.message, 'error'); }
}

// Admin Workers
async function renderAdminWorkers(el) {
    el.innerHTML = `
    <div class="page-header">
      <h1>👷 Workers</h1>
      <p>View all registered workers.</p>
    </div>
    <div id="admin-workers-list"><div class="spinner"></div></div>
  `;
    try {
        const { workers } = await api('/api/workers');
        document.getElementById('admin-workers-list').innerHTML = `
      <div class="table-container"><table class="table">
        <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Vehicle</th><th>Status</th></tr></thead>
        <tbody>${workers.map(w => `
          <tr>
            <td>#${w.id}</td>
            <td>${w.name}</td>
            <td>${w.email}</td>
            <td>${w.phone || 'N/A'}</td>
            <td>${w.vehicle_type}</td>
            <td><span class="badge ${w.is_available ? 'badge-completed' : 'badge-pending'}">${w.is_available ? 'Available' : 'Busy'}</span></td>
          </tr>
        `).join('')}</tbody>
      </table></div>
    `;
    } catch (err) { toast(err.message, 'error'); }
}

// ===== Auto-login on page load =====
(function init() {
    const token = localStorage.getItem('verdaserve_token');
    const role = localStorage.getItem('verdaserve_role');
    const user = localStorage.getItem('verdaserve_user');
    if (token && role && user) {
        currentUser = JSON.parse(user);
        currentRole = role;
        setupSidebar(role);
        navigateTo(`${role}-dashboard`);
    }
})();
