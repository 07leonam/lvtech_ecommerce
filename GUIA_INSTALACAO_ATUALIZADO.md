# Guia de Instalação - LVTech E-commerce com Múltiplas Imagens

## 📋 Pré-requisitos

- **Node.js** 14+ instalado
- **MySQL** 5.7+ instalado e rodando
- **npm** (gerenciador de pacotes do Node.js)
- **Git** (opcional, para clonar o repositório)

---

## 🚀 Passo 1: Preparar o Banco de Dados

### 1.1 Criar o banco de dados

```bash
mysql -u root -p
```

Dentro do MySQL:

```sql
CREATE DATABASE ecommerce_iphone;
USE ecommerce_iphone;
```

### 1.2 Executar os scripts SQL

Saia do MySQL (`exit`) e execute os scripts na ordem correta:

```bash
# 1. Criar as tabelas (schema)
mysql -u root -p ecommerce_iphone < db/schema.sql

# 2. Inserir os produtos base (sem imagens)
mysql -u root -p ecommerce_iphone < db/insert_iphones.sql

# 3. Popular a tabela produto_imagens com os caminhos das imagens
mysql -u root -p ecommerce_iphone < db/update_iphones_with_images_final.sql
```

### 1.3 Verificar se os dados foram inseridos

```bash
mysql -u root -p ecommerce_iphone
```

Dentro do MySQL:

```sql
-- Verificar se os produtos foram inseridos
SELECT COUNT(*) FROM produtos;

-- Verificar se as imagens foram inseridas
SELECT COUNT(*) FROM produto_imagens;

-- Ver um exemplo de produto com suas imagens
SELECT p.id, p.nome, COUNT(pi.id) as total_imagens
FROM produtos p
LEFT JOIN produto_imagens pi ON p.id = pi.produto_id
GROUP BY p.id
LIMIT 5;
```

Você deve ver algo como:

```
+----+----------------------------+----------------+
| id | nome                       | total_imagens  |
+----+----------------------------+----------------+
|  1 | iPhone 15 Branco 128GB     |       6        |
|  2 | iPhone 15 Preto 128GB      |       5        |
|  3 | iPhone 15 Branco 256GB     |       6        |
|  4 | iPhone 15 Preto 256GB      |       5        |
+----+----------------------------+----------------+
```

---

## 🔧 Passo 2: Configurar o Backend

### 2.1 Instalar dependências

```bash
cd backend
npm install
```

### 2.2 Configurar credenciais

Edite o arquivo `backend/config.js`:

```javascript
module.exports = {
  DB_HOST: 'localhost',
  DB_USER: 'root',
  DB_PASSWORD: 'sua_senha_mysql', // Altere para sua senha
  DB_NAME: 'ecommerce_iphone',
  MP_ACCESS_TOKEN: 'SEU_ACCESS_TOKEN_DO_MERCADO_PAGO_AQUI', // Altere com seu token
};
```

### 2.3 Copiar imagens para o backend

As imagens devem estar em `backend/uploads/` organizadas por cor/modelo:

```
backend/uploads/
├── iphone 15 branco/
│   ├── 1.webp
│   ├── 2.webp
│   ├── 3.webp
│   ├── 4.webp
│   ├── 5.webp
│   └── 6.webp
├── iphone 15 preto/
│   ├── 1.webp
│   ├── 2.webp
│   ├── 3.webp
│   ├── 4.webp
│   └── 5.webp
├── iphone 16e branco/
│   ├── 1.webp
│   ├── 2.webp
│   ├── 3.webp
│   ├── 4.webp
│   ├── 5.webp
│   ├── 6.jpg
│   └── 7.webp
├── iphone 16e preto/
│   ├── 1.webp
│   ├── 2.webp
│   ├── 3.webp
│   ├── 4.webp
│   ├── 5.jpg
│   └── 6.webp
├── iphone 16 ultramarino/
│   ├── 1.webp
│   ├── 2.webp
│   ├── 3.webp
│   ├── 4.webp
│   └── 5.webp
├── iphone 16 preto/
│   ├── 1.webp
│   ├── 2.webp
│   ├── 3.webp
│   ├── 4.webp
│   └── 5.webp
├── iphone 17 branco/
│   ├── 1.webp
│   ├── 2.webp
│   ├── 3.webp
│   └── 4.webp
├── iphone 17 pro laranja/
│   ├── 1.webp
│   ├── 2.webp
│   ├── 4.webp
│   ├── 5.webp
│   └── 6.webp
├── iphone 17 pro/
│   ├── 1.webp
│   ├── 2.webp
│   ├── 3.webp
│   ├── 4.webp
│   └── 5.webp
├── iphone 17 pro max laranja/
│   ├── 1.webp
│   ├── 2.webp
│   ├── 3.webp
│   ├── 4.webp
│   ├── 5.webp
│   └── 6.webp
└── iphone 17 pro max/
    ├── 1.webp
    ├── 2.webp
    ├── 3.webp
    ├── 4.webp
    ├── 5.webp
    └── 6.webp
```

**Nota**: Se você já tem as imagens em `imagens_iphones/`, você pode copiar para `backend/uploads/`:

```bash
cp -r imagens_iphones/* backend/uploads/
```

### 2.4 Iniciar o servidor

```bash
npm start
```

Você deve ver:

```
Servidor rodando em http://localhost:3000
```

---

## 🌐 Passo 3: Acessar o Frontend

Abra seu navegador e acesse:

```
http://localhost:3000
```

---

## 🧪 Passo 4: Testar as Funcionalidades

### 4.1 Testar Carrossel de Imagens

1. Clique em qualquer modelo de iPhone (ex: "iPhone 15")
2. Você deve ver:
   - Uma imagem grande no centro (carrossel)
   - Setas de navegação (< e >)
   - Miniaturas das imagens abaixo
3. Clique nas setas para navegar entre as imagens
4. Clique em qualquer miniatura para exibir a imagem em tamanho grande

### 4.2 Testar Seleção de Cores

1. Na página do iPhone, você deve ver botões de cores (Preto, Branco, Ultramarino, Laranja)
2. Clique em uma cor diferente
3. As imagens do carrossel devem mudar automaticamente
4. O preço pode mudar dependendo da cor/armazenamento

### 4.3 Testar Seleção de Armazenamento

1. Você deve ver botões de armazenamento (128GB, 256GB, 512GB, 1TB)
2. Clique em um armazenamento diferente
3. O preço deve mudar
4. **As imagens NÃO devem mudar** (apenas a cor muda as imagens)

### 4.4 Testar Adicionar ao Carrinho

1. Selecione uma cor e armazenamento
2. Clique em "Adicionar ao Carrinho"
3. Vá para a página do carrinho
4. Você deve ver o produto adicionado com a imagem principal

### 4.5 Testar Checkout com Mercado Pago

1. No carrinho, clique em "Ir para Checkout"
2. Preencha as informações pessoais (nome, e-mail, endereço)
3. Clique em "Próximo Passo"
4. Você deve ver o formulário de pagamento do Mercado Pago
5. **Nota**: Para testar, você precisa ter configurado o Access Token do Mercado Pago

---

## 🔐 Configuração do Mercado Pago

### Obter Credenciais

1. Acesse [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. Faça login com sua conta
3. Vá para **Credenciais**
4. Copie:
   - **Access Token** (para o backend)
   - **Chave Pública** (para o frontend)

### Configurar no Projeto

**Backend** (`backend/config.js`):
```javascript
MP_ACCESS_TOKEN: "seu_access_token_aqui"
```

**Frontend** (`frontend/checkout.js`):
```javascript
const MP_PUBLIC_KEY = "sua_chave_publica_aqui";
```

---

## 📊 Estrutura do Banco de Dados

### Tabela `produtos`
```sql
CREATE TABLE produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10, 2) NOT NULL,
    estoque INT NOT NULL DEFAULT 0
);
```

### Tabela `produto_imagens`
```sql
CREATE TABLE produto_imagens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produto_id INT NOT NULL,
    caminho VARCHAR(255) NOT NULL,
    ordem INT NOT NULL DEFAULT 1,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
);
```

**Exemplo de dados**:
```sql
-- Produto
INSERT INTO produtos (nome, descricao, preco, estoque) 
VALUES ('iPhone 15 Branco 128GB', 'iPhone 15 na cor branca...', 4399.00, 50);

-- Imagens associadas
INSERT INTO produto_imagens (produto_id, caminho, ordem) 
VALUES (1, 'iphone 15 branco/1.webp', 1);
INSERT INTO produto_imagens (produto_id, caminho, ordem) 
VALUES (1, 'iphone 15 branco/2.webp', 2);
-- ... e assim por diante
```

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
- Verifique se o servidor está rodando (`npm start`)

### Erro: "Produtos não aparecem"
- Verifique se os scripts SQL foram executados na ordem correta
- Verifique se o banco de dados foi criado: `mysql -u root -p -e "SHOW DATABASES;"`
- Verifique se os dados foram inseridos: `mysql -u root -p ecommerce_iphone -e "SELECT COUNT(*) FROM produtos;"`

### Erro: "Mercado Pago não funciona"
- Valide suas credenciais (Access Token e Chave Pública)
- Certifique-se de estar em ambiente de teste/produção correto
- Verifique se a SDK do Mercado Pago foi instalada: `npm list mercadopago`

### Erro: "Porta 3000 já está em uso"
- Altere a porta em `backend/server.js`: `const PORT = process.env.PORT || 3001;`
- Ou encerre o processo que está usando a porta 3000

---

## 📝 Estrutura de Pastas

```
lvtech_ecommerce/
├── backend/
│   ├── server.js              # Servidor principal
│   ├── config.js              # Configurações (DB, Mercado Pago)
│   ├── package.json           # Dependências
│   ├── uploads/               # Imagens dos produtos
│   └── node_modules/          # Dependências instaladas
├── frontend/
│   ├── index.html             # Página inicial
│   ├── iphone*.html           # Páginas de produtos
│   ├── carrinho.html          # Carrinho
│   ├── checkout.html          # Checkout
│   ├── styles.css             # Estilos
│   ├── script.js              # Scripts gerais
│   ├── model_logic.js         # Lógica de produtos e carrossel
│   ├── carrinho.js            # Lógica do carrinho
│   └── checkout.js            # Lógica de checkout
├── db/
│   ├── schema.sql             # Schema do banco (EXECUTE PRIMEIRO)
│   ├── insert_iphones.sql     # Inserts de produtos (EXECUTE SEGUNDO)
│   └── update_iphones_with_images_final.sql # Inserts de imagens (EXECUTE TERCEIRO)
├── imagens_iphones/           # Imagens de referência
├── README.md                  # Documentação
├── GUIA_INSTALACAO_ATUALIZADO.md # Este arquivo
└── ALTERACOES_REALIZADAS.md   # Detalhes das alterações
```

---

## ✅ Checklist de Instalação

- [ ] MySQL instalado e rodando
- [ ] Node.js e npm instalados
- [ ] Banco de dados `ecommerce_iphone` criado
- [ ] Scripts SQL executados na ordem correta
- [ ] Dependências do backend instaladas (`npm install`)
- [ ] Arquivo `backend/config.js` configurado
- [ ] Imagens copiadas para `backend/uploads/`
- [ ] Servidor iniciado (`npm start`)
- [ ] Frontend acessível em `http://localhost:3000`
- [ ] Carrossel de imagens funcionando
- [ ] Seleção de cores funcionando
- [ ] Seleção de armazenamento funcionando
- [ ] Carrinho funcionando
- [ ] Checkout funcionando (com Mercado Pago configurado)

---

## 🎯 Próximos Passos

1. **Configurar Mercado Pago** para pagamentos reais
2. **Adicionar autenticação de usuário** para histórico de pedidos
3. **Implementar sistema de avaliações** de produtos
4. **Adicionar filtros e busca** avançada
5. **Criar painel de administração** completo
6. **Integrar com transportadoras** para cálculo de frete

---

## 📞 Suporte

Para dúvidas ou problemas:

- Consulte a documentação do [Express.js](https://expressjs.com/)
- Consulte a documentação do [MySQL](https://dev.mysql.com/doc/)
- Consulte a documentação do [Mercado Pago](https://www.mercadopago.com.br/developers)

---

**Versão**: 2.1.0 (com estrutura de múltiplas imagens)  
**Última atualização**: Outubro de 2025  
**Status**: Pronto para Produção
