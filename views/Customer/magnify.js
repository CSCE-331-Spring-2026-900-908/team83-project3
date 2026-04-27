const lens = document.getElementById('magnifier');
const lensContent = document.getElementById('magnifier-content');
const pageContent = document.getElementById('page-content');
const toggleButton = document.getElementById('magnifier-toggle');
const statusText = document.getElementById('toggle-status');
let toggle = false;

//Page content is 'snapshotted'
function cloneContent() {
    //lensContent.innerHTML = pageContent.innerHTML.replace(/id="[^"]*"/g, '');
    lensContent.innerHTML = '';
    const mainContent = document.getElementById('page-wrapper').cloneNode(true);
    const modalOriginal = document.getElementById('customizeModal');
    const modalContent = modalOriginal.cloneNode(true);
    if (modalOriginal.classList.contains('active')) {
        modalContent.classList.add('active');
        modalContent.style.display = 'flex'; 
        modalContent.style.opacity = '1';
        modalContent.style.visibility = 'visible';
    }
    [mainContent, modalContent].forEach(el => {
        el.removeAttribute('id');
        el.querySelectorAll('[id]').forEach(child => child.removeAttribute('id'));
    });
    

    if (modalOriginal.classList.contains('active')) {
        modalContent.classList.add('active');
        Object.assign(modalContent.style, {
            display: 'flex',
            opacity: '1',
            visibility: 'visible',
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: '10001'
        });
    }
    lensContent.appendChild(mainContent);
    lensContent.appendChild(modalContent);
}

cloneContent();

window.addEventListener('refreshMagnifier', () => {
    cloneContent();
});

if (toggleButton) {
    toggleButton.addEventListener('click', () => {
        toggle = !toggle;
        statusText.innerText = toggle ? "ON" : "OFF";
        if (!toggle) {
            lens.style.display = 'none';
        }
        cloneContent();
    });
}

//Clone page content when page loads
window.addEventListener('load', () => {
    cloneContent();
    console.log("Magnifier clone updated. Menu items found: ", lensContent.querySelectorAll('.menu-card').length);
});

window.addEventListener('click', () => {
    cloneContent();
});

window.addEventListener('mousemove', (e) => {
    if (!toggle) return;
    lens.style.display = 'block';
    lens.style.left = `${e.clientX}px`;
    lens.style.top = `${e.clientY}px`;
    const zoom = 2;
    const lensRadius = 125;
    const moveX = lensRadius - (e.pageX * zoom);
    const moveY = lensRadius - (e.pageY * zoom);
    lensContent.style.left = `${moveX}px`;
    lensContent.style.top = `${moveY}px`;
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
    const lensRadius = 125;
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
    cloneContent;
});

//Magnifier stops when touch input is gone
window.addEventListener('touchend', () => {
    lens.style.display = 'none';
});
