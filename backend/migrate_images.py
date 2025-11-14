import os
import shutil
import mysql.connector

# Configurações do Banco de Dados (usando as configurações padrão do sandbox)
DB_CONFIG = {
    'user': 'root',
    'password': '',
    'host': 'localhost',
    'database': 'ecommerce_iphone'
}

# Diretórios
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
IMAGES_SOURCE_DIR = os.path.join(BASE_DIR, '..', '..', 'imagens_iphones')
UPLOADS_TARGET_DIR = os.path.join(BASE_DIR, 'uploads')

def get_product_mapping():
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    # Consulta para obter o ID e o nome do produto
    cursor.execute("SELECT id, nome FROM produtos")
    products = cursor.fetchall()
    
    # Lógica de mapeamento simplificada:
    # 1. Extrai o modelo e a cor do nome do produto.
    # 2. Cria o nome da pasta antiga (ex: 15_branco).
    # 3. Mapeia o nome da pasta antiga para o ID do produto.
    
    mapping = {}
    
    for id, nome in products:
        # Extrai o modelo (ex: iPhone 15, iPhone 17 Pro Max)
        # Simplificação para obter o número do modelo
        match_model = nome.split(' ')[1]
        
        # Extrai a cor (ex: Branco, Preto)
        match_color = nome.split(' ')[2]
        
        # Cria o nome da pasta antiga (ex: 15_branco)
        folder_name = f"{match_model.lower()}_{match_color.lower()}"
        
        # Trata exceções de nomes de pastas que não seguem o padrão simples
        if '16e' in nome:
            folder_name = f"16e_{match_color.lower()}"
        elif '16' in nome and 'ultramarino' in nome.lower():
            folder_name = "16_ultramarino"
        elif '17 pro' in nome.lower() and 'laranja' in nome.lower():
            folder_name = "17_pro_laranja"
        elif '17 pro max' in nome.lower() and 'laranja' in nome.lower():
            folder_name = "17_pro_max_laranja"
        elif '17 pro' in nome.lower() and ('branco' in nome.lower() or 'preto' in nome.lower()):
            folder_name = "17_pro" # Pasta genérica para Pro
        elif '17 pro max' in nome.lower() and ('branco' in nome.lower() or 'preto' in nome.lower()):
            folder_name = "17_pro_max" # Pasta genérica para Pro Max
        
        # Adiciona ao mapeamento. O ID do produto é a nova pasta.
        # Usamos o ID do produto de menor GB/TB para ser o ID da pasta principal do modelo/cor
        if folder_name not in mapping:
            mapping[folder_name] = id
            
    cursor.close()
    conn.close()
    return mapping

def migrate_images():
    product_mapping = get_product_mapping()
    
    conn = mysql.connector.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    # Limpa a tabela de imagens antes de inserir as novas
    cursor.execute("DELETE FROM produto_imagens")
    conn.commit()
    
    print("Iniciando migração de imagens...")
    
    for old_folder, product_id in product_mapping.items():
        source_path = os.path.join(IMAGES_SOURCE_DIR, old_folder)
        target_path = os.path.join(UPLOADS_TARGET_DIR, str(product_id))
        
        if not os.path.exists(source_path):
            print(f"Aviso: Pasta de origem não encontrada: {source_path}")
            continue
            
        # Cria a nova pasta de destino (ID do produto)
        os.makedirs(target_path, exist_ok=True)
        
        print(f"Migrando {old_folder} (ID: {product_id}) para {target_path}")
        
        # Lista e move os arquivos
        image_files = [f for f in os.listdir(source_path) if os.path.isfile(os.path.join(source_path, f))]
        
        # Ordena os arquivos para garantir que 1.webp, 2.webp, etc. sejam corretos
        image_files.sort()
        
        for i, filename in enumerate(image_files):
            old_file = os.path.join(source_path, filename)
            # Renomeia para 1.webp, 2.webp, etc.
            new_filename = f"{i+1}{os.path.splitext(filename)[1]}" 
            new_file = os.path.join(target_path, new_filename)
            
            # Move o arquivo
            shutil.copy2(old_file, new_file)
            
            # Atualiza o banco de dados
            db_path = os.path.join(str(product_id), new_filename).replace(os.sep, '/')
            
            # 1. Insere na tabela produto_imagens
            cursor.execute(
                "INSERT INTO produto_imagens (produto_id, caminho, ordem) VALUES (%s, %s, %s)",
                (product_id, db_path, i + 1)
            )
            
            # 2. Atualiza o campo 'imagem' na tabela 'produtos' para o primeiro arquivo
            if i == 0:
                cursor.execute(
                    "UPDATE produtos SET imagem = %s WHERE id = %s",
                    (db_path, product_id)
                )
                
    conn.commit()
    cursor.close()
    conn.close()
    print("Migração concluída.")

if __name__ == "__main__":
    migrate_images()
