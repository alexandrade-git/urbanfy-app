from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import sqlite3
import os
from azure.storage.blob import BlobServiceClient
from datetime import datetime
import base64
import json
import uuid
import logging
import binascii

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configuração CORS mais permissiva para debug
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Endpoint de testee
@app.get("/test")
async def test_endpoint():
    logger.info("Test endpoint called")
    return {"status": "ok", "message": "API is working"}

# Modelo de dados para o relato
class Relato(BaseModel):
    titulo: str
    descricao: str
    endereco: str
    categoria: str
    fotos: List[str]

# Configurações do Azure
AZURE_STORAGE_CONNECTION_STRING = ''  # Colocar chave da azure
CONTAINER_NAME = 'urbanfyimagem'
DATABASE_URL = "/home/urbanfy/relatos/relatos.db"

def validate_azure_connection_string(connection_string: str) -> bool:
    """Valida se a string de conexão do Azure está completa."""
    required_parts = ['DefaultEndpointsProtocol', 'AccountName', 'AccountKey']
    try:
        parts = dict(part.split('=', 1) for part in connection_string.split(';'))
        return all(part in parts for part in required_parts) and len(parts['AccountKey']) > 20
    except Exception:
        return False

# Inicializando o cliente do Azure Blob Storage
try:
    logger.info("Validando string de conexão do Azure...")
    if not validate_azure_connection_string(AZURE_STORAGE_CONNECTION_STRING):
        raise ValueError("String de conexão do Azure inválida ou incompleta. Verifique se a AccountKey está completa.")
    
    logger.info("Tentando conectar ao Azure Blob Storage...")
    blob_service_client = BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING)
    container_client = blob_service_client.get_container_client(CONTAINER_NAME)
    
    # Verificar se o container existe
    if not container_client.exists():
        logger.error(f"Container {CONTAINER_NAME} não existe!")
        raise Exception(f"Container {CONTAINER_NAME} não encontrado")
    logger.info("Conexão com Azure Blob Storage estabelecida com sucesso")
except Exception as e:
    logger.error(f"Erro ao conectar com Azure Blob Storage: {str(e)}")
    raise

# Função para obter conexão com o banco de dados
def get_db_connection():
    try:
        conn = sqlite3.connect(DATABASE_URL, timeout=10)
        conn.row_factory = sqlite3.Row
        print(f"Conexão com banco de dados estabelecida em: {DATABASE_URL}")
        return conn
    except Exception as e:
        print(f"Erro ao conectar ao banco de dados: {str(e)}")
        raise

# Função para obter o cliente do Blob Storage
def get_blob_service_client():
    try:
        return BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING)
    except Exception as e:
        logger.error(f"Blob Storage connection error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao conectar ao Blob Storage: {str(e)}")

# Função para upload de imagens no Azure Blob Storage
def upload_imagem_base64(base64_str: str, nome_imagem: str) -> str:
    logger.info(f"Tentando fazer upload da imagem: {nome_imagem}")
    try:
        if not base64_str:
            logger.error("String base64 vazia recebida")
            raise ValueError("String base64 vazia")

        # Limpar a string base64
        base64_str = base64_str.strip()
        
        # Remover prefixo se existir
        if "base64," in base64_str:
            base64_str = base64_str.split("base64,")[1]
        elif "data:image" in base64_str:
            base64_str = base64_str.split(",")[1]

        # Remover caracteres inválidos
        base64_str = base64_str.replace('\n', '').replace('\r', '').replace(' ', '')
        
        # Adicionar padding se necessário
        missing_padding = len(base64_str) % 4
        if missing_padding:
            base64_str += '=' * (4 - missing_padding)

        try:
            # Tentar decodificar a imagem
            imagem_bytes = base64.b64decode(base64_str)
            logger.info(f"Imagem decodificada com sucesso, tamanho: {len(imagem_bytes)} bytes")
            
            # Verificar se é uma imagem válida
            if len(imagem_bytes) < 100:  # Tamanho mínimo para uma imagem válida
                raise ValueError("Imagem muito pequena ou inválida")
                
        except binascii.Error as e:
            logger.error(f"Erro ao decodificar base64: {e}")
            raise HTTPException(status_code=400, detail="Imagem em base64 inválida")
        except Exception as e:
            logger.error(f"Erro ao processar imagem: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Erro ao processar imagem: {str(e)}")

        try:
            # Fazer upload para o Azure
            blob_client = container_client.get_blob_client(nome_imagem)
            blob_client.upload_blob(imagem_bytes, overwrite=True)
            logger.info(f"Upload realizado com sucesso: {nome_imagem}")
            
            # Gerar e retornar a URL
            url = f'https://{blob_service_client.account_name}.blob.core.windows.net/{CONTAINER_NAME}/{nome_imagem}'
            logger.info(f"URL gerada: {url}")
            return url
            
        except Exception as e:
            logger.error(f"Erro ao fazer upload para o Azure: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Erro ao fazer upload para o Azure: {str(e)}")

    except Exception as e:
        logger.error(f"Erro durante upload da imagem: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao fazer upload da imagem: {str(e)}")

@app.post("/relatos")
def criar_relato(relato: Relato):
    print(f"Recebendo novo relato: {relato.dict()}")
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Gerar ID único para o relato
        relato_id = str(uuid.uuid4())
        print(f"ID gerado para o relato: {relato_id}")
        
        # Inserir o relato no banco de dados
        cursor.execute('''
            INSERT INTO relatos (id, titulo, descricao, endereco, categoria, data_criacao)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            relato_id,
            relato.titulo,
            relato.descricao,
            relato.endereco,
            relato.categoria,
            datetime.now().isoformat()
        ))
        print("Relato inserido no banco de dados")
        
        # Processar fotos se houver
        for foto_base64 in relato.fotos:
            if not foto_base64:
                continue  # Pula strings vazias ou None
            nome_imagem = f"{uuid.uuid4()}.jpg"
            foto_url = upload_imagem_base64(foto_base64, nome_imagem)
            print(f"Foto enviada para Azure: {foto_url}")
            
            # Salvar URL da foto no banco
            foto_id = str(uuid.uuid4())
            cursor.execute('''
                INSERT INTO fotos (id, relato_id, url)
                VALUES (?, ?, ?)
            ''', (foto_id, relato_id, foto_url))
            print(f"URL da foto salva no banco de dados")
        
        conn.commit()
        print("Commit realizado com sucesso")
        return {"mensagem": "Relato recebido com sucesso.", "id": relato_id}
    
    except Exception as e:
        print(f"Erro ao processar relato: {str(e)}")
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        if conn:
            conn.close()
            print("Conexão com o banco fechada")

@app.get("/relatos")
async def listar_relatos():
    logger.info("Listing 4 most recent relatos")
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Query para buscar os 4 relatos mais recentes com suas fotos
        cursor.execute('''
            SELECT 
                r.id,
                r.titulo,
                r.descricao,
                r.endereco,
                r.categoria,
                r.data_criacao,
                GROUP_CONCAT(f.url) as fotos_urls
            FROM relatos r
            LEFT JOIN fotos f ON r.id = f.relato_id
            GROUP BY r.id
            ORDER BY r.data_criacao DESC
            LIMIT 4
        ''')
        
        relatos = []
        for row in cursor.fetchall():
            relato = dict(row)
            # Converter string de URLs em lista e remover URLs vazias
            fotos = relato['fotos_urls'].split(',') if relato['fotos_urls'] else []
            fotos = [foto for foto in fotos if foto]  # Remove URLs vazias
            relato['fotos'] = fotos
            del relato['fotos_urls']
            relatos.append(relato)
        
        conn.close()
        logger.info(f"Found {len(relatos)} relatos")
        return relatos
    
    except Exception as e:
        logger.error(f"Error listing relatos: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting FastAPI server...")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")