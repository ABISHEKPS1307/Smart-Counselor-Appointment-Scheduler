const API_BASE = window.location.origin + '/api';
let currentUser = null;
let authToken = null;
let allAppointments = [];
let currentFilter = 'all';
let feedbackData = null;

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
        if (currentUser.role !== 'counselor') {
            window.location.href = '/login.html';
            return;
        }

        document.getElementById('userName').textContent = `Hello, ${currentUser.Name || currentUser.Email}`;
        loadAppointments();
        loadFeedbackData();
        lucide.createIcons();
    } catch (error) {
        console.error('Auth error:', error);
        window.location.href = '/login.html';
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    window.location.href = '/login.html';
});

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        displayAppointments();
    });
});

// Load feedback data
async function loadFeedbackData() {
    try {
        const counselorID = currentUser.CounselorID || currentUser.counselorID;
        
        if (!counselorID) {
            console.error('Counselor ID not found');
            return;
        }
        
        const response = await fetch(`${API_BASE}/feedback/counselor/${counselorID}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to load feedback');
        }
        
        feedbackData = data.data;
        displayFeedbackStats();
    } catch (error) {
        console.error('Load feedback error:', error);
    }
}

// Display feedback statistics
function displayFeedbackStats() {
    const statsContainer = document.getElementById('feedbackStats');
    
    if (!feedbackData || !statsContainer) {
        return;
    }
    
    const stats = feedbackData.statistics;
    const avgRating = stats.averageRating || 0;
    const totalFeedback = stats.totalFeedback || 0;
    
    // Generate star rating display
    const fullStars = Math.floor(avgRating);
    const hasHalfStar = avgRating % 1 >= 0.5;
    let starsHTML = '';
    
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            starsHTML += '⭐';
        } else if (i === fullStars && hasHalfStar) {
            starsHTML += '⭐';
        } else {
            starsHTML += '☆';
        }
    }
    
    statsContainer.innerHTML = `
        <div class="feedback-summary">
            <h3>📊 Your Feedback Summary</h3>
            <div class="rating-display">
                <div class="rating-stars">${starsHTML}</div>
                <div class="rating-number">${avgRating.toFixed(1)}/5.0</div>
            </div>
            <p style="color: #6b7280; margin-top: 0.5rem;">Based on ${totalFeedback} feedback${totalFeedback !== 1 ? 's' : ''}</p>
            
            ${totalFeedback > 0 ? `
                <div class="sentiment-breakdown">
                    <div class="sentiment-item">
                        <span class="sentiment-icon positive">😊</span>
                        <span>Positive: ${stats.sentimentBreakdown.positive}</span>
                    </div>
                    <div class="sentiment-item">
                        <span class="sentiment-icon neutral">😐</span>
                        <span>Neutral: ${stats.sentimentBreakdown.neutral}</span>
                    </div>
                    <div class="sentiment-item">
                        <span class="sentiment-icon negative">😔</span>
                        <span>Negative: ${stats.sentimentBreakdown.negative}</span>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
    
    // Display recent feedback
    displayRecentFeedback();
}

// Display recent feedback
function displayRecentFeedback() {
    const feedbackContainer = document.getElementById('recentFeedback');
    
    if (!feedbackData || !feedbackContainer || !feedbackData.feedback) {
        return;
    }
    
    const recentFeedback = feedbackData.feedback.slice(0, 5); // Show last 5
    
    if (recentFeedback.length === 0) {
        feedbackContainer.innerHTML = '<p>No feedback yet. Keep up the great work!</p>';
        return;
    }
    
    feedbackContainer.innerHTML = `
        <h3 style="margin-bottom: 1rem;">💬 Recent Feedback</h3>
        ${recentFeedback.map(fb => {
            const dateStr = new Date(fb.CreatedAt).toLocaleDateString();
            const sentimentEmoji = fb.Sentiment === 'positive' ? '😊' : fb.Sentiment === 'negative' ? '😔' : '😐';
            const sentimentClass = `sentiment-${fb.Sentiment}`;
            
            return `
                <div class="feedback-card">
                    <div class="feedback-header">
                        <div>
                            <strong>${fb.StudentName || 'Anonymous'}</strong>
                            <span style="color: #6b7280; font-size: 0.875rem; margin-left: 0.5rem;">${dateStr}</span>
                        </div>
                        <div class="feedback-meta">
                            <span class="feedback-rating">⭐ ${fb.Rating}/5</span>
                            <span class="feedback-sentiment ${sentimentClass}">${sentimentEmoji} ${fb.Sentiment}</span>
                        </div>
                    </div>
                    <p class="feedback-summary">${fb.Summary || fb.FeedbackText}</p>
                    ${fb.ImprovementSuggestions ? `
                        <div class="improvement-suggestions">
                            <strong>💡 Suggestions:</strong>
                            <p>${fb.ImprovementSuggestions}</p>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('')}
    `;
}

// Load appointments
async function loadAppointments() {
    const container = document.getElementById('appointmentsList');
    
    if (!container) {
        console.error('Appointments list container not found');
        return;
    }
    
    container.innerHTML = '<div style="text-align: center; padding: 2rem;"><p>Loading appointments...</p></div>';

    try {
        const counselorID = currentUser.CounselorID || currentUser.counselorID;
        
        if (!counselorID) {
            throw new Error('Counselor ID not found. Please logout and login again.');
        }
        
        if (!authToken) {
            throw new Error('You are not logged in. Please login again.');
        }
        
        // Add timeout (15 seconds)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const response = await fetch(`${API_BASE}/appointments/counselor/${counselorID}`, {
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

        allAppointments = data.data.appointments || [];
        displayAppointments();
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
        
        container.innerHTML = `<p style="color: red;">${errorMsg} <button onclick="loadAppointments()" class="btn btn-sm">Retry</button></p>`;
        
        // Redirect to login if session expired
        if (error.message.includes('session expired')) {
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
        }
    }
}

// Display appointments
function displayAppointments() {
    const container = document.getElementById('appointmentsList');
    
    let filtered = allAppointments;
    if (currentFilter !== 'all') {
        filtered = allAppointments.filter(a => a.Status === currentFilter);
    }

    if (filtered.length === 0) {
        container.innerHTML = '<p>No appointments found.</p>';
        return;
    }

    container.innerHTML = filtered.map(appt => {
        const statusClass = `status-${appt.Status.toLowerCase()}`;
        const dateStr = new Date(appt.Date).toLocaleDateString();
        const isPending = appt.Status === 'Pending';
        const isAccepted = appt.Status === 'Accepted';

        return `
            <div class="appointment-card">
                <div class="appointment-info">
                    <h4>${appt.StudentName || 'Unknown Student'}</h4>
                    <div class="appointment-details">
                        <span>📅 ${dateStr}</span>
                        <span>🕐 ${appt.Time}</span>
                        <span>📧 ${appt.StudentEmail || ''}</span>
                    </div>
                    <div style="margin-top: 0.5rem;">
                        <span class="appointment-status ${statusClass}">${appt.Status}</span>
                    </div>
                </div>
                ${isPending ? `
                    <div class="appointment-actions">
                        <button class="btn-accept" onclick="updateStatus(${appt.AppointmentID}, 'Accepted')">
                            ✓ Accept
                        </button>
                        <button class="btn-reject" onclick="updateStatus(${appt.AppointmentID}, 'Rejected')">
                            ✗ Reject
                        </button>
                    </div>
                ` : ''}
                ${isAccepted ? `
                    <div class="appointment-actions">
                        <button class="btn-cancel" onclick="updateStatus(${appt.AppointmentID}, 'Cancelled')">
                            Cancel
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// Update appointment status
async function updateStatus(appointmentId, status) {
    // Validate inputs
    if (!appointmentId || typeof appointmentId !== 'number') {
        alert('Invalid appointment ID');
        return;
    }
    
    if (!status || !['Accepted', 'Rejected', 'Cancelled'].includes(status)) {
        alert('Invalid status');
        return;
    }
    
    if (!confirm(`Are you sure you want to ${status.toLowerCase()} this appointment?`)) {
        return;
    }
    
    if (!authToken) {
        alert('You are not logged in. Please login again.');
        window.location.href = '/login.html';
        return;
    }

    try {
        // Add timeout (15 seconds)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const response = await fetch(`${API_BASE}/appointments/${appointmentId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const data = await response.json();

        if (!response.ok) {
            // Handle specific status codes
            if (response.status === 401) {
                alert('Your session has expired. Please login again.');
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUser');
                window.location.href = '/login.html';
                return;
            }
            throw new Error(data.error?.message || 'Failed to update appointment');
        }

        // Update the appointment in local array
        const index = allAppointments.findIndex(a => a.AppointmentID === appointmentId);
        if (index !== -1) {
            allAppointments[index].Status = status;
        } else {
            // Reload if not found locally
            await loadAppointments();
            return;
        }

        displayAppointments();
        alert(`Appointment ${status.toLowerCase()} successfully!`);
    } catch (error) {
        console.error('Update status error:', error);
        
        // Handle specific error types
        if (error.name === 'AbortError') {
            alert('Request timeout. Please check your internet connection and try again.');
        } else if (error.message === 'Failed to fetch') {
            alert('Network error. Please check your internet connection.');
        } else {
            alert(error.message || 'Failed to update appointment');
        }
    }
}

// Make updateStatus globally available
window.updateStatus = updateStatus;
window.loadAppointments = loadAppointments;
