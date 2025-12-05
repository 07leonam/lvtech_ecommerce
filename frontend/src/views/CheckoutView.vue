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

          <div class="address-grid">
            <div class="form-group full-width">
              <label>CEP</label>
              <div class="cep-wrapper">
                <input 
                  type="text" 
                  v-model="enderecoForm.cep" 
                  @blur="buscarCep" 
                  placeholder="00000-000" 
                  maxlength="9"
                  :disabled="buscandoCep"
                >
                <span v-if="buscandoCep" class="loading-cep">⏳</span>
              </div>
            </div>

            <div class="form-group span-2">
              <label>Rua / Logradouro</label>
              <input type="text" v-model="enderecoForm.rua" required placeholder="Av. Paulista">
            </div>

            <div class="form-group">
              <label>Número</label>
              <input type="text" ref="inputNumero" v-model="enderecoForm.numero" required placeholder="123">
            </div>

            <div class="form-group">
              <label>Complemento</label>
              <input type="text" v-model="enderecoForm.complemento" placeholder="Apto 101">
            </div>

            <div class="form-group span-2">
              <label>Bairro</label>
              <input type="text" v-model="enderecoForm.bairro" required placeholder="Centro">
            </div>

            <div class="form-group span-2">
              <label>Cidade</label>
              <input type="text" v-model="enderecoForm.cidade" required readonly class="input-readonly">
            </div>

            <div class="form-group">
              <label>UF</label>
              <input type="text" v-model="enderecoForm.estado" required readonly class="input-readonly">
            </div>
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
const buscandoCep = ref(false);
const erro = ref('');
const inputNumero = ref(null); 

const form = ref({
  nome: '',
  email: ''
});

const enderecoForm = ref({
  cep: '',
  rua: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: ''
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

async function buscarCep() {
  const cepLimpo = enderecoForm.value.cep.replace(/\D/g, '');
  
  if (cepLimpo.length === 8) {
    buscandoCep.value = true;
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        enderecoForm.value.rua = data.logradouro;
        enderecoForm.value.bairro = data.bairro;
        enderecoForm.value.cidade = data.localidade;
        enderecoForm.value.estado = data.uf;
        
        setTimeout(() => inputNumero.value?.focus(), 100);
      } else {
        alert("CEP não encontrado.");
      }
    } catch (error) {
      console.error("Erro CEP:", error);
    } finally {
      buscandoCep.value = false;
    }
  }
}

async function pagarComMercadoPago() {
  if (cartStore.cart.length === 0) {
    alert('Seu carrinho está vazio.');
    return;
  }

  if (!form.value.nome || !form.value.email) {
    alert('Preencha nome e e-mail.');
    return;
  }
  if (!enderecoForm.value.rua || !enderecoForm.value.numero || !enderecoForm.value.cidade) {
    alert('Por favor, preencha o endereço completo.');
    return;
  }

  loading.value = true;
  erro.value = '';
  const enderecoCompleto = `${enderecoForm.value.rua}, ${enderecoForm.value.numero} ${enderecoForm.value.complemento ? '- ' + enderecoForm.value.complemento : ''} - ${enderecoForm.value.bairro}, ${enderecoForm.value.cidade}/${enderecoForm.value.estado} - CEP: ${enderecoForm.value.cep}`;
  const itensFormatados = cartStore.cart.map(item => ({
      id: Number(item.produto_id || item.id), 
      quantidade: Number(item.quantidade),
      capacidade: item.capacidade || ''
  }));

  try {
    console.log("Enviando para checkout:", itensFormatados);
    
    const response = await api.post('/checkout/preference', {
      items: itensFormatados,
      comprador: {
        ...form.value,
        endereco: enderecoCompleto // Envia a string formatada
      }
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