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

            // Extract only the numeric part of the price
            const normalized = String(product.precio).replace(/[^\d.-]/g, '');
            const value = Number(normalized);
            total += isNaN(value) ? 0 : value;

            itemDiv.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between; margin: 10px; border-bottom: 1px solid #E75E75; padding-bottom: 10px;">
                    <img class="cartImage" src="${product.imagen}" alt="${product.nombre}" height="200">
                    <div style="flex: 1; margin-right: 100px; text-align: center;">
                        <p><strong>${product.nombre}</strong></p>
                        <p>${product.description}</p>
                        <p>$${product.precio}</p>
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
        cart.splice(index, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        
        try {
            await fetch('http://localhost:3000/api/products/increment-stock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: product.id })
            });
            showCartContents();
        } catch (error) {
            console.error('Error deleting item:', error);
        }
    }
}

// Función para realizar el pago en el carrito
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