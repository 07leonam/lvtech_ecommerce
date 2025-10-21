// Configuração da API
const API_URL = 'http://localhost:3000/api';

// Processar o formulário de checkout
document.getElementById('checkout-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const endereco = document.getElementById('endereco').value;
    const forma_pagamento = document.getElementById('forma_pagamento').value;
    
    try {
        const response = await fetch(`${API_URL}/checkout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                nome,
                email,
                endereco,
                forma_pagamento
            })
        });
        
        if (response.ok) {
            alert('Pedido finalizado com sucesso!');
            window.location.href = 'index.html';
        } else {
            const errorText = await response.text();
            alert(`Erro ao finalizar pedido: ${errorText}`);
        }
    } catch (error) {
        console.error('Erro ao finalizar pedido:', error);
        alert('Erro ao finalizar pedido. Verifique se você está autenticado.');
    }
});

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
    updateCartCount();
});
