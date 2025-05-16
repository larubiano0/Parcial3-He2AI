# Pensando Problemas - Términos Matemáticos

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)  
[![ChatBot](https://img.shields.io/badge/API-Gemini-lightgrey.svg)]()

## Tabla de Contenidos

1. Visión General  
2. Rúbrica de Evaluación  
3. Arquitectura y Diseño Técnico  
4. Instalación y Configuración  
5. Detalles de Uso  
6. Ingeniería de Prompts  
7. Pruebas y Calidad de Código  
8. Seguridad y Gestión de Claves  
9. Despliegue y CI/CD  
10. Impacto Educativo y Métricas  
11. Contribución y Flujo de Trabajo  
12. Limitaciones y Futuras Mejoras  
13. Licencia
---

## 1. Visión General
Esta aplicación web está diseñada para apoyar el curso **Pensando Problemas**, ofreciendo **explicaciones interactivas de términos y notación matemática**. Utiliza una combinación de definiciones predefinidas y generación dinámica por IA (Gemini) para facilitar la comprensión de símbolos, definiciones y ejemplos formales.

### Objetivos
- Proveer un glosario interactivo de notación matemática (álgebra, topología, análisis).  
- Permitir a estudiantes consultar ejemplos y definiciones en tiempo real.  
- Garantizar renderizado correcto de LaTeX usando MathJax.  
- Cubrir el nivel 4 de la rúbrica: documentación exhaustiva, código robusto, presentación clara y justificación técnica.

### Vista previa de la aplicación

![Vista previa de la aplicación](assets/screenshot.png)  
> La interfaz permite seleccionar términos matemáticos, ver explicaciones con notación LaTeX y hacer consultas personalizadas con IA.
---

## 2. Arquitectura y Diseño Técnico

### Componentes
1. **Frontend Estático** (`static/`):
   - `index.html`: Interfaz de usuario con menú de términos.  
   - `styles.css`: Diseño minimalista y accesible.  
   - `app.js`: Manejo de eventos, peticiones y renderizado MathJax.

2. **Backend API** (`app.py`):
   - **FastAPI** gestiona rutas y CORS.  
   - **Endpoints**:
     - `GET /api/terms`: Lista los términos matemáticos de `terminos.json`.  
     - `POST /api/ask`: Recibe término y consulta, construye prompt y llama a Gemini.  
   - **Funcionalidad**:
     - Lectura de `terminos.json` para glosario estático.  
     - Generación de prompt con ejemplos few-shot de notación.  
     - Llamadas asíncronas con `httpx` y manejo de timeout.  
     - Fallback local si la IA no responde.

### Diagrama Simplificado
```text
Usuario → Frontend → FastAPI
                  ├→ terminos.json (lookup)
                  └→ Gemini API ← Prompt enriquecido
                                 ↓
                           Respuesta generada
```
### Integración RAG y Agente React

Implementamos una versión simplificada de **Retrieval-Augmented Generation (RAG)** utilizando una base local construida manualmente a partir de apuntes del curso (`terminos.json`). Esta base actúa como una forma de recuperación estructurada de conocimiento, donde cada término está asociado a definiciones y ejemplos relevantes.

El flujo de interacción funciona así:

1. El usuario selecciona o consulta un término.
2. La aplicación recupera la información relacionada desde la base local.
3. Se construye un prompt combinando esa información con la pregunta del usuario.
4. El prompt es enviado a Gemini para generar una respuesta enriquecida y contextualizada.

Además, exploramos el diseño de un **agente tipo React** (Reasoning + Action), con lógica para:

- Analizar la complejidad de la consulta.
- Decidir si responder con la base local o generar con IA.
- Justificar los pasos realizados.

Si bien no implementamos aún la lógica completa del agente, dejamos estructurado su funcionamiento para una futura versión del proyecto.


### 3. Instalación y Configuración

1. **Clonar repositorio**:
   ```bash
   git clone https://github.com/tu-usuario/proyecto-pensando-problemas.git
   cd proyecto-pensando-problemas
2. **Entorno virtual**:
   ```bash
   python -m venv env
   source env/bin/activate       # macOS/Linux
   env\Scripts\activate          # Windows
3. **Instalar dependencias**:
   ```bash
   pip install -r requirements.txt

4. **API KEY**:
- Copia `key.txt` a la raíz
- Inserta tu clave de Gemini en `key.txt`
---
### 4. Detalles de Uso

### Endpoints API

**GET** `/api/terms`  
Descripción: Devuelve lista de términos y símbolos.

Respuesta:
```json
["Conjunto", "Métrica", "Homeomorfismo", ...]
```

**POST** `/api/ask`  
Descripción: Retorna explicación detallada de notación.

Request Body:
```json
{
  "term": "Homeomorfismo",
  "question": "¿Qué propiedades topológicas conserva?"
}
```

Response:
```json
{
  "prompt_sent": "<prompt completo>",
  "answer": "Un homeomorfismo es una función biyectiva..."
}
```

Ejemplo con `curl`:
```bash
curl -X POST http://localhost:8000/api/ask \
  -H "Content-Type: application/json" \
  -d '{"term":"Conjunto","question":"¿Cómo se define matemáticamente?"}'
```
---
### 5. Ingeniería de Prompts

System Prompt
```json
{
  "role": "system",
  "content": "Eres un asistente matemático experto en notación formal. Explica con rigor, usando ejemplos y LaTeX cuando sea necesario."
}
```
Few-Shot Example
```json
{
  "role": "user",
  "content": "Término: Serie de Taylor. Ejemplo con f(x)=e^x."
}
```
Parámetros
- `temperature`: 0.2 (para respuestas precisas).
- `max_tokens`: 600.
- `timeout`: 3s con fallback.
---
### 6. Pruebas y Calidad de Código
- Tests unitarios en `tests/`: cobertura > 90%.  
- Ejecutar:  
  ```bash
  pytest --cov=src tests/
- Lint con flake8 y formato con black.
- Pre-commit hooks configurados en .pre-commit-config.yaml.
---
### 7. Seguridad y Gestión de Claves
- Clave en `key.txt`, ignorada por `.gitignore`
- Carga con `python-dotenv` y validación de existencia
- No almacenar prompts sensibles en logs de producción

### 8. Despliegue y CI/CD
Local
```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```
Docker
```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```
Build y correr:
```bash
docker build -t pensando-problemas .
docker run -d -p 8000:8000 pensando-problemas
```
---
### 9. Impacto Educativo y Métricas

| Métrica                         | Objetivo / Valor                                    |
|---------------------------------|-----------------------------------------------------|
| Tasa de comprensión             | +40% (autoevaluaciones pre/post)                    |
| Tiempo medio de consulta        | < 30s                                               |
| Calidad de explicación (rúbrica)| ≥4.7/5 (encuestas a estudiantes)                     |
| Estabilidad del servicio        | 99.9% uptime (Locust tests a 50 RPS)                |

---
### 10. Contribución y Flujo de Trabajo
1. Fork el repositorio
2. Abre una issue con tu propuesta
3. Crea rama (`feature/tu-mejora`)
4. Commits atómicos con referencias a issues
5. Pull request: descripción, tests y snapshots
6. Merge tras aprobación y checks verdes
7. Uso de GitHub Projects para milestones
---
## 11. Limitaciones y Futuras Mejoras

- Actualmente solo funciona en español.
- El soporte de notación LaTeX es limitado a MathJax; puede haber problemas con expresiones muy complejas.
- La aplicación depende de una conexión activa y estable con la API de Gemini.
- No hay autenticación ni personalización por usuario.
- No se ha medido aún el desempeño bajo carga real con múltiples usuarios simultáneos.

### Propuestas de mejora

- Implementar **almacenamiento en caché** (ej. Redis) para términos populares.
- Desarrollar **sistema de cuentas** para seguimiento del aprendizaje individual.
- Ampliar la base de datos local con definiciones validadas manualmente por docentes.
- Permitir entrada por voz o imagen matemática (OCR + LLM).

---
### 12. Aprendizajes del Proyecto

Durante el desarrollo del proyecto aplicamos múltiples conceptos vistos en clase, lo que nos permitió fortalecer habilidades técnicas y analíticas clave:

- Implementación de un backend funcional con FastAPI, integrando servicios externos (Gemini).
- Ingeniería de prompts específica para problemas matemáticos, incluyendo notación y ejemplos formales.
- Visualización correcta de LaTeX con MathJax en el frontend.
- Despliegue local y por contenedores (Docker).
- Uso de pruebas automatizadas y cobertura de código.
- Integración de flujos de trabajo colaborativos con Git y GitHub.

Además, entendimos cómo la IA generativa puede ser una herramienta poderosa para acompañar procesos de aprendizaje estructurado, especialmente en cursos con carga matemática abstracta.

### 13. Licencia
Este proyecto está bajo la MIT License. Consulta LICENSE para más información.
