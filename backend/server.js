const express = require("express");
const mysql = require("mysql2/promise");
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
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');


const uploadsMainDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsMainDir)) {
    fs.mkdirSync(uploadsMainDir, { recursive: true });
    console.log("✅ Pasta 'uploads' raiz criada com sucesso.");
}

const app = express();

app.set('trust proxy', 1);

const PORT = process.env.PORT || 3000; 
const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwtkey";

app.use(cors({
    origin: [
        'http://localhost:5173',                 
        'https://07leonam.github.io'           
    ],
    credentials: true, 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
    allowedHeaders: ['Content-Type', 'Authorization']
}));

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'loja-virtual', 
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        
    },
});

const upload = multer({ storage: storage });

//app.options('*', cors());

//MIDDLEWARES
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
    session({
        secret: "supersecretcartsessionkey",
        resave: false,
        saveUninitialized: true,
        cookie: { 
            secure: true, 
            sameSite: 'none', 
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 // 1 dia
        },
    })
);

app.use((req, res, next) => {
    if (req.path.startsWith('/api/admin')) {
        console.log(`[DEBUG] Tentativa de acesso a: ${req.method} ${req.path}`);
        console.log('[DEBUG] Cookies recebidos:', req.cookies);
        console.log('[DEBUG] Token específico:', req.cookies.token ? 'Presente' : 'AUSENTE');
    }
    next();
});
// ----------------------------------

// Configuração do banco de dados
const pool = mysql.createPool({
    host: config.DB_HOST,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    database: config.DB_NAME,
    port: config.DB_PORT || 3306, 
    ssl: {                          
        rejectUnauthorized: true
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});


const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        console.log("❌ Acesso negado: Token não encontrado nos cookies.");
        return res.sendStatus(401);
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.log("❌ Acesso negado: Token inválido ou expirado.");
            return res.sendStatus(403);
        }
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
                secure: true, // OBRIGATÓRIO NO RENDER
                sameSite: 'none', // OBRIGATÓRIO PARA FRONT EXTERNO
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
    // Ao fazer logout, precisamos limpar com as mesmas configurações que criamos
    res.clearCookie('token', { 
        httpOnly: true, 
        secure: true, 
        sameSite: 'none' 
    });
    res.sendStatus(200);
});

app.get("/api/status", authenticateToken, (req, res) => {
    res.json({ message: "Usuário autenticado", user: req.user });
});

// ----------------------- FIM ROTAS DE AUTENTICAÇÃO -----------------------


// ----------------------- ROTAS DE PRODUTOS (ADMIN) -----------------------
const uploadMultiple = upload.array("imagens", 6); 
app.post("/api/admin/produtos", authenticateToken, authorizeAdmin, upload.array("imagens", 6), async (req, res) => {
    const { nome, descricao, preco, estoque, capacidades } = req.body;
    const files = req.files || [];

    try {
        const [result] = await pool.execute(
            "INSERT INTO produtos (nome, descricao, preco, estoque, capacidades) VALUES (?, ?, ?, ?, ?)",
            [nome, descricao, preco, estoque, capacidades]
        );
        const produtoId = result.insertId;

        if (files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                await pool.execute(
                    "INSERT INTO produto_imagens (produto_id, caminho, ordem) VALUES (?, ?, ?)",
                    [produtoId, file.path, i + 1]
                );
            }
        }

        res.status(201).json({ message: "Produto criado com imagens na nuvem!" });

    } catch (error) {
        console.error("Erro ao salvar produto:", error);
        res.status(500).json({ message: "Erro ao salvar produto." });
    }
});

app.put("/api/admin/produtos/:id", authenticateToken, authorizeAdmin, upload.array("imagens", 6), async (req, res) => {
    const { id } = req.params;
    const { nome, descricao, preco, estoque, capacidades } = req.body;
    const files = req.files || [];

    try {
        await pool.execute(
            "UPDATE produtos SET nome = ?, descricao = ?, preco = ?, estoque = ?, capacidades = ? WHERE id = ?",
            [nome, descricao, preco, estoque, capacidades, id]
        );

        // Se enviou novas imagens, adiciona ao banco
        if (files.length > 0) {
            // Descobre qual a última ordem para adicionar depois
            const [rows] = await pool.execute("SELECT MAX(ordem) as maxOrdem FROM produto_imagens WHERE produto_id = ?", [id]);
            let proximaOrdem = (rows[0].maxOrdem || 0) + 1;

            for (const file of files) {
                await pool.execute(
                    "INSERT INTO produto_imagens (produto_id, caminho, ordem) VALUES (?, ?, ?)",
                    [id, file.path, proximaOrdem]
                );
                proximaOrdem++;
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
    try {
        const productDir = path.join(__dirname, "uploads", id);

        if (fs.existsSync(productDir)) {
            fs.rmSync(productDir, { recursive: true, force: true });
            console.log(`Pasta excluída: ${productDir}`);
        }
        
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
                imagem: firstImage, 
            };
        });

        res.json(cartWithImages);
    } catch (error) {
        console.error("Erro ao buscar carrinho:", error);
        res.status(500).send("Erro no servidor.");
    }
});

// ----------------------- ROTAS DE CHECKOUT (MERCADO PAGO) -----------------------

const client = new MercadoPagoConfig({
     accessToken: process.env.MP_ACCESS_TOKEN,
     options: {
        timeout: 5000,
     }
    });

const preference = new Preference(client);

// ROTA: Criar Preferência de Pagamento (Mercado Pago) - DEBUG MODE
app.post("/api/checkout/preference", async (req, res) => {
    try {
        // 1. Validar Token
        if (!process.env.MP_ACCESS_TOKEN) {
            console.error("❌ ERRO: MP_ACCESS_TOKEN não configurado no .env");
            return res.status(500).json({ error: "Erro de configuração no servidor." });
        }

        const { items } = req.body;
        console.log("1️⃣ Itens recebidos do Frontend:", items);

        // 2. Validar Carrinho
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: "Carrinho vazio." });
        }

        // 3. Buscar produtos no banco
        const productIds = items.map(item => item.id);
        const [products] = await pool.execute(
            `SELECT id, nome, preco FROM produtos WHERE id IN (${productIds.join(",")})`
        );
        
        console.log("2️⃣ Produtos achados no Banco:", products);

        // 4. Montar itens para o Mercado Pago
        const mpItems = items.map(cartItem => {
            // MUDANÇA CRÍTICA: Convertemos ambos para String para garantir a comparação
            const product = products.find(p => String(p.id) === String(cartItem.id));
            
            if (!product) {
                console.warn(`⚠️ Item do carrinho ID ${cartItem.id} não encontrado no banco.`);
                return null;
            }

            // Tratamento de preço (remove R$ e troca vírgula por ponto se necessário)
            let rawPrice = product.preco;
            if (typeof rawPrice === 'string') {
                rawPrice = rawPrice.replace("R$", "").trim().replace(",", ".");
            }
            const unitPrice = Number(rawPrice);

            // Validação final de preço
            if (isNaN(unitPrice) || unitPrice <= 0) {
                 console.warn(`⚠️ Preço inválido para o produto ${product.nome}: ${unitPrice}`);
                 return null;
            }
            
            return {
                id: String(product.id),
                title: product.nome,
                description: cartItem.capacidade ? `Capacidade: ${cartItem.capacidade}` : undefined,
                quantity: Number(cartItem.quantidade),
                unit_price: unitPrice,
                currency_id: 'BRL'
            };
        }).filter(item => item !== null);

        console.log("3️⃣ Itens processados para enviar ao MP:", mpItems);

        if (mpItems.length === 0) {
            console.error("❌ Erro: Todos os itens foram filtrados. Verifique IDs e Preços.");
            return res.status(400).json({ error: "Nenhum item válido para pagamento." });
        }

        // 5. Criar Preferência
        const body = {
            items: mpItems,
            back_urls: {
                success: "https://seusite.onrender.com/sucesso", 
                failure: "https://seusite.onrender.com/",
                pending: "https://seusite.onrender.com/"
            },
            auto_return: "approved",
            statement_descriptor: "LVTECH STORE",
        };

        const preference = new Preference(client);
        const result = await preference.create({ body });

        console.log(`✅ Preferência criada! Link: ${result.init_point}`);
        res.json({ url: result.init_point });

    } catch (error) {
        console.error("❌ Erro CRÍTICO no Checkout:", error);
        // Tenta mostrar o erro detalhado do Mercado Pago se existir
        if (error.cause) {
             console.error("🔍 Causa do erro MP:", JSON.stringify(error.cause, null, 2));
        }
        res.status(500).json({ error: "Erro ao conectar com Mercado Pago" });
    }
});

app.post("/api/checkout", async (req, res) => {
    const { nome, email, endereco, forma_pagamento } = req.body;
    
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
        
        const productIds = req.session.cart.map(item => item.produto_id);
        const [products] = await pool.execute(
            `SELECT id, nome, preco, estoque FROM produtos WHERE id IN (${productIds.join(",")})`
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
        
        console.log(`✅ Pedido #${pedidoId} criado com sucesso! Status: ${status_pagamento}`);
        res.status(200).send(`Pedido finalizado! ID: ${pedidoId}`);
        
    } catch (error) {
        console.error("❌ Erro ao finalizar pedido:", error);
        res.status(500).send("Erro no servidor ao gravar o pedido.");
    }
});

// ROTA DO WEBHOOK
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
                }
            }
        }
    } catch (error) {
        console.error("❌ Erro no processamento do Webhook:", error);
    }
});

// ROTA POST: Cadastro de Clientes
app.post("/api/register", async (req, res) => {
    const { nome, email, senha } = req.body;

    try {
        const [existingUsers] = await pool.execute("SELECT * FROM usuarios WHERE email = ?", [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: "Este e-mail já está cadastrado." });
        }

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

// ROTA GET: Histórico de Pedidos
app.get("/api/meus-pedidos", authenticateToken, async (req, res) => {
    const emailUsuario = req.user.email; 

    try {
        const [pedidos] = await pool.execute(
            "SELECT * FROM pedidos WHERE email_cliente = ? ORDER BY data_pedido DESC",
            [emailUsuario]
        );

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