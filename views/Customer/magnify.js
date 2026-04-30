const lens = document.getElementById('magnifier');
const lensContent = document.getElementById('magnifier-content');
const toggleButton = document.getElementById('magnifier-toggle');
const statusText = document.getElementById('toggle-status');
let toggle = false;

// 1. THE DEBOUNCER: Prevents the "Infinite Loop" crash
let cloneTimeout;
function debouncedClone() {
    clearTimeout(cloneTimeout);
    cloneTimeout = setTimeout(cloneContent, 50); // Wait 50ms for the UI to settle
}

function cloneContent() {
    if (!toggle) return; // Don't waste resources if the lens is off
    
    lensContent.innerHTML = '';
    
    const wrapperOriginal = document.getElementById('page-wrapper');
    const chatContainerOriginal = document.getElementById('chatbot-container');
    const chatToggleOriginal = document.getElementById('chatbot-toggle');

    if (!wrapperOriginal) return;

    // Clone the main pieces
    const wrapperClone = wrapperOriginal.cloneNode(true);
    const chatContainerClone = chatContainerOriginal ? chatContainerOriginal.cloneNode(true) : null;
    const chatToggleClone = chatToggleOriginal ? chatToggleOriginal.cloneNode(true) : null;

    // BAKE VISIBILITY: Use classes/styles instead of IDs for the clone
    if (chatContainerOriginal && chatContainerClone) {
        const isOpen = window.getComputedStyle(chatContainerOriginal).display !== 'none';
        chatContainerClone.style.display = isOpen ? 'block' : 'none';
        chatContainerClone.style.position = 'fixed';
    }

    // CLEANUP: Remove IDs safely
    [wrapperClone, chatContainerClone, chatToggleClone].forEach(el => {
        if (!el) return;
        el.removeAttribute('id');
        el.querySelectorAll('[id]').forEach(child => child.removeAttribute('id'));
    });

    // APPEND
    lensContent.appendChild(wrapperClone);
    if (chatToggleClone) lensContent.appendChild(chatToggleClone);
    if (chatContainerClone) lensContent.appendChild(chatContainerClone);
}

// 2. TRIGGER UPDATES: Use the debouncer instead of direct calls
if (toggleButton) {
    toggleButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Stop the click from bubbling up
        toggle = !toggle;
        if (statusText) statusText.innerText = toggle ? "ON" : "OFF";
        if (!toggle) {
            lens.style.display = 'none';
        } else {
            debouncedClone();
        }
    });
}

// Update whenever the user interacts, but safely
window.addEventListener('click', debouncedClone);
window.addEventListener('refreshMagnifier', debouncedClone);
window.addEventListener('load', debouncedClone);

// 3. MOVEMENT (Standard)
function moveMagnifier(pageX, pageY, clientX, clientY) {
    if (!toggle) return;
    lens.style.display = 'block';
    lens.style.left = `${clientX}px`;
    lens.style.top = `${clientY}px`;

    const zoom = 2;
    const lensRadius = 125;
    lensContent.style.left = `${lensRadius - (pageX * zoom)}px`;
    lensContent.style.top = `${lensRadius - (pageY * zoom)}px`;
}

window.addEventListener('mousemove', (e) => moveMagnifier(e.pageX, e.pageY, e.clientX, e.clientY));
window.addEventListener('mouseleave', () => lens.style.display = 'none');