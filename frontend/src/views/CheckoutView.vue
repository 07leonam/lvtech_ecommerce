<template>
  <div class="container checkout">
    <h2>Finalizar Compra</h2>

    <div class="checkout-grid">
      <div class="card form-section">
        <h3>Seus Dados</h3>
        <form @submit.prevent="pagarComMercadoPago">
          <div class="form-group">
            <label>Nome Completo</label>
            <input type="text" v-model="form.nome" required placeholder="Nome do recebedor">
          </div>
          <div class="form-group">
            <label>E-mail</label>
            <input type="email" v-model="form.email" required placeholder="Para envio do comprovante">
          </div>
          <div class="form-group">
            <label>Endereço de Entrega</label>
            <textarea v-model="form.endereco" required rows="3" placeholder="Rua, Número, Bairro, Cidade..."></textarea>
          </div>
          
          <div class="actions">
            <button type="submit" class="btn-primary btn-mp" :disabled="loading">
              {{ loading ? 'Processando...' : 'Pagar com Mercado Pago' }}
            </button>
          </div>
          
          <p v-if="erro" class="alert error">{{ erro }}</p>
        </form>
      </div>

      <div class="card summary-section">
        <h3>Resumo do Pedido</h3>
        
        <div class="summary-items">
          <div v-for="item in cartStore.cart" :key="item.cartId" class="summary-item">
            <div class="summary-info">
              <span class="item-name">{{ item.quantidade }}x {{ item.nome }}</span>
              <small v-if="item.capacidade" style="color: #666; display: block; font-size: 0.8rem;">
                 Opção: {{ item.capacidade }}
              </small>
            </div>
            <span class="item-price">R$ {{ (item.preco * item.quantidade).toFixed(2) }}</span>
          </div>
        </div>
        
        <hr style="margin: 20px 0; border: 0; border-top: 1px solid #eee;">
        
        <div class="total">
          <span>Total:</span>
          <strong>R$ {{ cartStore.cartTotal.toFixed(2) }}</strong>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useCartStore } from '@/stores/cart';
import api from '@/services/api';

const cartStore = useCartStore();
const loading = ref(false);
const erro = ref('');

const form = ref({
  nome: '',
  email: '',
  endereco: ''
});

onMounted(async () => {
  try {
    const res = await api.get('/status'); 
    if (res.data.user) {
      form.value.nome = res.data.user.nome;
      form.value.email = res.data.user.email;
    }
  } catch (e) {
  }
});

async function pagarComMercadoPago() {
  if (cartStore.cart.length === 0) {
    alert('Seu carrinho está vazio.');
    return;
  }

  if (!form.value.nome || !form.value.email || !form.value.endereco) {
    alert('Por favor, preencha seus dados de entrega.');
    return;
  }

  loading.value = true;
  erro.value = '';
  const itensFormatados = cartStore.cart.map(item => ({
      id: Number(item.produto_id || item.id), 
      quantidade: Number(item.quantidade),
      capacidade: item.capacidade || ''
  }));

  try {
    console.log("Enviando para checkout:", itensFormatados);
    const response = await api.post('/checkout/preference', {
      items: itensFormatados,
      comprador: form.value 
    });

    const { url } = response.data; 

    if (url) {
      window.location.href = url;
    } else {
      throw new Error('Link de pagamento não gerado.');
    }

  } catch (err) {
    console.error("Erro no checkout:", err);
    erro.value = 'Erro ao conectar com Mercado Pago. Tente novamente.';
  } finally {
    loading.value = false;
  }
}
</script>