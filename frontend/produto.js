// Configuração da API
const API_URL = 'http://localhost:3000/api';

// Obter o ID do produto da URL
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');

// Carregar detalhes do produto
async function loadProductDetails() {
    try {
        const response = await fetch(`${API_URL}/produtos/${productId}`);
        const product = await response.json();
        
        document.getElementById('product-name').textContent = product.nome;
        document.getElementById('product-description').textContent = product.descricao;
        document.getElementById('product-price').textContent = parseFloat(product.preco).toFixed(2);
        document.getElementById('product-stock').textContent = product.estoque;
        document.getElementById('product-image').src = `${API_URL.replace('/api', '')}/uploads/${product.imagem}`;
        document.getElementById('product-image').alt = product.nome;
        document.getElementById('product-image').onerror = function() {
            this.src = 'https://via.placeholder.com/400';
        };
        
        // Configurar o botão de adicionar ao carrinho
        document.getElementById('add-to-cart-btn').addEventListener('click', () => addToCart(product.id));
    } catch (error) {
        console.error('Erro ao carregar detalhes do produto:', error);
    }
}

// Adicionar produto ao carrinho
async function addToCart(productId) {
    const quantity = parseInt(document.getElementById('quantity').value);
    
    if (quantity <= 0) {
        alert('Quantidade inválida.');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/carrinho/adicionar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include', // Incluir cookies da sessão
            body: JSON.stringify({
                produto_id: productId,
                quantidade: quantity
            })
        });
        
        if (response.ok) {
            alert('Produto adicionado ao carrinho!');
            updateCartCount();
        } else {
            alert('Erro ao adicionar produto ao carrinho.');
        }
    } catch (error) {
        console.error('Erro ao adicionar produto ao carrinho:', error);
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
    loadProductDetails();
    updateCartCount();
});
