// Configuração da API
const API_URL = 'http://localhost:3000/api';

// Carregar itens do carrinho
async function loadCart() {
    try {
        const response = await fetch(`${API_URL}/carrinho`, {
            credentials: 'include'
        });
        const cart = await response.json();
        
        const cartItems = document.getElementById('cart-items');
        cartItems.innerHTML = '';
        
        if (cart.length === 0) {
            cartItems.innerHTML = '<p>Seu carrinho está vazio.</p>';
            document.getElementById('cart-total').textContent = '0.00';
            return;
        }
        
        let total = 0;
        
        cart.forEach(item => {
            const itemTotal = item.preco_unitario * item.quantidade;
            total += itemTotal;
            
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <img src="${API_URL.replace('/api', '')}/uploads/${item.imagem}" alt="${item.nome}" onerror="this.src='https://via.placeholder.com/100'">
                <div class="cart-item-info">
                    <h3>${item.nome}</h3>
                    <p>Preço unitário: R$ ${parseFloat(item.preco_unitario).toFixed(2)}</p>
                    <p>Subtotal: R$ ${itemTotal.toFixed(2)}</p>
                </div>
                <div class="cart-item-actions">
                    <input type="number" value="${item.quantidade}" min="1" data-product-id="${item.produto_id}">
                    <button onclick="updateCartItem(${item.produto_id})">Atualizar</button>
                    <button class="remove-btn" onclick="removeCartItem(${item.produto_id})">Remover</button>
                </div>
            `;
            cartItems.appendChild(cartItem);
        });
        
        document.getElementById('cart-total').textContent = total.toFixed(2);
    } catch (error) {
        console.error('Erro ao carregar carrinho:', error);
    }
}

// Atualizar quantidade de um item no carrinho
async function updateCartItem(productId) {
    const input = document.querySelector(`input[data-product-id="${productId}"]`);
    const quantity = parseInt(input.value);
    
    if (quantity <= 0) {
        alert('Quantidade inválida.');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/carrinho/atualizar`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                produto_id: productId,
                quantidade: quantity
            })
        });
        
        if (response.ok) {
            loadCart();
            updateCartCount();
        } else {
            alert('Erro ao atualizar carrinho.');
        }
    } catch (error) {
        console.error('Erro ao atualizar carrinho:', error);
    }
}

// Remover item do carrinho
async function removeCartItem(productId) {
    try {
        const response = await fetch(`${API_URL}/carrinho/remover/${productId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (response.ok) {
            loadCart();
            updateCartCount();
        } else {
            alert('Erro ao remover item do carrinho.');
        }
    } catch (error) {
        console.error('Erro ao remover item do carrinho:', error);
    }
}

// Atualizar contador do carrinho
async function updateCartCount() {
    try {
        const response = await fetch(`${API_URL}/carrinho`, {
            credentials: 'include'
        });
        const cart = await response.json();
        
        const cartCount = cart.reduce((total, item) => total + item.quantidade, 0);
        document.getElementById('cart-count').textContent = cartCount;
    } catch (error) {
        console.error('Erro ao atualizar contador do carrinho:', error);
    }
}

// Inicializar a página
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    updateCartCount();
});
