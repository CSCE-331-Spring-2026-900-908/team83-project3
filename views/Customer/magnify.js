const lens = document.getElementById('magnifier');
const lensContent = document.getElementById('magnifier-content');
const pageContent = document.getElementById('page-content');
let toggle = true;

lensContent.innerHTML = pageContent.innerHTML;
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