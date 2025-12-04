import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', () => {
  const cart = ref(JSON.parse(localStorage.getItem('cart')) || [])

  const cartCount = computed(() => cart.value.reduce((acc, item) => acc + item.quantidade, 0))
  const cartTotal = computed(() => cart.value.reduce((acc, item) => acc + (item.preco * item.quantidade), 0))

  function adicionarAoCarrinho(produto) {
    // --- O SEGREDO ESTÁ AQUI ---
    // Criamos uma "Identidade Única" misturando ID + Capacidade
    // Ex: "15-128GB" é diferente de "15-256GB"
    const cartId = `${produto.id}-${produto.capacidade || 'padrao'}`;

    // Procuramos no carrinho por esse cartId, e NÃO APENAS pelo ID normal
    const itemExistente = cart.value.find(item => item.cartId === cartId)

    if (itemExistente) {
      itemExistente.quantidade++
    } else {
      cart.value.push({
        ...produto,
        cartId: cartId, // Salvamos a identidade para usar depois
        quantidade: 1
      })
    }
  }

  function removerItem(cartId) {
    // Removemos usando a identidade única
    cart.value = cart.value.filter(item => item.cartId !== cartId)
  }

  function atualizarQuantidade(cartId, novaQtd) {
    const item = cart.value.find(item => item.cartId === cartId)
    if (item) {
      item.quantidade = novaQtd
      if (item.quantidade <= 0) removerItem(cartId)
    }
  }

  function limparCarrinho() {
    cart.value = []
  }

  watch(cart, (novoCarrinho) => {
    localStorage.setItem('cart', JSON.stringify(novoCarrinho))
  }, { deep: true })

  return { 
    cart, 
    cartCount, 
    cartTotal, 
    adicionarAoCarrinho, 
    removerItem, 
    atualizarQuantidade, 
    limparCarrinho 
  }
})