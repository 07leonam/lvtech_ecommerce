<template>
  <div class="container product-page">
    
    <nav class="breadcrumbs" v-if="produto">
      <router-link to="/">Início</router-link> <span>/</span>
      <span class="current">{{ produto.nome }}</span>
    </nav>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
    </div>
    
    <div v-else-if="produto" class="product-detail-grid">
      
      <div class="gallery-section">
        <div class="main-image-container">
          <img :src="imagemAtual" :alt="produto.nome" class="main-img-animada">
        </div>
        
        <div class="thumbnails" v-if="produto.imagens && produto.imagens.length > 1">
          <div 
            v-for="(img, index) in produto.imagens" 
            :key="index" 
            class="thumb-wrapper"
            :class="{ active: imagemAtual === getUrlImagem(img) }"
            @click="imagemAtual = getUrlImagem(img)"
          >
            <img :src="getUrlImagem(img)">
          </div>
        </div>
      </div>

      <div class="info-section">
        <div class="sticky-wrapper">
          
          <h1 class="product-title">{{ produto.nome }}</h1>
          
          <div class="price-block">
            <span class="currency">R$</span>
            <span class="value">{{ Number(produto.preco).toFixed(2) }}</span>
            <span class="installments">em até 12x sem juros</span>
          </div>
          
          <p class="desc">{{ produto.descricao }}</p>

          <hr class="divider">

          <div v-if="listaCapacidades.length > 0" class="selector-group">
            <h3 class="label">Escolha o Armazenamento</h3>
            <div class="options-grid">
              <button 
                v-for="cap in listaCapacidades" 
                :key="cap"
                @click="capacidadeSelecionada = cap"
                :class="['option-card', { selected: capacidadeSelecionada === cap }]"
              >
                <span class="option-text">{{ cap }}</span>
                </button>
            </div>
          </div>

          <div class="buy-action">
            <button 
              @click="adicionarAoCarrinho" 
              class="btn-buy-large" 
              :disabled="!podeComprar"
            >
              <span>{{ textoBotao }}</span>
              <svg v-if="podeComprar" xmlns="http://www.w3.org/2000/svg" class="icon-arrow" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
            
            <p class="shipping-info">
              <svg xmlns="http://www.w3.org/2000/svg" class="icon-truck" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              Frete Grátis para todo o Brasil
            </p>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router'; 
import axios from 'axios';
import { useCartStore } from '@/stores/cart';

const route = useRoute();
const cartStore = useCartStore();
const API_URL = 'http://localhost:3000/api';

const produto = ref(null);
const loading = ref(true);
const imagemAtual = ref('');
const capacidadeSelecionada = ref('');

const listaCapacidades = computed(() => {
  if (!produto.value?.capacidades) return [];
  return produto.value.capacidades.split(',').map(c => c.trim()).filter(c => c !== '');
});

const podeComprar = computed(() => {
  if (listaCapacidades.value.length > 0 && !capacidadeSelecionada.value) return false;
  return true;
});

const textoBotao = computed(() => {
  if (!podeComprar.value) return 'Selecione uma opção';
  return 'Adicionar à Sacola';
});

onMounted(async () => {
  try {
    const id = route.params.id;
    const res = await axios.get(`${API_URL}/produtos/${id}`);
    produto.value = res.data;
    
    if (produto.value.imagens && produto.value.imagens.length > 0) {
       imagemAtual.value = getUrlImagem(produto.value.imagens[0]);
    } else if (produto.value.imagem) {
       imagemAtual.value = getUrlImagem(produto.value.imagem);
    }
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
});

function getUrlImagem(imgInput) {
  if (!imgInput) return '';
  const caminho = imgInput.caminho || imgInput;
  if (!caminho.startsWith('http')) {
     const limpo = caminho.replace(/\\/g, '/');
     return `http://localhost:3000/uploads/${limpo}`;
  }
  return caminho;
}

function adicionarAoCarrinho() {
  let nomeFinal = produto.value.nome;
  if (capacidadeSelecionada.value) nomeFinal += ` - ${capacidadeSelecionada.value}`;

  cartStore.adicionarAoCarrinho({
    id: produto.value.id,
    nome: nomeFinal, 
    preco: produto.value.preco,
    imagem: imagemAtual.value,
    quantidade: 1,
    capacidade: capacidadeSelecionada.value
  });
  
  alert('Produto adicionado ao carrinho com sucesso!');
}
</script>