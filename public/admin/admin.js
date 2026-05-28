document.addEventListener('DOMContentLoaded', () => {
    const tokenInput = document.getElementById('update-token-input');
    const saveTokenBtn = document.getElementById('save-token-btn');
    const authStatus = document.getElementById('auth-status');
    const dashboardContent = document.getElementById('dashboard-content');
    const consolidateBtn = document.getElementById('consolidate-btn');
    const consolidateStatus = document.getElementById('consolidate-status');
    const latestCheckpointContent = document.getElementById('latest-checkpoint-content');
    const collectedLogsContent = document.getElementById('collected-logs-content');
    const activeRulesContent = document.getElementById('active-rules-content');
    const organizedLogsContent = document.getElementById('organized-logs-content');
    const exportBtn = document.getElementById('export-btn');
    const exportStatus = document.getElementById('export-status');

    let apiToken = localStorage.getItem('updateToken');

    function checkAuth() {
        if (apiToken) {
            tokenInput.value = '********';
            authStatus.textContent = 'Token is saved in your browser.';
            authStatus.className = 'status-message success';
            dashboardContent.style.display = 'block';
            loadDashboardData();
        } else {
            authStatus.textContent = 'No token found. Please enter one.';
            authStatus.className = 'status-message warning';
            dashboardContent.style.display = 'none';
        }
    }

    saveTokenBtn.addEventListener('click', () => {
        const token = tokenInput.value;
        if (token && token !== '********') {
            localStorage.setItem('updateToken', token);
            apiToken = token;
            authStatus.textContent = 'Token saved successfully!';
            authStatus.className = 'status-message success';
            setTimeout(checkAuth, 1000);
        } else if (!token) {
            localStorage.removeItem('updateToken');
            apiToken = null;
            authStatus.textContent = 'Token removed.';
            authStatus.className = 'status-message';
            tokenInput.value = '';
            checkAuth();
        }
    });

    async function loadDashboardData() {
        if (!apiToken) return;
        fetchLatestCheckpoint();
        fetchCollectedLogs();
        fetchActiveRules();
        fetchOrganizedLogs();
        checkSystemHealth();
    }

    async function fetchLatestCheckpoint() {
        try {
            latestCheckpointContent.innerHTML = '<p>Loading...</p>';
            const response = await fetch('/api/latest');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            
            latestCheckpointContent.textContent = JSON.stringify(data, null, 2);
        } catch (error) {
            latestCheckpointContent.innerHTML = `<p class="error">Failed to load latest checkpoint: ${error.message}</p>`;
        }
    }

    async function fetchCollectedLogs() {
        try {
            collectedLogsContent.innerHTML = '<p>Loading...</p>';
            const response = await fetch('/api/collected-logs');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const logs = await response.json();

            if (logs.length > 0) {
                collectedLogsContent.innerHTML = ''; // Clear loading message
                logs.forEach(log => {
                    const logEntry = document.createElement('div');
                    logEntry.className = 'log-entry';
                    logEntry.innerHTML = `
                        <strong>ID: ${log.id}</strong>
                        <pre>${log.content}</pre>
                    `;
                    collectedLogsContent.appendChild(logEntry);
                });
            } else {
                collectedLogsContent.textContent = 'No new logs to consolidate.';
            }
        } catch (error) {
            collectedLogsContent.innerHTML = `<p class="error">Failed to load collected logs: ${error.message}</p>`;
        }
    }

    async function fetchActiveRules() {
        try {
            activeRulesContent.textContent = 'Loading...';
            const response = await fetch('/api/current-rules');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            activeRulesContent.textContent = JSON.stringify(data, null, 2);
        } catch (error) {
            activeRulesContent.textContent = `Error: ${error.message}`;
        }
    }

    async function fetchOrganizedLogs() {
        try {
            organizedLogsContent.textContent = 'Loading...';
            const response = await fetch('/api/organized-logs');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const logs = await response.json();
            if (logs.length > 0) {
                organizedLogsContent.innerHTML = '';
                logs.forEach(log => {
                    const logEntry = document.createElement('div');
                    logEntry.className = 'log-entry';
                    logEntry.innerHTML = `<strong>ID: ${log.id}</strong><pre>${log.content}</pre>`;
                    organizedLogsContent.appendChild(logEntry);
                });
            } else {
                organizedLogsContent.textContent = 'No organized logs found.';
            }
        } catch (error) {
            organizedLogsContent.innerHTML = `<p class="error">Failed to load organized logs. This endpoint might not be implemented yet. ${error.message}</p>`;
        }
    }

    consolidateBtn.addEventListener('click', async () => {
        if (!apiToken) {
            consolidateStatus.textContent = 'Error: UPDATE_TOKEN is not set.';
            consolidateStatus.className = 'status-message error';
            return;
        }

        consolidateStatus.textContent = 'Consolidating...';
        consolidateStatus.className = 'status-message';
        
        try {
            const response = await fetch('/api/consolidate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiToken}`
                },
                body: JSON.stringify({})
            });

            const result = await response.json();

            if (!response.ok) {
                 throw new Error(result.error || `HTTP error! status: ${response.status}`);
            }

            consolidateStatus.textContent = result.message || 'Consolidation successful!';
            consolidateStatus.className = 'status-message success';

            setTimeout(() => {
                fetchLatestCheckpoint();
                fetchCollectedLogs();
                fetchOrganizedLogs();
            }, 1000);

        } catch (error) {
            consolidateStatus.textContent = `Error: ${error.message}`;
            consolidateStatus.className = 'status-message error';
        }
    });

    exportBtn.addEventListener('click', () => {
        exportStatus.textContent = 'Export functionality is not yet implemented.';
        exportStatus.className = 'status-message info';
    });
    
    const checkSystemStatus = async (url, statusIndicatorId, statusTextId) => {
        const statusIndicator = document.getElementById(statusIndicatorId);
        const statusText = document.getElementById(statusTextId);
        try {
            const response = await fetch(url);
            if (response.ok) {
                statusIndicator.classList.remove('offline');
                statusIndicator.classList.add('online');
                statusText.textContent = 'Operational';
            } else {
                throw new Error(`Status: ${response.status}`);
            }
        } catch (error) {
            console.error(`Error checking status for ${url}:`, error);
            statusIndicator.classList.remove('online');
            statusIndicator.classList.add('offline');
            statusText.textContent = 'Offline';
        }
    };
    
    function checkSystemHealth() {
        checkSystemStatus('/api/latest', 'coreApiStatusIndicator', 'coreApiStatusText');
        checkSystemStatus('/api/current-rules', 'rulesEngineStatusIndicator', 'rulesEngineStatusText');
        checkSystemStatus('/api/logs', 'logServiceStatusIndicator', 'logServiceStatusText');
        checkSystemStatus('/api/collect-log', 'collectionServiceStatusIndicator', 'collectionServiceStatusText');
    }

    checkAuth();
});
