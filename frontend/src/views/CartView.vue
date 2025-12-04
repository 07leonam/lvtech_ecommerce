<template>
  <div class="container cart-page">
    <h2>Seu Carrinho</h2>

    <div v-if="cartStore.cart.length === 0" class="empty-msg" style="text-align: center; padding: 40px;">
      <p style="font-size: 1.2rem; margin-bottom: 20px;">Seu carrinho está vazio.</p>
      <router-link to="/" class="btn-primary" style="display: inline-block;">Voltar as Compras</router-link>
    </div>

    <div v-else class="cart-grid">
      <div class="cart-items">
        <div v-for="item in cartStore.cart" :key="item.cartId" class="cart-item">
          
          <img :src="item.imagem" alt="Foto" class="item-img">
          
          <div class="cart-item-info">
            <h4>{{ item.nome }}</h4>
            <p>R$ {{ Number(item.preco).toFixed(2) }}</p>
            <small v-if="item.capacidade" style="color: #666">
               Opção: {{ item.capacidade }}
            </small>
          </div>

          <div class="cart-item-actions">
            <button @click="cartStore.atualizarQuantidade(item.cartId, item.quantidade - 1)" class="qtd-btn">-</button>
            
            <span class="qtd-number">{{ item.quantidade }}</span>
            
            <button @click="cartStore.atualizarQuantidade(item.cartId, item.quantidade + 1)" class="qtd-btn">+</button>
            
            <button @click="cartStore.removerItem(item.cartId)" class="btn-trash" title="Remover item">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
          </div>
        </div>
      </div>

      <div class="cart-summary">
        <h3>Resumo</h3>
        <p class="cart-total">Total: R$ {{ cartStore.cartTotal.toFixed(2) }}</p>
        <button @click="irParaCheckout" class="btn-checkout">Finalizar Compra</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useCartStore } from '@/stores/cart'
import { useRouter } from 'vue-router'

const cartStore = useCartStore()
const router = useRouter()

function irParaCheckout() {
  router.push('/checkout')
}
</script>