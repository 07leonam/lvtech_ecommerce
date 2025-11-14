const API_URL = 'http://localhost:3000/api';

// Funções de Bricks foram removidas.

async function createPreference(items) {
    try {
        const response = await fetch(`${API_URL}/checkout/preference`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                items: items,
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            // Retorna a preferência e o initPoint (URL de redirecionamento)
            return { preferenceId: data.preferenceId, initPoint: data.initPoint }; 
        } else {
            const errorText = await response.text();
            alert(`Erro ao criar preferência de pagamento: ${errorText}`);
            return null;
        }
    } catch (error) {
        console.error('Erro de rede ao criar preferência:', error);
        alert('Erro de rede ao criar preferência de pagamento.');
        return null;
    }
}


async function fetchCartItems() {
    // ... (função inalterada)
    try {
        const response = await fetch(`${API_URL}/carrinho`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            return await response.json();
        } else {
            return [];
        }
    } catch (error) {
        console.error('Erro ao buscar itens do carrinho:', error);
        return [];
    }
}

// NOVA FUNÇÃO: Finaliza o pedido no backend (deduz estoque, registra)
async function finalizeOrder(status) {
    // Esta função deve ser chamada apenas após o redirecionamento do MP
    if (status !== 'success' && status !== 'pending') return;
    
    // Tenta obter a forma de pagamento do campo, caso contrário, usa um padrão MP
    const forma_pagamento = document.getElementById('forma_pagamento').value || (status === 'success' ? 'mp_cartao' : 'mp_pix'); 
    
    // Assume que os campos de endereço já estão preenchidos antes do redirecionamento
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const endereco = document.getElementById('endereco').value;
    
    if (!nome || !email || !endereco) {
        alert("Erro: Dados do cliente ausentes após o retorno do pagamento.");
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
    }

    try {
        const response = await fetch(`${API_URL}/checkout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                // O backend usa a session cart, estes dados são para o registro do pedido.
                nome,
                email,
                endereco,
                forma_pagamento, 
            })
        });

        if (response.ok) {
            alert(`🎉 Pagamento ${status.toUpperCase()}! Pedido finalizado com sucesso.`);
            window.location.href = 'index.html';
        } else {
            const errorText = await response.text();
            alert(`Erro ao finalizar pedido no backend: ${errorText}. Status: ${status}.`);
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    } catch (error) {
        console.error('Erro de rede ao finalizar pedido:', error);
        alert('Erro de rede ao finalizar pedido. Verifique o console.');
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}


document.getElementById('next-step-btn').addEventListener('click', async () => {
    const forma_pagamento = document.getElementById('forma_pagamento').value;
    // Removendo a referência ao payment-form-container e confirm-order-btn, pois o fluxo é sempre redirecionamento

    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const endereco = document.getElementById('endereco').value;
    
    if (!nome || !email || !endereco || forma_pagamento === "") {
        alert("Por favor, preencha todos os campos e selecione uma forma de pagamento.");
        return;
    }
    
    const cartItems = await fetchCartItems();
    if (cartItems.length === 0) {
        alert("Seu carrinho está vazio.");
        return;
    }
    
    const mpItems = cartItems.map(item => ({
        title: item.nome,
        quantity: item.quantidade,
        unit_price: item.preco
    }));
    
    const result = await createPreference(mpItems);
    
    if (result && result.initPoint) {
        // REDIRECIONAMENTO PARA O CHECKOUT PRO DO MERCADO PAGO
        console.log("Redirecionando para: ", result.initPoint);
        window.location.href = result.initPoint;
    }
});

document.getElementById('checkout-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Bloqueia a submissão direta do formulário. A ordem é finalizada APÓS o retorno do MP.
    alert('A finalização do pedido é feita após a confirmação do pagamento no Mercado Pago. Por favor, clique em "Avançar para o Pagamento".');
});

async function updateCartCount() {
    // ... (função inalterada)
    try {
        const response = await fetch(`${API_URL}/carrinho`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const cart = await response.json();
            const cartCount = cart.reduce((total, item) => total + item.quantidade, 0);
            document.getElementById('cart-count').textContent = cartCount;
        }
    } catch (error) {
        console.error('Erro ao atualizar contador do carrinho:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    
    // LÓGICA PARA TRATAR O RETORNO DO MERCADO PAGO NA MESMA PÁGINA
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    
    if (status) {
        // Se houver um status na URL, o usuário retornou do Mercado Pago.
        // O pedido deve ser FINALIZADO no nosso backend aqui, se aprovado ou pendente.
        
        if (status === 'success') {
            console.log("Status: Pagamento APROVADO. Iniciando finalização do pedido no backend...");
            finalizeOrder('success'); // Inicia a finalização
        } else if (status === 'pending') {
            console.log("Status: Pagamento PENDENTE. Iniciando finalização do pedido no backend (status_pagamento: Aguardando)...");
            finalizeOrder('pending'); // Inicia a finalização
        } else if (status === 'failure') {
            alert("❌ Pagamento RECUSADO. Tente outra forma de pagamento.");
            window.history.replaceState({}, document.title, window.location.pathname); // Limpa o status da URL
        }
    }
});