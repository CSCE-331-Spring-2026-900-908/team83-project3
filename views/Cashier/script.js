let cart = JSON.parse(localStorage.getItem('cart')) || [];

function addToCart(name, price) {
    const item = {
        name: name,
        price: parseFloat(price)
    };
    cart.push(item);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartButton();
    
    console.log("Added:", name, "Current Cart:", cart);
}

function updateCartButton() {
    const cartBtn = document.querySelector('.floating-cart-button');
    if (cartBtn) {
        cartBtn.innerText = `View Cart (${cart.length} items)`;
    }
}

// Display items on the Cart page
function displayCart() {
    const container = document.getElementById('cart-container');
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    if (cart.length === 0) {
        container.innerHTML = "<p>Your cart is empty.</p>";
        return;
    }

    container.innerHTML = cart.map((item, index) => `
        <div class="cart-item">
            <div class="item-info">
                <h3>${item.name}</h3>
                <p>$${item.price.toFixed(2)}</p>
            </div>
            <button class="remove-button" onclick="removeItem(${index})">Remove</button>
        </div>
    `).join('');
}

function removeItem(index) {
    let cart = JSON.parse(localStorage.getItem('cart'));
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    displayCart();
}

async function checkout() {
    const cart = JSON.parse(localStorage.getItem('cart'));
    
    if (!cart || cart.length === 0) return alert("Cart is empty!");

    // Send the cart to Node.js server
    const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart })
    });

    if (response.ok) {
        localStorage.removeItem('cart'); // Clear cart on success
        window.location.href = '/active-orders'; // Redirect to the screen you showed
    } else {
        alert("Checkout failed. Check server logs.");
    }
}

const textSizeSlider = document.getElementById('text-size-slider');
const buttonSizeSlider = document.getElementById('button-size-slider');

// Update Text Size
textSizeSlider.addEventListener('input', (e) => {
    document.documentElement.style.setProperty('--base-text-size', `${e.target.value}px`);
    localStorage.setItem('preferred-text-size', e.target.value); // Save preference
});

// Update Button Scale
buttonSizeSlider.addEventListener('input', (e) => {
    document.documentElement.style.setProperty('--button-scale', e.target.value);
    localStorage.setItem('preferred-button-scale', e.target.value); // Save preference
});

// Load saved preferences on page load
window.addEventListener('DOMContentLoaded', () => {
    const savedText = localStorage.getItem('preferred-text-size');
    const savedButton = localStorage.getItem('preferred-button-scale');
    
    if (savedText) {
        document.documentElement.style.setProperty('--base-text-size', `${savedText}px`);
        textSizeSlider.value = savedText;
    }
    if (savedButton) {
        document.documentElement.style.setProperty('--button-scale', savedButton);
        buttonSizeSlider.value = savedButton;
    }
});

// Run once on page load to show existing items
updateCartButton();