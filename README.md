# Pensando Problemas - Conceptos Económicos

Una aplicación web que ayuda a estudiantes a aprender conceptos económicos usando explicaciones con dinosaurios y permitiendo hacer preguntas que son respondidas por Gemini.

## Características

- Selección de conceptos económicos desde un menú desplegable
- Visualización de la notación matemática (LaTeX) y explicación con dinosaurios para cada concepto
- Formulario para hacer preguntas sobre el concepto seleccionado
- Integración con Gemini para responder preguntas usando la notación del concepto

## Tecnologías

- **Backend**: FastAPI
- **Frontend**: HTML, CSS, JavaScript (vanilla)
- **Renderizado matemático**: MathJax
- **API de IA**: Gemini (Google)

## Instalación

1. Clona este repositorio
2. Instala las dependencias:
   ```
   pip install -r requirements.txt
   ```
3. Obtén una API key de Gemini y colócala en el archivo `key.txt`

## Uso

1. Inicia el servidor:
   ```
   uvicorn app:app --reload
   ```
2. Abre tu navegador en `http://localhost:8000`
3. Selecciona un concepto del menú desplegable
4. Lee la notación y explicación
5. Haz una pregunta sobre el concepto
6. Recibe la respuesta generada por Gemini

## Estructura del Proyecto

- `app.py`: API de backend con FastAPI
- `terminos.json`: Datos de los conceptos económicos
- `static/`: Archivos estáticos para el frontend
  - `index.html`: Estructura HTML
  - `styles.css`: Estilos CSS
  - `app.js`: Lógica JavaScript
- `key.txt`: Archivo para almacenar la API key de Gemini
- `requirements.txt`: Dependencias del proyecto

## Nota

Asegúrate de reemplazar el contenido de `key.txt` con tu API key de Gemini válida antes de ejecutar la aplicación.