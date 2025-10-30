// Configuração da API
const API_URL = 'http://localhost:3000/api';

// Chave pública do Mercado Pago (Substitua pela sua chave pública real)
// ATENÇÃO: Em um ambiente de produção, esta chave deve ser carregada de forma segura.
const MP_PUBLIC_KEY = "TEST-0c1254d5-ab9a-4659-a0a9-a27c9afa39f1"; 

// Variáveis globais para o Mercado Pago
let mp = null;
let cardPaymentBrick = null;

// Função para inicializar o Mercado Pago
function initializeMercadoPago() {
    if (MP_PUBLIC_KEY === "SUA_CHAVE_PUBLICA_DO_MERCADO_PAGO_AQUI") {
        console.error("ERRO: Substitua 'SUA_CHAVE_PUBLICA_DO_MERCADO_PAGO_AQUI' pela sua chave pública real do Mercado Pago.");
        alert("Erro de configuração: Chave pública do Mercado Pago ausente.");
        return;
    }
    
    mp = new MercadoPago(MP_PUBLIC_KEY, {
        locale: 'pt-BR'
    });
}

// Função para renderizar o Brick de Cartão
async function renderCardPaymentBrick(preferenceId) {
    const settings = {
        initialization: {
            preferenceId: preferenceId,
            // Outras configurações de inicialização
        },
        customization: {
            // Personalização do Brick
            visual: {
                style: {
                    theme: 'dark' // ou 'bootstrap', 'flat', 'dark'
                }
            }
        },
        callbacks: {
            onReady: () => {
                // Callback chamado quando o Brick está pronto
                console.log("Brick de Cartão Pronto");
                document.getElementById('confirm-order-btn').style.display = 'block';
                document.getElementById('next-step-btn').style.display = 'none';
            },
            onSubmit: ({ selectedPaymentMethod, formData }) => {
                // Callback chamado ao submeter o formulário do Brick
                // Aqui você enviaria os dados do cartão para o seu backend
                console.log("Dados do formulário do Brick:", formData);
                
                // O Brick de Pagamento de Cartão (Card Payment Brick) é projetado para
                // enviar os dados de pagamento diretamente para o backend do Mercado Pago
                // e retornar um ID de pagamento.
                // Como não temos um backend completo para processar o pagamento,
                // vamos simular o envio do formulário de checkout principal.
                
                // Em um cenário real, você faria:
                // return new Promise((resolve, reject) => {
                //     fetch("/process_payment", {
                //         method: "POST",
                //         headers: {
                //             "Content-Type": "application/json",
                //         },
                //         body: JSON.stringify(formData)
                //     })
                //     .then((response) => {
                //         // receber o resultado do pagamento
                //         resolve();
                //     })
                //     .catch((error) => {
                //         // lidar com a falha
                //         reject();
                //     })
                // });
                
                // Para fins de demonstração, vamos apenas resolver a promessa e
                // usar o botão de "Confirmar Pagamento" para finalizar o pedido.
                return Promise.resolve();
            },
            onError: (error) => {
                // Callback chamado em caso de erro
                console.error("Erro no Brick de Cartão:", error);
                alert("Erro no pagamento. Tente novamente.");
            },
        },
    };
    
    const cardPaymentContainer = document.getElementById('payment-form-container');
    cardPaymentContainer.innerHTML = '<div id="cardPaymentBrick_container"></div>';
    
    cardPaymentBrick = mp.bricks().create("cardPayment", "cardPaymentBrick_container", settings);
}

// Função para renderizar o Brick de Pagamento (PIX/Boleto)
async function renderPaymentBrick(preferenceId, paymentType) {
    const settings = {
        initialization: {
            preferenceId: preferenceId,
        },
        customization: {
            // Personalização
            paymentMethods: {
                // Oculta métodos de pagamento não desejados
                excludedPaymentTypes: paymentType === 'mp_pix' ? ['ticket'] : ['credit_card', 'debit_card', 'bank_transfer', 'atm'],
                // Se for mp_pix, exclui boleto. Se for mp_boleto, exclui o resto.
                // Como o Payment Brick é mais amplo, é mais fácil usar o Checkout Pro/API para PIX/Boleto.
                // Para simplificar e demonstrar a integração, vamos usar o Checkout Pro para PIX/Boleto.
                // O Payment Brick é mais complexo para configurar métodos únicos.
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
    
    // O Payment Brick requer um backend para criar a preferência com o tipo de pagamento correto.
    // Para simplificar a demonstração no frontend, vamos usar o Checkout Pro para PIX/Boleto.
    // O Payment Brick é mais adequado para Cartão de Crédito/Débito.
    
    // Como alternativa, vamos apenas mostrar uma mensagem e usar o botão de "Confirmar Pagamento".
    paymentContainer.innerHTML = `<p>Você selecionou ${paymentType === 'mp_pix' ? 'PIX' : 'Boleto'}. Clique em "Confirmar Pagamento" para finalizar o pedido e gerar o código/boleto.</p>`;
    document.getElementById('confirm-order-btn').style.display = 'block';
    document.getElementById('next-step-btn').style.display = 'none';
}

// Função para gerar a preferência de pagamento no backend
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
                // Aqui você adicionaria informações do comprador se já estivessem preenchidas
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

// Função para buscar os itens do carrinho
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

// Lógica do botão "Próximo Passo"
document.getElementById('next-step-btn').addEventListener('click', async () => {
    const forma_pagamento = document.getElementById('forma_pagamento').value;
    const paymentContainer = document.getElementById('payment-form-container');
    
    // Validação básica dos campos de usuário
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const endereco = document.getElementById('endereco').value;
    if (!nome || !email || !endereco || forma_pagamento === "") {
        alert("Por favor, preencha todos os campos e selecione uma forma de pagamento.");
        return;
    }
    
    // Limpa o container de pagamento
    paymentContainer.innerHTML = '';
    document.getElementById('confirm-order-btn').style.display = 'none';
    
    // Se for Mercado Pago, inicializa e cria a preferência
    if (forma_pagamento.startsWith('mp_')) {
        initializeMercadoPago();
        
        const cartItems = await fetchCartItems();
        if (cartItems.length === 0) {
            alert("Seu carrinho está vazio.");
            return;
        }
        
        // Formata os itens para o Mercado Pago
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
                // Para PIX e Boleto, usamos o Payment Brick de forma simplificada
                renderPaymentBrick(preferenceId, forma_pagamento);
            }
        }
    } else {
        // Para outras formas de pagamento (simuladas)
        paymentContainer.innerHTML = `<p>Você selecionou ${forma_pagamento}. Clique em "Confirmar Pagamento" para finalizar o pedido.</p>`;
        document.getElementById('confirm-order-btn').style.display = 'block';
        document.getElementById('next-step-btn').style.display = 'none';
    }
});

// Processar o formulário de checkout (agora apenas para finalizar o pedido após a etapa de pagamento)
document.getElementById('checkout-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const endereco = document.getElementById('endereco').value;
    const forma_pagamento = document.getElementById('forma_pagamento').value;
    
    // Em um cenário real, aqui você verificaria o status do pagamento do Mercado Pago
    // e só finalizaria o pedido se o pagamento fosse bem-sucedido.
    
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
                // Adicionar o ID de pagamento do Mercado Pago aqui (se aplicável)
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

// Atualizar contador do carrinho
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

// Inicializar a página
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
});
