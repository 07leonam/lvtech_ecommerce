import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import AdminView from '../views/AdminView.vue'
import CartView from '../views/CartView.vue' 
import RegisterView from '../views/RegisterView.vue'
import ProductView from '../views/ProductView.vue'
import CheckoutView from '../views/CheckoutView.vue'
import MeusPedidosView from '../views/MeusPedidosView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminView,
      beforeEnter: (to, from, next) => {
        next(); 
      }
    },
    {
      path: '/carrinho',
      name: 'carrinho',
      component: CartView
    },
    {
      path: '/cadastro', 
      name: 'cadastro',
      component: RegisterView
    },
    {
      path: '/produto/:id',
      name: 'produto',
      component: ProductView
    },
    {
      path: '/checkout',
      name: 'checkout',
      component: CheckoutView
    },
    {
      path: '/meus-pedidos',
      name: 'MeusPedidos', 
      component: MeusPedidosView, 
      meta: { requiresAuth: true } 
    }
  ]
})

export default router