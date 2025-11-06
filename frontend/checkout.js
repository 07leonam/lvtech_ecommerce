const API_URL = 'http://localhost:3000/api';

const MP_PUBLIC_KEY = "TEST-0c1254d5-ab9a-4659-a0a9-a27c9afa39f1";


let mp = null;
let cardPaymentBrick = null;

function initializeMercadoPago() {    
    mp = new MercadoPago(MP_PUBLIC_KEY, {
        locale: 'pt-BR'
    });
}

async function renderCardPaymentBrick(preferenceId) {
    const settings = {
        initialization: {
            preferenceId: preferenceId,
        },
        customization: {
            visual: {
                style: {
                    theme: 'dark'
                }
            }
        },
        callbacks: {
            onReady: () => {
                console.log("Brick de Cartão Pronto");
                document.getElementById('confirm-order-btn').style.display = 'block';
                document.getElementById('next-step-btn').style.display = 'none';
            },
            onSubmit: ({ selectedPaymentMethod, formData }) => {
                console.log("Dados do formulário do Brick:", formData);
                return Promise.resolve();
            },
            onError: (error) => {
                console.error("Erro no Brick de Cartão:", error);
                alert("Erro no pagamento. Tente novamente.");
            },
        },
    };
    
    const cardPaymentContainer = document.getElementById('payment-form-container');
    cardPaymentContainer.innerHTML = '<div id="cardPaymentBrick_container"></div>';
    
    cardPaymentBrick = mp.bricks().create("cardPayment", "cardPaymentBrick_container", settings);
}

async function renderPaymentBrick(preferenceId, paymentType) {
    const settings = {
        initialization: {
            preferenceId: preferenceId,
        },
        customization: {
            paymentMethods: {
                excludedPaymentTypes: paymentType === 'mp_pix' ? ['ticket'] : ['credit_card', 'debit_card', 'bank_transfer', 'atm'],

            }
        },
        callbacks: {
            onReady: () => {
                console.log("Brick de Pagamento Pronto");
                document.getElementById('confirm-order-btn').style.display = 'block';
                document.getElementById('next-step-btn').style.display = 'none';
            },
            onSubmit: (formData) => {
                console.log("Dados do formulário do Brick:", formData);
                return Promise.resolve();
            },
            onError: (error) => {
                console.error("Erro no Brick de Pagamento:", error);
                alert("Erro no pagamento. Tente novamente.");
            },
        },
    };
    
    const paymentContainer = document.getElementById('payment-form-container');
    paymentContainer.innerHTML = '<div id="paymentBrick_container"></div>';
    paymentContainer.innerHTML = `<p>Você selecionou ${paymentType === 'mp_pix' ? 'PIX' : 'Boleto'}. Clique em "Confirmar Pagamento" para finalizar o pedido e gerar o código/boleto.</p>`;
    document.getElementById('confirm-order-btn').style.display = 'block';
    document.getElementById('next-step-btn').style.display = 'none';
}

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
            return data.preferenceId;
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
    const paymentContainer = document.getElementById('payment-form-container');
    

    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const endereco = document.getElementById('endereco').value;
    if (!nome || !email || !endereco || forma_pagamento === "") {
        alert("Por favor, preencha todos os campos e selecione uma forma de pagamento.");
        return;
    }
    
    paymentContainer.innerHTML = '';
    document.getElementById('confirm-order-btn').style.display = 'none';

    if (forma_pagamento.startsWith('mp_')) {
        initializeMercadoPago();
        
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
        
        const preferenceId = await createPreference(mpItems);
        
        if (preferenceId) {
            if (forma_pagamento === 'mp_cartao') {
                renderCardPaymentBrick(preferenceId);
            } else {
                renderPaymentBrick(preferenceId, forma_pagamento);
            }
        }
    } else {
        paymentContainer.innerHTML = `<p>Você selecionou ${forma_pagamento}. Clique em "Confirmar Pagamento" para finalizar o pedido.</p>`;
        document.getElementById('confirm-order-btn').style.display = 'block';
        document.getElementById('next-step-btn').style.display = 'none';
    }
});

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
                forma_pagamento,

            })
        });
        
        if (response.ok) {
            alert('Pedido finalizado com sucesso! Redirecionando para a página inicial.');
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
});
