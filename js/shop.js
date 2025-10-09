// Load products by category and render them
async function loadProducts(category) {
    try {
        const res = await fetch(`http://localhost:3000/api/products/category/${category}`);
        const products = await res.json();
        const grid = document.querySelector(`#${category} + section .card-grid`);
        grid.innerHTML = '';
        
        products.forEach(product => {
            grid.innerHTML += `
                <div class="featured-card">
                    <img src="${product.imageUrl}" alt="${category}" width="400" height="300">
                    <h3>${product.name}</h3>
                    <p>${product.description}</p>
                    <p>${product.price} USD</p>
                    ${
                        product.stock > 0
                            ? `<button class="button" onclick="addToCart('${product.name}', '${product.description}', '${product.price}', '${product.imageUrl}', '${product.id}')">Purchase</button>`
                            : `<button class="button" disabled>Sold out</button>`
                    }
                </div>
            `;
        });
    } catch (error) {
        console.error('Error loading products:', error);
    }
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

async function addToCart(name, description, price, image, category, id) {
    const saved = localStorage.getItem('cart');
    cart = saved ? JSON.parse(saved) : [];
    const product = { 
        nombre: name, 
        description: description, 
        precio: price, 
        imagen: image,
        category: category,
        id: id 
    };
    cart.push(product);
    localStorage.setItem('cart', JSON.stringify(cart));
    
    try {
        await fetch('http://localhost:3000/api/products/decrement-stock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        alert(`${name} has been added to the cart`);
    } catch (error) {
        console.error('Error adding to cart:', error);
        alert('Error adding product to cart');
    }
}