// Update text and button sizes
function updateAccessibility(type, value) {
    if (type === 'text') {
        document.documentElement.style.setProperty('--base-text-size', `${value}px`);
        localStorage.setItem('customer-text-size', value);
    } else if (type === 'button') {
        document.documentElement.style.setProperty('--button-scale', value);
        localStorage.setItem('customer-button-scale', value);
    }
}

// Sync magnifying glass and sliders
function syncMagnifier() {
    const lensContent = document.getElementById('magnifier-content');
    const pageContent = document.getElementById('page-content');
    if (lensContent && pageContent) {
        lensContent.innerHTML = pageContent.innerHTML;
    }
}

// Load saved preferences on page load
document.addEventListener('DOMContentLoaded', () => {
    const textSizeSlider = document.getElementById('text-size-slider');
    const buttonSizeSlider = document.getElementById('button-size-slider');
    const savedText = localStorage.getItem('customer-text-size');
    const savedButton = localStorage.getItem('customer-button-scale');

    if (savedText) {
        updateAccessibility('text', savedText);
        if (textSizeSlider) textSizeSlider.value = savedText;
    }

    if (savedButton) {
        updateAccessibility('button', savedButton);
        if (buttonSizeSlider) buttonSizeSlider.value = savedButton;
    }

    if (textSizeSlider) {
        textSizeSlider.addEventListener('input', (e) => {
            updateAccessibility('text', e.target.value);
            syncMagnifier();
        });
    }

    if (buttonSizeSlider) {
        buttonSizeSlider.addEventListener('input', (e) => {
            updateAccessibility('button', e.target.value);
            syncMagnifier();
        });
    }
});
