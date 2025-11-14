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
require("dotenv").config();

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

// Rota de arquivos estáticos para /uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuração do Multer para upload de imagens
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Multer salva arquivos temporariamente na pasta raiz 'uploads'
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

// ----------------------- ROTAS DE AUTENTICAÇÃO -----------------------

app.post("/api/login", async (req, res) => {
    const { email, senha } = req.body;
    
    try {
        const [users] = await pool.execute("SELECT * FROM usuarios WHERE email = ?", [email]);
        const user = users[0];

        // Verificação de Senha (usando texto puro para compatibilidade com o DB atual)
        if (user && senha === user.senha) { 
            
            const { senha: _, ...userWithoutPass } = user; 
            
            const token = jwt.sign(userWithoutPass, JWT_SECRET, { expiresIn: '1h' });
            
            res.cookie('token', token, { 
                httpOnly: true, 
                secure: process.env.NODE_ENV === 'production', 
                maxAge: 3600000 // 1 hora
            }); 
            
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

app.get("/api/status", authenticateToken, (req, res) => {
    res.json({ message: "Usuário autenticado", user: req.user });
});

// ----------------------- FIM ROTAS DE AUTENTICAÇÃO -----------------------


// ----------------------- ROTAS DE PRODUTOS (ADMIN) -----------------------
const uploadMultiple = upload.array("imagens", 6); // Campo esperado é "imagens"

// ROTA POST: Adicionar Produto (CORRIGIDA COM MOVIMENTAÇÃO DE ARQUIVOS)
app.post("/api/admin/produtos", authenticateToken, authorizeAdmin, uploadMultiple, async (req, res) => {

    const { nome, descricao, preco, estoque } = req.body;
    const files = req.files || [];

        try {
        // 1. Inserir o produto para obter o ID
        const [result] = await pool.execute(
            "INSERT INTO produtos (nome, descricao, preco, estoque) VALUES (?, ?, ?, ?)",
            [nome, descricao, preco, estoque]
        );
        const produtoId = result.insertId;
        
        // 2. Determina a pasta de destino usando o ID
        const finalDir = path.join(__dirname, "uploads", String(produtoId));

        // 3. Mover arquivos e atualizar o DB
        if (files.length > 0) {
            // Cria a pasta final (Ex: 1) se ela não existir
            if (!fs.existsSync(finalDir)) {
                fs.mkdirSync(finalDir, { recursive: true });
            }

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const oldPath = file.path; 
                
                // Caminho final para o DB (Ex: 1/imagens-12345.webp)
                const dbPath = path.join(String(produtoId), file.filename); 
                const newPath = path.join(finalDir, file.filename);
                
                // CRÍTICO: Move o arquivo da raiz 'uploads' para a subpasta correta
                fs.renameSync(oldPath, newPath); 

                await pool.execute(
                    "INSERT INTO produto_imagens (produto_id, caminho, ordem) VALUES (?, ?, ?)",
                    [produtoId, dbPath, i + 1]
                );
            }
        }

        res.status(201).send("Produto e imagens adicionados com sucesso!");
    } catch (error) {
        // Tratamento de erro: tenta excluir arquivos movidos em caso de falha no DB
        if (files.length > 0) {
            // Se o produtoId foi gerado, tentamos limpar a pasta. Caso contrário, apenas limpamos os temporários.
            const tempDir = path.join(__dirname, "uploads");
            files.forEach(file => {
                const finalFilePath = path.join(tempDir, file.filename);
                if (fs.existsSync(finalFilePath)) fs.unlinkSync(finalFilePath);
            });
        }
        console.error("Erro ao adicionar produto:", error);
        res.status(500).send("Erro no servidor.");
    }
});


// ROTA PUT: Atualizar Produto (CORRIGIDA COM MOVIMENTAÇÃO DE ARQUIVOS)
app.put("/api/admin/produtos/:id", authenticateToken, authorizeAdmin, uploadMultiple, async (req, res) => {

    const { id } = req.params;
    const { nome, descricao, preco, estoque } = req.body;
    const files = req.files || [];
    
        // 1. Determina a pasta de destino usando o ID
    const finalDir = path.join(__dirname, "uploads", id);

    try {
        // 2. Atualizar o produto
        await pool.execute(
            "UPDATE produtos SET nome = ?, descricao = ?, preco = ?, estoque = ? WHERE id = ?",
            [nome, descricao, preco, estoque, id]
        );

        // 3. Mover e inserir novas imagens
        if (files.length > 0) {
             if (!fs.existsSync(finalDir)) {
                fs.mkdirSync(finalDir, { recursive: true });
            }

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const oldPath = file.path; 
                
                // Caminho final para o DB (Ex: 1/imagens-12345.webp)
                const dbPath = path.join(id, file.filename);
                const newPath = path.join(finalDir, file.filename);
                
                fs.renameSync(oldPath, newPath);

                // Inserção no DB (assumindo que a ordem é i+1)
                await pool.execute(
                    "INSERT INTO produto_imagens (produto_id, caminho, ordem) VALUES (?, ?, ?)",
                    [id, dbPath, i + 1] 
                );
            }
        }

        res.send("Produto atualizado com sucesso!");
    } catch (error) {
        // Tratamento de erro
        if (files.length > 0) {
            const tempDir = path.join(__dirname, "uploads");
            files.forEach(file => {
                const finalFilePath = path.join(tempDir, file.filename);
                if (fs.existsSync(finalFilePath)) fs.unlinkSync(finalFilePath);
            });
        }
        console.error("Erro ao atualizar produto:", error);
        res.status(500).send("Erro no servidor.");
    }
});

// ROTA DELETE
app.delete("/api/admin/produtos/:id", authenticateToken, authorizeAdmin, async (req, res) => {
    const { id } = req.params;
    let imageFolderName = null;
    
    try {
                // 1. Determinar o nome da pasta (agora é o ID)
        const productDir = path.join(__dirname, "uploads", id);

        // 2. Excluir a pasta de arquivos se ela existir
        if (fs.existsSync(productDir)) {
            // recursive: true para deletar arquivos e subpastas. force: true para ignorar erros se arquivos não existirem.
            fs.rmSync(productDir, { recursive: true, force: true });
            console.log(`Pasta excluída: ${productDir}`);
        }
        
        // 4. Excluir entradas no banco de dados
        await pool.execute("DELETE FROM produto_imagens WHERE produto_id = ?", [id]);
        await pool.execute("DELETE FROM produtos WHERE id = ?", [id]);
        
        res.send("Produto e imagens excluídos com sucesso.");
        
    } catch (error) {
        console.error("Erro ao excluir produto e arquivos:", error);
        res.status(500).send("Erro no servidor.");
    }
});

// ----------------------- ROTAS DE PRODUTOS (PÚBLICO) -----------------------
// ROTA GET: Obter imagens de um produto pelo ID
app.get("/api/produtos/:id/imagens", async (req, res) => {
    const { id } = req.params; 
    
    try {
        const [imagens] = await pool.execute(
            "SELECT caminho FROM produto_imagens WHERE produto_id = ? ORDER BY ordem ASC",
            [id]
        );
        
        res.json(imagens.map(img => img.caminho));
        
    } catch (error) {
        console.error("Erro ao buscar imagens:", error);
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
            imagem: imagens.filter(img => img.produto_id === prod.id)[0]?.caminho || null,
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
            imagem: imagens[0]?.caminho || null,
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

// ----------------------- ROTAS DE CHECKOUT (MERCADO PAGO) -----------------------

// Inicialização do Mercado Pago
const client = new MercadoPagoConfig({
     accessToken: process.env.MP_ACCESS_TOKEN,
     options: {
        timeout: 5000,
     }
    
    });

const preference = new Preference(client);

app.post("/api/checkout/preference", async (req, res) => {
    const { items } = req.body; 
    
    if (!config.MP_ACCESS_TOKEN || config.MP_ACCESS_TOKEN === "SEU_ACCESS_TOKEN_DO_MERCADO_PAGO_AQUI") {
        return res.status(500).send("Erro de configuração: Access Token do Mercado Pago ausente no backend.");
    }

    if (!req.session.cart || req.session.cart.length === 0) return res.status(400).send("Carrinho vazio.");

    try {
        const productIds = req.session.cart.map(item => item.produto_id);
        const [products] = await pool.execute(
            `SELECT id, nome, preco FROM produtos WHERE id IN (${productIds.join(",")})`
        );
        
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
                success: "http://localhost:3000/checkout.html?status=success",
                failure: "http://localhost:3000/checkout.html?status=failure",
                pending: "http://localhost:3000/checkout.html?status=pending",
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

app.post("/api/checkout", async (req, res) => {
    const { nome, email, endereco, forma_pagamento } = req.body;
    
    if (!req.session.cart || req.session.cart.length === 0) {
        return res.status(400).send("Carrinho vazio. Não é possível finalizar o pedido.");
    }
    
    let pagamento_status = "Aguardando Pagamento";
    if (forma_pagamento.startsWith('mp_')) {
        pagamento_status = forma_pagamento === 'mp_cartao' ? "Aprovado (Simulado)" : "Aguardando Pagamento (PIX/Boleto)";
    } else {
        pagamento_status = "Aprovado (Outra Forma)";
    }
    
    try {
        const [result] = await pool.execute(
            "INSERT INTO pedidos (nome_cliente, email_cliente, endereco_entrega, forma_pagamento, status_pagamento, data_pedido) VALUES (?, ?, ?, ?, ?, NOW())",
            [nome, email, endereco, forma_pagamento, pagamento_status]
        );
        const pedidoId = result.insertId;
        
        const productIds = req.session.cart.map(item => item.produto_id);
        const [products] = await pool.execute(
            `SELECT id, nome, preco FROM produtos WHERE id IN (${productIds.join(",")})`
        );
        
        for (const cartItem of req.session.cart) {
            const product = products.find(p => p.id === cartItem.produto_id);
            if (!product) continue; 
            
            await pool.execute(
                "INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, preco_unitario) VALUES (?, ?, ?, ?)",
                [pedidoId, cartItem.produto_id, cartItem.quantidade, product.preco]
            );
            
            const novoEstoque = product.estoque - cartItem.quantidade;
            await pool.execute(
                "UPDATE produtos SET estoque = ? WHERE id = ?",
                [novoEstoque, cartItem.produto_id]
            );
        }
        
        req.session.cart = [];
        
        res.status(200).send("Pedido finalizado com sucesso. Status do Pagamento: " + pagamento_status);
        
    } catch (error) {
        console.error("Erro ao finalizar pedido:", error);
        res.status(500).send("Erro no servidor ao finalizar o pedido.");
    }
});

// ----------------------- SERVIR ARQUIVOS -----------------------
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "../frontend")));

// ----------------------- INICIAR SERVIDOR -----------------------
app.listen(PORT, () => {
    console.log(`Servidor backend rodando na porta ${PORT}`);
});