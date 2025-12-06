<template>
  <div class="login-container">
    <h2>Acesse sua conta</h2>

    <form @submit.prevent="fazerLogin">
      <div class="form-group">
        <label>E-mail</label>
        <input type="email" v-model="email" required placeholder="seu@email.com">
      </div>

      <div class="form-group">
        <label>Senha</label>
        <input type="password" v-model="senha" required placeholder="******">
      </div>

      <button type="submit" class="btn-primary login-btn" :disabled="loading">
        {{ loading ? 'Entrando...' : 'Entrar' }}
      </button>

      <div class="login-feedback">
        <p v-if="erro" class="alert error">{{ erro }}</p>
        <p>Ainda não tem conta? <router-link to="/cadastro">Cadastre-se aqui</router-link></p>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import api from '../services/api';
import { useAuthStore } from '@/stores/auth';


const email = ref('');
const senha = ref('');
const erro = ref('');
const loading = ref(false);
const router = useRouter();
const authStore = useAuthStore();

async function fazerLogin() {
  loading.value = true;
  erro.value = '';

  try {
    const response = await api.post('/login', {
      email: email.value,
      senha: senha.value
    });

    if (response.status === 200) {
      const usuario = response.data.user;

      authStore.setUser(usuario);

      if (usuario.tipo === 'admin') {
        window.location.href = '/admin';
      } else {
        window.location.href = '/';
      }
    }
  } catch (err) {
  } finally {
    loading.value = false;
  }
}
</script>
