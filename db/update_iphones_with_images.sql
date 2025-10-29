-- Script para atualizar os produtos existentes com as novas cores e nomes de imagem
-- Nota: Este script assume que os IDs dos produtos são os mesmos da inserção anterior.
-- Para garantir a consistência, o ideal seria re-executar o script de inserção com os novos dados.

-- 1. Excluir os produtos antigos (se necessário, para evitar duplicatas e limpar os nomes de imagem antigos)
-- DELETE FROM produtos; 

-- 2. Inserir os novos produtos com as cores e imagens corretas
INSERT INTO produtos (nome, descricao, preco, estoque, imagem) VALUES
-- iPhone 15
('iPhone 15 Branco 128GB', 'iPhone 15 na cor branca com 128GB de armazenamento. Novo design e Dynamic Island.', 4399.00, 50, 'iphone 15 branco/1.webp'),
('iPhone 15 Preto 128GB', 'iPhone 15 na cor preta com 128GB de armazenamento. Novo design e Dynamic Island.', 4399.00, 50, 'iphone 15 preto/1.webp'),
('iPhone 15 Branco 256GB', 'iPhone 15 na cor branca com 256GB de armazenamento. Novo design e Dynamic Island.', 5499.00, 50, 'iphone 15 branco/1.webp'),
('iPhone 15 Preto 256GB', 'iPhone 15 na cor preta com 256GB de armazenamento. Novo design e Dynamic Island.', 5499.00, 50, 'iphone 15 preto/1.webp'),

-- iPhone 16e
('iPhone 16e Branco 128GB', 'iPhone 16e na cor branca com 128GB de armazenamento. Modelo econômico com ótimo desempenho.', 3899.00, 50, 'iphone 16e branco/1.webp'),
('iPhone 16e Preto 128GB', 'iPhone 16e na cor preta com 128GB de armazenamento. Modelo econômico com ótimo desempenho.', 3899.00, 50, 'iphone 16e preto/1.webp'),
('iPhone 16e Branco 256GB', 'iPhone 16e na cor branca com 256GB de armazenamento. Modelo econômico com ótimo desempenho.', 4499.00, 50, 'iphone 16e branco/1.webp'),
('iPhone 16e Preto 256GB', 'iPhone 16e na cor preta com 256GB de armazenamento. Modelo econômico com ótimo desempenho.', 4499.00, 50, 'iphone 16e preto/1.webp'),

-- iPhone 16
('iPhone 16 Ultramarino 128GB', 'iPhone 16 na cor ultramarino com 128GB de armazenamento. Melhorias significativas em câmera e bateria.', 4999.00, 50, 'iphone 16 ultramarino/1.webp'),
('iPhone 16 Preto 128GB', 'iPhone 16 na cor preta com 128GB de armazenamento. Melhorias significativas em câmera e bateria.', 4999.00, 50, 'iphone 16 preto/1.webp'),
('iPhone 16 Ultramarino 256GB', 'iPhone 16 na cor ultramarino com 256GB de armazenamento. Melhorias significativas em câmera e bateria.', 5799.00, 50, 'iphone 16 ultramarino/1.webp'),
('iPhone 16 Preto 256GB', 'iPhone 16 na cor preta com 256GB de armazenamento. Melhorias significativas em câmera e bateria.', 5799.00, 50, 'iphone 16 preto/1.webp'),

-- iPhone 17
('iPhone 17 Branco 256GB', 'iPhone 17 na cor branca com 256GB de armazenamento. Desempenho avançado e novas funcionalidades.', 7999.00, 50, 'iphone 17 branco/1.webp'),
('iPhone 17 Preto 256GB', 'iPhone 17 na cor preta com 256GB de armazenamento. Desempenho avançado e novas funcionalidades.', 7999.00, 50, 'iphone 17 pro max/1.webp'), -- Usando imagem do 17 Pro Max preto como placeholder para o 17 preto
('iPhone 17 Branco 512GB', 'iPhone 17 na cor branca com 512GB de armazenamento. Desempenho avançado e novas funcionalidades.', 9499.00, 50, 'iphone 17 branco/1.webp'),
('iPhone 17 Preto 512GB', 'iPhone 17 na cor preta com 512GB de armazenamento. Desempenho avançado e novas funcionalidades.', 9499.00, 50, 'iphone 17 pro max/1.webp'), -- Usando imagem do 17 Pro Max preto como placeholder para o 17 preto

-- iPhone 17 Pro (Somente Branco -> Laranja)
('iPhone 17 Pro Laranja 256GB', 'iPhone 17 Pro na cor laranja com 256GB de armazenamento. Câmeras profissionais e chip de última geração.', 11499.00, 50, 'iphone 17 pro laranja/1.webp'),
('iPhone 17 Pro Laranja 512GB', 'iPhone 17 Pro na cor laranja com 512GB de armazenamento. Câmeras profissionais e chip de última geração.', 12999.00, 50, 'iphone 17 pro laranja/1.webp'),
('iPhone 17 Pro Laranja 1TB', 'iPhone 17 Pro na cor laranja com 1TB de armazenamento. Câmeras profissionais e chip de última geração.', 14499.00, 50, 'iphone 17 pro laranja/1.webp'),

-- iPhone 17 Pro Max (Branco -> Laranja)
('iPhone 17 Pro Max Laranja 256GB', 'iPhone 17 Pro Max na cor laranja com 256GB de armazenamento. O melhor da tecnologia Apple, tela maior e bateria de longa duração.', 12499.00, 50, 'iphone 17 pro max laranja/1.webp'),
('iPhone 17 Pro Max Preto 256GB', 'iPhone 17 Pro Max na cor preta com 256GB de armazenamento. O melhor da tecnologia Apple, tela maior e bateria de longa duração.', 12499.00, 50, 'iphone 17 pro max/1.webp'),
('iPhone 17 Pro Max Laranja 512GB', 'iPhone 17 Pro Max na cor laranja com 512GB de armazenamento. O melhor da tecnologia Apple, tela maior e bateria de longa duração.', 13999.00, 50, 'iphone 17 pro max laranja/1.webp'),
('iPhone 17 Pro Max Preto 512GB', 'iPhone 17 Pro Max na cor preta com 512GB de armazenamento. O melhor da tecnologia Apple, tela maior e bateria de longa duração.', 13999.00, 50, 'iphone 17 pro max/1.webp'),
('iPhone 17 Pro Max Laranja 1TB', 'iPhone 17 Pro Max na cor laranja com 1TB de armazenamento. O melhor da tecnologia Apple, tela maior e bateria de longa duração.', 15499.00, 50, 'iphone 17 pro max laranja/1.webp'),
('iPhone 17 Pro Max Preto 1TB', 'iPhone 17 Pro Max na cor preta com 1TB de armazenamento. O melhor da tecnologia Apple, tela maior e bateria de longa duração.', 15499.00, 50, 'iphone 17 pro max/1.webp'),
('iPhone 17 Pro Max Laranja 2TB', 'iPhone 17 Pro Max na cor laranja com 2TB de armazenamento. O melhor da tecnologia Apple, tela maior e bateria de longa duração.', 18499.00, 50, 'iphone 17 pro max laranja/1.webp'),
('iPhone 17 Pro Max Preto 2TB', 'iPhone 17 Pro Max na cor preta com 2TB de armazenamento. O melhor da tecnologia Apple, tela maior e bateria de longa duração.', 18499.00, 50, 'iphone 17 pro max/1.webp');
