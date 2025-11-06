// Load products by category and render them
async function loadProducts(category) {
    try {
        const res = await fetch(`http://localhost:3000/api/products/category/${category}`);
        const products = await res.json();
        const grid = document.querySelector(`#${category} + section .card-grid`);
        grid.innerHTML = '';

        products.forEach(product => {
            // Escape values for attributes inline
            const safeName = String(product.name).replace(/"/g, '\\"').replace(/'/g, "&#39;");
            const safeDesc = String(product.description).replace(/"/g, '\\"').replace(/'/g, "&#39;");
            const safeImage = String(product.imageUrl).replace(/"/g, '\\"').replace(/'/g, "&#39;");
            const safeCategory = String(product.category).replace(/"/g, '\\"').replace(/'/g, "&#39;");
            const price = product.price;

            grid.innerHTML += `
    <div class="featured-card">
      <img src="${product.imageUrl}" alt="${category}" width="400" height="300">
      <h3>${product.name}</h3>
      <p>${product.description}</p>
      <p>${product.price} USD</p>
      ${
                product.stock > 0
                    ? `
            <div class="purchase-row" style="display:flex; gap:8px; align-items:center; justify-content:flex-start;">
              <button class="button"
                onclick="addToCart('${safeName}', '${safeDesc}', '${price}', '${safeImage}', '${safeCategory}', '${product.id}', parseInt(document.getElementById('qty-${product.id}').value, 10) || 1)">
                Purchase
              </button>
              <div class="qty-controls" style="display:flex; align-items:center; gap:6px;">
                <button type="button" class="qty-btn" onclick="changeQty('${product.id}', -1)">−</button>
                <input id="qty-${product.id}" class="qty-input" type="number" min="1" value="1" />
                <button type="button" class="qty-btn" onclick="changeQty('${product.id}', 1)">+</button>
              </div>
            </div>
          ` : `<button class="button" disabled>Sold out</button>`
      }
    </div>
`;
        });
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function changeQty(id, delta) {
    const el = document.getElementById(`qty-${id}`);
    if (!el) return;
    const current = parseInt(el.value, 10) || 1;
    const next = Math.max(1, current + delta);
    el.value = next;
}

let cart = [];
function loadCartFromLocalStorage() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) cart = JSON.parse(savedCart);
}

// Load all categories on page load
window.addEventListener('DOMContentLoaded', () => {
    loadCartFromLocalStorage();
    ['desktop', 'laptop', 'gaming', 'components'].forEach(loadProducts);
});

async function addToCart(name, description, price, image, category, id, quantity = 1) {
    const saved = localStorage.getItem('cart');
    cart = saved ? JSON.parse(saved) : [];

    const qty = Math.max(1, Number(quantity) || 1);
    const numericPrice = Number(String(price).replace(/[^\d.-]/g, ''));

    const product = {
        nombre: name,
        description: description,
        precio: isNaN(numericPrice) ? price : numericPrice,
        imagen: image,
        category: category,
        id: id,
        quantity: qty
    };

    cart.push(product);
    localStorage.setItem('cart', JSON.stringify(cart));

    try {
        await fetch('http://localhost:3000/api/products/decrement-stock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, quantity: qty })
        });
        alert(`${name} (x${qty}) has been added to the cart`);
    } catch (error) {
        console.error('Error adding to cart:', error);
        alert('Error adding product to cart');
    }
}