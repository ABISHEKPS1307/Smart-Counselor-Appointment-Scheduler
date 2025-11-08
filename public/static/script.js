/**
 * Smart Counselor Appointment Scheduler - Frontend JavaScript
 * Plain JavaScript (no frameworks) with JWT authentication
 */

// =============================================================================
// Global State Management
// =============================================================================

let currentUser = null;
let authToken = null;
let allCounselors = [];

// API Base URL (adjust for production)
const API_BASE = window.location.origin + '/api';

// =============================================================================
// Authentication & Token Management
// =============================================================================

/**
 * Check if user is authenticated on page load
 */
function initAuth() {
    try {
        const token = localStorage.getItem('authToken');
        const user = localStorage.getItem('currentUser');

        if (token && user) {
            authToken = token;
            currentUser = JSON.parse(user);
            
            // Validate user object has required properties
            if (!currentUser || !currentUser.Email) {
                console.error('Invalid user data in localStorage');
                logout();
                return;
            }
            
            updateUIForAuthenticatedUser();
        }
    } catch (error) {
        console.error('Failed to initialize auth:', error);
        // Clear corrupted data
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
    }
}

/**
 * Update UI when user is logged in
 */
function updateUIForAuthenticatedUser() {
    document.getElementById('loginBtn').style.display = 'none';
    document.getElementById('registerBtn').style.display = 'none';
    document.getElementById('userMenu').style.display = 'flex';
    document.getElementById('userName').textContent = `Hello, ${currentUser.Name}`;

    // Add appointments link for authenticated users
    if (!document.getElementById('appointmentsLink')) {
        const nav = document.getElementById('mainNav');
        const appointmentsBtn = document.createElement('button');
        appointmentsBtn.id = 'appointmentsLink';
        appointmentsBtn.className = 'btn btn-secondary';
        appointmentsBtn.textContent = 'My Appointments';
        appointmentsBtn.onclick = () => {
            showSection('appointmentsSection');
            loadMyAppointments();
        };
        nav.insertBefore(appointmentsBtn, document.getElementById('userMenu'));
    }
}

/**
 * Logout user
 */
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    authToken = null;
    currentUser = null;

    // Reset UI
    document.getElementById('loginBtn').style.display = 'inline-block';
    document.getElementById('registerBtn').style.display = 'inline-block';
    document.getElementById('userMenu').style.display = 'none';

    const appointmentsLink = document.getElementById('appointmentsLink');
    if (appointmentsLink) {
        appointmentsLink.remove();
    }

    showSection('welcomeSection');
}

/**
 * Make authenticated API request
 */
async function authenticatedFetch(url, options = {}) {
    if (!authToken) {
        throw new Error('No authentication token');
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        ...options.headers
    };

    const response = await fetch(url, { ...options, headers });

    // Handle token expiry
    if (response.status === 401 || response.status === 403) {
        logout();
        showError('Session expired. Please login again.');
        showSection('loginSection');
        throw new Error('Authentication failed');
    }

    return response;
}

// =============================================================================
// Section Navigation
// =============================================================================

function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.style.display = 'none';
    });

    // Show selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
    }

    // Load data for specific sections
    if (sectionId === 'counselorsSection') {
        loadCounselors();
    }
}

// =============================================================================
// Login & Registration
// =============================================================================

document.getElementById('loginBtn').addEventListener('click', () => {
    showSection('loginSection');
});

document.getElementById('registerBtn').addEventListener('click', () => {
    showSection('registerSection');
});

document.getElementById('logoutBtn').addEventListener('click', logout);

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const userType = document.getElementById('loginUserType').value;
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const endpoint = userType === 'student' ? '/students/login' : '/counselors/login';

    console.log('Login request:', { endpoint, email, passwordLength: password.length });

    // Show loading message
    showError('Logging in... Please wait.', 'loginError');

    try {
        // Add timeout to fetch request (60 seconds for slow connections)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Check if response has content before parsing
        const contentType = response.headers.get('content-type');
        let data = null;
        
        if (contentType && contentType.includes('application/json')) {
            try {
                data = await response.json();
            } catch (jsonError) {
                console.error('JSON parse error:', jsonError);
                throw new Error('Invalid response from server');
            }
        }

        console.log('Login response:', { status: response.status, data });

        if (!response.ok) {
            const errorMsg = data?.error?.message || data?.message || `Login failed (${response.status})`;
            console.error('Login error:', errorMsg, data);
            showError(errorMsg, 'loginError');
            return;
        }

        if (!data || !data.data) {
            throw new Error('Invalid response format');
        }

        // Store token and user info
        authToken = data.data.token;
        currentUser = data.data.user;
        currentUser.role = userType; // Add role to user object
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        updateUIForAuthenticatedUser();
        showSection('welcomeSection');
        document.getElementById('loginForm').reset();
        hideError('loginError');
    } catch (error) {
        console.error('Login error:', { message: error.message, error });
        
        // Handle timeout specifically
        if (error.name === 'AbortError') {
            showError('Login is taking too long. Please check your internet connection and try again.', 'loginError');
        } else {
            showError(error.message || 'Network error. Please try again.', 'loginError');
        }
    }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const userType = document.getElementById('registerUserType').value;
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    const endpoint = userType === 'student' ? '/students/register' : '/counselors/register';
    const body = { name, email, password };

    // Add counselor-specific fields
    if (userType === 'counselor') {
        body.counselorType = document.getElementById('counselorType').value;
        body.bio = document.getElementById('counselorBio').value;
    }

    console.log('Registration request:', { endpoint, body });

    // Show loading message
    showError('Registering... Please wait.', 'registerError');

    try {
        // Add timeout to fetch request (60 seconds for slow connections)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Check if response has content before parsing
        const contentType = response.headers.get('content-type');
        let data = null;
        
        if (contentType && contentType.includes('application/json')) {
            try {
                data = await response.json();
            } catch (jsonError) {
                console.error('JSON parse error:', jsonError);
                throw new Error('Invalid response from server');
            }
        }

        console.log('Registration response:', { status: response.status, data });

        if (!response.ok) {
            // Handle validation errors
            let errorMessage = `Registration failed (${response.status})`;
            if (data?.error?.message) {
                errorMessage = data.error.message;
            } else if (data?.error?.errors && Array.isArray(data.error.errors)) {
                errorMessage = data.error.errors.map(e => e.message).join(', ');
                console.error('Validation errors:', data.error.errors);
            } else if (data?.message) {
                errorMessage = data.message;
            } else if (typeof data?.error === 'string') {
                errorMessage = data.error;
            }
            console.error('Registration error:', errorMessage, 'Full response:', data);
            showError(errorMessage, 'registerError');
            hideSuccess('registerSuccess');
            return;
        }

        showSuccess('Registration successful! Please login.', 'registerSuccess');
        hideError('registerError');
        document.getElementById('registerForm').reset();

        // Auto-switch to login after 2 seconds
        setTimeout(() => {
            showSection('loginSection');
            hideSuccess('registerSuccess');
        }, 2000);
    } catch (error) {
        console.error('Registration error:', { message: error.message, error });
        
        // Handle timeout specifically
        if (error.name === 'AbortError') {
            showError('Registration is taking too long. Please check your internet connection and try again.', 'registerError');
        } else {
            showError(error.message || 'Network error. Please try again.', 'registerError');
        }
        hideSuccess('registerSuccess');
    }
});

function toggleCounselorFields() {
    const userType = document.getElementById('registerUserType').value;
    const counselorFields = document.getElementById('counselorFields');
    counselorFields.style.display = userType === 'counselor' ? 'block' : 'none';
}

// =============================================================================
// Counselors Management
// =============================================================================

async function loadCounselors() {
    try {
        const response = await fetch(`${API_BASE}/counselors`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error('Failed to load counselors');
        }

        // Validate response structure
        if (!data || !data.data || !Array.isArray(data.data.counselors)) {
            console.error('Invalid counselors response format:', data);
            throw new Error('Invalid response format');
        }

        allCounselors = data.data.counselors;
        displayCounselors(allCounselors);
    } catch (error) {
        console.error('Load counselors error:', error);
        const container = document.getElementById('counselorsList');
        if (container) {
            container.innerHTML = '<p style="color: red;">Failed to load counselors. Please refresh the page.</p>';
        }
    }
}

function displayCounselors(counselors) {
    const container = document.getElementById('counselorsList');

    if (!counselors || !Array.isArray(counselors)) {
        container.innerHTML = '<p style="color: red;">Error displaying counselors.</p>';
        return;
    }

    if (counselors.length === 0) {
        container.innerHTML = '<p>No counselors found.</p>';
        return;
    }

    container.innerHTML = counselors.map(counselor => {
        // Safety check for counselor properties
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

function filterCounselors() {
    const typeFilter = document.getElementById('counselorTypeFilter').value;

    if (!typeFilter) {
        displayCounselors(allCounselors);
        return;
    }

    const filtered = allCounselors.filter(c => c.CounselorType === typeFilter);
    displayCounselors(filtered);
}

// =============================================================================
// Appointment Booking
// =============================================================================

async function loadCounselorsByType() {
    const type = document.getElementById('bookingCounselorType').value;
    const counselorSelect = document.getElementById('bookingCounselor');

    counselorSelect.innerHTML = '<option value="">Select a counselor</option>';

    if (!type) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/counselors`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error('Failed to load counselors');
        }

        const allCounselors = data.data.counselors;
        const filtered = allCounselors.filter(c => c.CounselorType === type);

        if (filtered.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = `No ${type} counselors available`;
            counselorSelect.appendChild(option);
            return;
        }

        filtered.forEach(counselor => {
            const option = document.createElement('option');
            option.value = counselor.CounselorID;
            option.textContent = `${counselor.Name} - ${counselor.Email}`;
            counselorSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Load counselors error:', error);
        showError('Failed to load counselors', 'bookingError');
    }
}

document.getElementById('bookingForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentUser || currentUser.role !== 'student') {
        showError('Please login as a student to book appointments.', 'bookingError');
        return;
    }

    const counselorID = parseInt(document.getElementById('bookingCounselor').value);
    const date = document.getElementById('bookingDate').value;
    const time = document.getElementById('bookingTime').value;

    // Validate inputs
    if (!counselorID || isNaN(counselorID) || counselorID <= 0) {
        showError('Please select a counselor.', 'bookingError');
        return;
    }

    if (!date) {
        showError('Please select a date.', 'bookingError');
        return;
    }

    if (!time) {
        showError('Please select a time.', 'bookingError');
        return;
    }

    const studentID = currentUser.StudentID || currentUser.studentID;
    if (!studentID) {
        showError('Student ID not found. Please logout and login again.', 'bookingError');
        return;
    }

    try {
        const response = await authenticatedFetch(`${API_BASE}/appointments`, {
            method: 'POST',
            body: JSON.stringify({
                studentID: studentID,
                counselorID,
                date,
                time
            })
        });

        const data = await response.json();

        if (!response.ok) {
            showError(data.error || 'Booking failed', 'bookingError');
            hideSuccess('bookingSuccess');
            return;
        }

        showSuccess('Appointment booked successfully!', 'bookingSuccess');
        hideError('bookingError');
        document.getElementById('bookingForm').reset();

        // Show appointments after booking
        setTimeout(() => {
            showSection('appointmentsSection');
            loadMyAppointments();
        }, 1500);
    } catch (error) {
        console.error('Booking error:', error);
        showError('Failed to book appointment. Please try again.', 'bookingError');
        hideSuccess('bookingSuccess');
    }
});

// =============================================================================
// My Appointments
// =============================================================================

async function loadMyAppointments() {
    if (!currentUser) {
        showError('Please login to view appointments.');
        return;
    }

    const container = document.getElementById('appointmentsList');
    container.innerHTML = '<div class="spinner"></div>';

    try {
        let endpoint;
        let userId;
        
        if (currentUser.role === 'student') {
            userId = currentUser.StudentID || currentUser.studentID;
            if (!userId) {
                console.error('Student ID not found in user object:', currentUser);
                throw new Error('Student ID not found. Please logout and login again.');
            }
            endpoint = `${API_BASE}/appointments/student/${userId}`;
        } else if (currentUser.role === 'counselor') {
            userId = currentUser.CounselorID || currentUser.counselorID;
            if (!userId) {
                console.error('Counselor ID not found in user object:', currentUser);
                throw new Error('Counselor ID not found. Please logout and login again.');
            }
            endpoint = `${API_BASE}/appointments/counselor/${userId}`;
        } else {
            throw new Error('Invalid user role');
        }

        console.log('Fetching appointments from:', endpoint);

        const response = await authenticatedFetch(endpoint);
        const data = await response.json();

        if (!response.ok) {
            console.error('Appointments API error:', data);
            throw new Error(data.error?.message || 'Failed to load appointments');
        }

        displayAppointments(data.data.appointments);
    } catch (error) {
        console.error('Load appointments error:', error);
        container.innerHTML = `<p style="color: red;">${error.message || 'Failed to load appointments.'}</p>`;
    }
}

function displayAppointments(appointments) {
    const container = document.getElementById('appointmentsList');

    if (!appointments || !Array.isArray(appointments)) {
        container.innerHTML = '<p style="color: red;">Error displaying appointments.</p>';
        return;
    }

    if (appointments.length === 0) {
        container.innerHTML = '<p>No appointments found.</p>';
        return;
    }

    container.innerHTML = appointments.map(appt => {
        // Safety checks for appointment properties
        if (!appt || !appt.Status || !appt.Date || !appt.Time) {
            console.error('Invalid appointment data:', appt);
            return '';
        }

        const statusClass = `status-${appt.Status.toLowerCase()}`;
        const name = currentUser.role === 'student' ? (appt.CounselorName || 'Unknown') : (appt.StudentName || 'Unknown');
        const role = currentUser.role === 'student' ? (appt.CounselorType || 'Counselor') : 'Student';

        try {
            const dateStr = new Date(appt.Date).toLocaleDateString();
            return `
                <div class="appointment-card">
                    <div class="appointment-info">
                        <h4>${name}</h4>
                        <div class="appointment-details">
                            <span>📅 ${dateStr}</span>
                            <span>🕐 ${appt.Time}</span>
                            <span>👤 ${role}</span>
                        </div>
                    </div>
                    <div>
                        <span class="appointment-status ${statusClass}">${appt.Status}</span>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error rendering appointment:', error, appt);
            return '';
        }
    }).filter(html => html).join('');
}

// =============================================================================
// AI Assistant Integration
// =============================================================================

function openAIModal() {
    if (!currentUser) {
        showError('Please login to use the AI assistant.');
        showSection('loginSection');
        return;
    }

    document.getElementById('aiModal').style.display = 'flex';
    document.getElementById('aiChatHistory').innerHTML = '';
}

function closeAIModal() {
    document.getElementById('aiModal').style.display = 'none';
}

async function sendAIQuery() {
    const promptInput = document.getElementById('aiPrompt');
    const prompt = promptInput.value.trim();

    if (!prompt) {
        return;
    }

    const chatHistory = document.getElementById('aiChatHistory');

    // Add user message
    const userMessage = document.createElement('div');
    userMessage.className = 'chat-message user';
    userMessage.textContent = prompt;
    chatHistory.appendChild(userMessage);

    // Clear input
    promptInput.value = '';

    // Add loading indicator
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'chat-message assistant';
    loadingMessage.textContent = 'Thinking...';
    chatHistory.appendChild(loadingMessage);
    chatHistory.scrollTop = chatHistory.scrollHeight;

    try {
        const response = await authenticatedFetch(`${API_BASE}/ai/query`, {
            method: 'POST',
            body: JSON.stringify({
                prompt,
                mode: 'chat'
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'AI request failed');
        }

        // Remove loading message
        chatHistory.removeChild(loadingMessage);

        // Add AI response
        const aiMessage = document.createElement('div');
        aiMessage.className = 'chat-message assistant';
        aiMessage.textContent = data.response;
        if (data.cached) {
            aiMessage.innerHTML += ' <small style="color: var(--text-secondary);">(cached)</small>';
        }
        chatHistory.appendChild(aiMessage);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    } catch (error) {
        console.error('AI query error:', error);
        chatHistory.removeChild(loadingMessage);

        const errorMessage = document.createElement('div');
        errorMessage.className = 'chat-message assistant';
        errorMessage.textContent = '❌ Failed to get AI response. Please try again.';
        chatHistory.appendChild(errorMessage);
    }
}

async function getAIRecommendation() {
    if (!currentUser) {
        showError('Please login to use AI recommendations.', 'bookingError');
        return;
    }

    const counselorType = document.getElementById('bookingCounselorType').value;

    if (!counselorType) {
        showError('Please select a counselor type first.', 'bookingError');
        return;
    }

    const prompt = `I need help choosing a ${counselorType} counselor. What should I consider?`;

    try {
        const response = await authenticatedFetch(`${API_BASE}/ai/query`, {
            method: 'POST',
            body: JSON.stringify({
                prompt,
                mode: 'recommendation'
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'AI request failed');
        }

        alert(`AI Recommendation:\n\n${data.response}`);
    } catch (error) {
        console.error('AI recommendation error:', error);
        showError('Failed to get AI recommendation. Please try again.', 'bookingError');
    }
}

// Allow Enter key in AI chat
document.getElementById('aiPrompt').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendAIQuery();
    }
});

// =============================================================================
// Utility Functions
// =============================================================================

function showError(message, elementId = 'generalError') {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    } else {
        alert(`Error: ${message}`);
    }
}

function hideError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.classList.remove('show');
    }
}

function showSuccess(message, elementId) {
    const successElement = document.getElementById(elementId);
    if (successElement) {
        successElement.textContent = message;
        successElement.classList.add('show');
    }
}

function hideSuccess(elementId) {
    const successElement = document.getElementById(elementId);
    if (successElement) {
        successElement.classList.remove('show');
    }
}

// =============================================================================
// Initialize Application
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
    initAuth();

    // Set minimum date for appointment booking to today
    const dateInput = document.getElementById('bookingDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
    }
});
