-- Script FINAL para inserir os produtos com as cores e nomes de imagem corretos,
-- seguindo as últimas especificações:
-- iPhone 17: Somente Branco
-- iPhone 17 Pro: Preto e Laranja
-- iPhone 17 Pro Max: Preto e Laranja

-- Excluir todos os produtos existentes para garantir a limpeza e usar o novo script de inserção
DELETE FROM produtos; 
ALTER TABLE produtos AUTO_INCREMENT = 1;

INSERT INTO produtos (nome, descricao, preco, estoque, imagem) VALUES
-- iPhone 15 (Branco e Preto)
('iPhone 15 Branco 128GB', 'iPhone 15 na cor branca com 128GB de armazenamento. Novo design e Dynamic Island.', 4399.00, 50, 'iphone 15 branco/1.webp'),
('iPhone 15 Preto 128GB', 'iPhone 15 na cor preta com 128GB de armazenamento. Novo design e Dynamic Island.', 4399.00, 50, 'iphone 15 preto/1.webp'),
('iPhone 15 Branco 256GB', 'iPhone 15 na cor branca com 256GB de armazenamento. Novo design e Dynamic Island.', 5499.00, 50, 'iphone 15 branco/1.webp'),
('iPhone 15 Preto 256GB', 'iPhone 15 na cor preta com 256GB de armazenamento. Novo design e Dynamic Island.', 5499.00, 50, 'iphone 15 preto/1.webp'),

-- iPhone 16e (Branco e Preto)
('iPhone 16e Branco 128GB', 'iPhone 16e na cor branca com 128GB de armazenamento. Modelo econômico com ótimo desempenho.', 3899.00, 50, 'iphone 16e branco/1.webp'),
('iPhone 16e Preto 128GB', 'iPhone 16e na cor preta com 128GB de armazenamento. Modelo econômico com ótimo desempenho.', 3899.00, 50, 'iphone 16e preto/1.webp'),
('iPhone 16e Branco 256GB', 'iPhone 16e branco com 256GB de armazenamento. Modelo econômico com ótimo desempenho.', 4499.00, 50, 'iphone 16e branco/1.webp'),
('iPhone 16e Preto 256GB', 'iPhone 16e na cor preta com 256GB de armazenamento. Modelo econômico com ótimo desempenho.', 4499.00, 50, 'iphone 16e preto/1.webp'),

-- iPhone 16 (Ultramarino e Preto)
('iPhone 16 Ultramarino 128GB', 'iPhone 16 na cor ultramarino com 128GB de armazenamento. Melhorias significativas em câmera e bateria.', 4999.00, 50, 'iphone 16 ultramarino/1.webp'),
('iPhone 16 Preto 128GB', 'iPhone 16 na cor preta com 128GB de armazenamento. Melhorias significativas em câmera e bateria.', 4999.00, 50, 'iphone 16 preto/1.webp'),
('iPhone 16 Ultramarino 256GB', 'iPhone 16 na cor ultramarino com 256GB de armazenamento. Melhorias significativas em câmera e bateria.', 5799.00, 50, 'iphone 16 ultramarino/1.webp'),
('iPhone 16 Preto 256GB', 'iPhone 16 na cor preta com 256GB de armazenamento. Melhorias significativas em câmera e bateria.', 5799.00, 50, 'iphone 16 preto/1.webp'),

-- iPhone 17 (Somente Branco)
('iPhone 17 Branco 256GB', 'iPhone 17 na cor branca com 256GB de armazenamento. Desempenho avançado e novas funcionalidades.', 7999.00, 50, 'iphone 17 branco/1.webp'),
('iPhone 17 Branco 512GB', 'iPhone 17 na cor branca com 512GB de armazenamento. Desempenho avançado e novas funcionalidades.', 9499.00, 50, 'iphone 17 branco/1.webp'),

-- iPhone 17 Pro (Preto e Laranja)
('iPhone 17 Pro Laranja 256GB', 'iPhone 17 Pro na cor laranja com 256GB de armazenamento. Câmeras profissionais e chip de última geração.', 11499.00, 50, 'iphone 17 pro laranja/1.webp'),
('iPhone 17 Pro Preto 256GB', 'iPhone 17 Pro na cor preta com 256GB de armazenamento. Câmeras profissionais e chip de última geração.', 11499.00, 50, 'iphone 17 pro/1.webp'),
('iPhone 17 Pro Laranja 512GB', 'iPhone 17 Pro na cor laranja com 512GB de armazenamento. Câmeras profissionais e chip de última geração.', 12999.00, 50, 'iphone 17 pro laranja/1.webp'),
('iPhone 17 Pro Preto 512GB', 'iPhone 17 Pro na cor preta com 512GB de armazenamento. Câmeras profissionais e chip de última geração.', 12999.00, 50, 'iphone 17 pro/1.webp'),
('iPhone 17 Pro Laranja 1TB', 'iPhone 17 Pro na cor laranja com 1TB de armazenamento. Câmeras profissionais e chip de última geração.', 14499.00, 50, 'iphone 17 pro laranja/1.webp'),
('iPhone 17 Pro Preto 1TB', 'iPhone 17 Pro na cor preta com 1TB de armazenamento. Câmeras profissionais e chip de última geração.', 14499.00, 50, 'iphone 17 pro/1.webp'),

-- iPhone 17 Pro Max (Preto e Laranja)
('iPhone 17 Pro Max Laranja 256GB', 'iPhone 17 Pro Max na cor laranja com 256GB de armazenamento. O melhor da tecnologia Apple, tela maior e bateria de longa duração.', 12499.00, 50, 'iphone 17 pro max laranja/1.webp'),
('iPhone 17 Pro Max Preto 256GB', 'iPhone 17 Pro Max na cor preta com 256GB de armazenamento. O melhor da tecnologia Apple, tela maior e bateria de longa duração.', 12499.00, 50, 'iphone 17 pro max/1.webp'),
('iPhone 17 Pro Max Laranja 512GB', 'iPhone 17 Pro Max na cor laranja com 512GB de armazenamento. O melhor da tecnologia Apple, tela maior e bateria de longa duração.', 13999.00, 50, 'iphone 17 pro max laranja/1.webp'),
('iPhone 17 Pro Max Preto 512GB', 'iPhone 17 Pro Max na cor preta com 512GB de armazenamento. O melhor da tecnologia Apple, tela maior e bateria de longa duração.', 13999.00, 50, 'iphone 17 pro max/1.webp'),
('iPhone 17 Pro Max Laranja 1TB', 'iPhone 17 Pro Max na cor laranja com 1TB de armazenamento. O melhor da tecnologia Apple, tela maior e bateria de longa duração.', 15499.00, 50, 'iphone 17 pro max laranja/1.webp'),
('iPhone 17 Pro Max Preto 1TB', 'iPhone 17 Pro Max na cor preta com 1TB de armazenamento. O melhor da tecnologia Apple, tela maior e bateria de longa duração.', 15499.00, 50, 'iphone 17 pro max/1.webp'),
('iPhone 17 Pro Max Laranja 2TB', 'iPhone 17 Pro Max na cor laranja com 2TB de armazenamento. O melhor da tecnologia Apple, tela maior e bateria de longa duração.', 18499.00, 50, 'iphone 17 pro max laranja/1.webp'),
('iPhone 17 Pro Max Preto 2TB', 'iPhone 17 Pro Max na cor preta com 2TB de armazenamento. O melhor da tecnologia Apple, tela maior e bateria de longa duração.', 18499.00, 50, 'iphone 17 pro max/1.webp');
