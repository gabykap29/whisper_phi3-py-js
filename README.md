# Proyecto de Transcripción y Diarización de Audio con Whisper, Express.js y React

Este proyecto consta de tres componentes principales:

1. **Servidor de Whisper en FastAPI**: Para la transcripción de audio y diarización de hablantes.
2. **Servidor Express.js para phi3**: Proporciona funcionalidades adicionales.
3. **Frontend en React**: Montado con Vite para interactuar con los servidores.

## Requisitos Previos

- Python 3.8+
- Node.js 14+
- npm o yarn

## Configuración

### 1. Servidor de Whisper en FastAPI

#### Instalación de Dependencias

```bash
# Crear y activar un entorno virtual
python -m venv whisper_env
```

```bash
source whisper_env/bin/activate  # En Windows: whisper_env\Scripts\activate
```
```bash
# Instalar las dependencias
pip install -r requirements.txt
```
```bash
# Ejecutar el servidor de python
uvicorn main:app ---reload
```

### 2. Servidor de Express-JS para PHI3
- Ingresa a la caperta del servidor de phi
```bash
# Instalar las dependencias
npm install
```
```bash
# Ejecutar el servidor
npm run dev
```
### 3. Servidor del cliente

- Ingresa a la caperta del cliente

```bash
# Instalar las dependencias
npm install
```

```bash
# Ejecutar el servidor
npm run dev
```
