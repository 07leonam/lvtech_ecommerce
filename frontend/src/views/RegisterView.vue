<template>
  <div class="container login-container">
    <h2>Crie sua conta</h2>
    <p>Preencha os dados abaixo para se cadastrar.</p>

    <form @submit.prevent="fazerCadastro">
      
      <div v-if="erro" class="alert error">
        {{ erro }}
      </div>

      <div class="form-group">
        <label>Nome Completo</label>
        <input type="text" v-model="form.nome" required placeholder="Seu nome">
      </div>

      <div class="form-group">
        <label>E-mail</label>
        <input type="email" v-model="form.email" required placeholder="seu@email.com">
      </div>

      <div class="form-group">
        <label>Senha</label>
        <input type="password" v-model="form.senha" required placeholder="Crie uma senha segura">
      </div>

      <button type="submit" class="btn-primary" :disabled="loading">
        {{ loading ? 'Criando conta...' : 'Cadastrar' }}
      </button>

      <div style="margin-top: 15px; text-align: center;">
        <p>Já tem uma conta? <router-link to="/login">Faça Login</router-link></p>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const router = useRouter();
const loading = ref(false);
const erro = ref('');

const form = ref({
  nome: '',
  email: '',
  senha: ''
});

async function fazerCadastro() {
  loading.value = true;
  erro.value = '';

  try {
    // Envia para a rota que você já criou no server.js
    await axios.post('https://lvtech-backend.onrender.com/api/register', {
      nome: form.value.nome,
      email: form.value.email,
      senha: form.value.senha
    });

    // Se der certo, alerta e manda pro login
    alert('Conta criada com sucesso! Faça login para continuar.');
    router.push('/login');

  } catch (err) {
    // Pega a mensagem de erro do backend (ex: "Email já cadastrado")
    erro.value = err.response?.data?.message || 'Erro ao criar conta. Tente novamente.';
  } finally {
    loading.value = false;
  }
}
</script>