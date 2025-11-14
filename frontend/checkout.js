const API_URL = 'http://localhost:3000/api';

// Funções dos Bricks (initializeMercadoPago, renderCardPaymentBrick, renderPaymentBrick) foram removidas.

async function createPreference(items) {
    try {
        const response = await fetch(`${API_URL}/checkout/preference`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                items: items, // Este body é ignorado pelo backend (que usa req.session.cart), mas o formato é mantido.
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


document.getElementById('next-step-btn').addEventListener('click', async () => {
    const forma_pagamento = document.getElementById('forma_pagamento').value;
    // Removendo a referência ao paymentContainer e confirm-order-btn, pois o fluxo é sempre redirecionamento

    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const endereco = document.getElementById('endereco').value;
    
    if (!nome || !email || !endereco || forma_pagamento === "") {
        alert("Por favor, preencha todos os campos e selecione uma forma de pagamento.");
        return;
    }
    
    // O fluxo é sempre Mercado Pago por redirecionamento agora
    
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

// Este listener agora serve apenas como um bloqueador e ponto de informação,
// já que a finalização real será após o retorno do Mercado Pago (via URL status).
document.getElementById('checkout-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    alert('O pedido será finalizado após o pagamento no Mercado Pago. Por favor, clique em "Avançar para o Pagamento" para continuar.');
});

async function updateCartCount() {
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
        let alertMessage = "";
        
        if (status === 'success') {
            alertMessage = "🎉 Pagamento APROVADO! Seu pedido foi finalizado.";
        } else if (status === 'pending') {
            alertMessage = "⏳ Pagamento PENDENTE. O pedido será processado assim que o pagamento for confirmado (ex: PIX/Boleto).";
        } else if (status === 'failure') {
            alertMessage = "❌ Pagamento RECUSADO. Tente outra forma de pagamento.";
        }
        
        alert(alertMessage);
        
        // Limpa o status da URL e redireciona para a página inicial (se for sucesso ou pendente)
        window.history.replaceState({}, document.title, window.location.pathname);
        if (status === 'success' || status === 'pending') {
            // No cenário real, aqui você chamaria sua rota /api/checkout após
            // obter a confirmação do MP via Webhook ou GET.
            // Para simplificação, redirecionamos para a home:
            window.location.href = 'index.html'; 
        }
    }
});