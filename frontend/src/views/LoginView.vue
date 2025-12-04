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
      
      <button type="submit" :disabled="loading">
        {{ loading ? 'Entrando...' : 'Entrar' }}
      </button>
      
    <div style="margin-top: 15px; text-align: center;">
        <p>Ainda não tem conta? <router-link to="/cadastro">Cadastre-se aqui</router-link></p>
    </div>
      <p v-if="erro" class="error">{{ erro }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import api from '../services/api';

const email = ref('');
const senha = ref('');
const erro = ref('');
const loading = ref(false);
const router = useRouter();

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
      if (usuario.tipo === 'admin') {
         router.push('/admin'); 
      } else {
         router.push('/');
      }
    }
  } catch (err) {
    console.error(err);
    // ... tratamento de erro
  } finally {
    loading.value = false;
  }
}
</script>

