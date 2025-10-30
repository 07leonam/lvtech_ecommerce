const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const config = require("./config");
const { MercadoPagoConfig, Preference } = require("mercadopago");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwtkey";

// Configuração do banco de dados
const pool = mysql.createPool({
  host: config.DB_HOST,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  session({
    secret: "supersecretcartsessionkey",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

// Configuração do Multer para upload de imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// Autenticação e autorização
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const authorizeAdmin = (req, res, next) => {
  if (req.user.tipo !== "admin") return res.sendStatus(403);
  next();
};
// server.js (ADICIONAR ESTE BLOCO)

// ----------------------- ROTAS DE AUTENTICAÇÃO -----------------------

app.post("/api/login", async (req, res) => {
    const { email, senha } = req.body;
    
    try {
        const [users] = await pool.execute("SELECT * FROM usuarios WHERE email = ?", [email]);
        const user = users[0];

        // ATENÇÃO DE SEGURANÇA: Esta linha é uma comparação de texto puro.
        // É NECESSÁRIO porque seu banco não tem o hash bcrypt. Mude isso em produção!
        // No futuro, use: await bcrypt.compare(senha, user.senha)
        if (user && senha === user.senha) { 
            
            // Cria o objeto de usuário sem a senha para segurança
            const { senha: _, ...userWithoutPass } = user; 
            
            // 1. Gera o token JWT
            const token = jwt.sign(userWithoutPass, JWT_SECRET, { expiresIn: '1h' });
            
            // 2. Define o cookie de autenticação (CRÍTICO para o frontend)
            res.cookie('token', token, { 
                httpOnly: true, 
                secure: process.env.NODE_ENV === 'production', 
                maxAge: 3600000 // 1 hora
            }); 
            
            // 3. Retorna os dados do usuário (CRÍTICO para o admin.js verificar o tipo)
            return res.json({ message: "Login realizado com sucesso", user: userWithoutPass }); 
        } else {
            return res.status(401).send("Email ou senha inválidos.");
        }
    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).send("Erro no servidor.");
    }
});

app.post("/api/logout", (req, res) => {
    res.clearCookie('token');
    res.sendStatus(200);
});

// ----------------------- FIM ROTAS DE AUTENTICAÇÃO -----------------------

// ----------------------- ROTAS DE PRODUTOS (ADMIN) -----------------------
const uploadMultiple = upload.array("imagens", 6); // até 6 imagens por produto

app.post("/api/admin/produtos", authenticateToken, authorizeAdmin, (req, res) => {
  uploadMultiple(req, res, async function (err) {
    if (err) return res.status(400).send("Erro no upload das imagens.");

    const { nome, descricao, preco, estoque } = req.body;

    try {
      const [result] = await pool.execute(
        "INSERT INTO produtos (nome, descricao, preco, estoque) VALUES (?, ?, ?, ?)",
        [nome, descricao, preco, estoque]
      );
      const produtoId = result.insertId;

      if (req.files) {
        for (let i = 0; i < req.files.length; i++) {
          const file = req.files[i];
          await pool.execute(
            "INSERT INTO produto_imagens (produto_id, caminho, ordem) VALUES (?, ?, ?)",
            [produtoId, file.filename, i + 1]
          );
        }
      }

      res.status(201).send("Produto e imagens adicionados com sucesso!");
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
      res.status(500).send("Erro no servidor.");
    }
  });
});

app.put("/api/admin/produtos/:id", authenticateToken, authorizeAdmin, (req, res) => {
  uploadMultiple(req, res, async function (err) {
    if (err) return res.status(400).send("Erro no upload das imagens.");

    const { id } = req.params;
    const { nome, descricao, preco, estoque } = req.body;

    try {
      await pool.execute(
        "UPDATE produtos SET nome = ?, descricao = ?, preco = ?, estoque = ? WHERE id = ?",
        [nome, descricao, preco, estoque, id]
      );

      if (req.files) {
        for (let i = 0; i < req.files.length; i++) {
          const file = req.files[i];
          await pool.execute(
            "INSERT INTO produto_imagens (produto_id, caminho, ordem) VALUES (?, ?, ?)",
            [id, file.filename, i + 1]
          );
        }
      }

      res.send("Produto atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);
      res.status(500).send("Erro no servidor.");
    }
  });
});

app.delete("/api/admin/produtos/:id", authenticateToken, authorizeAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.execute("DELETE FROM produto_imagens WHERE produto_id = ?", [id]);
    await pool.execute("DELETE FROM produtos WHERE id = ?", [id]);
    res.send("Produto e imagens excluídos com sucesso.");
  } catch (error) {
    console.error("Erro ao excluir produto:", error);
    res.status(500).send("Erro no servidor.");
  }
});

// ----------------------- ROTAS DE PRODUTOS (PÚBLICO) -----------------------

// Nova Rota: Listar imagens de um produto/modelo
app.get("/api/produtos/:modelo/imagens", async (req, res) => {
  const { modelo } = req.params; // Ex: "iphone 15 branco"
  // Decodifica o nome do modelo para lidar com espaços e caracteres especiais na URL
  const decodedModelo = decodeURIComponent(modelo);
  
  try {
    // 1. Encontra o ID de um produto que corresponda ao modelo (cor e modelo, sem armazenamento)
    // O nome do produto no BD é "iPhone 15 Branco 128GB". O modelo passado é "iphone 15 branco".
    // Precisamos encontrar todos os produtos que comecem com o nome do modelo (ex: 'iPhone 15 Branco%')
    const [produtos] = await pool.execute(
      "SELECT id FROM produtos WHERE nome LIKE ?", 
      [`%${decodedModelo.replace(/\s/g, '%')}%`] // Ex: %iphone%15%branco%
    );

    if (produtos.length === 0) {
        return res.json([]); // Retorna array vazio se não encontrar produtos para o modelo
    }
    
    // 2. Busca as imagens para o primeiro produto encontrado (assumindo que as imagens são as mesmas para todas as variações de armazenamento da mesma cor)
    const produtoId = produtos[0].id;

    const [imagens] = await pool.execute(
      "SELECT caminho FROM produto_imagens WHERE produto_id = ? ORDER BY ordem ASC",
      [produtoId]
    );
    
    // Retorna apenas o caminho da imagem
    res.json(imagens.map(img => img.caminho));
    
  } catch (error) {
    console.error("Erro ao listar imagens:", error);
    res.status(500).send("Erro no servidor.");
  }
});
app.get("/api/produtos", async (req, res) => {
  try {
    const [produtos] = await pool.execute("SELECT * FROM produtos");

    const produtoIds = produtos.map(p => p.id);
    let imagens = [];
    if (produtoIds.length > 0) {
      [imagens] = await pool.execute(
        `SELECT * FROM produto_imagens WHERE produto_id IN (${produtoIds.join(",")}) ORDER BY ordem ASC`
      );
    }

    const produtosComImagens = produtos.map(prod => ({
      ...prod,
      imagens: imagens.filter(img => img.produto_id === prod.id).map(img => img.caminho),
      imagem: imagens.filter(img => img.produto_id === prod.id)[0]?.caminho || null, // PRIMEIRA imagem
    }));

    res.json(produtosComImagens);
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    res.status(500).send("Erro no servidor.");
  }
});

app.get("/api/produtos/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [produtos] = await pool.execute("SELECT * FROM produtos WHERE id = ?", [id]);
    const produto = produtos[0];
    if (!produto) return res.status(404).send("Produto não encontrado.");

    const [imagens] = await pool.execute(
      "SELECT * FROM produto_imagens WHERE produto_id = ? ORDER BY ordem ASC",
      [id]
    );

    res.json({
      ...produto,
      imagens: imagens.map(img => img.caminho),
      imagem: imagens[0]?.caminho || null, // PRIMEIRA imagem
    });
  } catch (error) {
    console.error("Erro ao buscar produto:", error);
    res.status(500).send("Erro no servidor.");
  }
});

// ----------------------- ROTAS DO CARRINHO -----------------------

// ----------------------- ROTAS DE CHECKOUT (MERCADO PAGO) -----------------------

// Inicialização do Mercado Pago
const client = new MercadoPagoConfig({ accessToken: config.MP_ACCESS_TOKEN });
const preference = new Preference(client);

app.post("/api/checkout/preference", async (req, res) => {
  const { items } = req.body; // Recebe os itens do frontend
  
  if (!config.MP_ACCESS_TOKEN || config.MP_ACCESS_TOKEN === "SEU_ACCESS_TOKEN_DO_MERCADO_PAGO_AQUI") {
      return res.status(500).send("Erro de configuração: Access Token do Mercado Pago ausente no backend.");
  }

  // Busca os itens reais do carrinho para garantir que os preços não foram adulterados no frontend
  if (!req.session.cart || req.session.cart.length === 0) return res.status(400).send("Carrinho vazio.");

  try {
    const productIds = req.session.cart.map(item => item.produto_id);
    const [products] = await pool.execute(
      `SELECT id, nome, preco FROM produtos WHERE id IN (${productIds.join(",")})`
    );
    
    // Mapeia os itens do carrinho para o formato do Mercado Pago
    const mpItems = req.session.cart.map(cartItem => {
        const product = products.find(p => p.id === cartItem.produto_id);
        if (!product) throw new Error(`Produto ID ${cartItem.produto_id} não encontrado.`);
        
        return {
            title: product.nome,
            quantity: cartItem.quantidade,
            unit_price: parseFloat(product.preco),
        };
    });

    const body = {
      items: mpItems,
      back_urls: {
        success: "http://localhost:3000/checkout.html?status=success", // URL de sucesso (ajustar para o domínio real)
        failure: "http://localhost:3000/checkout.html?status=failure", // URL de falha
        pending: "http://localhost:3000/checkout.html?status=pending", // URL pendente
      },
      auto_return: "approved",
    };

    const createdPreference = await preference.create({ body });
    
    res.json({ preferenceId: createdPreference.id });

  } catch (error) {
    console.error("Erro ao criar preferência de pagamento:", error);
    res.status(500).send("Erro ao criar preferência de pagamento.");
  }
});

// Rota para finalizar o pedido (após o pagamento)
app.post("/api/checkout", async (req, res) => {
    const { nome, email, endereco, forma_pagamento } = req.body;
    
    // 1. Verificar se o carrinho está vazio
    if (!req.session.cart || req.session.cart.length === 0) {
        return res.status(400).send("Carrinho vazio. Não é possível finalizar o pedido.");
    }
    
    // 2. Simulação de processamento de pagamento (em um cenário real, haveria uma verificação do status do Mercado Pago)
    let pagamento_status = "Aguardando Pagamento";
    if (forma_pagamento.startsWith('mp_')) {
        // Se for Mercado Pago, assumimos que o pagamento será processado pelo Brick/Checkout Pro
        // Aqui, o frontend deveria ter um mecanismo para verificar o status do pagamento.
        // Como o foco é a integração, vamos simular que o pagamento está "pendente" ou "aprovado"
        // dependendo da forma de pagamento.
        pagamento_status = forma_pagamento === 'mp_cartao' ? "Aprovado (Simulado)" : "Aguardando Pagamento (PIX/Boleto)";
    } else {
        pagamento_status = "Aprovado (Outra Forma)";
    }
    
    // 3. Inserir o pedido no banco de dados (simulação)
    try {
        const [result] = await pool.execute(
            "INSERT INTO pedidos (nome_cliente, email_cliente, endereco_entrega, forma_pagamento, status_pagamento, data_pedido) VALUES (?, ?, ?, ?, ?, NOW())",
            [nome, email, endereco, forma_pagamento, pagamento_status]
        );
        const pedidoId = result.insertId;
        
        // 4. Inserir os itens do pedido e atualizar o estoque
        const productIds = req.session.cart.map(item => item.produto_id);
        const [products] = await pool.execute(
            `SELECT id, preco, estoque FROM produtos WHERE id IN (${productIds.join(",")})`
        );
        
        for (const cartItem of req.session.cart) {
            const product = products.find(p => p.id === cartItem.produto_id);
            if (!product) continue; // Ignora se o produto não for encontrado
            
            await pool.execute(
                "INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, preco_unitario) VALUES (?, ?, ?, ?)",
                [pedidoId, cartItem.produto_id, cartItem.quantidade, product.preco]
            );
            
            // Atualiza o estoque
            const novoEstoque = product.estoque - cartItem.quantidade;
            await pool.execute(
                "UPDATE produtos SET estoque = ? WHERE id = ?",
                [novoEstoque, cartItem.produto_id]
            );
        }
        
        // 5. Limpar o carrinho
        req.session.cart = [];
        
        res.status(200).send("Pedido finalizado com sucesso. Status do Pagamento: " + pagamento_status);
        
    } catch (error) {
        console.error("Erro ao finalizar pedido:", error);
        res.status(500).send("Erro no servidor ao finalizar o pedido.");
    }
});

// ----------------------- ROTAS DO CARRINHO -----------------------
app.post("/api/carrinho/adicionar", (req, res) => {
  const { produto_id, quantidade } = req.body;
  if (!req.session.cart) req.session.cart = [];

  const existingItemIndex = req.session.cart.findIndex(item => item.produto_id === produto_id);
  if (existingItemIndex > -1) {
    req.session.cart[existingItemIndex].quantidade += quantidade;
  } else {
    req.session.cart.push({ produto_id, quantidade });
  }

  res.json(req.session.cart);
});

app.put("/api/carrinho/atualizar", (req, res) => {
  const { produto_id, quantidade } = req.body;
  if (!req.session.cart) return res.status(404).send("Carrinho vazio.");

  const index = req.session.cart.findIndex(item => item.produto_id === produto_id);
  if (index > -1) {
    if (quantidade <= 0) req.session.cart.splice(index, 1);
    else req.session.cart[index].quantidade = quantidade;
    res.json(req.session.cart);
  } else {
    res.status(404).send("Item não encontrado no carrinho.");
  }
});

app.delete("/api/carrinho/remover/:produto_id", (req, res) => {
  const { produto_id } = req.params;
  if (!req.session.cart) return res.status(404).send("Carrinho vazio.");

  req.session.cart = req.session.cart.filter(item => item.produto_id !== parseInt(produto_id));
  res.json(req.session.cart);
});

app.get("/api/carrinho", async (req, res) => {
  if (!req.session.cart || req.session.cart.length === 0) return res.json([]);

  try {
    const productIds = req.session.cart.map(item => item.produto_id);
    const [products] = await pool.execute(
      `SELECT * FROM produtos WHERE id IN (${productIds.join(",")})`
    );

    const [imagens] = await pool.execute(
      `SELECT * FROM produto_imagens WHERE produto_id IN (${productIds.join(",")}) AND ordem = 1`
    );

    const cartWithImages = req.session.cart.map(item => {
      const product = products.find(p => p.id === item.produto_id);
      const firstImage = imagens.find(img => img.produto_id === item.produto_id)?.caminho || null;
      return {
        ...item,
        nome: product?.nome || "Produto Desconhecido",
        preco_unitario: product?.preco || 0,
        imagem: firstImage, // PRIMEIRA imagem (ordem 1)
      };
    });

    res.json(cartWithImages);
  } catch (error) {
    console.error("Erro ao buscar carrinho:", error);
    res.status(500).send("Erro no servidor.");
  }
});

// ----------------------- SERVIR ARQUIVOS -----------------------
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "../frontend")));

// ----------------------- INICIAR SERVIDOR -----------------------
app.listen(PORT, () => {
  console.log(`Servidor backend rodando na porta ${PORT}`);
});