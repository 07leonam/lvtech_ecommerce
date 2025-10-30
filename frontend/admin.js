// Configuração da API
const API_URL = 'http://localhost:3000/api';

// Verificar se o usuário está autenticado
let isAuthenticated = false;

// Login de administrador
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;
    
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ email, senha })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('Resposta do Login (Data):', data);
            if (data.user.tipo === 'admin') {
                isAuthenticated = true;
                document.getElementById('login-section').style.display = 'none';
                document.getElementById('admin-dashboard').style.display = 'block';
                loadAdminProducts();
            } else {
                alert('Acesso negado. Apenas administradores podem acessar esta página.');
            }
        } else {
            alert('Email ou senha inválidos.');
        }
    } catch (error) {
        console.error('Erro no login:', error);
        alert('Erro ao fazer login.');
    }
});

// Logout
document.getElementById('logout-btn').addEventListener('click', async (e) => {
    e.preventDefault();
    
    try {
        await fetch(`${API_URL}/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        
        isAuthenticated = false;
        document.getElementById('login-section').style.display = 'block';
        document.getElementById('admin-dashboard').style.display = 'none';
        document.getElementById('login-form').reset();
    } catch (error) {
        console.error('Erro no logout:', error);
    }
});

// Carregar produtos para o administrador
async function loadAdminProducts() {
    try {
        const response = await fetch(`${API_URL}/produtos`);
        const products = await response.json();
        
        const productsList = document.getElementById('admin-products-list');
        productsList.innerHTML = '';
        
        products.forEach(product => {
            const productItem = document.createElement('div');
            productItem.className = 'admin-product-item';
            productItem.innerHTML = `
                <div>
                    <h5>${product.nome}</h5>
                    <p>Preço: R$ ${parseFloat(product.preco).toFixed(2)} | Estoque: ${product.estoque}</p>
                </div>
                <div>
                    <button onclick="editProduct(${product.id})">Editar</button>
                    <button class="delete-btn" onclick="deleteProduct(${product.id})">Excluir</button>
                </div>
            `;
            productsList.appendChild(productItem);
        });
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
    }
}

// Salvar produto (criar ou atualizar)
document.getElementById('product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const productId = document.getElementById('product-id').value;
    const nome = document.getElementById('product-nome').value;
    const descricao = document.getElementById('product-descricao').value;
    const preco = document.getElementById('product-preco').value;
    const estoque = document.getElementById('product-estoque').value;
    const imagemFile = document.getElementById('product-imagem').files[0];
    
    const formData = new FormData();
    formData.append('nome', nome);
    formData.append('descricao', descricao);
    formData.append('preco', preco);
    formData.append('estoque', estoque);
    if (imagemFile) {
        formData.append('imagem', imagemFile);
    }
    
    try {
        let response;
        if (productId) {
            // Atualizar produto existente
            response = await fetch(`${API_URL}/admin/produtos/${productId}`, {
                method: 'PUT',
                credentials: 'include',
                body: formData
            });
        } else {
            // Criar novo produto
            response = await fetch(`${API_URL}/admin/produtos`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });
        }
        
        if (response.ok) {
            alert('Produto salvo com sucesso!');
            document.getElementById('product-form').reset();
            document.getElementById('product-id').value = '';
            loadAdminProducts();
        } else {
            alert('Erro ao salvar produto.');
        }
    } catch (error) {
        console.error('Erro ao salvar produto:', error);
    }
});

// Editar produto
async function editProduct(productId) {
    try {
        const response = await fetch(`${API_URL}/produtos/${productId}`);
        const product = await response.json();
        
        document.getElementById('product-id').value = product.id;
        document.getElementById('product-nome').value = product.nome;
        document.getElementById('product-descricao').value = product.descricao;
        document.getElementById('product-preco').value = product.preco;
        document.getElementById('product-estoque').value = product.estoque;
        
        // Scroll para o formulário
        document.getElementById('product-form').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Erro ao carregar produto para edição:', error);
    }
}

// Excluir produto
async function deleteProduct(productId) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/admin/produtos/${productId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (response.ok) {
            alert('Produto excluído com sucesso!');
            loadAdminProducts();
        } else {
            alert('Erro ao excluir produto.');
        }
    } catch (error) {
        console.error('Erro ao excluir produto:', error);
    }
}

// Limpar formulário
document.getElementById('clear-form-btn').addEventListener('click', () => {
    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = '';
});

// Relatório de vendas por produto
document.getElementById('relatorio-vendas-btn').addEventListener('click', async () => {
    try {
        const response = await fetch(`${API_URL}/admin/relatorios/vendas-por-produto`, {
            credentials: 'include'
        });
        const data = await response.json();
        
        const relatorioResultado = document.getElementById('relatorio-resultado');
        relatorioResultado.innerHTML = '<h4>Vendas por Produto</h4>';
        
        if (data.length === 0) {
            relatorioResultado.innerHTML += '<p>Nenhuma venda registrada.</p>';
            return;
        }
        
        const table = document.createElement('table');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Produto</th>
                    <th>Total Vendido</th>
                    <th>Receita Total</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(item => `
                    <tr>
                        <td>${item.nome}</td>
                        <td>${item.total_vendido}</td>
                        <td>R$ ${parseFloat(item.receita_total).toFixed(2)}</td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        relatorioResultado.appendChild(table);
    } catch (error) {
        console.error('Erro ao gerar relatório de vendas:', error);
    }
});

// Relatório de total de pedidos
document.getElementById('relatorio-pedidos-btn').addEventListener('click', async () => {
    try {
        const response = await fetch(`${API_URL}/admin/relatorios/total-pedidos`, {
            credentials: 'include'
        });
        const data = await response.json();
        
        const relatorioResultado = document.getElementById('relatorio-resultado');
        relatorioResultado.innerHTML = `
            <h4>Total de Pedidos</h4>
            <p><strong>Total de Pedidos:</strong> ${data.total_pedidos}</p>
            <p><strong>Pedidos Entregues:</strong> ${data.pedidos_entregues}</p>
            <p><strong>Pedidos Pendentes:</strong> ${data.pedidos_pendentes}</p>
        `;
    } catch (error) {
        console.error('Erro ao gerar relatório de pedidos:', error);
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
