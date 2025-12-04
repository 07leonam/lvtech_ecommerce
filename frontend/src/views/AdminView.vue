<template>
  <div class="container admin-page">
    <div class="header-admin">
      <h2>Painel de Produtos</h2>
      <p class="subtitle">Gerencie o catálogo da sua loja</p>
    </div>

    <div v-if="mensagem.texto" :class="['alert', mensagem.tipo]">
      {{ mensagem.texto }}
    </div>

    <div class="admin-grid">
      
      <section class="card form-section">
        <h3>{{ produtoEditando ? 'Editar Produto' : 'Cadastrar Novo' }}</h3>
        
        <form @submit.prevent="salvarProduto">
          <input type="hidden" v-model="form.id">
          
          <div class="form-group">
            <label>Nome do Produto</label>
            <input type="text" v-model="form.nome" required placeholder="Ex: iPhone 15 Preto">
          </div>

          <div class="form-group">
            <label>Descrição</label>
            <textarea v-model="form.descricao" required rows="3"></textarea>
          </div>

          <div class="row">
            <div class="form-group half">
              <label>Preço (R$)</label>
              <input type="number" v-model="form.preco" step="0.01" required>
            </div>
            <div class="form-group half">
              <label>Estoque</label>
              <input type="number" v-model="form.estoque" required>
            </div>
          </div>

          <div class="form-group">
            <label>Armazenamento (Separe por vírgula)</label>
            <input type="text" v-model="form.capacidades" placeholder="Ex: 128GB, 256GB, 512GB">
          </div>

          <div class="form-group">
            <label>Imagens</label>
            <input type="file" ref="fileInput" multiple @change="handleFileUpload" accept="image/*">
            <small v-if="produtoEditando">Deixe vazio para manter as atuais.</small>
          </div>

          <div class="actions">
            <button type="submit" class="btn-primary" :disabled="loading">
              {{ loading ? 'Salvando...' : (produtoEditando ? 'Atualizar' : 'Cadastrar') }}
            </button>
            <button type="button" v-if="produtoEditando" @click="cancelarEdicao" class="btn-secondary">
              Cancelar
            </button>
          </div>
        </form>
      </section>

      <section class="admin-section list-section">
        <h3>Catálogo Atual</h3>
        
        <div v-if="carregandoLista">Carregando...</div>
        <div v-else-if="produtos.length === 0">Nenhum produto cadastrado.</div>
        
        <div v-else class="product-list-scroll">
          <div v-for="prod in produtos" :key="prod.id" class="admin-product-item">
            <div class="admin-item-header">
               <img v-if="prod.imagem" :src="getUrlImagem(prod.imagem)" class="admin-item-image">
               <div class="admin-item-details">
                  <h5>{{ prod.nome }}</h5>
                  <p>R$ {{ Number(prod.preco).toFixed(2) }} | Estoque: {{ prod.estoque }}</p>
                  <p style="font-size: 11px; color: #888" v-if="prod.capacidades">
                    Opções: {{ prod.capacidades }}
                  </p>
               </div>
            </div>
            <div class="admin-item-actions">
              <button @click="prepararEdicao(prod)" title="Editar">Editar</button>
              <button @click="excluirProduto(prod.id)" class="delete-btn" title="Excluir">Excluir</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const API_URL = 'https://lvtech-backend.onrender.com/api';
const produtos = ref([]);
const loading = ref(false);
const carregandoLista = ref(true);
const mensagem = ref({ texto: '', tipo: '' });
const produtoEditando = ref(false);
const arquivosSelecionados = ref([]);
const fileInput = ref(null);

const form = ref({
  id: null,
  nome: '',
  descricao: '',
  preco: '',
  estoque: '',
  capacidades: '' // Somente capacidades ficou
});

onMounted(() => {
  carregarProdutos();
});

async function carregarProdutos() {
  carregandoLista.value = true;
  try {
    const response = await axios.get(`${API_URL}/produtos`);
    produtos.value = response.data;
  } catch (error) {
    exibirMensagem('Erro ao carregar.', 'error');
  } finally {
    carregandoLista.value = false;
  }
}

async function salvarProduto() {
  loading.value = true;
  const formData = new FormData();
  formData.append('nome', form.value.nome);
  formData.append('descricao', form.value.descricao);
  formData.append('preco', form.value.preco);
  formData.append('estoque', form.value.estoque);
  formData.append('capacidades', form.value.capacidades); // Envia Capacidades

  for (let i = 0; i < arquivosSelecionados.value.length; i++) {
    formData.append('imagens', arquivosSelecionados.value[i]);
  }

  try {
    const config = {
      withCredentials: true 
    };
    if (produtoEditando.value) {
      await axios.put(`${API_URL}/admin/produtos/${form.value.id}`, formData, config);
      exibirMensagem('Atualizado com sucesso!', 'success');
    } else {
      await axios.post(`${API_URL}/admin/produtos`, formData, config);
      exibirMensagem('Criado com sucesso!', 'success');
    }
    cancelarEdicao();
    carregarProdutos();
  } catch (error) {
    exibirMensagem('Erro ao salvar.', 'error');
  } finally {
    loading.value = false;
  }
}

async function excluirProduto(id) {
  if (!confirm('Excluir este produto?')) return;
  try {
    await axios.delete(`${API_URL}/admin/produtos/${id}`, { withCredentials: true });
    carregarProdutos();
  } catch (error) {
    exibirMensagem('Erro ao excluir.', 'error');
  }
}

function handleFileUpload(event) {
  arquivosSelecionados.value = event.target.files;
}

function prepararEdicao(prod) {
  produtoEditando.value = true;
  // Copia os dados simples
  form.value = { ...prod, capacidades: prod.capacidades || '' };
  arquivosSelecionados.value = [];
  if (fileInput.value) fileInput.value.value = '';
}

function cancelarEdicao() {
  produtoEditando.value = false;
  form.value = { id: null, nome: '', descricao: '', preco: '', estoque: '', capacidades: '' };
  arquivosSelecionados.value = [];
  if (fileInput.value) fileInput.value.value = '';
}

function exibirMensagem(texto, tipo) {
  mensagem.value = { texto, tipo };
  setTimeout(() => mensagem.value = { texto: '', tipo: '' }, 3000);
}

function getUrlImagem(imgInput) {
  if (!imgInput) return '';
  const caminho = imgInput.caminho || imgInput;
  if (!caminho.startsWith('http')) {
     return `https://lvtech-backend.onrender.com/uploads/${caminho.replace(/\\/g, '/')}`;
  }
  return caminho;
}
</script>