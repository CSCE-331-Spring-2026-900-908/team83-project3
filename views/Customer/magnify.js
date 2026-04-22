const lens = document.getElementById('magnifier');
const lensContent = document.getElementById('magnifier-content');
const pageContent = document.getElementById('page-content');
const toggleButton = document.getElementById('magnifier-toggle');
const statusText = document.getElementById('toggle-status');
let toggle = false;

//Page content is 'snpashotted'
function cloneContent() {
    lensContent.innerHTML = pageContent.innerHTML.replace(/id="[^"]*"/g, '');
}

cloneContent();

//Toggle magnifier on and off
if (toggleButton) {
    toggleButton.addEventListener('click', () => {
        toggle = !toggle;
        statusText.innerText = toggle ? "ON" : "OFF";
        if (!toggle) {
            lens.style.display = 'none';
        }
    });
}

//Clone page content when page loads
window.addEventListener('load', () => {
    cloneContent();
    console.log("Magnifier clone updated. Menu items found: ", lensContent.querySelectorAll('.menu-card').length);
});

//Magnifier will follow mouse
window.addEventListener('mousemove', (e) => {
    if (!toggle) return;
    lens.style.display = 'block';
    lens.style.left = `${e.clientX}px`;
    lens.style.top = `${e.clientY}px`;
    const zoom = 2;
    const lensRadius = 125;
    const totalX = e.pageX * zoom;
    const totalY = e.pageY * zoom;
    lensContent.style.left = `${lensRadius - totalX}px`;
    lensContent.style.top = `${lensRadius - totalY}px`;
});

//Magnifier leaves when mouse is gone
window.addEventListener('mouseleave', () => {
    lens.style.display = 'none';
});

//Moves the magnifier accurately
function moveMagnifier(pageX, pageY, clientX, clientY) {
    lens.style.display = 'block';
    lens.style.left = `${clientX}px`;
    lens.style.top = `${clientY}px`;

    const zoom = 2;
    const lensRadius = 75;
    const moveX = lensRadius - (pageX * zoom);
    const moveY = lensRadius - (pageY * zoom);

    lensContent.style.left = `${moveX}px`;
    lensContent.style.top = `${moveY}px`;
}

//Magnifier follows touch input
window.addEventListener('touchmove', (e) => {
    if (!toggle) return;
    const touch = e.touches[0];
    const fingerOffset = 80;
    lens.style.top = `${touch.clientY - fingerOffset}px`;
    moveMagnifier(touch.pageX, touch.pageY, touch.clientX, touch.clientY);
}, { passive: false });

//Magnifier gets placed at touch input
window.addEventListener('touchstart', (e) => {
    if (!toggle) return;
    const touch = e.touches[0];
    moveMagnifier(touch.pageX, touch.pageY, touch.clientX, touch.clientY);
});

//Magnifier stops when touch input is gone
window.addEventListener('touchend', () => {
    lens.style.display = 'none';
});
