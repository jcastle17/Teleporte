document.addEventListener('DOMContentLoaded', () => {
    const collectForm = document.getElementById('collectForm');
    const responseMessageDiv = document.getElementById('responseMessage');
    const submitBtn = document.getElementById('submit-btn');
    const contentInput = document.getElementById('content');
    const autosaveStatus = document.getElementById('autosaveStatus');
    let autosaveTimeout;

    collectForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        // Prevent double-submission
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        // Clear previous messages
        responseMessageDiv.style.display = 'none';
        responseMessageDiv.className = 'message';

        const payload = {
            title: document.getElementById('title').value || null,
            content: document.getElementById('content').value,
            tags: document.getElementById('tags').value || null,
            source_chat: document.getElementById('source_chat').value || null,
            confidence_level: document.getElementById('confidence_level').value || null,
        };
        
        // Basic validation
        if (!payload.content || payload.content.trim() === '') {
            showResponse('Content field cannot be empty.', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit & Finalize Log';
            return;
        }

        try {
            const response = await fetch('/api/collect-log', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                showResponse('Log collected successfully! ID: ' + (data.id || 'N/A'), 'success');
                collectForm.reset();
            } else {
                showResponse(`Error: ${data.error || 'Unknown error'}`, 'error');
            }
        } catch (error) {
            showResponse(`Network error: ${error.message}`, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit & Finalize Log';
        }
    });
    
    function showResponse(message, type) {
        responseMessageDiv.textContent = message;
        responseMessageDiv.className = `message ${type}`;
        responseMessageDiv.style.display = 'block';
    }

    // --- Autosave Simulation ---
    contentInput.addEventListener('input', () => {
        clearTimeout(autosaveTimeout);
        autosaveStatus.textContent = 'Typing...';
        autosaveTimeout = setTimeout(() => {
            // This is just a UI simulation. In a real app, you would save to localStorage.
            autosaveStatus.textContent = 'Draft autosaved.';
        }, 1500);
    });

    collectForm.addEventListener('reset', () => {
        autosaveStatus.textContent = '';
        clearTimeout(autosaveTimeout);
        responseMessageDiv.style.display = 'none';
    });
});
