# 📱 E-commerce de iPhones — Projeto de TCC (LVTech)

Bem-vindo ao projeto de TCC da LVTech!  
Este sistema de e-commerce foi desenvolvido com foco em oferecer uma **experiência de compra rápida, moderna e funcional** para usuários interessados em iPhones.

O objetivo é apresentar um sistema completo, com frontend responsivo, backend robusto (em Node.js) e banco de dados MySQL — ideal para quem quer ver um projeto web fullstack em ação.

---

## 🧩 Sobre o Projeto

Este e-commerce é uma aplicação web com três áreas principais:

- **Página principal:** vitrine de iPhones à venda
- **Carrinho de compras:** onde o usuário pode revisar e finalizar sua compra
- **Área de login/admin:** controle e gerenciamento de produtos

Desenvolvido como parte do **Trabalho de Conclusão de Curso (TCC)**, ele foca em boas práticas de desenvolvimento web, estrutura organizada e fácil manutenção.

---

## 📁 Estrutura de Pastas

```text
📦 Projeto
├── frontend/   → HTML, CSS e JavaScript da interface
├── backend/    → Servidor Node.js com API e regras de negócio
└── db/         → Scripts SQL para criar e popular o banco de dados
```

---

## ✨ Novas Funcionalidades Implementadas

### 1. **Carrossel de Imagens Interativo**
- Navegação por setas (anterior/próxima) para visualizar múltiplas imagens
- Miniaturas clicáveis para seleção rápida de imagens
- Transições suaves com animação CSS
- Suporta múltiplas imagens por combinação de cor e modelo

### 2. **Seleção de Cores**
- Botões visuais com cores reais dos iPhones (Preto, Branco, Ultramarino, Laranja)
- Atualização automática de imagens ao trocar de cor
- Indicador visual da cor selecionada
- As imagens mudam conforme a cor escolhida

### 3. **Seleção de Armazenamento**
- Múltiplas opções de armazenamento (128GB, 256GB, 512GB, 1TB)
- Preço dinâmico baseado na seleção
- Verificação de disponibilidade em estoque
- O armazenamento não afeta as imagens (apenas a cor muda as imagens)

### 4. **Integração com Mercado Pago**
- **Cartão de Crédito/Débito**: Via Brick de Cartão do Mercado Pago
- **PIX**: Pagamento instantâneo com código QR
- **Boleto**: Boleto bancário tradicional
- Processamento seguro de pagamentos
- Atualização automática de estoque após pagamento
- Fluxo de checkout em duas etapas (informações + pagamento)

---

## 🚀 Como Usar

### Instalação Rápida

```bash
# 1. Instalar dependências do backend
cd backend
npm install

# 2. Configurar banco de dados
mysql -u root -p < ../db/schema.sql
mysql -u root -p < ../db/insert_iphones.sql
mysql -u root -p < ../db/update_iphones_with_images_final.sql

# 3. Configurar credenciais do Mercado Pago
# Edite backend/config.js e frontend/checkout.js com suas chaves

# 4. Iniciar o servidor
npm start
```

Acesse `http://localhost:3000` no seu navegador.

### Configuração do Mercado Pago

1. Acesse [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. Faça login com sua conta
3. Vá para **Credenciais** e copie:
   - **Access Token** (para `backend/config.js`)
   - **Chave Pública** (para `frontend/checkout.js`)

**Backend** (`backend/config.js`):
```javascript
MP_ACCESS_TOKEN: "seu_access_token_aqui"
```

**Frontend** (`frontend/checkout.js`):
```javascript
const MP_PUBLIC_KEY = "sua_chave_publica_aqui";
```

---

## 📋 Fluxo de Compra

1. **Navegação**: Explore os modelos de iPhone
2. **Seleção de Cor**: Escolha a cor desejada (imagens atualizam automaticamente)
3. **Seleção de Armazenamento**: Escolha o tamanho de armazenamento
4. **Galeria**: Visualize múltiplas imagens com o carrossel interativo
5. **Carrinho**: Adicione produtos ao carrinho
6. **Checkout**: Preencha informações pessoais (nome, e-mail, endereço)
7. **Pagamento**: Selecione método de pagamento (Mercado Pago, Cartão, PIX ou Boleto)
8. **Confirmação**: Complete a transação com segurança

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Versão | Propósito |
|-----------|--------|----------|
| Node.js | 14+ | Runtime JavaScript |
| Express.js | 4.x | Framework web |
| MySQL | 5.7+ | Banco de dados |
| Mercado Pago SDK | Latest | Processamento de pagamentos |
| Multer | 1.x | Upload de imagens |
| JWT | - | Autenticação |
| CSS3 | - | Estilos e animações |
| JavaScript Vanilla | - | Interatividade sem dependências |

---

## 📱 Modelos Disponíveis

- **iPhone 15**: A partir de R$ 4.399,00
- **iPhone 16e**: A partir de R$ 3.899,00
- **iPhone 16**: A partir de R$ 4.999,00
- **iPhone 17**: A partir de R$ 7.999,00
- **iPhone 17 Pro**: A partir de R$ 11.499,00
- **iPhone 17 Pro Max**: A partir de R$ 12.499,00

---

## 🔒 Recursos de Segurança

- ✅ Validação de entrada no backend
- ✅ Proteção contra SQL Injection (prepared statements)
- ✅ Autenticação JWT para admin
- ✅ Verificação de estoque antes de finalizar pedido
- ✅ Processamento seguro de pagamentos via Mercado Pago
- ✅ Senhas criptografadas com bcrypt
- ✅ Verificação de preços no backend (evita manipulação no frontend)

---

## 📚 Documentação Completa

Para mais detalhes sobre instalação e configuração, consulte o arquivo [GUIA_INSTALACAO.md](./GUIA_INSTALACAO.md).

---

## 🐛 Troubleshooting

### Erro: "Banco de dados não encontrado"
- Verifique se MySQL está rodando
- Confirme as credenciais em `backend/config.js`
- Execute os scripts SQL em `db/`

### Erro: "Imagens não carregam"
- Certifique-se que as imagens estão em `backend/uploads/`
- Verifique os nomes das pastas (devem corresponder aos produtos)
- Exemplo: `backend/uploads/iphone 15 branco/1.webp`

### Erro: "Mercado Pago não funciona"
- Valide suas credenciais (Access Token e Chave Pública)
- Certifique-se de estar em ambiente de teste/produção correto
- Verifique se a SDK do Mercado Pago foi instalada: `npm install mercadopago`

---

## 🎯 Próximos Passos

- [ ] Sistema de autenticação de usuário
- [ ] Histórico de pedidos do cliente
- [ ] Avaliações e comentários de produtos
- [ ] Busca e filtros avançados
- [ ] Relatórios de vendas
- [ ] Notificações por e-mail
- [ ] Aplicativo mobile
- [ ] Sistema de cupons e descontos

---

## 📞 Suporte

Para dúvidas ou problemas, consulte:
- [Documentação Mercado Pago](https://www.mercadopago.com.br/developers)
- [Documentação Express.js](https://expressjs.com/)
- [Documentação MySQL](https://dev.mysql.com/doc/)

---

**Versão**: 2.0.0 (com Carrossel, Seleção de Cores e Mercado Pago)  
**Última atualização**: Outubro de 2025  
**Status**: Pronto para produção (com configurações adequadas)
