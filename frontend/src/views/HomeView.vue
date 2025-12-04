<template>
  <main class="container" style="padding: 2rem 0;">
    
    <div class="section-header" style="text-align: center; margin-bottom: 40px;">
      <h2 style="font-size: 2.5rem; color: var(--color-primary);">Novidades</h2>
      <p style="color: #666; font-size: 1.1rem;">Confira os últimos lançamentos da LVTech</p>
    </div>

    <div v-if="loading" class="text-center">
      <p>Carregando produtos...</p>
    </div>

    <div v-else-if="erro" class="error-msg text-center">
      <p>{{ erro }}</p>
    </div>

    <div v-else class="products-grid">
      <div v-for="produto in produtos" :key="produto.id" class="product-card" @click="irParaDetalhes(produto.id)">
        
        <div class="product-img-container">
          <img 
            :src="getProductImage(produto.imagem)" 
            :alt="produto.nome" 
            class="product-img"
          />
        </div>
        
        <div class="product-info">
          <h3 class="product-name">{{ produto.nome }}</h3>
          <p class="product-price">R$ {{ formatarPreco(produto.preco) }}</p>
          
          <button class="btn-detalhes">
            Ver Detalhes
          </button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router'; // Importamos o router no script

// Configurações
const produtos = ref([]);
const loading = ref(true);
const erro = ref(null);
const API_URL = 'https://lvtech-backend.onrender.com'; 
const router = useRouter(); // Instância do router

onMounted(async () => {
  try {
    const response = await axios.get(`${API_URL}/api/produtos`);
    produtos.value = response.data;
  } catch (err) {
    console.error(err);
    erro.value = "Erro ao carregar produtos. Verifique se o backend está rodando.";
  } finally {
    loading.value = false;
  }
});

function getProductImage(imagem) {
  if (!imagem) return 'https://via.placeholder.com/150';
  const caminhoLimpo = imagem.replace(/\\/g, '/');
  return `${API_URL}/uploads/${caminhoLimpo}`;
}

function formatarPreco(preco) {
  return parseFloat(preco).toFixed(2);
}

// Função limpa para navegar
function irParaDetalhes(id) {
  router.push(`/produto/${id}`);
}
</script>

