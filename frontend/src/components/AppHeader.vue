<template>
  <header>
    <div class="container">
      <div class="logo">
        <h1>
          <router-link to="/" style="text-decoration: none; color: inherit;">LVTech</router-link>
        </h1>
      </div>

      <nav>
        <ul>
          <li><router-link to="/">Início</router-link></li>

          <li>
            <router-link to="/carrinho">
              Carrinho ({{ cartStore.cartCount }})
            </router-link>
          </li>

          <li v-if="authStore.user" class="user-menu">
            <span>Olá, {{ authStore.user.nome.split(' ')[0] }}</span>

            <router-link v-if="authStore.isAdmin" to="/admin" style="color: orange;">
              Painel Admin
            </router-link>

            <router-link v-else to="/meus-pedidos">
              Meus Pedidos
            </router-link>

            <a href="#" @click.prevent="logout" class="btn-sair">Sair</a>
          </li>

          <li v-else>
            <router-link to="/login">Entrar / Cadastrar</router-link>
          </li>
        </ul>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import { useCartStore } from '@/stores/cart';
import { useAuthStore } from '@/stores/auth';

const user = ref(null);
const router = useRouter();
const cartStore = useCartStore();
const authStore = useAuthStore();
const API_URL = 'https://lvtech-backend.onrender.com/api';

onMounted(() => {
  if (!authStore.isLoggedIn) {
    authStore.checkAuthStatus();
  }
});

async function logout() {
  try {
    await authStore.logout(); // Chama a ação do store
    outer.push('/login');
  } catch (error) {
    console.error('Erro ao sair', error);
  }
}
</script>