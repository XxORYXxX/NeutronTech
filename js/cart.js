// Cart
window.addEventListener('DOMContentLoaded', function() {
    document.body.classList.add('fade-in');
    // Load and display the cart products
    showCartContents();
});

// Function to display the products in the cart
function showCartContents() {
    const savedCart = localStorage.getItem('cart');
    const cartContainer = document.querySelector('.cart-container');

    // Clear the container
    cartContainer.innerHTML = '';

    if (savedCart && JSON.parse(savedCart).length > 0) {
        const cart = JSON.parse(savedCart);
        let total = 0;

        // Create elements for each product
        cart.forEach((product, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'cart-item';

            const normalized = String(product.precio).replace(/[^\d.-]/g, '');
            const unitValue = Number(normalized);
            const qty = Math.max(1, Number(product.quantity) || 1);
            const lineTotal = (isNaN(unitValue) ? 0 : unitValue) * qty;
            total += lineTotal;

            itemDiv.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin: 10px; border-bottom: 1px solid #E75E75; padding-bottom: 10px;">
      <img class="cartImage" src="${product.imagen}" alt="${product.nombre}" height="200">
      <div style="flex: 1; text-align: center; align-content: center">
        <p><strong>${product.nombre}</strong></p>
        <p>${product.description}</p>
        <p>Unit: $${unitValue.toLocaleString()}</p>
        <div style="display:flex; align-items:center; justify-content:center; gap:8px;">
          <span>Quantity:</span>
          <button class="cartButton" onclick="updateCartItemQty(${index}, -1)">−</button>
          <span><strong>${qty}</strong></span>
          <button class="cartButton" onclick="updateCartItemQty(${index}, 1)">+</button>
        </div>
        <p><strong>Line total: $${lineTotal.toLocaleString()}</strong></p>
      </div>
      <button onclick="deleteCartItem(${index})" class="cartButton">Delete</button>
    </div>
  `;

            cartContainer.appendChild(itemDiv);
        });

        // Add the total and the pay button
        const totalDiv = document.createElement('div');
        totalDiv.className = 'cart-total';
        totalDiv.innerHTML = `
            <div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #ccc;">
                <p><strong>Total: $${total.toLocaleString()}</strong></p>
                <button onclick="handlePurchaseCompletion()" class="cartButton">Pay</button>
            </div>
        `;

        cartContainer.appendChild(totalDiv);
    } else {
        // Show a message if the cart is empty
        cartContainer.innerHTML = '<p>There are no products in your cart</p>';
    }
}

// Function to remove a product from the cart
async function deleteCartItem(index) {
    if (!confirm('Are you sure you want to remove this item?')) return;

    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        const cart = JSON.parse(savedCart);
        const product = cart[index];
        const qty = Math.max(1, Number(product?.quantity) || 1);
        cart.splice(index, 1);
        localStorage.setItem('cart', JSON.stringify(cart));

        try {
            await fetch('http://localhost:3000/api/products/increment-stock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: product.id, quantity: qty })
            });
            showCartContents();
        } catch (error) {
            console.error('Error deleting item:', error);
        }
    }
}

// Function to do the payment in the cart
function handlePurchaseCompletion() {
    const savedCart = localStorage.getItem('cart');
    // Generate QR with cart details before clearing the cart
    const qrContainer = document.getElementById('qrContainer');
    qrContainer.innerHTML = ''; // Clear previous QR

    if (savedCart) {
        const cart = JSON.parse(savedCart);
        const details = cart.map(p => `${p.nombre} ($${p.precio}) ${p.category}`).join(', ');
        const qrText = `NeutronTech purchase: ${details}`;
        QRCode.toCanvas(qrText, {width: 256}, function (error, canvas) {
            if (error) {
                qrContainer.innerHTML = '<p>Error generating QR code</p>';
            } else {
                qrContainer.innerHTML = '<h3 style="margin-bottom: 5px">Your purchase QR code:</h3>';
                qrContainer.appendChild(canvas);
            }
        });
    }
    alert('Thank you for your purchase!');
    localStorage.removeItem('cart');
    showCartContents();
}

async function updateCartItemQty(index, delta) {
    const savedCart = localStorage.getItem('cart');
    if (!savedCart) return;
    const cart = JSON.parse(savedCart);
    const item = cart[index];
    if (!item) return;

    const oldQty = Math.max(1, Number(item.quantity) || 1);
    const newQty = Math.max(1, oldQty + delta);
    const diff = newQty - oldQty; // could be +1 or -1 per click

    // Update local cart first for snappy UI
    item.quantity = newQty;
    localStorage.setItem('cart', JSON.stringify(cart));
    showCartContents();

    // Sync stock with server (increment if quantity decreased, decrement if increased)
    try {
        if (diff !== 0) {
            const endpoint = diff > 0
                ? 'http://localhost:3000/api/products/decrement-stock'
                : 'http://localhost:3000/api/products/increment-stock';
            await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: item.id, quantity: Math.abs(diff) })
            });
        }
    } catch (e) {
        console.error('Error syncing quantity change:', e);
        // Optional: revert on error by restoring old quantity
    }
}