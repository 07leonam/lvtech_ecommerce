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
const cors = require('cors');
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

app.use(cors({
    origin: 'http://localhost:5173', // A porta onde o Vue está rodando
    credentials: true,               // Permite que o cookie de login passe
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rota de arquivos estáticos para /uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuração do Multer para upload de imagens
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Multer salva arquivos temporariamente na pasta raiz 'uploads'
        cb(null, path.join(__dirname, "uploads")); 
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
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
        if (user && senha === user.senha) { 
            const { senha: _, ...userWithoutPass } = user; 
            const token = jwt.sign(userWithoutPass, JWT_SECRET, { expiresIn: '1h' });
            res.cookie('token', token, { 
                httpOnly: true, 
                secure: process.env.NODE_ENV === 'production', 
                maxAge: 3600000 
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

// ROTA POST: Adicionar Produto
app.post("/api/admin/produtos", authenticateToken, authorizeAdmin, uploadMultiple, async (req, res) => {
    // 1. Removemos 'cores' daqui, mantemos 'capacidades'
    const { nome, descricao, preco, estoque, capacidades } = req.body;
    const files = req.files || [];
    let produtoIdCriado = null;

    try {
        // 2. Removemos a coluna 'cores' do INSERT
        const [result] = await pool.execute(
            "INSERT INTO produtos (nome, descricao, preco, estoque, capacidades) VALUES (?, ?, ?, ?, ?)",
            [nome, descricao, preco, estoque, capacidades]
        );
        const produtoId = result.insertId;
        produtoIdCriado = produtoId;

        // ... (o resto do código de criar pasta e salvar imagens continua igual) ...
        const finalDir = path.join(__dirname, "uploads", String(produtoId));
        if (!fs.existsSync(finalDir)) {
            fs.mkdirSync(finalDir, { recursive: true });
        }

        if (files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const oldPath = file.path;
                const newPath = path.join(finalDir, file.filename);
                const dbPath = `${produtoId}/${file.filename}`;

                try {
                    if (fs.existsSync(oldPath)) {
                        fs.copyFileSync(oldPath, newPath);
                        fs.unlinkSync(oldPath);
                        await pool.execute(
                            "INSERT INTO produto_imagens (produto_id, caminho, ordem) VALUES (?, ?, ?)",
                            [produtoId, dbPath, i + 1]
                        );
                    }
                } catch (fileError) {
                    console.error(`Erro imagem:`, fileError);
                }
            }
        }
        res.status(201).json({ message: "Produto salvo com sucesso!" });

    } catch (error) {
        console.error("Erro CRÍTICO:", error);
        res.status(500).send("Erro ao salvar produto.");
    }
});


// ROTA PUT: Atualizar Produto
app.put("/api/admin/produtos/:id", authenticateToken, authorizeAdmin, uploadMultiple, async (req, res) => {
    const { id } = req.params;
    // Removemos 'cores' daqui também
    const { nome, descricao, preco, estoque, capacidades } = req.body;
    const files = req.files || [];
    const finalDir = path.join(__dirname, "uploads", id);

    try {
        // Removemos 'cores' do UPDATE
        await pool.execute(
            "UPDATE produtos SET nome = ?, descricao = ?, preco = ?, estoque = ?, capacidades = ? WHERE id = ?",
            [nome, descricao, preco, estoque, capacidades, id]
        );

        // ... (o resto do código de mover imagens continua igual) ...
        if (files.length > 0) {
             if (!fs.existsSync(finalDir)) fs.mkdirSync(finalDir, { recursive: true });

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const oldPath = file.path; 
                const dbPath = path.join(id, file.filename);
                const newPath = path.join(finalDir, file.filename);
                fs.renameSync(oldPath, newPath);
                await pool.execute(
                    "INSERT INTO produto_imagens (produto_id, caminho, ordem) VALUES (?, ?, ?)",
                    [id, dbPath, i + 1] 
                );
            }
        }
        res.send("Produto atualizado com sucesso!");
    } catch (error) {
        console.error("Erro update:", error);
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

app.get("/api/produtos/:id/imagens", async (req, res) => {
    const { id } = req.params; // Faltava definir o ID
    
    try { // Faltava abrir o TRY
        // Precisamos buscar o produto antes, pois você usa '...produto' no retorno
        const [produtos] = await pool.execute("SELECT * FROM produtos WHERE id = ?", [id]);
        const produto = produtos[0];

        if (!produto) return res.status(404).send("Produto não encontrado.");

        const [imagens] = await pool.execute(
            "SELECT * FROM produto_imagens WHERE produto_id = ? ORDER BY ordem ASC",
            [id]
        );
    
        res.json({
            ...produto,
            imagens: imagens, 
            imagem: imagens[0]?.caminho || null,
        });
        
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

// ROTA MODIFICADA: Envia o nome detalhado (com GB) para o Mercado Pago
app.post("/api/checkout/preference", async (req, res) => {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).send("O carrinho está vazio ou inválido.");
    }

    try {
        // Busca dados REAIS no banco (para garantir o PREÇO correto)
        const productIds = items.map(item => item.id); // O front manda como 'id'
        
        if (productIds.length === 0) return res.status(400).send("Carrinho sem IDs válidos.");

        const [products] = await pool.execute(
            `SELECT id, nome, preco FROM produtos WHERE id IN (${productIds.join(",")})`
        );
        
        const mpItems = items.map(cartItem => {
            // Acha o produto original no banco
            const product = products.find(p => p.id === cartItem.id);
            if (!product) return null;
            
            // PREÇO: Vem do Banco (Segurança)
            let rawPrice = product.preco;
            if (typeof rawPrice === 'string') rawPrice = rawPrice.replace("R$", "").trim().replace(",", ".");
            const cleanPrice = Number(rawPrice);

            // NOME: Montamos com o detalhe do carrinho (Ex: "iPhone 15 - 256GB")
            // Se o carrinho mandou um nome completo (já com a variante), usamos ele.
            // Se não, usamos o do banco + capacidade.
            let titleFinal = product.nome;
            if (cartItem.capacidade) {
                titleFinal += ` - ${cartItem.capacidade}`;
            }

            return {
                id: String(product.id),
                title: titleFinal, // <--- Aqui vai o nome bonito pro comprovante
                quantity: Number(cartItem.quantidade),
                unit_price: cleanPrice,
                currency_id: 'BRL'
            };
        }).filter(item => item !== null);

        // ... Resto da configuração do MP continua igual ...
        const client = new MercadoPagoConfig({ 
            accessToken: process.env.MP_ACCESS_TOKEN,
            options: { timeout: 5000 }
        });
        const preference = new Preference(client);

        const body = {
            items: mpItems,
            back_urls: {
                success: "http://localhost:5173/checkout?status=success", // Porta do Vue!
                failure: "http://localhost:5173/checkout?status=failure", 
                pending: "http://localhost:5173/checkout?status=pending",
            },
            auto_return: "approved",
            statement_descriptor: "LVTECH",
        };

        const createdPreference = await preference.create({ body });
        res.json({ 
            preferenceId: createdPreference.id,
            initPoint: createdPreference.init_point
        });

    } catch (error) {
        console.error("Erro MP:", error);
        res.status(500).send("Erro ao criar pagamento.");
    }
});

app.post("/api/checkout", async (req, res) => {
    const { nome, email, endereco, forma_pagamento } = req.body;
    
    // 1. Validação do Carrinho
    if (!req.session.cart || req.session.cart.length === 0) {
        return res.status(400).send("Carrinho vazio. Não é possível finalizar o pedido.");
    }
    
    try {

        const status_pagamento = "Pedido Recebido (Aguardando Confirmação)";
        const [result] = await pool.execute(
            "INSERT INTO pedidos (nome_cliente, email_cliente, endereco_entrega, forma_pagamento, status_pagamento, data_pedido) VALUES (?, ?, ?, ?, ?, NOW())",
            [nome, email, endereco, forma_pagamento, status_pagamento]
        );
        const pedidoId = result.insertId;
        
        // 4. Buscar Detalhes dos Produtos (Preço e Estoque)
        const productIds = req.session.cart.map(item => item.produto_id);
        const [products] = await pool.execute(
            `SELECT id, nome, preco, estoque FROM produtos WHERE id IN (${productIds.join(",")})`
        );
        
        // 5. Inserir Itens do Pedido e Atualizar Estoque
        for (const cartItem of req.session.cart) {
            const product = products.find(p => p.id === cartItem.produto_id);
            if (!product) continue; 
            
            // Salva o item no pedido
            await pool.execute(
                "INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, preco_unitario) VALUES (?, ?, ?, ?)",
                [pedidoId, cartItem.produto_id, cartItem.quantidade, product.preco]
            );
            
            // Deduz do estoque (Importante!)
            const novoEstoque = product.estoque - cartItem.quantidade;
            await pool.execute(
                "UPDATE produtos SET estoque = ? WHERE id = ?",
                [novoEstoque, cartItem.produto_id]
            );
        }
        
        // 6. Limpar o Carrinho
        req.session.cart = [];
        
        console.log(`✅ Pedido #${pedidoId} criado com sucesso! Status: ${status_pagamento}`);
        res.status(200).send(`Pedido finalizado! ID: ${pedidoId}`);
        
    } catch (error) {
        console.error("❌ Erro ao finalizar pedido:", error);
        res.status(500).send("Erro no servidor ao gravar o pedido.");
    }
});

// ROTA DO WEBHOOK (Onde o Mercado Pago avisa sobre atualizações)
app.post("/api/webhook", async (req, res) => {
    const { action, data, type } = req.body;
    res.status(200).send("OK");

    try {
        if (action === 'payment.created' || action === 'payment.updated' || type === 'payment') {
            const paymentId = data?.id || req.body?.data?.id || req.query['data.id'];
            if (!paymentId) return;
            console.log(`🔔 Webhook recebido: Pagamento ID ${paymentId}`);
            const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: {
                    'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`
                }
            });
            
            if (response.ok) {
                const paymentData = await response.json();
                const status = paymentData.status; 
                const externalReference = paymentData.external_reference;
                const paymentMethod = paymentData.payment_method_id; 

                console.log(`📊 Status MP: ${status} | Ref: ${externalReference}`);
                let statusFinal = "Aguardando Pagamento";

                if (status === 'approved') {
                    statusFinal = "Aprovado";
                } else if (status === 'pending' || status === 'in_process') {
                    statusFinal = "Em Análise";
                } else if (status === 'rejected') {
                    statusFinal = "Recusado";
                } else if (status === 'cancelled') {
                    statusFinal = "Cancelado";
                }
                if (externalReference) {
                    const [result] = await pool.execute(
                        "UPDATE pedidos SET status_pagamento = ?, forma_pagamento = ? WHERE id = ?", 
                        [statusFinal, `Mercado Pago (${paymentMethod})`, externalReference]
                    );

                    if (result.affectedRows > 0) {
                        console.log(`✅ Pedido #${externalReference} atualizado para: ${statusFinal}`);
                    } else {
                        console.warn(`⚠️ Pedido #${externalReference} não encontrado no banco.`);
                    }
                } else {
                    console.warn("⚠️ Pagamento sem 'external_reference'. Não foi possível vincular a um pedido.");
                }
            }
        }
    } catch (error) {
        console.error("❌ Erro no processamento do Webhook:", error);
    }
});

// ROTA POST: Cadastro de Clientes (Público)
app.post("/api/register", async (req, res) => {
    const { nome, email, senha } = req.body;

    try {
        const [existingUsers] = await pool.execute("SELECT * FROM usuarios WHERE email = ?", [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: "Este e-mail já está cadastrado." });
        }

        // --- MUDANÇA AQUI: Salva a senha direto (sem hash) ---
        await pool.execute(
            "INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, 'cliente')",
            [nome, email, senha] 
        );

        res.status(201).json({ message: "Conta criada com sucesso! Faça login." });
    } catch (error) {
        console.error("Erro no cadastro:", error);
        res.status(500).json({ message: "Erro ao criar conta." });
    }
});

// ROTA GET: Histórico de Pedidos do Cliente
app.get("/api/meus-pedidos", authenticateToken, async (req, res) => {
    // Pegamos o email do usuário logado através do token
    const emailUsuario = req.user.email; 

    try {
        // Buscamos os pedidos onde o email do cliente é igual ao do usuário logado
        const [pedidos] = await pool.execute(
            "SELECT * FROM pedidos WHERE email_cliente = ? ORDER BY data_pedido DESC",
            [emailUsuario]
        );

        // Opcional: Se quiser buscar os itens de cada pedido, teria que fazer um loop aqui.
        // Por enquanto, vamos retornar apenas os dados principais do pedido (status, total, data).
        
        res.json(pedidos);
    } catch (error) {
        console.error("Erro ao buscar meus pedidos:", error);
        res.status(500).send("Erro ao buscar histórico.");
    }
});


// ----------------------- SERVIR ARQUIVOS -----------------------
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "../frontend")));

// ----------------------- INICIAR SERVIDOR -----------------------
app.listen(PORT, () => {
    console.log(`Servidor backend rodando na porta ${PORT}`);
});