// Configuração da API
const API_URL = 'http://localhost:3000/api';

// Mapeamento de modelos para cores e armazenamentos (será carregado do backend)
let modelData = {};
let allProducts = [];

// Variáveis de estado
let currentModelName = '';
let selectedColor = null;
let selectedStorage = null;
let currentProductId = null;
let currentProductPrice = 0;
let currentProductStock = 0;

// Função auxiliar para formatar preço
const formatPrice = (price) => {
    return `R$ ${parseFloat(price).toFixed(2).replace('.', ',')}`;
};

// Função para buscar todos os produtos e agrupar por modelo
async function fetchAndGroupProducts() {
    try {
        const response = await fetch(`${API_URL}/produtos`);
        allProducts = await response.json();
        
        // Agrupar produtos por modelo (ex: 'iPhone 15', 'iPhone 16e', etc.)
        const grouped = allProducts.reduce((acc, product) => {
            // Extrai o nome do modelo (ex: 'iPhone 15', 'iPhone 17 Pro Max')
            const match = product.nome.match(/iPhone\s\d+(e|\sPro|\sPro\sMax)?/);
            if (!match) return acc;

            const modelName = match[0].trim();
            
            // Extrai a cor (ex: 'Branco', 'Preto', 'Ultramarino', 'Laranja')
            let color = 'Cor Desconhecida';
            if (product.nome.includes('Ultramarino')) color = 'Ultramarino';
            else if (product.nome.includes('Laranja')) color = 'Laranja';
            else if (product.nome.includes('Branco')) color = 'Branco';
            else if (product.nome.includes('Preto')) color = 'Preto';
            
            // Extrai o armazenamento (ex: '128GB', '256GB', '1TB')
            const storageMatch = product.nome.match(/\d+(GB|TB)/);
            const storage = storageMatch ? storageMatch[0] : 'Armazenamento Desconhecido';

            if (!acc[modelName]) {
                acc[modelName] = { colors: {}, storages: new Set() };
            }

            if (!acc[modelName].colors[color]) {
                acc[modelName].colors[color] = {};
            }

            // O nome da pasta de imagem é o nome completo do produto (ex: 'iphone 15 branco')
            const imageFolderName = product.nome.replace(/\s\d+(GB|TB)/, '').toLowerCase().replace(/\s/g, '_');

            acc[modelName].colors[color][storage] = {
                id: product.id,
                preco: product.preco,
                estoque: product.estoque,
                imageFolderName: imageFolderName, // Nome da pasta de imagens
                nome: product.nome
            };
            acc[modelName].storages.add(storage);

            return acc;
        }, {});
        
        // Converte Set de armazenamentos para Array e ordena
        for (const model in grouped) {
            grouped[model].storages = Array.from(grouped[model].storages).sort((a, b) => {
                const aVal = parseInt(a.replace('GB', '').replace('TB', '000'));
                const bVal = parseInt(b.replace('GB', '').replace('TB', '000'));
                return aVal - bVal;
            });
        }

        modelData = grouped;
        initializeModelPage();
    } catch (error) {
        console.error('Erro ao buscar e agrupar produtos:', error);
        // alert('Erro ao carregar dados dos produtos. Verifique o servidor.');
    }
}

// Função para obter o código de cor visual (apenas para o frontend)
function getColorCode(colorName) {
    switch(colorName) {
        case 'Preto': return '#0A0A0A';
        case 'Branco': return '#F8F8F8';
        case 'Ultramarino': return '#0070c9'; // Azul profundo
        case 'Laranja': return '#FF4500'; // Laranja vibrante
        default: return '#CCCCCC';
    }
}

// Função para renderizar as opções de cor e armazenamento
function renderOptions(modelName) {
    const model = modelData[modelName];
    if (!model) return;

    // Renderizar cores
    const colorOptionsDiv = document.getElementById('color-options');
    colorOptionsDiv.innerHTML = '';
    const availableColors = Object.keys(model.colors);
    
    availableColors.forEach(color => {
        const colorBtn = document.createElement('button');
        colorBtn.className = 'color-btn';
        colorBtn.textContent = color;
        colorBtn.dataset.color = color;
        colorBtn.style.backgroundColor = getColorCode(color);
        colorBtn.style.color = (color === 'Branco' || color === 'Ultramarino') ? 'black' : 'white';

        colorBtn.addEventListener('click', () => {
            selectedColor = color;
            document.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('selected'));
            colorBtn.classList.add('selected');
            updateProductDetails();
        });
        colorOptionsDiv.appendChild(colorBtn);
    });

    // Renderizar armazenamentos
    const storageOptionsDiv = document.getElementById('storage-options');
    storageOptionsDiv.innerHTML = '';
    model.storages.forEach(storage => {
        const storageBtn = document.createElement('button');
        storageBtn.className = 'storage-btn';
        storageBtn.textContent = storage;
        storageBtn.dataset.storage = storage;

        storageBtn.addEventListener('click', () => {
            selectedStorage = storage;
            document.querySelectorAll('.storage-btn').forEach(btn => btn.classList.remove('selected'));
            storageBtn.classList.add('selected');
            updateProductDetails();
        });
        storageOptionsDiv.appendChild(storageBtn);
    });

    // Selecionar o primeiro de cada como padrão
    if (availableColors.length > 0) {
        selectedColor = availableColors[0];
        colorOptionsDiv.querySelector(`[data-color="${selectedColor}"]`).classList.add('selected');
    }
    if (model.storages.length > 0) {
        selectedStorage = model.storages[0];
        storageOptionsDiv.querySelector(`[data-storage="${selectedStorage}"]`).classList.add('selected');
    }
}

// Função para buscar e renderizar a galeria de imagens
async function fetchAndRenderGallery(imageFolderName) {
    const galleryDiv = document.getElementById('thumbnail-gallery');
    const mainImage = document.getElementById('main-product-image');
    galleryDiv.innerHTML = '';

    try {
        // O nome da pasta de imagem no backend é o nome do produto com espaços
        const folderName = imageFolderName.replace(/_/g, ' ');

        const response = await fetch(`${API_URL}/produtos/${folderName}/imagens`);
        const imagePaths = await response.json(); // Ex: ['iphone 15 branco/1.webp', 'iphone 15 branco/2.webp', ...]

        if (imagePaths.length > 0) {
            // Define a imagem principal
            const firstImagePath = `${API_URL.replace('/api', '')}/uploads/${imagePaths[0]}`;
            mainImage.src = firstImagePath;

            // Cria as miniaturas
            imagePaths.forEach((imagePath, index) => {
                const fullPath = `${API_URL.replace('/api', '')}/uploads/${imagePath}`;
                const thumbnail = document.createElement('img');
                thumbnail.src = fullPath;
                thumbnail.alt = `Miniatura ${index + 1}`;
                thumbnail.addEventListener('click', () => {
                    mainImage.src = fullPath;
                    document.querySelectorAll('.thumbnail-gallery img').forEach(img => img.classList.remove('selected'));
                    thumbnail.classList.add('selected');
                });
                
                if (index === 0) {
                    thumbnail.classList.add('selected');
                }
                galleryDiv.appendChild(thumbnail);
            });
        } else {
            mainImage.src = 'https://via.placeholder.com/400x500/0A0A0A/B8860B?text=Sem+Imagem';
        }
    } catch (error) {
        console.error('Erro ao buscar galeria de imagens:', error);
        mainImage.src = 'https://via.placeholder.com/400x500/0A0A0A/B8860B?text=Erro+Carregar+Imagem';
    }
}

// Função para atualizar os detalhes do produto na tela
function updateProductDetails() {
    const model = modelData[currentModelName];
    const priceSpan = document.getElementById('product-price');
    const stockSpan = document.getElementById('product-stock');
    const productIdHidden = document.getElementById('product-id-hidden');
    const addToCartBtn = document.getElementById('add-to-cart-btn');

    // Reset
    currentProductId = null;
    currentProductPrice = 0;
    currentProductStock = 0;
    priceSpan.textContent = 'R$ 0,00';
    stockSpan.textContent = '0';
    productIdHidden.textContent = '';
    addToCartBtn.disabled = true;

    if (selectedColor && selectedStorage) {
        const product = model.colors[selectedColor][selectedStorage];
        if (product) {
            currentProductId = product.id;
            currentProductPrice = product.preco;
            currentProductStock = product.estoque;

            priceSpan.textContent = formatPrice(product.preco);
            stockSpan.textContent = product.estoque;
            productIdHidden.textContent = product.id;
            
            // Atualizar galeria de imagens
            fetchAndRenderGallery(product.imageFolderName);

            if (product.estoque > 0) {
                addToCartBtn.disabled = false;
            } else {
                stockSpan.textContent = 'Indisponível';
            }
        }
    }
}

// Lógica de inicialização da página
function initializeModelPage() {
    // Tenta extrair o nome do modelo da URL (ex: iphone15.html -> iPhone 15)
    const pageName = window.location.pathname.split('/').pop().replace('.html', '');
    
    // Mapeamento simplificado para o nome completo
    if (pageName === 'iphone15') currentModelName = 'iPhone 15';
    else if (pageName === 'iphone16e') currentModelName = 'iPhone 16e';
    else if (pageName === 'iphone16') currentModelName = 'iPhone 16';
    else if (pageName === 'iphone17') currentModelName = 'iPhone 17';
    else if (pageName === 'iphone17pro') currentModelName = 'iPhone 17 Pro';
    else if (pageName === 'iphone17promax') currentModelName = 'iPhone 17 Pro Max';
    
    if (!currentModelName || !modelData[currentModelName]) {
        // Redirecionar ou mostrar erro se o modelo não for encontrado
        const container = document.querySelector('.product-detail .container');
        if (container) {
            container.innerHTML = '<h2>Modelo de iPhone não encontrado.</h2><a href="index.html">Voltar para a lista de modelos</a>';
        }
        return;
    }

    // Atualizar títulos e renderizar opções
    document.title = `LVTech - ${currentModelName}`;
    const titleElement = document.getElementById('model-name-title');
    if (titleElement) titleElement.textContent = currentModelName;
    const descElement = document.getElementById('model-description');
    if (descElement) descElement.textContent = `O ${currentModelName} é a escolha perfeita para quem busca performance e elegância. Selecione as opções abaixo para configurar o seu.`;

    renderOptions(currentModelName);
    updateProductDetails(); // Atualiza os detalhes iniciais

    // Adicionar evento ao botão "Adicionar ao Carrinho"
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    if (addToCartBtn) addToCartBtn.addEventListener('click', addToCart);
}

// Função para adicionar ao carrinho
async function addToCart() {
    const quantityInput = document.getElementById('quantity');
    const quantity = parseInt(quantityInput.value);
    
    if (!currentProductId || quantity <= 0 || quantity > currentProductStock) {
        alert('Selecione um produto válido e uma quantidade em estoque.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/carrinho/adicionar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                produto_id: currentProductId,
                quantidade: quantity
            })
        });

        if (response.ok) {
            alert(`Adicionado ${quantity}x ${currentModelName} ao carrinho!`);
            // Limpa o campo de quantidade e atualiza o contador
            quantityInput.value = 1;
            if (typeof updateCartCount === 'function') {
                updateCartCount();
            }
        } else {
            const errorText = await response.text();
            alert(`Erro ao adicionar ao carrinho: ${errorText}`);
        }
    } catch (error) {
        console.error('Erro de rede ao adicionar ao carrinho:', error);
        alert('Erro de rede ao adicionar ao carrinho.');
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // updateCartCount() é chamado pelo script.js
    fetchAndGroupProducts();
});
