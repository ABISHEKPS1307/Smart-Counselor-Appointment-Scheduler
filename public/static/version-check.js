/**
 * Automatic Version Check and Cache Management
 * Checks for new deployments and forces reload if version changed
 */

(function() {
  'use strict';

  const VERSION_CHECK_INTERVAL = 60000; // Check every 60 seconds
  const VERSION_ENDPOINT = '/version.json';
  let currentVersion = null;
  let isFirstCheck = true;

  /**
   * Get current app version from server
   */
  async function checkVersion() {
    try {
      // Add timestamp to prevent caching of version.json itself
      const response = await fetch(`${VERSION_ENDPOINT}?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (!response.ok) {
        console.warn('Version check failed:', response.status);
        return;
      }

      const data = await response.json();
      const serverVersion = data.version;

      // Store version on first check
      if (isFirstCheck) {
        currentVersion = serverVersion;
        localStorage.setItem('app_version', serverVersion);
        isFirstCheck = false;
        console.log('📌 Current version:', currentVersion);
        return;
      }

      // Check if version changed
      if (currentVersion && serverVersion !== currentVersion) {
        console.log('🔄 New version detected!');
        console.log('  Old:', currentVersion);
        console.log('  New:', serverVersion);
        
        // Show update notification
        showUpdateNotification(serverVersion);
      }
    } catch (error) {
      console.error('Version check error:', error);
    }
  }

  /**
   * Show update notification to user
   */
  function showUpdateNotification(newVersion) {
    // Create notification element
    const notification = document.createElement('div');
    notification.id = 'update-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #ffc300 0%, #ffd60a 100%);
      color: #000814;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 12px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-weight: 600;
      animation: slideDown 0.3s ease;
    `;

    notification.innerHTML = `
      <span style="font-size: 20px;">🚀</span>
      <div>
        <div style="font-size: 14px; margin-bottom: 4px;">New version available!</div>
        <div style="font-size: 12px; opacity: 0.8;">Refreshing in <span id="countdown">5</span> seconds...</div>
      </div>
    `;

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(notification);

    // Countdown and reload
    let countdown = 5;
    const countdownEl = document.getElementById('countdown');
    
    const timer = setInterval(() => {
      countdown--;
      if (countdownEl) {
        countdownEl.textContent = countdown;
      }
      
      if (countdown <= 0) {
        clearInterval(timer);
        reloadApp(newVersion);
      }
    }, 1000);

    // Allow user to click to reload immediately
    notification.addEventListener('click', () => {
      clearInterval(timer);
      reloadApp(newVersion);
    });
  }

  /**
   * Reload app with cache clearing
   */
  function reloadApp(newVersion) {
    console.log('🔄 Reloading app with new version:', newVersion);
    
    // Update stored version
    localStorage.setItem('app_version', newVersion);
    
    // Clear session storage
    sessionStorage.clear();
    
    // Add cache-busting parameter and reload
    const url = new URL(window.location.href);
    url.searchParams.set('v', newVersion);
    url.searchParams.set('_refresh', Date.now());
    
    // Hard reload with cache clearing
    window.location.href = url.toString();
  }

  /**
   * Initialize version checking
   */
  function init() {
    // Check version immediately
    checkVersion();
    
    // Check periodically
    setInterval(checkVersion, VERSION_CHECK_INTERVAL);
    
    // Check when page becomes visible (user switches back to tab)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        checkVersion();
      }
    });

    // Check version stored in localStorage on page load
    const storedVersion = localStorage.getItem('app_version');
    if (storedVersion) {
      currentVersion = storedVersion;
    }
  }

  // Start version checking when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose version check function globally for debugging
  window.checkAppVersion = checkVersion;
  window.forceReload = () => {
    const version = localStorage.getItem('app_version') || 'unknown';
    reloadApp(version + '-force');
  };

  console.log('✅ Version check system initialized');
})();
