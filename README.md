# 📱 LVTech — E-commerce Fullstack (Vue.js + Node.js)

Sistema de e-commerce completo desenvolvido como Trabalho de Conclusão de Curso (TCC). O projeto simula uma loja especializada em iPhones, focando em uma experiência de usuário fluida (SPA), design responsivo e fluxo real de pagamentos.

O projeto passou por uma refatoração completa, migrando de HTML/JS estático para uma arquitetura moderna baseada em **Vue 3**.

---

## 🚀 Tecnologias Utilizadas

### Frontend (SPA)
* **Vue.js 3** (Composition API)
* **Vite** (Build tool ultrarrápida)
* **Pinia** (Gerenciamento de estado global / Carrinho inteligente)
* **Vue Router** (Navegação sem recarregamento de página)
* **Axios** (Consumo de API)
* **CSS Global** (Design System personalizado com tema Azul/Roxo)

### Backend (API REST)
* **Node.js** & **Express**
* **MySQL** (Banco de dados relacional)
* **Multer** (Upload e armazenamento de múltiplas imagens)
* **Mercado Pago SDK** (Integração de pagamentos e Webhooks)

---

## 🧩 Funcionalidades

### 🛍️ Experiência do Cliente
* **Vitrine Moderna:** Listagem de produtos com efeitos de hover e carregamento otimizado.
* **Página de Detalhes:** Galeria de fotos dinâmica, seleção de armazenamento e informações técnicas.
* **Carrinho Inteligente:** Adição/remoção de itens e cálculo de total em tempo real (Persistência via LocalStorage).
* **Checkout Integrado:** Formulário de entrega e pagamento real via Mercado Pago (Cartão, PIX, Boleto).
* **Botão Flutuante:** Link direto para atendimento via WhatsApp.

### ⚙️ Painel Administrativo
* **Gestão de Produtos:** CRUD completo (Criar, Ler, Atualizar, Deletar).
* **Upload Múltiplo:** Suporte para enviar várias fotos do produto simultaneamente.
* **Autenticação:** Sistema de login para proteger a área administrativa.

---

## 📦 Como Rodar o Projeto

### Pré-requisitos
* Node.js instalado.
* MySQL instalado e rodando.

### 1. Configuração do Banco de Dados
1.  Crie um banco de dados no MySQL chamado `lvtech_ecommerce` (ou o nome que preferir).
2.  Importe o arquivo `.sql` localizado na pasta `db/` para criar as tabelas (`produtos`, `usuarios`, `pedidos`, etc).

### 2. Configuração do Backend

cd backend
npm install

# Crie um arquivo .env na pasta backend com as chaves:
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=sua_senha
# DB_NAME=lvtech_ecommerce
# MP_ACCESS_TOKEN=seu_token_mercado_pago_test

node server.js


O servidor rodará em: http://localhost:3000

3. Configuração do Frontend
Abra um novo terminal e rode:

Bash

cd frontend
npm install
npm run dev
Acesse a aplicação em: http://localhost:5173

🔑 Credenciais de Acesso (Demo)
Para testar o painel administrativo:

Email: admin@admin.com

Senha: 123

📸 Screenshots
(Espaço reservado para prints da tela)

Desenvolvido por Leonam para fins acadêmicos.