const API_BASE = window.location.origin + '/api';
let currentUser = null;
let authToken = null;
let allCounselors = [];

// Check authentication
window.addEventListener('DOMContentLoaded', () => {
    authToken = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('currentUser');

    if (!authToken || !userStr) {
        window.location.href = '/login.html';
        return;
    }

    try {
        currentUser = JSON.parse(userStr);
        if (currentUser.role !== 'student') {
            window.location.href = '/login.html';
            return;
        }

        document.getElementById('userName').textContent = `Hello, ${currentUser.Name || currentUser.Email}`;
        loadCounselors();
        lucide.createIcons();
    } catch (error) {
        console.error('Auth error:', error);
        window.location.href = '/login.html';
    }
});

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const section = btn.dataset.section;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.dashboard-section').forEach(s => s.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`${section}Section`).classList.add('active');

        if (section === 'appointments') {
            loadMyAppointments();
        }
    });
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    window.location.href = '/login.html';
});

// Load counselors
async function loadCounselors() {
    try {
        const response = await fetch(`${API_BASE}/counselors`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error('Failed to load counselors');
        }

        allCounselors = data.data.counselors || [];
        displayCounselors(allCounselors);
    } catch (error) {
        console.error('Load counselors error:', error);
        document.getElementById('counselorsList').innerHTML = '<p style="color: red;">Failed to load counselors.</p>';
    }
}

// Display counselors
function displayCounselors(counselors) {
    const container = document.getElementById('counselorsList');

    if (counselors.length === 0) {
        container.innerHTML = '<p>No counselors found.</p>';
        return;
    }

    container.innerHTML = counselors.map(counselor => `
        <div class="counselor-card">
            <div class="counselor-photo">${counselor.Name.charAt(0).toUpperCase()}</div>
            <h3>${counselor.Name}</h3>
            <span class="counselor-type">${counselor.CounselorType || 'General'}</span>
            <p class="counselor-bio">${counselor.Bio || 'No bio available'}</p>
            <p style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.5rem;">
                ${counselor.Email}
            </p>
        </div>
    `).join('');
}

// Filter counselors
document.getElementById('counselorTypeFilter').addEventListener('change', (e) => {
    const type = e.target.value;
    if (!type) {
        displayCounselors(allCounselors);
    } else {
        const filtered = allCounselors.filter(c => c.CounselorType === type);
        displayCounselors(filtered);
    }
});

// Load counselors by type for booking
document.getElementById('bookingType').addEventListener('change', async (e) => {
    const type = e.target.value;
    const counselorSelect = document.getElementById('bookingCounselor');
    
    counselorSelect.innerHTML = '<option value="">Select Counselor</option>';
    
    if (!type) return;

    const filtered = allCounselors.filter(c => c.CounselorType === type);
    
    if (filtered.length === 0) {
        counselorSelect.innerHTML += '<option value="">No counselors available</option>';
        return;
    }

    filtered.forEach(counselor => {
        const option = document.createElement('option');
        option.value = counselor.CounselorID;
        option.textContent = `${counselor.Name} - ${counselor.Email}`;
        counselorSelect.appendChild(option);
    });
});

// Book appointment
document.getElementById('bookingForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const errorEl = document.getElementById('bookingError');
    const successEl = document.getElementById('bookingSuccess');
    
    errorEl.style.display = 'none';
    successEl.style.display = 'none';

    const counselorID = parseInt(document.getElementById('bookingCounselor').value);
    const date = document.getElementById('bookingDate').value;
    const time = document.getElementById('bookingTime').value;

    // Validate
    if (!counselorID || isNaN(counselorID)) {
        errorEl.textContent = 'Please select a counselor';
        errorEl.style.display = 'block';
        return;
    }

    if (!date) {
        errorEl.textContent = 'Please select a date';
        errorEl.style.display = 'block';
        return;
    }

    if (!time) {
        errorEl.textContent = 'Please select a time';
        errorEl.style.display = 'block';
        return;
    }

    const studentID = currentUser.StudentID || currentUser.studentID;
    if (!studentID) {
        errorEl.textContent = 'Student ID not found. Please logout and login again.';
        errorEl.style.display = 'block';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/appointments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                studentID,
                counselorID,
                date,
                time: time.length === 5 ? time + ':00' : time
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to book appointment');
        }

        successEl.textContent = 'Appointment booked successfully!';
        successEl.style.display = 'block';
        document.getElementById('bookingForm').reset();

        // Switch to appointments tab after 1.5 seconds
        setTimeout(() => {
            document.querySelector('[data-section="appointments"]').click();
        }, 1500);
    } catch (error) {
        console.error('Booking error:', error);
        errorEl.textContent = error.message || 'Failed to book appointment';
        errorEl.style.display = 'block';
    }
});

// Load my appointments
async function loadMyAppointments() {
    const container = document.getElementById('appointmentsList');
    container.innerHTML = '<div style="text-align: center; padding: 2rem;"><p>Loading appointments...</p></div>';

    try {
        const studentID = currentUser.StudentID || currentUser.studentID;
        const response = await fetch(`${API_BASE}/appointments/student/${studentID}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to load appointments');
        }

        displayAppointments(data.data.appointments || []);
    } catch (error) {
        console.error('Load appointments error:', error);
        container.innerHTML = `<p style="color: red;">${error.message}</p>`;
    }
}

// Display appointments
function displayAppointments(appointments) {
    const container = document.getElementById('appointmentsList');

    if (appointments.length === 0) {
        container.innerHTML = '<p>No appointments found. Book your first appointment!</p>';
        return;
    }

    container.innerHTML = appointments.map(appt => {
        const statusClass = `status-${appt.Status.toLowerCase()}`;
        const dateStr = new Date(appt.Date).toLocaleDateString();

        return `
            <div class="appointment-card">
                <div class="appointment-info">
                    <h4>${appt.CounselorName || 'Unknown'}</h4>
                    <div class="appointment-details">
                        <span>📅 ${dateStr}</span>
                        <span>🕐 ${appt.Time}</span>
                        <span>👤 ${appt.CounselorType || 'Counselor'}</span>
                    </div>
                    <div style="margin-top: 0.5rem;">
                        <span class="appointment-status ${statusClass}">${appt.Status}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}
