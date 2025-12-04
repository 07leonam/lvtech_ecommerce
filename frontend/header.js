const AUTH_API_URL = 'https://lvtech-backend.onrender.com/api';

async function updateHeaderAuth() {
    // Procura o elemento com ID 'auth-link' no HTML
    const authLink = document.getElementById('auth-link');
    
    // Se não achar (ex: página de login não tem menu), para o código
    if (!authLink) return;

    try {
        // Pergunta ao backend: "Quem está logado?"
        const response = await fetch(`${AUTH_API_URL}/status`, { 
            method: 'GET',
            credentials: 'include' 
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // SE ESTIVER LOGADO (Seja Admin ou Cliente):
            // 1. Pega o primeiro nome para não ficar muito grande
            const primeiroNome = data.user.nome.split(' ')[0];

            // 2. Muda o HTML do menu
            // Note que adicionei classes CSS para você poder estilizar se quiser
            authLink.innerHTML = `
                <div class="user-menu" style="display: flex; gap: 15px; align-items: center;">
                    <span>Olá, <strong>${primeiroNome}</strong></span>
                    <a href="meus-pedidos.html">Meus Pedidos</a>
                    <a href="#" id="btn-logout" style="color: #dc3545; font-weight: bold;">Sair</a>
                </div>
            `;

            // 3. Adiciona a função de Logout ao botão que acabamos de criar
            document.getElementById('btn-logout').addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    await fetch(`${AUTH_API_URL}/logout`, { 
                        method: 'POST', 
                        credentials: 'include' 
                    });
                    // Recarrega a página para o site "perceber" que deslogou e voltar o botão de Login
                    window.location.reload(); 
                } catch (error) {
                    console.error('Erro ao sair:', error);
                }
            });
        }
        // Se a resposta não for OK (401/403), ele mantém o botão "Login" original do HTML
    } catch (error) {
        // Silencia erros de conexão para não travar o site, apenas mantém como deslogado
        console.log('Usuário não logado ou API offline');
    }
}

// Executa a função assim que o HTML terminar de carregar
document.addEventListener('DOMContentLoaded', updateHeaderAuth);