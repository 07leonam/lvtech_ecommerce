const API_URL = 'http://localhost:3000/api';

// --- FUNÇÕES AUXILIARES ---

// Salva dados do formulário para não perder quando for ao Mercado Pago
function saveCustomerData() {
    const data = {
        nome: document.getElementById('nome').value,
        email: document.getElementById('email').value,
        endereco: document.getElementById('endereco').value,
        forma_pagamento: document.getElementById('forma_pagamento').value
    };
    localStorage.setItem('checkout_data', JSON.stringify(data));
}

// Recupera os dados quando o cliente volta
function getSavedCustomerData() {
    const data = localStorage.getItem('checkout_data');
    return data ? JSON.parse(data) : null;
}

// --- INTEGRAÇÃO COM BACKEND ---

async function createPreference(items) {
    try {
        const response = await fetch(`${API_URL}/checkout/preference`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ items: items }) // O backend vai ignorar isso e usar o DB, mas mantemos por compatibilidade
        });
        
        if (response.ok) {
            const data = await response.json();
            return { preferenceId: data.preferenceId, initPoint: data.initPoint }; 
        } else {
            const errorText = await response.text();
            alert(`Erro no servidor: ${errorText}`);
            return null;
        }
    } catch (error) {
        console.error('Erro de rede:', error);
        alert('Erro de conexão ao criar pagamento.');
        return null;
    }
}

async function fetchCartItems() {
    try {
        const response = await fetch(`${API_URL}/carrinho`, { credentials: 'include' });
        return response.ok ? await response.json() : [];
    } catch (error) {
        console.error('Erro ao buscar carrinho:', error);
        return [];
    }
}

// --- FINALIZAÇÃO DO PEDIDO (PÓS-PAGAMENTO) ---

async function finalizeOrder(status) {
    if (status !== 'success' && status !== 'pending') return;
    
    // CORREÇÃO CRÍTICA: Recupera dados do localStorage, pois os inputs estarão vazios
    const savedData = getSavedCustomerData();
    
    if (!savedData || !savedData.nome) {
        alert("Atenção: Pagamento confirmado, mas houve um erro ao recuperar seus dados de cadastro. Entre em contato com o suporte.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                nome: savedData.nome,
                email: savedData.email,
                endereco: savedData.endereco,
                forma_pagamento: savedData.forma_pagamento || 'mp_padrao', 
            })
        });

        if (response.ok) {
            // Limpa o carrinho visual e os dados salvos
            localStorage.removeItem('checkout_data'); 
            alert(`🎉 Pagamento ${status === 'success' ? 'APROVADO' : 'PENDENTE'}! Pedido realizado com sucesso.`);
            window.location.href = 'index.html';
        } else {
            const errorText = await response.text();
            alert(`Erro ao salvar pedido: ${errorText}`);
        }
    } catch (error) {
        console.error('Erro ao finalizar:', error);
        alert('Erro ao registrar o pedido no sistema.');
    }
}

// --- EVENTOS ---

document.getElementById('next-step-btn').addEventListener('click', async () => {
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const endereco = document.getElementById('endereco').value;
    const forma_pagamento = document.getElementById('forma_pagamento').value;
    
    if (!nome || !email || !endereco || forma_pagamento === "") {
        alert("Por favor, preencha todos os campos e selecione uma forma de pagamento.");
        return;
    }
    
    // 1. Salva os dados ANTES de sair do site
    saveCustomerData();

    const cartItems = await fetchCartItems();
    if (cartItems.length === 0) {
        alert("Seu carrinho está vazio.");
        return;
    }
    
    // Mapeamento simples (o backend valida os preços reais)
    const mpItems = cartItems.map(item => ({
        title: item.nome,
        quantity: item.quantidade,
        unit_price: item.preco
    }));
    
    // 2. Cria a preferência
    const result = await createPreference(mpItems);
    
    if (result && result.initPoint) {
        console.log("Redirecionando para Mercado Pago...");
        window.location.href = result.initPoint;
    }
});

document.getElementById('checkout-form').addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Clique em "Avançar para o Pagamento" para finalizar.');
});

// --- INICIALIZAÇÃO ---

async function updateCartCount() {
    try {
        const response = await fetch(`${API_URL}/carrinho`, { credentials: 'include' });
        if (response.ok) {
            const cart = await response.json();
            const cartCount = cart.reduce((total, item) => total + item.quantidade, 0);
            document.getElementById('cart-count').textContent = cartCount;
        }
    } catch (error) { console.error(error); }
}

document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    
    // Se voltamos do Mercado Pago, tentamos preencher os campos visualmente para o usuário ver
    const savedData = getSavedCustomerData();
    if (savedData) {
        document.getElementById('nome').value = savedData.nome || '';
        document.getElementById('email').value = savedData.email || '';
        document.getElementById('endereco').value = savedData.endereco || '';
    }

    // Verifica parâmetros da URL (Retorno do MP)
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    
    if (status) {
        if (status === 'success' || status === 'pending') {
            console.log(`Retorno MP: ${status}. Finalizando pedido...`);
            finalizeOrder(status);
        } else if (status === 'failure') {
            alert("❌ O pagamento foi recusado pelo Mercado Pago.");
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
});