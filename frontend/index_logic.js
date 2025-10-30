// index_logic.js

// OBS: Assumimos que a variável global API_URL está definida em script.js

// Helper para converter o nome do produto para o formato da pasta (ex: '15_branco')
const getFolderNameFromProductName = (productName) => {
    // CORREÇÃO CRÍTICA: Prioriza '\sPro Max' para que o Max não seja capturado como apenas 'Pro'
    const match = productName.match(/iPhone\s\d+(e|\sPro Max|\sPro)?/);
    if (!match) return null; 

    const modelName = match[0].trim();
    
    let color = 'Cor Desconhecida';
    if (productName.includes('Ultramarino')) color = 'Ultramarino';
    else if (productName.includes('Laranja')) color = 'Laranja';
    else if (productName.includes('Branco')) color = 'Branco';
    else if (productName.includes('Preto')) color = 'Preto';
    
    const modelVersionPart = modelName.replace('iPhone ', '').trim();
    const folderModelPart = modelVersionPart.toLowerCase().replace(/\s/g, '_');
    const folderColorPart = color.toLowerCase();

    let imageFolderName = `${folderModelPart}_${folderColorPart}`;

    // Regra de Exceção para Pro/Pro Max (onde a cor padrão não está no nome da pasta)
    if ((folderModelPart.includes('pro') || folderModelPart.includes('max')) && (folderColorPart === 'preto' || folderColorPart === 'branco' || folderColorPart === 'cor desconhecida')) {
        if (folderColorPart === 'preto' || folderColorPart === 'branco') {
           imageFolderName = folderModelPart; 
        }
    }
    
    return imageFolderName;
};

// Helper para extrair apenas o nome do arquivo, ignorando o caminho da pasta
const getFilename = (path) => {
    if (!path) return null;
    const parts = path.split('/');
    let filename = parts[parts.length - 1];
    const finalFilenameParts = filename.split('\\').pop(); 
    return finalFilenameParts;
};

// Helper para formatar o preço (reutilizado do model_logic.js)
const formatPrice = (price) => {
    return `R$ ${parseFloat(price).toFixed(2).replace('.', ',')}`;
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

        // 1. Agrupa os produtos por nome do modelo (ex: 'iPhone 15')
        const modelsMap = allProducts.reduce((acc, product) => {
            // CORREÇÃO CRÍTICA APLICADA AQUI TAMBÉM
            const match = product.nome.match(/iPhone\s\d+(e|\sPro Max|\sPro)?/); 
            if (!match) return acc;

            const modelName = match[0].trim();
            
            // Apenas guarda o primeiro produto encontrado para este modelo (ele terá a primeira imagem)
            if (!acc[modelName]) {
                acc[modelName] = product;
            } else {
                // Atualiza o preço se encontrar um mais baixo (opcional)
                if (parseFloat(product.preco) < parseFloat(acc[modelName].preco)) {
                    acc[modelName].preco = product.preco;
                }
            }
            return acc;
        }, {});
        
        modelsListDiv.innerHTML = ''; // Limpa o conteúdo

        // 2. Cria os cards dinamicamente
        Object.values(modelsMap).forEach(product => {
            // CORREÇÃO CRÍTICA APLICADA AQUI TAMBÉM
            const modelNameMatch = product.nome.match(/iPhone\s\d+(e|\sPro Max|\sPro)?/); 
            const modelName = modelNameMatch ? modelNameMatch[0].trim() : 'Modelo Desconhecido';

            // Gera o nome do arquivo HTML (ex: 'iPhone 15' -> 'iphone15.html')
            const pageName = modelName.toLowerCase().replace(/\s/g, '').replace('e', 'e'); 
            
            // 3. Montar a URL da imagem usando a lógica de caminhos
            const imageFolderName = getFolderNameFromProductName(product.nome);
            // O campo 'imagem' já é a primeira imagem, mas precisamos limpar o caminho
            const filename = product.imagem ? getFilename(product.imagem) : null;
            
            let imageUrl = 'https://via.placeholder.com/220/0A0A0A/B8860B?text=Sem+Imagem';
            
            if (filename && imageFolderName) {
                // Monta a URL FINAL CORRETA
                imageUrl = `${API_URL.replace('/api', '')}/uploads/${imageFolderName}/${filename}`;
            }

            // 4. Cria o card HTML
            const cardHtml = `
                <div class="product-card" onclick="window.location.href='${pageName}.html'">
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