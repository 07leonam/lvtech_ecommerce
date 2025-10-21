
const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const multer = require("multer");
const path = require("path");
const config = require("./config");

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
    cookie: { secure: false }, // Use secure: true em produção com HTTPS
  })
);

// Configuração do Multer para upload de imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads"); // As imagens serão salvas na pasta 'uploads'
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});
const upload = multer({ storage: storage });

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.sendStatus(401); // Não autorizado

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // Token inválido ou expirado
    req.user = user;
    next();
  });
};

// Middleware para verificar se é administrador
const authorizeAdmin = (req, res, next) => {
  if (req.user.tipo !== "admin") {
    return res.sendStatus(403); // Proibido
  }
  next();
};

// Rotas de Autenticação
app.post("/api/login", async (req, res) => {
  const { email, senha } = req.body;
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM usuarios WHERE email = ?",
      [email]
    );
    const user = rows[0];

    if (!user) {
      return res.status(400).send("Email ou senha inválidos.");
    }

    const isMatch = await bcrypt.compare(senha, user.senha);
    if (!isMatch) {
      return res.status(400).send("Email ou senha inválidos.");
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, tipo: user.tipo },
      JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.cookie("token", token, { httpOnly: true });
    res.json({ message: "Login bem-sucedido", user: { id: user.id, nome: user.nome, email: user.email, tipo: user.tipo } });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).send("Erro no servidor.");
  }
});

app.post("/api/logout", (req, res) => {
  res.clearCookie("token");
  res.send("Logout bem-sucedido.");
});

// Rotas de Produtos (Admin)
app.post("/api/admin/produtos", authenticateToken, authorizeAdmin, upload.single("imagem"), async (req, res) => {
  const { nome, descricao, preco, estoque } = req.body;
  const imagem = req.file ? req.file.filename : null;
  try {
    await pool.execute(
      "INSERT INTO produtos (nome, descricao, preco, estoque, imagem) VALUES (?, ?, ?, ?, ?)",
      [nome, descricao, preco, estoque, imagem]
    );
    res.status(201).send("Produto adicionado com sucesso.");
  } catch (error) {
    console.error("Erro ao adicionar produto:", error);
    res.status(500).send("Erro no servidor.");
  }
});

app.put("/api/admin/produtos/:id", authenticateToken, authorizeAdmin, upload.single("imagem"), async (req, res) => {
  const { id } = req.params;
  const { nome, descricao, preco, estoque } = req.body;
  const imagem = req.file ? req.file.filename : null;
  try {
    let query = "UPDATE produtos SET nome = ?, descricao = ?, preco = ?, estoque = ?";
    let params = [nome, descricao, preco, estoque];
    if (imagem) {
      query += ", imagem = ?";
      params.push(imagem);
    }
    query += " WHERE id = ?";
    params.push(id);

    await pool.execute(query, params);
    res.send("Produto atualizado com sucesso.");
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    res.status(500).send("Erro no servidor.");
  }
});

app.delete("/api/admin/produtos/:id", authenticateToken, authorizeAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.execute("DELETE FROM produtos WHERE id = ?", [id]);
    res.send("Produto excluído com sucesso.");
  } catch (error) {
    console.error("Erro ao excluir produto:", error);
    res.status(500).send("Erro no servidor.");
  }
});

// Rotas de Produtos (Público)
app.get("/api/produtos", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM produtos");
    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    res.status(500).send("Erro no servidor.");
  }
});

app.get("/api/produtos/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute("SELECT * FROM produtos WHERE id = ?", [id]);
    const produto = rows[0];
    if (!produto) {
      return res.status(404).send("Produto não encontrado.");
    }
    res.json(produto);
  } catch (error) {
    console.error("Erro ao buscar produto:", error);
    res.status(500).send("Erro no servidor.");
  }
});

// Rotas do Carrinho (Sessão)
app.post("/api/carrinho/adicionar", (req, res) => {
  const { produto_id, quantidade } = req.body;
  if (!req.session.cart) {
    req.session.cart = [];
  }

  const existingItemIndex = req.session.cart.findIndex(
    (item) => item.produto_id === produto_id
  );

  if (existingItemIndex > -1) {
    req.session.cart[existingItemIndex].quantidade += quantidade;
  } else {
    req.session.cart.push({ produto_id, quantidade });
  }
  res.json(req.session.cart);
});

app.put("/api/carrinho/atualizar", (req, res) => {
  const { produto_id, quantidade } = req.body;
  if (!req.session.cart) {
    return res.status(404).send("Carrinho vazio.");
  }

  const itemIndex = req.session.cart.findIndex(
    (item) => item.produto_id === produto_id
  );

  if (itemIndex > -1) {
    if (quantidade <= 0) {
      req.session.cart.splice(itemIndex, 1); // Remove item se quantidade for 0 ou menos
    } else {
      req.session.cart[itemIndex].quantidade = quantidade;
    }
    res.json(req.session.cart);
  } else {
    res.status(404).send("Item não encontrado no carrinho.");
  }
});

app.delete("/api/carrinho/remover/:produto_id", (req, res) => {
  const { produto_id } = req.params;
  if (!req.session.cart) {
    return res.status(404).send("Carrinho vazio.");
  }

  req.session.cart = req.session.cart.filter(
    (item) => item.produto_id !== parseInt(produto_id)
  );
  res.json(req.session.cart);
});

app.get("/api/carrinho", async (req, res) => {
  if (!req.session.cart || req.session.cart.length === 0) {
    return res.json([]);
  }

  try {
    const productIds = req.session.cart.map((item) => item.produto_id);
    const [products] = await pool.execute(
      `SELECT id, nome, preco, imagem FROM produtos WHERE id IN (${productIds.join(",")})`
    );

    const cartWithDetails = req.session.cart.map((item) => {
      const productDetail = products.find((p) => p.id === item.produto_id);
      return {
        ...item,
        nome: productDetail ? productDetail.nome : "Produto Desconhecido",
        preco_unitario: productDetail ? productDetail.preco : 0,
        imagem: productDetail ? productDetail.imagem : null,
      };
    });
    res.json(cartWithDetails);
  } catch (error) {
    console.error("Erro ao buscar detalhes do carrinho:", error);
    res.status(500).send("Erro no servidor.");
  }
});

// Rotas de Pedidos
app.post("/api/checkout", authenticateToken, async (req, res) => {
  const { nome, email, endereco, forma_pagamento } = req.body; // Endereço e forma de pagamento não são persistidos no DB, apenas para simulação
  const userId = req.user.id; // Obtém o ID do usuário autenticado

  if (!req.session.cart || req.session.cart.length === 0) {
    return res.status(400).send("Carrinho vazio. Não é possível finalizar o pedido.");
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Criar o pedido
    const [orderResult] = await connection.execute(
      "INSERT INTO pedidos (usuario_id, status) VALUES (?, ?)",
      [userId, "pendente"]
    );
    const pedidoId = orderResult.insertId;

    // 2. Adicionar itens ao pedido e atualizar estoque
    for (const item of req.session.cart) {
      const [productRows] = await connection.execute(
        "SELECT preco, estoque FROM produtos WHERE id = ? FOR UPDATE", // Bloqueia o produto para atualização
        [item.produto_id]
      );
      const product = productRows[0];

      if (!product || product.estoque < item.quantidade) {
        await connection.rollback();
        return res.status(400).send(`Estoque insuficiente para o produto ${item.produto_id}.`);
      }

      await connection.execute(
        "INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco) VALUES (?, ?, ?, ?)",
        [pedidoId, item.produto_id, item.quantidade, product.preco]
      );

      await connection.execute(
        "UPDATE produtos SET estoque = estoque - ? WHERE id = ?",
        [item.quantidade, item.produto_id]
      );
    }

    await connection.commit();
    req.session.cart = []; // Limpa o carrinho após o checkout
    res.status(201).send("Pedido finalizado com sucesso!");
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Erro ao finalizar pedido:", error);
    res.status(500).send("Erro no servidor ao finalizar o pedido.");
  } finally {
    if (connection) connection.release();
  }
});

// Rotas de Relatórios (Admin)
app.get("/api/admin/relatorios/vendas-por-produto", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT p.nome, SUM(ip.quantidade) AS total_vendido, SUM(ip.quantidade * ip.preco) AS receita_total FROM itens_pedido ip JOIN produtos p ON ip.produto_id = p.id GROUP BY p.nome ORDER BY receita_total DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Erro ao gerar relatório de vendas por produto:", error);
    res.status(500).send("Erro no servidor.");
  }
});

app.get("/api/admin/relatorios/total-pedidos", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT COUNT(id) AS total_pedidos, SUM(CASE WHEN status = \'entregue\' THEN 1 ELSE 0 END) AS pedidos_entregues, SUM(CASE WHEN status = \'pendente\' THEN 1 ELSE 0 END) AS pedidos_pendentes FROM pedidos"
    );
    res.json(rows[0]);
  } catch (error) {
    console.error("Erro ao gerar relatório de total de pedidos:", error);
    res.status(500).send("Erro no servidor.");
  }
});

// Servir arquivos estáticos (imagens de produtos)
app.use("/uploads", express.static("uploads"));

app.use(express.static(path.join(__dirname, "../frontend")));

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor backend rodando na porta ${PORT}`);
});

