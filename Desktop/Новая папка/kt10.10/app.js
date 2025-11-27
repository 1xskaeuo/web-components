const cart = {};
const stock = {};

function addToCart(productId, quantity) {
    if (quantity <= 0) {
        throw new Error('Quantity must be positive');
    }
    
    const currentQty = cart[productId] || 0;
    const availableStock = stock[productId] || 0;
    
    if (currentQty + quantity > availableStock) {
        throw new Error('Not enough stock');
    }
    
    if (cart[productId]) {
        cart[productId] += quantity;
    } else {
        cart[productId] = quantity;
    }
    
    updateCartUI();
    return cart;
}

function updateCartUI() {
    const total = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
    const countEl = document.querySelector('.cart-count');
    if (countEl) countEl.textContent = total;
    
    const cartItems = document.querySelector('.cart-items');
    const cartTotal = document.querySelector('.cart-total span');
    
    if (cartItems) {
        if (total === 0) {
            cartItems.innerHTML = '<div class="empty-cart">Корзина пуста</div>';
        } else {
            cartItems.innerHTML = '';
            Object.keys(cart).forEach(productId => {
                const productEl = document.querySelector(`[data-id="${productId}"]`);
                const productName = productEl.querySelector('h3').textContent;
                
                const item = document.createElement('div');
                item.className = 'cart-item';
                item.innerHTML = `
                    <div class="cart-item-name">${productName}</div>
                    <div class="cart-item-qty">Количество: ${cart[productId]}</div>
                `;
                cartItems.appendChild(item);
            });
        }
    }
    
    if (cartTotal) {
        cartTotal.textContent = total;
    }
    
    updateStockDisplay();
}

function updateStockDisplay() {
    document.querySelectorAll('.product').forEach(productEl => {
        const productId = productEl.dataset.id;
        const stockSpan = productEl.querySelector('.stock span');
        const btnAdd = productEl.querySelector('.btn-add');
        const qtyInput = productEl.querySelector('.quantity');
        
        const originalStock = parseInt(productEl.dataset.stock);
        const inCart = cart[productId] || 0;
        const remaining = originalStock - inCart;
        
        stockSpan.textContent = remaining;
        
        if (remaining === 0) {
            btnAdd.disabled = true;
            btnAdd.textContent = 'Нет в наличии';
        } else {
            btnAdd.disabled = false;
            btnAdd.textContent = 'Добавить';
        }
        
        qtyInput.max = remaining;
        if (parseInt(qtyInput.value) > remaining) {
            qtyInput.value = remaining;
        }
    });
}

function getCart() {
    return cart;
}

function clearCart() {
    Object.keys(cart).forEach(key => delete cart[key]);
    updateCartUI();
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.product').forEach(productEl => {
            const productId = productEl.dataset.id;
            stock[productId] = parseInt(productEl.dataset.stock);
        });
        
        updateCartUI();
        
        document.querySelectorAll('.btn-add').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productEl = e.target.closest('.product');
                const productId = productEl.dataset.id;
                const quantity = parseInt(productEl.querySelector('.quantity').value);
                
                try {
                    addToCart(productId, quantity);
                } catch (error) {
                    alert(error.message);
                }
            });
        });
        
        document.querySelectorAll('.btn-minus').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const input = e.target.parentElement.querySelector('.quantity');
                if (input.value > 1) {
                    input.value = parseInt(input.value) - 1;
                }
            });
        });
        
        document.querySelectorAll('.btn-plus').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const input = e.target.parentElement.querySelector('.quantity');
                const max = parseInt(input.max) || 999;
                if (input.value < max) {
                    input.value = parseInt(input.value) + 1;
                }
            });
        });
    });
}