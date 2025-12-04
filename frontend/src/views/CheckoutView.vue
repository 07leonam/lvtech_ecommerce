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
import axios from 'axios';

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
    const res = await axios.get('http://localhost:3000/api/status', { withCredentials: true });
    if (res.data.user) {
      form.value.nome = res.data.user.nome;
      form.value.email = res.data.user.email;
    }
  } catch (e) {
    // Usuário não logado
  }
});

async function pagarComMercadoPago() {
  if (cartStore.cart.length === 0) {
    alert('Seu carrinho está vazio.');
    return;
  }

  loading.value = true;
  erro.value = '';

  try {
    const response = await axios.post('http://localhost:3000/api/checkout/preference', {
      items: cartStore.cart,
      comprador: form.value 
    });

    const { initPoint } = response.data;

    if (initPoint) {
      window.location.href = initPoint;
    } else {
      throw new Error('Link de pagamento não gerado.');
    }

  } catch (err) {
    console.error(err);
    erro.value = 'Erro ao conectar com Mercado Pago. Tente novamente.';
    loading.value = false;
  }
}
</script>

<style scoped>
.checkout-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 30px; margin-top: 20px; }
.btn-mp { background-color: #009EE3; border: none; width: 100%; font-size: 1.1rem; }
.btn-mp:hover { background-color: #007bbd; }

.summary-item { 
    display: flex; 
    justify-content: space-between; 
    align-items: flex-start; /* Alinha no topo caso tenha duas linhas */
    margin-bottom: 15px; 
    font-size: 0.95rem; 
    color: #444; 
    border-bottom: 1px dashed #eee;
    padding-bottom: 10px;
}

.item-name { font-weight: 500; }
.item-price { font-weight: 700; color: var(--color-primary); white-space: nowrap; }
.total { display: flex; justify-content: space-between; font-size: 1.4rem; margin-top: 10px; color: var(--color-accent); }

@media (max-width: 768px) { .checkout-grid { grid-template-columns: 1fr; } }
</style>