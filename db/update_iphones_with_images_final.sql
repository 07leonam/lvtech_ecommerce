-- Script FINAL para inserir os produtos com as cores e nomes de imagem corretos,
-- e popular a nova tabela 'produto_imagens' com os caminhos corretos das imagens.

-- 1. Limpar e redefinir o auto-incremento para garantir que os IDs sejam consistentes
DELETE FROM produto_imagens;
DELETE FROM produtos; 
ALTER TABLE produtos AUTO_INCREMENT = 1;

-- 2. Inserir os novos produtos (sem a coluna 'imagem')
INSERT INTO produtos (nome, descricao, preco, estoque) VALUES
-- iPhone 15 (Branco e Preto)
('iPhone 15 Branco 128GB', 'iPhone 15 na cor branca com 128GB de armazenamento. Novo design e Dynamic Island.', 4399.00, 50),
('iPhone 15 Preto 128GB', 'iPhone 15 na cor preta com 128GB de armazenamento. Novo design e Dynamic Island.', 4399.00, 50),
('iPhone 15 Branco 256GB', 'iPhone 15 na cor branca com 256GB de armazenamento. Novo design e Dynamic Island.', 5499.00, 50),
('iPhone 15 Preto 256GB', 'iPhone 15 na cor preta com 256GB de armazenamento. Novo design e Dynamic Island.', 5499.00, 50),

-- iPhone 16e (Branco e Preto)
('iPhone 16e Branco 128GB', 'iPhone 16e na cor branca com 128GB de armazenamento. Modelo econômico com ótimo desempenho.', 3899.00, 50),
('iPhone 16e Preto 128GB', 'iPhone 16e na cor preta com 128GB de armazenamento. Modelo econômico com ótimo desempenho.', 3899.00, 50),
('iPhone 16e Branco 256GB', 'iPhone 16e branco com 256GB de armazenamento. Modelo econômico com ótimo desempenho.', 4499.00, 50),
('iPhone 16e Preto 256GB', 'iPhone 16e na cor preta com 256GB de armazenamento. Modelo econômico com ótimo desempenho.', 4499.00, 50),

-- iPhone 16 (Ultramarino e Preto)
('iPhone 16 Ultramarino 128GB', 'iPhone 16 na cor ultramarino com 128GB de armazenamento. Melhorias significativas em câmera e bateria.', 4999.00, 50),
('iPhone 16 Preto 128GB', 'iPhone 16 na cor preta com 128GB de armazenamento. Melhorias significativas em câmera e bateria.', 4999.00, 50),
('iPhone 16 Ultramarino 256GB', 'iPhone 16 na cor ultramarino com 256GB de armazenamento. Melhorias significativas em câmera e bateria.', 5799.00, 50),
('iPhone 16 Preto 256GB', 'iPhone 16 na cor preta com 256GB de armazenamento. Melhorias significativas em câmera e bateria.', 5799.00, 50),

-- iPhone 17 (Somente Branco)
('iPhone 17 Branco 256GB', 'iPhone 17 na cor branca com 256GB de armazenamento. Desempenho avançado e novas funcionalidades.', 7999.00, 50),
('iPhone 17 Branco 512GB', 'iPhone 17 na cor branca com 512GB de armazenamento. Desempenho avançado e novas funcionalidades.', 9499.00, 50),

-- iPhone 17 Pro (Preto e Laranja)
('iPhone 17 Pro Laranja 256GB', 'iPhone 17 Pro na cor laranja com 256GB de armazenamento. Câmeras profissionais e chip de última geração.', 11499.00, 50),
('iPhone 17 Pro Preto 256GB', 'iPhone 17 Pro na cor preta com 256GB de armazenamento. Câmeras profissionais e chip de última geração.', 11499.00, 50),
('iPhone 17 Pro Laranja 512GB', 'iPhone 17 Pro na cor laranja com 512GB de armazenamento. Câmeras profissionais e chip de última geração.', 12999.00, 50),
('iPhone 17 Pro Preto 512GB', 'iPhone 17 Pro na cor preta com 512GB de armazenamento. Câmeras profissionais e chip de última geração.', 12999.00, 50),
('iPhone 17 Pro Laranja 1TB', 'iPhone 17 Pro na cor laranja com 1TB de armazenamento. Câmeras profissionais e chip de última geração.', 14499.00, 50),
('iPhone 17 Pro Preto 1TB', 'iPhone 17 Pro na cor preta com 1TB de armazenamento. Câmeras profissionais e chip de última geração.', 14499.00, 50),

-- iPhone 17 Pro Max (Preto e Laranja)
('iPhone 17 Pro Max Laranja 256GB', 'iPhone 17 Pro Max na cor laranja com 256GB de armazenamento. O melhor da tecnologia Apple, tela maior e bateria de longa duração.', 12499.00, 50),
('iPhone 17 Pro Max Preto 256GB', 'iPhone 17 Pro Max na cor preta com 256GB de armazenamento. O melhor da tecnologia Apple, tela maior e bateria de longa duração.', 12499.00, 50),
('iPhone 17 Pro Max Laranja 512GB', 'iPhone 17 Pro Max na cor laranja com 512GB de armazenamento. O melhor da tecnologia Apple, tela maior e bateria de longa duração.', 13999.00, 50),
('iPhone 17 Pro Max Preto 512GB', 'iPhone 17 Pro Max na cor preta com 512GB de armazenamento. O melhor da tecnologia Apple, tela maior e bateria de longa duração.', 13999.00, 50),
('iPhone 17 Pro Max Laranja 1TB', 'iPhone 17 Pro Max na cor laranja com 1TB de armazenamento. O melhor da tecnologia Apple, tela maior e bateria de longa duração.', 15499.00, 50),
('iPhone 17 Pro Max Preto 1TB', 'iPhone 17 Pro Max na cor preta com 1TB de armazenamento. O melhor da tecnologia Apple, tela maior e bateria de longa duração.', 15499.00, 50),
('iPhone 17 Pro Max Laranja 2TB', 'iPhone 17 Pro Max na cor laranja com 2TB de armazenamento. O melhor da tecnologia Apple, tela maior e bateria de longa duração.', 18499.00, 50),
('iPhone 17 Pro Max Preto 2TB', 'iPhone 17 Pro Max na cor preta com 2TB de armazenamento. O melhor da tecnologia Apple, tela maior e bateria de longa duração.', 18499.00, 50);

-- 3. Popular a nova tabela 'produto_imagens'

-- 1. Inserir imagens para iPhone 15 Branco
INSERT INTO produto_imagens (produto_id, caminho, ordem)
SELECT id, CONCAT('iphone 15 branco/', nome_arquivo), ordem
FROM produtos
JOIN (
    SELECT '1.webp' AS nome_arquivo, 1 AS ordem UNION ALL
    SELECT '2.webp', 2 UNION ALL
    SELECT '3.webp', 3 UNION ALL
    SELECT '4.webp', 4 UNION ALL
    SELECT '5.webp', 5 UNION ALL
    SELECT '6.webp', 6
) AS imagens ON 1=1
WHERE produtos.nome LIKE 'iPhone 15 Branco%';

-- 2. Inserir imagens para iPhone 15 Preto
INSERT INTO produto_imagens (produto_id, caminho, ordem)
SELECT id, CONCAT('iphone 15 preto/', nome_arquivo), ordem
FROM produtos
JOIN (
    SELECT '1.webp' AS nome_arquivo, 1 AS ordem UNION ALL
    SELECT '2.webp', 2 UNION ALL
    SELECT '3.webp', 3 UNION ALL
    SELECT '4.webp', 4 UNION ALL
    SELECT '5.webp', 5
) AS imagens ON 1=1
WHERE produtos.nome LIKE 'iPhone 15 Preto%';

-- 3. Inserir imagens para iPhone 16e Branco
INSERT INTO produto_imagens (produto_id, caminho, ordem)
SELECT id, CONCAT('iphone 16e branco/', nome_arquivo), ordem
FROM produtos
JOIN (
    SELECT '1.webp' AS nome_arquivo, 1 AS ordem UNION ALL
    SELECT '2.webp', 2 UNION ALL
    SELECT '3.webp', 3 UNION ALL
    SELECT '4.webp', 4 UNION ALL
    SELECT '5.webp', 5 UNION ALL
    SELECT '6.jpg', 6 UNION ALL
    SELECT '7.webp', 7
) AS imagens ON 1=1
WHERE produtos.nome LIKE 'iPhone 16e Branco%';

-- 4. Inserir imagens para iPhone 16e Preto
INSERT INTO produto_imagens (produto_id, caminho, ordem)
SELECT id, CONCAT('iphone 16e preto/', nome_arquivo), ordem
FROM produtos
JOIN (
    SELECT '1.webp' AS nome_arquivo, 1 AS ordem UNION ALL
    SELECT '2.webp', 2 UNION ALL
    SELECT '3.webp', 3 UNION ALL
    SELECT '4.webp', 4 UNION ALL
    SELECT '5.jpg', 5 UNION ALL
    SELECT '6.webp', 6
) AS imagens ON 1=1
WHERE produtos.nome LIKE 'iPhone 16e Preto%';

-- 5. Inserir imagens para iPhone 16 Ultramarino
INSERT INTO produto_imagens (produto_id, caminho, ordem)
SELECT id, CONCAT('iphone 16 ultramarino/', nome_arquivo), ordem
FROM produtos
JOIN (
    SELECT '1.webp' AS nome_arquivo, 1 AS ordem UNION ALL
    SELECT '2.webp', 2 UNION ALL
    SELECT '3.webp', 3 UNION ALL
    SELECT '4.webp', 4 UNION ALL
    SELECT '5.webp', 5
) AS imagens ON 1=1
WHERE produtos.nome LIKE 'iPhone 16 Ultramarino%';

-- 6. Inserir imagens para iPhone 16 Preto
INSERT INTO produto_imagens (produto_id, caminho, ordem)
SELECT id, CONCAT('iphone 16 preto/', nome_arquivo), ordem
FROM produtos
JOIN (
    SELECT '1.webp' AS nome_arquivo, 1 AS ordem UNION ALL
    SELECT '2.webp', 2 UNION ALL
    SELECT '3.webp', 3 UNION ALL
    SELECT '4.webp', 4 UNION ALL
    SELECT '5.webp', 5
) AS imagens ON 1=1
WHERE produtos.nome LIKE 'iPhone 16 Preto%';

-- 7. Inserir imagens para iPhone 17 Branco
INSERT INTO produto_imagens (produto_id, caminho, ordem)
SELECT id, CONCAT('iphone 17 branco/', nome_arquivo), ordem
FROM produtos
JOIN (
    SELECT '1.webp' AS nome_arquivo, 1 AS ordem UNION ALL
    SELECT '2.webp', 2 UNION ALL
    SELECT '3.webp', 3 UNION ALL
    SELECT '4.webp', 4
) AS imagens ON 1=1
WHERE produtos.nome LIKE 'iPhone 17 Branco%';

-- 8. Inserir imagens para iPhone 17 Pro Laranja
INSERT INTO produto_imagens (produto_id, caminho, ordem)
SELECT id, CONCAT('iphone 17 pro laranja/', nome_arquivo), ordem
FROM produtos
JOIN (
    SELECT '1.webp' AS nome_arquivo, 1 AS ordem UNION ALL
    SELECT '2.webp', 2 UNION ALL
    SELECT '4.webp', 3 UNION ALL
    SELECT '5.webp', 4 UNION ALL
    SELECT '6.webp', 5
) AS imagens ON 1=1
WHERE produtos.nome LIKE 'iPhone 17 Pro Laranja%';

-- 9. Inserir imagens para iPhone 17 Pro Preto
INSERT INTO produto_imagens (produto_id, caminho, ordem)
SELECT id, CONCAT('iphone 17 pro/', nome_arquivo), ordem
FROM produtos
JOIN (
    SELECT '1.webp' AS nome_arquivo, 1 AS ordem UNION ALL
    SELECT '2.webp', 2 UNION ALL
    SELECT '3.webp', 3 UNION ALL
    SELECT '4.webp', 4 UNION ALL
    SELECT '5.webp', 5
) AS imagens ON 1=1
WHERE produtos.nome LIKE 'iPhone 17 Pro Preto%';

-- 10. Inserir imagens para iPhone 17 Pro Max Laranja
INSERT INTO produto_imagens (produto_id, caminho, ordem)
SELECT id, CONCAT('iphone 17 pro max laranja/', nome_arquivo), ordem
FROM produtos
JOIN (
    SELECT '1.webp' AS nome_arquivo, 1 AS ordem UNION ALL
    SELECT '2.webp', 2 UNION ALL
    SELECT '3.webp', 3 UNION ALL
    SELECT '4.webp', 4 UNION ALL
    SELECT '5.webp', 5 UNION ALL
    SELECT '6.webp', 6
) AS imagens ON 1=1
WHERE produtos.nome LIKE 'iPhone 17 Pro Max Laranja%';

-- 11. Inserir imagens para iPhone 17 Pro Max Preto
INSERT INTO produto_imagens (produto_id, caminho, ordem)
SELECT id, CONCAT('iphone 17 pro max/', nome_arquivo), ordem
FROM produtos
JOIN (
    SELECT '1.webp' AS nome_arquivo, 1 AS ordem UNION ALL
    SELECT '2.webp', 2 UNION ALL
    SELECT '3.webp', 3 UNION ALL
    SELECT '4.webp', 4 UNION ALL
    SELECT '5.webp', 5 UNION ALL
    SELECT '6.webp', 6
) AS imagens ON 1=1
WHERE produtos.nome LIKE 'iPhone 17 Pro Max Preto%';

-- 12. Inserir imagens para iPhone 17 Preto (Usando imagens do 17 Pro Max Preto como placeholder, conforme a estrutura de pastas)
INSERT INTO produto_imagens (produto_id, caminho, ordem)
SELECT id, CONCAT('iphone 17 pro max/', nome_arquivo), ordem
FROM produtos
JOIN (
    SELECT '1.webp' AS nome_arquivo, 1 AS ordem UNION ALL
    SELECT '2.webp', 2 UNION ALL
    SELECT '3.webp', 3 UNION ALL
    SELECT '4.webp', 4 UNION ALL
    SELECT '5.webp', 5 UNION ALL
    SELECT '6.webp', 6
) AS imagens ON 1=1
WHERE produtos.nome LIKE 'iPhone 17 Preto%';
