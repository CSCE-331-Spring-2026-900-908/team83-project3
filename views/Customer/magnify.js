const lens = document.getElementById('magnifier');
const lensContent = document.getElementById('magnifier-content');
const pageContent = document.getElementById('page-content');
const toggleButton = document.getElementById('magnifier-toggle');
const statusText = document.getElementById('toggle-status');
let toggle = false;

lensContent.innerHTML = pageContent.innerHTML;

//Toggle magnifier on or off
if (toggleButton) {
  toggleButton.addEventListener('click', () => {
    toggle = !toggle;
    statusText.innerText = toggle ? "ON" : "OFF";
    if (!toggle) {
      lens.style.display = 'none';
    }
  })
}

//Grabs page after it loads
window.addEventListener('load', () => {
  lensContent.innerHTML = pageContent.innerHTML;
  console.log("Magnifier clone updated. Menu items found: ", lensContent.querySelectorAll('.menu-card').length);
});

//Magnifier follows mouse movement
window.addEventListener('mousemove', (e) => {
  if (!toggle) {
    return;
  }
  lens.style.display = 'block';
  lens.style.left = `${e.clientX}px`;
  lens.style.top = `${e.clientY}px`;
   const zoom = 2;
  const lensRadius = 125;
  const totalX = e.pageX * zoom;
  const totalY = e.pageY * zoom;
  lensContent.style.left = `${lensRadius-totalX}px`;
  lensContent.style.top = `${lensRadius-totalY}px`;
  console.log("Lens Top:", lensContent.style.top);
});


window.addEventListener('mouseleave', () => {
  lens.style.display = 'none';
});

//The magnifier will correctly display what the user is hovering over
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

//Magnifier follows user touch input
window.addEventListener('touchmove', (e) => {
    if (!toggle) return;
    
    const touch = e.touches[0];
    const fingerOffset = 80;
    lens.style.top = `${touch.clientY - fingerOffset}px`;
    moveMagnifier(touch.pageX, touch.pageY, touch.clientX, touch.clientY);
}, { passive: false });

//Magnifier placed under user's finger
window.addEventListener('touchstart', (e) => {
    if (!toggle) return;
    const touch = e.touches[0];
    moveMagnifier(touch.pageX, touch.pageY, touch.clientX, touch.clientY);
});

window.addEventListener('touchend', () => {
    lens.style.display = 'none';
});