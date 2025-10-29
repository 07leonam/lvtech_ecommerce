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
  const dirPath = path.join(__dirname, "uploads", modelo);
  
  try {
    if (fs.existsSync(dirPath)) {
      const files = await fs.promises.readdir(dirPath);
      // Filtra apenas arquivos de imagem (ex: .jpg, .jpeg, .png, .webp) e ordena
      const imageFiles = files
        .filter(file => /\.(jpe?g|png|webp)$/i.test(file))
        .sort(); 
      
      res.json(imageFiles.map(file => `${modelo}/${file}`));
    } else {
      res.status(404).json([]); // Retorna array vazio se a pasta não existir
    }
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
      `SELECT * FROM produto_imagens WHERE produto_id IN (${productIds.join(",")}) ORDER BY ordem ASC`
    );

    const cartWithImages = req.session.cart.map(item => {
      const product = products.find(p => p.id === item.produto_id);
      const firstImage = imagens.find(img => img.produto_id === item.produto_id)?.caminho || null;
      return {
        ...item,
        nome: product?.nome || "Produto Desconhecido",
        preco_unitario: product?.preco || 0,
        imagem: firstImage, // PRIMEIRA imagem
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