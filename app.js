/**
 * ZumbaConnect Global JavaScript Engine v5
 * - Admin Auth (admin / admin)
 * - Real-time Location Detection & Distance Sorting/Filtering
 * - Persistent Data Storage using localStorage (Attendance, Workouts, Verification, Challenges, Goals)
 */

// --- Default Data Sets ---
const DEFAULT_CLASSES = [
  { id: 1, title: 'Colombo Dance Studio', city: 'Colombo', lat: 6.9271, lng: 79.8612, instructor: 'Nipuni Perera', fee: 1500, time: 'Sat 8:00 AM' },
  { id: 2, title: 'Negombo Beach Zumba', city: 'Negombo', lat: 7.2008, lng: 79.8737, instructor: 'Kasun Silva', fee: 1300, time: 'Sun 9:00 AM' },
  { id: 3, title: 'Kurunegala Active Club', city: 'Kurunegala', lat: 7.4863, lng: 80.3623, instructor: 'Dilani Fernando', fee: 1200, time: 'Tue 6:00 PM' },
  { id: 4, title: 'Kandy Fitness Hub', city: 'Kandy', lat: 7.2906, lng: 80.6337, instructor: 'Rashmi Gunasekara', fee: 1400, time: 'Thu 5:30 PM' },
  { id: 5, title: 'Galle Fort Fitness Zone', city: 'Galle', lat: 6.0535, lng: 80.2210, instructor: 'Sahan Rajapaksha', fee: 1500, time: 'Fri 6:00 PM' },
  { id: 6, title: 'Jaffna Wellness Studio', city: 'Jaffna', lat: 9.6615, lng: 80.0255, instructor: 'Kavitha Nathan', fee: 1100, time: 'Sat 4:00 PM' }
];

// --- Utility: localStorage helper ---
function getStorage(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch(e) {
    return fallback;
  }
}
function setStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch(e) {}
}

// --- Navigation Toggle ---
function toggleMobileMenu() {
  const links = document.getElementById('nav-links');
  if (links) links.classList.toggle('active');
}

// --- Modal Controls ---
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
}

// --- Haversine Distance Formula (in km) ---
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

// --- Real Location Detection & Sorting/Filtering ---
let userCurrentLat = 6.9271; // Default Colombo
let userCurrentLng = 79.8612;

function detectUserLocation() {
  const statusEl = document.getElementById('location-status');
  if (statusEl) {
    statusEl.style.display = 'flex';
    statusEl.className = 'location-status warning';
    statusEl.innerHTML = '🔄 Requesting GPS location permissions...';
  }

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userCurrentLat = pos.coords.latitude;
        userCurrentLng = pos.coords.longitude;
        if (statusEl) {
          statusEl.className = 'location-status success';
          statusEl.innerHTML = `📍 Live location detected (${userCurrentLat.toFixed(2)}° N, ${userCurrentLng.toFixed(2)}° E)! Sorted by nearest locations.`;
        }
        applyLocationFilterAndSort();
      },
      (err) => {
        userCurrentLat = 6.9271;
        userCurrentLng = 79.8612;
        if (statusEl) {
          statusEl.className = 'location-status warning';
          statusEl.innerHTML = '📍 Location access blocked or unsupported. Defaulting center location to Colombo (6.9271° N, 79.8612° E).';
        }
        applyLocationFilterAndSort();
      },
      { timeout: 7000 }
    );
  } else {
    userCurrentLat = 6.9271;
    userCurrentLng = 79.8612;
    if (statusEl) {
      statusEl.className = 'location-status warning';
      statusEl.innerHTML = '📍 Browser does not support geolocation. Defaulting location to Colombo.';
    }
    applyLocationFilterAndSort();
  }
}

function applyLocationFilterAndSort() {
  const container = document.getElementById('class-cards-container');
  if (!container) return;

  const searchInput = document.getElementById('filter-search');
  const radiusSelect = document.getElementById('filter-radius');

  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const radiusVal = radiusSelect ? radiusSelect.value : '15';

  const cards = Array.from(container.getElementsByClassName('class-card'));

  cards.forEach(card => {
    const lat = parseFloat(card.getAttribute('data-lat'));
    const lng = parseFloat(card.getAttribute('data-lng'));
    const dist = calculateDistance(userCurrentLat, userCurrentLng, lat, lng);
    
    card.setAttribute('data-distance', dist);
    const badge = card.querySelector('.dist-badge');
    if (badge) badge.innerText = `${dist} km away`;

    const title = (card.querySelector('h3') ? card.querySelector('h3').innerText : '').toLowerCase();
    const city = (card.querySelector('.card-city') ? card.querySelector('.card-city').innerText : '').toLowerCase();

    let matchesQuery = !query || title.includes(query) || city.includes(query);
    let matchesRadius = true;

    if (radiusVal !== 'all') {
      const maxDist = parseFloat(radiusVal);
      if (dist > maxDist) matchesRadius = false;
    }

    if (matchesQuery && matchesRadius) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });

  // Sort DOM cards by distance ascending
  cards.sort((a, b) => parseFloat(a.getAttribute('data-distance')) - parseFloat(b.getAttribute('data-distance')));
  cards.forEach(card => container.appendChild(card));

  // Update map iframe location
  const mapIframe = document.getElementById('google-map-iframe');
  if (mapIframe) {
    mapIframe.src = `https://maps.google.com/maps?q=${userCurrentLat},${userCurrentLng}&z=11&output=embed`;
  }
}

// --- Admin Authentication (admin / admin) ---
function initAdminAuth() {
  const adminOverlay = document.getElementById('admin-login-modal');
  if (!adminOverlay) return;

  const isLoggedIn = sessionStorage.getItem('zumba_admin_logged') === 'true';
  if (!isLoggedIn) {
    adminOverlay.classList.add('active');
  } else {
    adminOverlay.classList.remove('active');
  }
}

function handleAdminLogin(e) {
  e.preventDefault();
  const user = document.getElementById('admin-user').value.trim();
  const pass = document.getElementById('admin-pass').value.trim();

  if (user === 'admin' && pass === 'admin') {
    sessionStorage.setItem('zumba_admin_logged', 'true');
    closeModal('admin-login-modal');
    alert('Logged in successfully as Administrator!');
    renderAdminVerificationTable();
  } else {
    alert('Invalid credentials! Use Username: admin and Password: admin');
  }
}

function handleAdminLogout() {
  sessionStorage.removeItem('zumba_admin_logged');
  alert('Logged out of Admin Portal.');
  location.reload();
}

// --- Business Verification State (localStorage) ---
function submitBusinessRegistration(e) {
  e.preventDefault();
  const name = document.getElementById('br-name').value;
  const num = document.getElementById('br-num').value;
  const type = document.getElementById('br-type').value;

  let requests = getStorage('zumba_br_requests', [
    { id: 101, instructor: 'Nipuni Perera', type: 'Registered Business', name: 'Zumba Fit Ltd', br: 'BR-98421', status: 'Verified' },
    { id: 102, instructor: 'Kasun Silva', type: 'Individual Instructor', name: 'Kasun Dance Studio', br: 'BR-55120', status: 'Pending' }
  ]);

  const newReq = {
    id: Date.now(),
    instructor: 'Current Instructor',
    type: type,
    name: name,
    br: num,
    status: 'Pending'
  };

  requests.push(newReq);
  setStorage('zumba_br_requests', requests);

  closeModal('modal-business');
  alert('Business Verification submitted successfully! Pending Admin review.');
  renderAdminVerificationTable();
}

function renderAdminVerificationTable() {
  const tbody = document.getElementById('admin-br-table-body');
  if (!tbody) return;

  let requests = getStorage('zumba_br_requests', [
    { id: 101, instructor: 'Nipuni Perera', type: 'Registered Business', name: 'Zumba Fit Ltd', br: 'BR-98421', status: 'Verified' },
    { id: 102, instructor: 'Kasun Silva', type: 'Individual Instructor', name: 'Kasun Dance Studio', br: 'BR-55120', status: 'Pending' }
  ]);

  tbody.innerHTML = '';
  requests.forEach(req => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${req.instructor}</strong></td>
      <td>${req.type} (${req.name})</td>
      <td><code>${req.br}</code></td>
      <td><span class="badge ${req.status === 'Verified' ? 'badge-verified' : req.status === 'Rejected' ? 'badge-pink' : 'badge-gold'}">${req.status}</span></td>
      <td>
        ${req.status === 'Pending' ? `
          <button onclick="updateVerificationStatus(${req.id}, 'Verified')" class="btn btn-success" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">Approve</button>
          <button onclick="updateVerificationStatus(${req.id}, 'Rejected')" class="btn btn-danger" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">Reject</button>
        ` : '<em>Action Completed</em>'}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function updateVerificationStatus(id, status) {
  let requests = getStorage('zumba_br_requests', []);
  requests = requests.map(r => r.id === id ? { ...r, status: status } : r);
  setStorage('zumba_br_requests', requests);
  renderAdminVerificationTable();
  alert(`Verification request #${id} updated to ${status}!`);
}

// --- Attendance State (localStorage) ---
function toggleAttendance(btn) {
  if (btn.classList.contains('btn-success')) {
    btn.className = 'btn btn-outline btn-att';
    btn.innerText = 'Absent';
    btn.setAttribute('data-status', 'absent');
  } else {
    btn.className = 'btn btn-success btn-att';
    btn.innerText = 'Present ✓';
    btn.setAttribute('data-status', 'present');
  }
}

function saveAttendanceRoster() {
  const rows = document.querySelectorAll('.att-row');
  let records = getStorage('zumba_attendance_log', []);

  rows.forEach(row => {
    const name = row.getAttribute('data-name');
    const btn = row.querySelector('.btn-att');
    const status = btn ? btn.getAttribute('data-status') : 'present';

    records.push({
      date: new Date().toISOString().split('T')[0],
      name: name,
      class: 'Colombo Dance Studio',
      status: status
    });
  });

  setStorage('zumba_attendance_log', records);
  alert('Attendance records saved successfully to storage!');
  updateAttendanceStats();
}

function updateAttendanceStats() {
  const records = getStorage('zumba_attendance_log', []);
  const presentCount = records.filter(r => r.status === 'present').length;
  const el = document.getElementById('stat-present-count');
  if (el) el.innerText = 128 + presentCount;
}

// --- Live Workout Timer & Workout Storage ---
let timerInterval = null;
let secondsElapsed = 0;

function startWorkoutTimer() {
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    secondsElapsed++;
    const hrs = String(Math.floor(secondsElapsed / 3600)).padStart(2, '0');
    const mins = String(Math.floor((secondsElapsed % 3600) / 60)).padStart(2, '0');
    const secs = String(secondsElapsed % 60).padStart(2, '0');

    const display = document.getElementById('timer-display');
    if (display) display.innerText = `${hrs}:${mins}:${secs}`;

    const calEl = document.getElementById('timer-calories');
    if (calEl) calEl.innerText = Math.floor(secondsElapsed * 0.14);

    const hrEl = document.getElementById('timer-hr');
    if (hrEl) hrEl.innerText = Math.floor(110 + (secondsElapsed % 25));
  }, 1000);
}

function pauseWorkoutTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function stopWorkoutTimer() {
  pauseWorkoutTimer();
  const mins = Math.max(1, Math.floor(secondsElapsed / 60));
  const cals = Math.floor(secondsElapsed * 0.14);

  let workouts = getStorage('zumba_workouts', [
    { date: '2026-11-23', duration: '45 mins', cals: 320, bpm: 135 },
    { date: '2026-11-20', duration: '60 mins', cals: 450, bpm: 142 }
  ]);

  workouts.unshift({
    date: new Date().toISOString().split('T')[0],
    duration: `${mins} mins`,
    cals: cals,
    bpm: 130
  });

  setStorage('zumba_workouts', workouts);
  openModal('modal-summary');
  renderWorkoutHistory();
}

function renderWorkoutHistory() {
  const tbody = document.getElementById('workout-history-body');
  if (!tbody) return;

  const workouts = getStorage('zumba_workouts', [
    { date: '2026-11-23', duration: '45 mins', cals: 320, bpm: 135 },
    { date: '2026-11-20', duration: '60 mins', cals: 450, bpm: 142 }
  ]);

  tbody.innerHTML = '';
  workouts.forEach(w => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${w.date}</strong></td>
      <td>Zumba Fitness Session</td>
      <td>${w.duration}</td>
      <td><span style="color: var(--accent-pink);">${w.cals} kcal</span></td>
      <td>${w.bpm} bpm</td>
    `;
    tbody.appendChild(tr);
  });
}

// --- Challenges Storage ---
function joinChallenge(id, name) {
  let joined = getStorage('zumba_user_challenges', []);
  if (!joined.includes(id)) {
    joined.push(id);
    setStorage('zumba_user_challenges', joined);
    alert(`Successfully registered for the ${name}!`);
  } else {
    alert(`You are already enrolled in the ${name}.`);
  }
  updateChallengeButtons();
}

function updateChallengeButtons() {
  const joined = getStorage('zumba_user_challenges', []);
  joined.forEach(id => {
    const btn = document.getElementById(`btn-challenge-${id}`);
    if (btn) {
      btn.className = 'btn btn-success btn-block';
      btn.innerText = 'Enrolled ✓';
    }
  });
}

// --- Goals Storage ---
function saveGoals(e) {
  e.preventDefault();
  const weekly = document.getElementById('goal-weekly').value;
  const duration = document.getElementById('goal-duration').value;

  setStorage('zumba_user_goals', { weekly: weekly, duration: duration });
  closeModal('modal-goals');
  alert('Personal fitness goals updated successfully!');

  const label = document.getElementById('display-weekly-goal');
  if (label) label.innerText = `${weekly} Sessions / Week`;
}

// --- On Page Load ---
document.addEventListener('DOMContentLoaded', () => {
  initAdminAuth();
  renderAdminVerificationTable();
  renderWorkoutHistory();
  updateChallengeButtons();

  // If search filter exists, attach real-time input event listeners
  const searchInput = document.getElementById('filter-search');
  const radiusSelect = document.getElementById('filter-radius');
  if (searchInput) searchInput.addEventListener('input', applyLocationFilterAndSort);
  if (radiusSelect) radiusSelect.addEventListener('change', applyLocationFilterAndSort);
});
