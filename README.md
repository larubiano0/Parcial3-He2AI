# Pensando Problemas - Términos Matemáticos

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)  
[![ChatBot](https://img.shields.io/badge/API-Gemini-lightgrey.svg)]()

## Tabla de Contenidos

1. Visión General  
2. Recuperación y Generación (RAG) + Agente React  
3. Arquitectura y Diseño Técnico  
4. Instalación y Configuración  
5. Detalles de Uso  
6. Ingeniería de Prompts  
7. Seguridad y Gestión de Claves  
8. Contribución y Flujo de Trabajo  
9. Limitaciones y Mejoras Futuras
10. Aprendizajes del Proyecto 
11. Licencia

---

## 1. Visión General
Esta aplicación web está diseñada para apoyar el curso **Pensando Problemas**, ofreciendo **explicaciones interactivas de términos y notación matemática**. Utiliza una combinación de definiciones predefinidas y generación dinámica por IA (Gemini) para facilitar la comprensión de símbolos, definiciones y ejemplos formales.

### Objetivos
- Proveer un glosario interactivo de notación matemática.  
- Permitir a estudiantes consultar ejemplos y definiciones en tiempo real.  
- Garantizar renderizado correcto de LaTeX usando MathJax.  
- Cubrir el nivel 4 de la rúbrica: documentación exhaustiva, código robusto, presentación clara y justificación técnica.

### Vista previa de la aplicación

![Vista previa de la aplicación](screenshot.png)  
> La interfaz permite seleccionar términos matemáticos, ver explicaciones con notación LaTeX y hacer consultas personalizadas con IA.
---
## 2. Recuperación y Generación (RAG) + Agente React

Este proyecto implementa una versión simplificada de **Retrieval-Augmented Generation (RAG)**. En lugar de utilizar embeddings o búsqueda vectorial, se construyó manualmente una base de conocimientos (`terminos.json`) a partir de apuntes del curso, organizada por término matemático.

### Flujo del RAG simplificado:

1. El usuario consulta un término o hace una pregunta relacionada.
2. El backend recupera la definición correspondiente desde `terminos.json`.
3. Se construye un prompt combinando esa definición con la consulta del usuario.
4. El prompt enriquecido se envía al modelo generativo (Gemini), que produce una respuesta contextualizada.

Este enfoque permite mejorar la precisión y la relevancia de las respuestas, ya que el modelo parte de una base específica del curso antes de generar contenido.

### Agente React (Reasoning + Action)

Adicionalmente, diseñamos un prototipo de agente tipo **React** con el siguiente comportamiento:

- **Razonamiento**: interpreta la complejidad de la consulta y determina si debe responder directamente o usar la IA.
- **Acción**: decide entre responder desde la base local (`terminos.json`) o consultar Gemini.
- **Justificación**: explica los pasos seguidos para llegar a una respuesta.

Aunque esta lógica aún no está integrada al flujo principal, su arquitectura está diseñada y lista para ser incorporada en versiones futuras como extensión del proyecto.

## 3. Arquitectura y Diseño Técnico

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

### 4. Instalación y Configuración

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

5. **Iniciar la aplicación localmente**:
   ```bash
   uvicorn app:app --reload
   ```
La aplicación se hostea en http://localhost:8000
### 5. Detalles de Uso

### Endpoints API

**GET** `/api/terms`  
Descripción: Devuelve lista de términos y símbolos.

Respuesta:
```json
["Conjunto", "Métrica", "Homeomorfismo", ...]
```

**POST** `/api/ask`  
Consulta un concepto matemático y una pregunta relacionada. El backend construye un prompt personalizado con base en la definición del concepto (desde `terminos.json`) y consulta la API de Gemini para generar una respuesta explicativa con estilo pedagógico.

## Request Body

```json
{
  "concept": "Fracción",
  "latex": "\frac{a}{b}",
  "question": "¿Qué significa la parte de arriba en una fracción??"
}

```
Response:
```json
{
  "response": "Para responder sobre **Fracción**, usaré la información disponible.\n\n En una fracción la parte de arriba signfica..."
}

```
## Funcionamiento interno

- Recupera la definición del concepto desde `terminos.json`
- Construye un prompt con notación LaTeX y tono amigable
- Si Gemini responde, retorna su respuesta enriquecida
- Si falla, responde con un mensaje generado localmente como fallback

## Errores posibles

- `404`: Si el concepto no existe
- `503`: Si no se encuentra la clave API de Gemini

## Ejemplo con curl

```bash
curl -X POST http://localhost:8000/api/ask \
  -H "Content-Type: application/json" \
  -d '{"concept":"Conjunto","question":"¿Cómo se define matemáticamente?"}'
```
---
## 6. Ingeniería de Prompts

La generación de respuestas se basa en un `system prompt` fijo, más un mensaje del usuario que combina el término seleccionado y su consulta. Esta estructura se envía como JSON a la API de Gemini mediante una llamada HTTP.

### Prompt utilizado (definido en `app.py`):


El user_prompt se genera dinámicamente así:
```python
prompt = f"""Responde la siguiente pregunta usando lenguaje apropiado para un estudiante de primer año de economía, usa analogías y lenguaje ambientado en dinosaurios para que tenga un tono divertido y relajado. Usa la siguiente notación {latex} y mete entre signos de $ las ecuaciones cuando quieras utilizar mathmode, además NO utilices comandos como \text, manten el texto relativamente plano. La respuesta va a ser procesada por una webapp, entonces mantén la respuesta sin simbolos que puedan dañar el HTML, y no hables del prompt. Solo responde la pregunta basado en las instrucciones.
    {request.question}"""
```

### 7. Seguridad y Gestión de Claves
- Clave en `key.txt`, ignorada por `.gitignore`
- Carga con `python-dotenv` y validación de existencia
- No almacenar prompts sensibles en logs de producción

---
### 8. Contribución y Flujo de Trabajo

Este proyecto fue desarrollado de manera colaborativa, dividiendo responsabilidades según fortalezas individuales:

- **Luis Rubiano**: Desarrollo del backend y lógica de integración con Gemini. Implementación de los endpoints API (`/terms`, `/ask`) y manejo de excepciones.
- **Carlos Castillo**: Redacción técnica del README y documentación del proyecto. Organización estructural del repositorio y coherencia técnica.
- **Manuela Pineda**: Diseño y presentación del pitch final. Apoyo en la validación comunicativa del contenido.
- **Angie Campos**: Elaboración del glosario de términos (`terminos.json`) y creación del diagrama del patrón de diseño Agentic.
- **Nicolás Martínez**: Co-diseño de la presentación final (pitch), revisión pedagógica de contenido y claridad en la interfaz.

> Además, todos los miembros participaron en sesiones de revisión conjunta del código, pruebas funcionales y diseño de la interfaz.

El flujo de trabajo se estructuró a través de GitHub, utilizando ramas específicas (`feature/`) y revisión por pares antes del merge.


---
## 9. Limitaciones y Futuras Mejoras

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
### 10. Aprendizajes del Proyecto

Durante el desarrollo del proyecto aplicamos múltiples conceptos vistos en clase, lo que nos permitió fortalecer habilidades técnicas y analíticas clave:

- Implementación de un backend funcional con FastAPI, integrando servicios externos (Gemini).
- Ingeniería de prompts específica para problemas matemáticos, incluyendo notación y ejemplos formales.
- Visualización correcta de LaTeX con MathJax en el frontend.
- Configuración y uso de un entorno virtual reproducible para desarrollo.
- Organización del código en rutas claras y separación de lógica.
- Flujo de trabajo colaborativo con Git y GitHub (ramas, commits y revisiones).

Además, entendimos cómo la IA generativa puede ser una herramienta poderosa para acompañar procesos de aprendizaje estructurado, especialmente en cursos con carga matemática abstracta. El proceso también nos permitió identificar oportunidades reales de mejora, como la integración futura de pruebas automáticas, optimización del flujo de consulta y personalización de respuestas.


### 11. Licencia
Este proyecto está bajo la MIT License. Consulta LICENSE para más información.
