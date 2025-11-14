// index_logic.js


const API_BASE_URL = API_URL.replace('/api', '');
// Helper para formatar o preço
const formatPrice = (price) => {
    return `R$ ${parseFloat(price).toFixed(2).replace('.', ',')}`;
};

// A função getFolderNameFromProductName não é mais necessária, pois usaremos o ID do produto.
// Deixando um placeholder para evitar erros de referência, mas a lógica será alterada abaixo.
const getFolderNameFromProductName = (productName) => {
    return "placeholder";
};


async function loadIndexModels() {
    const modelsListDiv = document.getElementById('models-list');
    if (!modelsListDiv) return;

    try {
        const response = await fetch(`${API_URL}/produtos`);
        const allProducts = await response.json();
        
        if (!allProducts || allProducts.length === 0) {
            modelsListDiv.innerHTML = '<p>Nenhum produto encontrado na loja.</p>';
            return;
        }

        const modelRegex = /iPhone\s\d+\s?(Pro Max|Pro|e)?/i; 
        
        // 1. Agrupamento
        const modelsMap = allProducts.reduce((acc, product) => {
            const match = product.nome.match(modelRegex); 
            if (!match) return acc;

            const modelName = match[0].trim();
            
            if (!acc[modelName]) {
                acc[modelName] = product;
            } else {
                if (parseFloat(product.preco) < parseFloat(acc[modelName].preco)) {
                    acc[modelName].preco = product.preco;
                }
            }
            return acc;
        }, {});
        
        modelsListDiv.innerHTML = ''; 

        // 2. Cria os cards dinamicamente
        Object.values(modelsMap).forEach(product => {
            const modelNameMatch = product.nome.match(modelRegex); 
            const modelName = modelNameMatch ? modelNameMatch[0].trim() : 'Modelo Desconhecido';
            const pageParam = modelName.toLowerCase().replace(/\s/g, ''); 
            
                        // --- NOVA MONTAGEM DA URL USANDO ID DO PRODUTO ---
            const dbImagePath = product.imagem; 
            
            let imageUrl = 'https://via.placeholder.com/220/0A0A0A/B8860B?text=Sem+Imagem';

            if (dbImagePath) {
                // O campo 'imagem' no DB agora deve conter o caminho completo (ex: 1/1.webp)
                // O produto retornado aqui é o produto com o menor preço, que tem um ID.
                const imagePath = dbImagePath; // Assumindo que dbImagePath já é o caminho completo (ex: 1/1.webp)
                
                // Monta a URL FINAL: /uploads/{id_produto}/{nome_arquivo}
                imageUrl = `${API_BASE_URL}/uploads/${imagePath}`; 
            }
            // ------------------------------------

            // 4. Cria o card HTML
            const cardHtml = `
                <div class="product-card" onclick="window.location.href='product_detail.html?model=${pageParam}'">
                    <img src="${imageUrl}" alt="${modelName}">
                    <h3>${modelName}</h3>
                    <p>A partir de ${formatPrice(product.preco)}</p>
                    <button>Ver Opções</button>
                </div>
            `;
            
            modelsListDiv.insertAdjacentHTML('beforeend', cardHtml);
        });

    } catch (error) {
        console.error('Erro ao carregar modelos para a página inicial:', error);
        modelsListDiv.innerHTML = '<p>Erro ao carregar produtos. Verifique o servidor.</p>';
    }
}

document.addEventListener('DOMContentLoaded', loadIndexModels);