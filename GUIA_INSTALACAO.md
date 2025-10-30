# Guia de Instalação e Configuração - LVTech E-commerce

## Visão Geral

Este projeto é um e-commerce de iPhones com as seguintes funcionalidades:

- **Carrossel de Imagens**: Exibe múltiplas imagens para cada produto com navegação por setas e miniaturas.
- **Seleção de Cores**: Permite alternar entre diferentes cores de iPhone, atualizando as imagens automaticamente.
- **Seleção de Armazenamento**: Permite escolher o tamanho de armazenamento (128GB, 256GB, 512GB, 1TB).
- **Integração com Mercado Pago**: Checkout seguro com suporte para Cartão de Crédito, PIX e Boleto.

## Pré-requisitos

- **Node.js** (versão 14 ou superior)
- **npm** ou **yarn**
- **MySQL** (versão 5.7 ou superior)
- **Navegador moderno** (Chrome, Firefox, Safari, Edge)

## Instalação

### 1. Clonar ou Extrair o Projeto

```bash
# Se estiver em um arquivo ZIP, extraia-o
unzip lvtech_ecommerce.zip
cd lvtech_ecommerce
```

### 2. Configurar o Banco de Dados

#### 2.1 Criar o Banco de Dados

```bash
# Acesse o MySQL
mysql -u root -p

# No prompt do MySQL, execute:
CREATE DATABASE ecommerce_iphone;
USE ecommerce_iphone;
```

#### 2.2 Importar o Schema

```bash
# Ainda no MySQL, importe o arquivo de schema
source db/schema.sql;
source db/insert_iphones.sql;
source db/update_iphones_with_images_final.sql;
```

### 3. Configurar o Backend

```bash
cd backend

# Instalar dependências
npm install

# Criar arquivo .env (opcional, para variáveis de ambiente)
# Você pode definir as variáveis de ambiente ou editar config.js
```

#### 3.1 Configurar Credenciais do Mercado Pago

Edite o arquivo `backend/config.js`:

```javascript
module.exports = {
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_USER: process.env.DB_USER || 'root',
    DB_PASSWORD: process.env.DB_PASSWORD || '',
    DB_NAME: process.env.DB_NAME || 'ecommerce_iphone',
    MP_ACCESS_TOKEN: process.env.MP_ACCESS_TOKEN || "SEU_ACCESS_TOKEN_DO_MERCADO_PAGO_AQUI"
};
```

**Substitua `"SEU_ACCESS_TOKEN_DO_MERCADO_PAGO_AQUI"` pelo seu Access Token real do Mercado Pago.**

Para obter suas credenciais do Mercado Pago:

1. Acesse [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. Faça login com sua conta do Mercado Pago
3. Vá para **Credenciais** e copie seu **Access Token**

### 4. Configurar o Frontend

Edite o arquivo `frontend/checkout.js`:

```javascript
// Chave pública do Mercado Pago (Substitua pela sua chave pública real)
const MP_PUBLIC_KEY = "SUA_CHAVE_PUBLICA_DO_MERCADO_PAGO_AQUI";
```

**Substitua `"SUA_CHAVE_PUBLICA_DO_MERCADO_PAGO_AQUI"` pela sua Chave Pública real do Mercado Pago.**

Para obter a Chave Pública:

1. Acesse [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. Vá para **Credenciais** e copie sua **Chave Pública**

## Executar o Projeto

### 1. Iniciar o Backend

```bash
cd backend
npm start
# ou
node server.js
```

O servidor backend será iniciado na porta **3000** (http://localhost:3000).

### 2. Acessar o Frontend

Abra seu navegador e acesse:

```
http://localhost:3000
```

## Estrutura do Projeto

```
lvtech_ecommerce/
├── backend/
│   ├── server.js              # Servidor Express principal
│   ├── config.js              # Configurações (DB, Mercado Pago)
│   ├── package.json           # Dependências do Node.js
│   ├── uploads/               # Pasta para armazenar imagens dos produtos
│   └── node_modules/          # Dependências instaladas
├── frontend/
│   ├── index.html             # Página inicial
│   ├── iphone15.html          # Página do iPhone 15
│   ├── iphone16e.html         # Página do iPhone 16e
│   ├── iphone16.html          # Página do iPhone 16
│   ├── iphone17.html          # Página do iPhone 17
│   ├── iphone17pro.html       # Página do iPhone 17 Pro
│   ├── iphone17promax.html    # Página do iPhone 17 Pro Max
│   ├── carrinho.html          # Página do carrinho
│   ├── checkout.html          # Página de checkout
│   ├── admin.html             # Página de administração
│   ├── styles.css             # Estilos CSS
│   ├── script.js              # Scripts gerais
│   ├── model_logic.js         # Lógica de produtos e carrossel
│   ├── carrinho.js            # Lógica do carrinho
│   ├── checkout.js            # Lógica de checkout e Mercado Pago
│   └── admin.js               # Lógica de administração
├── db/
│   ├── schema.sql             # Schema do banco de dados
│   ├── insert_iphones.sql     # Dados iniciais dos iPhones
│   └── update_iphones_with_images_final.sql # Atualização das imagens
├── imagens_iphones/           # Imagens dos produtos (referência)
└── GUIA_INSTALACAO.md         # Este arquivo
```

## Funcionalidades Implementadas

### 1. Carrossel de Imagens

- **Navegação por Setas**: Clique nas setas (< >) para navegar entre as imagens.
- **Miniaturas Clicáveis**: Clique em qualquer miniatura para exibir a imagem em tamanho grande.
- **Transição Suave**: As imagens transitam suavemente com animação CSS.

### 2. Seleção de Cores

- **Botões de Cor**: Cada cor disponível é representada por um botão com a cor visual.
- **Atualização de Imagens**: Ao selecionar uma cor, as imagens do carrossel são atualizadas automaticamente.
- **Indicador Visual**: A cor selecionada é destacada com uma borda.

### 3. Seleção de Armazenamento

- **Botões de Armazenamento**: Cada tamanho de armazenamento é exibido como um botão.
- **Preço Dinâmico**: O preço é atualizado quando você seleciona um armazenamento diferente.
- **Indicador Visual**: O armazenamento selecionado é destacado com uma borda.

### 4. Integração com Mercado Pago

#### Fluxo de Checkout

1. **Carrinho**: Adicione produtos ao carrinho.
2. **Checkout**: Vá para a página de checkout.
3. **Informações Pessoais**: Preencha nome, e-mail e endereço.
4. **Seleção de Pagamento**: Escolha a forma de pagamento (Mercado Pago - Cartão, PIX ou Boleto).
5. **Próximo Passo**: Clique em "Próximo Passo" para exibir o formulário de pagamento do Mercado Pago.
6. **Pagamento**: Complete o pagamento usando o Brick de Cartão ou outro método.
7. **Confirmação**: Clique em "Confirmar Pagamento" para finalizar o pedido.

#### Métodos de Pagamento Suportados

- **Cartão de Crédito/Débito**: Via Brick de Cartão do Mercado Pago.
- **PIX**: Gera um código QR para pagamento instantâneo.
- **Boleto**: Gera um boleto bancário para pagamento.

## Configuração Avançada

### Variáveis de Ambiente

Você pode usar variáveis de ambiente para configurar o projeto sem editar os arquivos:

```bash
# No backend
export DB_HOST=localhost
export DB_USER=root
export DB_PASSWORD=sua_senha
export DB_NAME=ecommerce_iphone
export MP_ACCESS_TOKEN=seu_access_token_aqui
export PORT=3000

# No frontend (se necessário)
export REACT_APP_API_URL=http://localhost:3000
export REACT_APP_MP_PUBLIC_KEY=sua_chave_publica_aqui
```

### Personalização de Cores

As cores dos iPhones são definidas em `frontend/model_logic.js`:

```javascript
function getColorCode(colorName) {
    switch(colorName) {
        case 'Preto': return '#0A0A0A';
        case 'Branco': return '#F8F8F8';
        case 'Ultramarino': return '#0070c9';
        case 'Laranja': return '#FF4500';
        default: return '#CCCCCC';
    }
}
```

Você pode adicionar mais cores editando este objeto.

## Solução de Problemas

### Erro: "Banco de dados não encontrado"

- Certifique-se de que o MySQL está em execução.
- Verifique as credenciais do banco de dados em `backend/config.js`.
- Certifique-se de que o banco de dados `ecommerce_iphone` foi criado.

### Erro: "Chave pública do Mercado Pago ausente"

- Verifique se você substituiu `SUA_CHAVE_PUBLICA_DO_MERCADO_PAGO_AQUI` em `frontend/checkout.js`.
- Certifique-se de que a chave é válida e não está expirada.

### Erro: "Imagens não carregam"

- Certifique-se de que as imagens estão na pasta `backend/uploads/` com a estrutura correta.
- Verifique se os nomes das pastas correspondem aos nomes dos produtos no banco de dados.
- Exemplo: `backend/uploads/iphone 15 branco/1.webp`

### Erro: "Carrinho vazio ao fazer checkout"

- Certifique-se de que você adicionou produtos ao carrinho antes de ir para o checkout.
- Verifique se as sessões estão habilitadas no backend.

## Próximos Passos

1. **Autenticação de Usuário**: Implemente login e registro de usuários.
2. **Histórico de Pedidos**: Permita que os usuários visualizem seus pedidos anteriores.
3. **Avaliações de Produtos**: Adicione um sistema de avaliações e comentários.
4. **Busca e Filtros**: Implemente busca e filtros avançados.
5. **Relatórios de Vendas**: Crie um painel de administração com relatórios.
6. **Notificações por E-mail**: Envie confirmações de pedido e atualizações de status.

## Suporte

Para dúvidas ou problemas, consulte a documentação oficial:

- [Documentação do Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs)
- [Documentação do Express.js](https://expressjs.com/)
- [Documentação do MySQL](https://dev.mysql.com/doc/)

## Licença

Este projeto é fornecido como está, sem garantias. Use por sua conta e risco.

---

**Última atualização**: Outubro de 2025
