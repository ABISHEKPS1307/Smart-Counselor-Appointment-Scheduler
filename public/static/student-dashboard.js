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
    const container = document.getElementById('counselorsList');
    if (!container) {
        console.error('Counselors list container not found');
        return;
    }
    
    container.innerHTML = '<p>Loading counselors...</p>';
    
    try {
        // Add timeout (15 seconds)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const response = await fetch(`${API_BASE}/counselors`, {
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to load counselors');
        }
        
        // Validate response structure
        if (!data || !data.data || !Array.isArray(data.data.counselors)) {
            throw new Error('Invalid response format');
        }

        allCounselors = data.data.counselors || [];
        displayCounselors(allCounselors);
    } catch (error) {
        console.error('Load counselors error:', error);
        
        let errorMsg = 'Failed to load counselors.';
        if (error.name === 'AbortError') {
            errorMsg = 'Loading timeout. Please check your internet connection and try again.';
        } else if (error.message === 'Failed to fetch') {
            errorMsg = 'Network error. Please check your internet connection.';
        } else if (error.message) {
            errorMsg = error.message;
        }
        
        container.innerHTML = `<p style="color: red;">${errorMsg} <button onclick="loadCounselors()" class="btn btn-sm">Retry</button></p>`;
    }
}

// Display counselors
function displayCounselors(counselors) {
    const container = document.getElementById('counselorsList');
    
    if (!container) {
        console.error('Counselors list container not found');
        return;
    }
    
    if (!Array.isArray(counselors)) {
        container.innerHTML = '<p style="color: red;">Error displaying counselors.</p>';
        return;
    }

    if (counselors.length === 0) {
        container.innerHTML = '<p>No counselors found.</p>';
        return;
    }

    container.innerHTML = counselors.map(counselor => {
        // Validate counselor data
        if (!counselor || !counselor.Name || !counselor.Email) {
            console.error('Invalid counselor data:', counselor);
            return '';
        }
        
        return `
            <div class="counselor-card">
                <div class="counselor-photo">${counselor.Name.charAt(0).toUpperCase()}</div>
                <h3>${counselor.Name}</h3>
                <span class="counselor-type">${counselor.CounselorType || 'General'}</span>
                <p class="counselor-bio">${counselor.Bio || 'No bio available'}</p>
                <p style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.5rem;">
                    ${counselor.Email}
                </p>
            </div>
        `;
    }).filter(html => html).join('');
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
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    errorEl.style.display = 'none';
    successEl.style.display = 'none';

    const counselorID = parseInt(document.getElementById('bookingCounselor').value);
    const date = document.getElementById('bookingDate').value;
    const time = document.getElementById('bookingTime').value;

    // Validate
    if (!counselorID || isNaN(counselorID) || counselorID <= 0) {
        errorEl.textContent = 'Please select a counselor';
        errorEl.style.display = 'block';
        return;
    }

    if (!date) {
        errorEl.textContent = 'Please select a date';
        errorEl.style.display = 'block';
        return;
    }
    
    // Validate date is not in the past
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
        errorEl.textContent = 'Cannot book appointments in the past';
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
    
    if (!authToken) {
        errorEl.textContent = 'You are not logged in. Please login again.';
        errorEl.style.display = 'block';
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 2000);
        return;
    }
    
    // Disable button
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Booking...';
    }

    try {
        // Add timeout (15 seconds)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
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
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const data = await response.json();

        if (!response.ok) {
            // Handle specific status codes
            if (response.status === 401) {
                errorEl.textContent = 'Your session has expired. Please login again.';
                errorEl.style.display = 'block';
                setTimeout(() => {
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('currentUser');
                    window.location.href = '/login.html';
                }, 2000);
                return;
            }
            throw new Error(data.error?.message || 'Failed to book appointment');
        }

        successEl.textContent = 'Appointment booked successfully!';
        successEl.style.display = 'block';
        document.getElementById('bookingForm').reset();

        // Switch to appointments tab after 1.5 seconds
        setTimeout(() => {
            const appointmentsTab = document.querySelector('[data-section="appointments"]');
            if (appointmentsTab) {
                appointmentsTab.click();
            }
        }, 1500);
    } catch (error) {
        console.error('Booking error:', error);
        
        // Handle specific error types
        if (error.name === 'AbortError') {
            errorEl.textContent = 'Booking timeout. Please check your internet connection and try again.';
        } else if (error.message === 'Failed to fetch') {
            errorEl.textContent = 'Network error. Please check your internet connection.';
        } else {
            errorEl.textContent = error.message || 'Failed to book appointment';
        }
        
        errorEl.style.display = 'block';
    } finally {
        // Re-enable button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Book Appointment';
        }
    }
});

// Load my appointments
async function loadMyAppointments() {
    const container = document.getElementById('appointmentsList');
    
    if (!container) {
        console.error('Appointments list container not found');
        return;
    }
    
    container.innerHTML = '<div style="text-align: center; padding: 2rem;"><p>Loading appointments...</p></div>';

    try {
        const studentID = currentUser.StudentID || currentUser.studentID;
        
        if (!studentID) {
            throw new Error('Student ID not found. Please logout and login again.');
        }
        
        if (!authToken) {
            throw new Error('You are not logged in. Please login again.');
        }
        
        // Add timeout (15 seconds)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const response = await fetch(`${API_BASE}/appointments/student/${studentID}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const data = await response.json();

        if (!response.ok) {
            // Handle specific status codes
            if (response.status === 401) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUser');
                throw new Error('Your session has expired. Redirecting to login...');
            }
            throw new Error(data.error?.message || 'Failed to load appointments');
        }
        
        // Validate response structure
        if (!data || !data.data || !Array.isArray(data.data.appointments)) {
            throw new Error('Invalid response format');
        }

        displayAppointments(data.data.appointments || []);
    } catch (error) {
        console.error('Load appointments error:', error);
        
        let errorMsg = 'Failed to load appointments.';
        if (error.name === 'AbortError') {
            errorMsg = 'Loading timeout. Please check your internet connection.';
        } else if (error.message === 'Failed to fetch') {
            errorMsg = 'Network error. Please check your internet connection.';
        } else if (error.message) {
            errorMsg = error.message;
        }
        
        container.innerHTML = `<p style="color: red;">${errorMsg} <button onclick="loadMyAppointments()" class="btn btn-sm">Retry</button></p>`;
        
        // Redirect to login if session expired
        if (error.message.includes('session expired')) {
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
        }
    }
}

// Display appointments
function displayAppointments(appointments) {
    const container = document.getElementById('appointmentsList');
    
    if (!container) {
        console.error('Appointments list container not found');
        return;
    }
    
    if (!Array.isArray(appointments)) {
        container.innerHTML = '<p style="color: red;">Error displaying appointments.</p>';
        return;
    }

    if (appointments.length === 0) {
        container.innerHTML = '<p>No appointments found. Book your first appointment!</p>';
        return;
    }

    container.innerHTML = appointments.map(appt => {
        // Validate appointment data
        if (!appt || !appt.Status || !appt.Date || !appt.Time) {
            console.error('Invalid appointment data:', appt);
            return '';
        }
        
        try {
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
        } catch (error) {
            console.error('Error rendering appointment:', error, appt);
            return '';
        }
    }).filter(html => html).join('');
}
