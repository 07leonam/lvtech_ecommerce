
// Função auxiliar para extrair apenas o nome do arquivo, ignorando o caminho da pasta
// Esta função não é mais necessária, pois o backend retorna o caminho completo.
// Deixando o corpo vazio para evitar erros de referência, caso ainda seja chamada.
const getFilename = (path) => {
    return path;
};

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

// Variáveis de estado para o carrossel
let currentImageIndex = 0;
let currentImagePaths = [];

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
            // Regex para capturar QUALQUER modelo iPhone numérico, priorizando Max/Pro
            const match = product.nome.match(/iPhone\s\d+\s?(e|\sPro Max|\sPro)?/);
            if (!match) return acc;

            const modelName = match[0].trim();
            
            // Extrai a cor
            let color = 'Cor Desconhecida';
            if (product.nome.includes('Ultramarino')) color = 'Ultramarino';
            else if (product.nome.includes('Laranja')) color = 'Laranja';
            else if (product.nome.includes('Branco')) color = 'Branco';
            else if (product.nome.includes('Preto')) color = 'Preto';
            
            // O cálculo de imageFolderName não é mais necessário, pois usaremos o ID do produto.
            
            // Extrai o armazenamento
            const storageMatch = product.nome.match(/\d+(GB|TB)/);
            const storage = storageMatch ? storageMatch[0] : 'Armazenamento Desconhecido';

            if (!acc[modelName]) {
                acc[modelName] = { colors: {}, storages: new Set() };
            }

            if (!acc[modelName].colors[color]) {
                acc[modelName].colors[color] = {};
            }

            acc[modelName].colors[color][storage] = {
                id: product.id,
                preco: product.preco,
                estoque: product.estoque,
                // imageFolderName não é mais necessário, usaremos product.id
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
        colorBtn.title = color; // Adiciona o nome da cor no tooltip
        colorBtn.dataset.color = color;
        colorBtn.style.backgroundColor = getColorCode(color);

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
        const firstColorBtn = colorOptionsDiv.querySelector(`[data-color="${selectedColor}"]`);
        if (firstColorBtn) firstColorBtn.classList.add('selected');
    }
    if (model.storages.length > 0) {
        selectedStorage = model.storages[0];
        const firstStorageBtn = storageOptionsDiv.querySelector(`[data-storage="${selectedStorage}"]`);
        if (firstStorageBtn) firstStorageBtn.classList.add('selected');
    }
}

// Função para buscar e renderizar a galeria de imagens
async function fetchAndRenderGallery(productId) {
    const galleryDiv = document.getElementById('thumbnail-gallery');
    const carouselDiv = document.getElementById('image-carousel');
    
    galleryDiv.innerHTML = '';
    carouselDiv.innerHTML = '';
    currentImageIndex = 0;
    currentImagePaths = [];

    try {
        const response = await fetch(`${API_URL}/produtos/${productId}/imagens`);
        const imagePaths = await response.json();
        currentImagePaths = imagePaths;

        if (imagePaths.length > 0) {
            
            // 1. Renderiza as imagens no carrossel
            imagePaths.forEach(imagePath => {
                // imagePath já é o caminho completo relativo a /uploads (ex: 1/1.webp)
                const fullPath = `${API_URL.replace('/api', '')}/uploads/${imagePath}`;
                
                const img = document.createElement('img');
                img.src = fullPath;
                img.alt = `Produto ${productId}`;
                img.classList.add('carousel-image');
                carouselDiv.appendChild(img);
            });

            // 2. Renderiza as miniaturas
            imagePaths.forEach((imagePath, index) => {
                // imagePath já é o caminho completo relativo a /uploads (ex: 1/1.webp)
                const fullPath = `${API_URL.replace('/api', '')}/uploads/${imagePath}`;

                const thumbnail = document.createElement('img');
                thumbnail.src = fullPath;
                thumbnail.alt = `Miniatura ${index + 1}`;
                
                thumbnail.addEventListener('click', () => {
                    currentImageIndex = index;
                    updateCarousel();
                    updateThumbnails();
                });
                
                galleryDiv.appendChild(thumbnail);
            });

            // 3. Inicializa o carrossel e as miniaturas
            updateCarousel();
            updateThumbnails();

        } else {
            carouselDiv.innerHTML = '<img src="https://via.placeholder.com/400x500/0A0A0A/B8860B?text=Sem+Imagem" alt="Sem Imagem">';
        }
    } catch (error) {
        console.error('Erro ao buscar galeria de imagens:', error);
        carouselDiv.innerHTML = '<img src="https://via.placeholder.com/400x500/0A0A0A/B8860B?text=Erro+Carregar+Imagem" alt="Erro Carregar Imagem">';
    }
}

// Função para atualizar a posição do carrossel
function updateCarousel() {
    const carouselDiv = document.getElementById('image-carousel');
    const imageCount = carouselDiv.children.length;

    if (imageCount > 0) {
        carouselDiv.style.width = `${imageCount * 100}%`;
        carouselDiv.style.transform = `translateX(-${currentImageIndex * 100}%)`;
    }
}


// Função para atualizar a seleção da miniatura
function updateThumbnails() {
    document.querySelectorAll('#thumbnail-gallery img').forEach((img, index) => {
        img.classList.remove('selected');
        if (index === currentImageIndex) {
            img.classList.add('selected');
        }
    });
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
        // Verifica se a combinação cor/armazenamento existe
        const product = model.colors[selectedColor] && model.colors[selectedColor][selectedStorage]
            ? model.colors[selectedColor][selectedStorage]
            : null;

        if (product) {
            currentProductId = product.id;
            currentProductPrice = product.preco;
            currentProductStock = product.estoque;

            priceSpan.textContent = formatPrice(product.preco);
            stockSpan.textContent = product.estoque;
            productIdHidden.textContent = product.id;
            
            // Atualizar galeria de imagens
            fetchAndRenderGallery(product.id);

            if (product.estoque > 0) {
                addToCartBtn.disabled = false;
            } else {
                stockSpan.textContent = 'Indisponível';
            }
        } else {
             // Se a combinação não existir (ex: cor X não tem armazenamento Y), desabilita a compra
            stockSpan.textContent = 'Indisponível';
            priceSpan.textContent = 'R$ 0,00';
            // O carrossel deve ser limpo ou mostrar uma imagem de "indisponível"
            const carouselDiv = document.getElementById('image-carousel');
            const galleryDiv = document.getElementById('thumbnail-gallery');
            carouselDiv.innerHTML = '<img src="https://via.placeholder.com/400x500/0A0A0A/B8860B?text=Combinação+Indisponível" alt="Combinação Indisponível">';
            galleryDiv.innerHTML = '';
        }
    }
}

// Lógica de inicialização da página
function initializeModelPage() {
    // Adiciona eventos de navegação do carrossel (apenas uma vez)
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    if (prevBtn) prevBtn.removeEventListener('click', handlePrevClick);
    if (nextBtn) nextBtn.removeEventListener('click', handleNextClick);

    function handlePrevClick() {
        if (currentImagePaths.length > 0) {
            currentImageIndex = (currentImageIndex - 1 + currentImagePaths.length) % currentImagePaths.length;
            updateCarousel();
            updateThumbnails();
        }
    }

    function handleNextClick() {
        if (currentImagePaths.length > 0) {
            currentImageIndex = (currentImageIndex + 1) % currentImagePaths.length;
            updateCarousel();
            updateThumbnails();
        }
    }

    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', handlePrevClick);
        nextBtn.addEventListener('click', handleNextClick);
    }
    
    // NOVO CÓDIGO CRÍTICO: Extrai e Reconstrói o nome do modelo
    const urlParams = new URLSearchParams(window.location.search);
    const modelParam = urlParams.get('model'); // Captura, ex: 'iphone17promax'
    
    // Se não houver parâmetro, paramos.
    if (!modelParam) {
        currentModelName = null;
    } else {
        // Tenta reconstruir o nome canônico (Ex: iphone17promax -> iPhone 17 Pro Max)
        // 1. Remove 'iphone' do início
        let name = modelParam.replace('iphone', ''); 
        
        // 2. Converte números e letras minúsculas para maiúsculas/espaços
        name = name.replace(/(\d+)/, ' $1'); // Coloca espaço antes do número
        name = name.replace(/pro/g, ' Pro'); // Adiciona espaço e capitaliza Pro
        name = name.replace(/max/g, ' Max'); // Adiciona espaço e capitaliza Max
        name = name.replace(/e$/, 'e');      // Mantém o 'e' (ex: 16e)
        name = name.trim();
        
        // 3. Adiciona "iPhone" no início
        currentModelName = 'iPhone ' + name.charAt(0).toUpperCase() + name.slice(1);
        
        // 4. Limpa espaços duplos que possam ter sido criados (Ex: "iPhone  17 Pro Max" -> "iPhone 17 Pro Max")
        currentModelName = currentModelName.replace(/\s+/g, ' ').trim();
    }
    
    // console.log("Modelo Reconstruído:", currentModelName); // Use para debugging

    // Se o modelo não foi encontrado na URL ou nos dados da API
    if (!currentModelName || !modelData[currentModelName]) {
        // Se cair aqui, significa que a API não retornou dados para este modelo,
        // ou a reconstrução falhou.
        const container = document.querySelector('.product-detail .container');
        if (container) {
            container.innerHTML = `<h2>Modelo ${currentModelName || 'não especificado'} não encontrado.</h2>
                                   <p>Verifique se o servidor retornou dados para este produto.</p>
                                   <a href="index.html" class="btn-secondary">Voltar para a lista de modelos</a>`;
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