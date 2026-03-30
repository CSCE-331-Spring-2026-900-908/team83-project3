let cart = JSON.parse(localStorage.getItem('cart')) || [];

function addToCart(name, price) {
    // 1. Create the item object
    const item = {
        name: name,
        price: parseFloat(price)
    };

    // 2. Add to our array
    cart.push(item);

    // 3. Save to LocalStorage so we can see it on the Cart page later
    localStorage.setItem('cart', JSON.stringify(cart));

    // 4. Update the UI button text
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
            <button class="remove-btn" onclick="removeItem(${index})">Remove</button>
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

    // Send the cart to your Node.js server
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
// Run once on page load to show existing items
updateCartButton();