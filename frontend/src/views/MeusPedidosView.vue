<template>
  <div class="container meus-pedidos-page">
    <h2>Histórico de Pedidos</h2>

    <p class="subtitle">Acompanhe todos os seus pedidos na LVTech.</p>

    <div v-if="loading" class="loading-state">
      <p>Carregando seus pedidos...</p>
    </div>

    <div v-else-if="erro" class="alert error">
      <p>{{ erro }}</p>
    </div>

    <div v-else-if="pedidos.length === 0" class="alert warning">
      <p>Você ainda não realizou nenhum pedido em nossa loja.</p>
      <router-link to="/" style="font-weight: 600; color: var(--color-accent);">
        Voltar para a loja
      </router-link>
    </div>

    <div v-else class="pedidos-list">
      <div v-for="pedido in pedidos" :key="pedido.id" class="pedido-card">
        <div class="pedido-header">
          <span class="pedido-id">Pedido #{{ pedido.id }}</span>
          <span :class="['pedido-status', getStatusClass(pedido.status_pagamento)]">
            {{ pedido.status_pagamento }}
          </span>
        </div>

        <div class="pedido-details">
          <p>
            **Data:** {{ formatarData(pedido.data_pedido) }}
          </p>
          <p>
            **Endereço:** {{ pedido.endereco_entrega }}
          </p>
          <p>
            **Total:** R$ {{ formatarPreco(pedido.valor_total || 0) }}
          </p>
          <p class="metodo-pagamento">
            <small>Pagamento: {{ pedido.forma_pagamento }}</small>
          </p>
        </div>
        
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/services/api';

const pedidos = ref([]);
const loading = ref(true);
const erro = ref(null);

onMounted(async () => {
  try {
    const response = await api.get('/meus-pedidos');
    pedidos.value = response.data;
  } catch (err) {
    console.error("Erro ao carregar pedidos:", err);
    erro.value = "Não foi possível carregar seu histórico de pedidos. Tente fazer login novamente.";
  } finally {
    loading.value = false;
  }
});

function formatarData(data) {
  if (!data) return 'N/A';
  const d = new Date(data);
  return d.toLocaleDateString('pt-BR');
}

function formatarPreco(preco) {
  return parseFloat(preco).toFixed(2).replace('.', ',');
}

function getStatusClass(status) {
  const s = status.toLowerCase();
  if (s.includes('aprovado') || s.includes('recebido')) return 'success';
  if (s.includes('análise') || s.includes('pendente')) return 'warning';
  if (s.includes('cancelado') || s.includes('recusado')) return 'danger';
  return 'default';
}
</script>