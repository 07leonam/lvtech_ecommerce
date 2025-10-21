
USE ecommerce_iphone;

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    tipo ENUM('admin', 'cliente') DEFAULT 'cliente'
);

CREATE TABLE produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10, 2) NOT NULL,
    estoque INT NOT NULL DEFAULT 0,
    imagem VARCHAR(255)
);

CREATE TABLE pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    data DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pendente', 'processando', 'enviado', 'entregue', 'cancelado') DEFAULT 'pendente',
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE itens_pedido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    produto_id INT NOT NULL,
    quantidade INT NOT NULL,
    preco DECIMAL(10, 2) NOT NULL, -- Preço do produto no momento da compra
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
    FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

-- Inserir um usuário administrador para testes
INSERT INTO usuarios (nome, email, senha, tipo) VALUES ('Admin', 'admin@ecommerce.com', '$2b$10$y.X.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x', 'admin'); -- Senha 'admin123' hashada

-- Inserir alguns produtos de exemplo
INSERT INTO produtos (nome, descricao, preco, estoque, imagem) VALUES
('iPhone 15 Pro Max', 'O mais recente iPhone com chip A17 Bionic e câmera avançada.', 9999.99, 50, 'iphone15promax.jpg'),
('iPhone 15 Pro', 'Desempenho Pro com tela Super Retina XDR.', 8999.99, 75, 'iphone15pro.jpg'),
('iPhone 15', 'Novo design e Dynamic Island.', 7999.99, 100, 'iphone15.jpg'),
('iPhone 14', 'Chip A15 Bionic e bateria para o dia todo.', 6499.99, 120, 'iphone14.jpg');

