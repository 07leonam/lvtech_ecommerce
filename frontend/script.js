// Configuração da API
const API_URL = 'http://localhost:3000/api';

// Atualizar contador do carrinho
async function updateCartCount() {
    try {
        const response = await fetch(`${API_URL}/carrinho`, {
            credentials: 'include' // Incluir cookies da sessão
        });
        
        if (!response.ok) {
            throw new Error(`Erro de rede: ${response.statusText}`);
        }
        
        const cart = await response.json();
        
        const cartCount = cart.reduce((total, item) => total + item.quantidade, 0);
        
        const cartCountElement = document.getElementById('cart-count');
        if (cartCountElement) {
            cartCountElement.textContent = cartCount;
        }
    } catch (error) {
        console.error('Erro ao atualizar contador do carrinho:', error);
    }
}

// Inicializar a página
document.addEventListener('DOMContentLoaded', () => {
    // A função loadProducts() foi removida daqui, pois a index.html agora lista modelos estaticamente.
    updateCartCount();
});

