import { defineStore } from 'pinia';
import api from '@/services/api'; 
import { useCartStore } from './cart';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null, 
    loading: false,
  }),
  getters: {
    isLoggedIn: (state) => !!state.user,
    isAdmin: (state) => state.user && state.user.tipo === 'admin',
  },
  actions: {
    setUser(userData) {
      this.user = userData;
    },

    async checkAuthStatus() {
      if (this.user) return; 

      this.loading = true;
      try {
        const response = await api.get('/status');
        this.user = response.data.user;
      } catch (error) {
        this.user = null; 
      } finally {
        this.loading = false;
      }
    },

    
    async logout() {
      try {
        await api.post('/logout');
        this.user = null; 
        const cartStore = useCartStore();
        cartStore.limparCarrinho();
      } catch (error) {
        console.error("Erro ao fazer logout:", error);
      }
    }
  },
});