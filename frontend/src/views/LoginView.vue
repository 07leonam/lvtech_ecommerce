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

const email = ref('');
const senha = ref('');
const erro = ref('');
const loading = ref(false);
const router = useRouter();

async function fazerLogin() {
  loading.value = true;
  erro.value = '';

  try {
    const response = await axios.post('http://localhost:3000/api/login', 
      { email: email.value, senha: senha.value },
      { withCredentials: true }
    );

if (response.status === 200) {
      const usuario = response.data.user; 
      if (usuario.tipo === 'admin') {
         window.location.href = '/admin';
      } else {
         window.location.href = '/';
      }
    }
  } catch (err) {
    console.error(err);
    erro.value = err.response?.data || 'Erro ao conectar com o servidor.';
  } finally {
    loading.value = false;
  }
}
</script>

