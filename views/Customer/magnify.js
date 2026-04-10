const lens = document.getElementById('magnifier');
const lensContent = document.getElementById('magnifier-content');
const pageContent = document.getElementById('page-content');
const toggleButton = document.getElementById('magnifier-toggle');
const statusText = document.getElementById('toggle-status');
let toggle = false;

lensContent.innerHTML = pageContent.innerHTML;
if (toggleButton) {
  toggleButton.addEventListener('click', () => {
    toggle = !toggle;
    statusText.innerText = toggle ? "ON" : "OFF";
    if (!toggle) {
      lens.style.display = 'none';
    }
  })
}
window.addEventListener('load', () => {
  lensContent.innerHTML = pageContent.innerHTML;
  console.log("Magnifier clone updated. Menu items found: ", lensContent.querySelectorAll('.menu-card').length);
});

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