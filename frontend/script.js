// Configuração da API
const API_URL = 'http://localhost:3000/api';

// Carregar produtos na página inicial
async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}/produtos`);
        const products = await response.json();
        
        const productsList = document.getElementById('products-list');
        productsList.innerHTML = '';
        
        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <img src="${API_URL.replace('/api', '')}/uploads/${product.imagem}" alt="${product.nome}" onerror="this.src='https://via.placeholder.com/200'">
                <h3>${product.nome}</h3>
                <p>R$ ${parseFloat(product.preco).toFixed(2)}</p>
                <button onclick="viewProduct(${product.id})">Ver Detalhes</button>
            `;
            productsList.appendChild(productCard);
        });
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
    }
}

// Redirecionar para a página de detalhes do produto
function viewProduct(productId) {
    window.location.href = `produto.html?id=${productId}`;
}

// Atualizar contador do carrinho
async function updateCartCount() {
    try {
        const response = await fetch(`${API_URL}/carrinho`, {
            credentials: 'include' // Incluir cookies da sessão
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
    loadProducts();
    updateCartCount();
});
