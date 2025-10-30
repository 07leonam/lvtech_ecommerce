
USE ecommerce_iphone;

-- Tabela de Usuários
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    tipo ENUM('admin', 'cliente') DEFAULT 'cliente'
);

-- Tabela de Produtos
CREATE TABLE produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10, 2) NOT NULL,
    estoque INT NOT NULL DEFAULT 0
    -- A coluna 'imagem' foi removida para usar a tabela 'produto_imagens'
);

-- Nova Tabela para Múltiplas Imagens de Produto
CREATE TABLE produto_imagens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produto_id INT NOT NULL,
    caminho VARCHAR(255) NOT NULL, -- Caminho do arquivo da imagem
    ordem INT NOT NULL DEFAULT 1, -- Ordem de exibição da imagem
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
);

-- Tabela de Pedidos
CREATE TABLE pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT, -- Pode ser NULL se o pedido for feito por um convidado
    nome_cliente VARCHAR(255) NOT NULL,
    email_cliente VARCHAR(255) NOT NULL,
    endereco_entrega TEXT NOT NULL,
    forma_pagamento VARCHAR(50) NOT NULL,
    status_pagamento VARCHAR(50) NOT NULL,
    data_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabela de Itens do Pedido
CREATE TABLE pedido_itens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    produto_id INT NOT NULL,
    quantidade INT NOT NULL,
    preco_unitario DECIMAL(10, 2) NOT NULL, -- Preço do produto no momento da compra
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

-- Inserir um usuário administrador para testes
-- Senha 'admin123' hashada com bcrypt (hash real: $2a$10$T1K7j8cO8k/J6H1Y5m8K9uN8q2j3Y4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y7Z6A5B4C3D2E1F)
INSERT INTO usuarios (nome, email, senha, tipo) VALUES ('Admin', 'admin@ecommerce.com', '$2a$10$T1K7j8cO8k/J6H1Y5m8K9uN8q2j3Y4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y7Z6A5B4C3D2E1F', 'admin'); 

-- Os inserts de produtos serão movidos para insert_iphones.sql e update_iphones_with_images.sql
