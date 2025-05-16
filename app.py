from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from pydantic import BaseModel
import json
import os
import requests
import httpx

# Initialize FastAPI app
app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model for question request
class QuestionRequest(BaseModel):
    concept: str
    question: str

# Load terms from terminos.json
def load_terms():
    try:
        with open("terminos.json", "r", encoding="utf-8") as file:
            return json.load(file)
    except Exception as e:
        print(f"Error loading terms: {e}")
        return []

# Load API Key
try:
    with open("key.txt", "r") as file:
        API_KEY = file.read().strip()
except Exception as e:
    print(f"Warning: Could not load API key: {e}")
    API_KEY = None

# Main HTML page
@app.get("/", response_class=HTMLResponse)
async def get_root():
    with open("static/index.html", "r", encoding="utf-8") as file:
        html_content = file.read()
    return html_content

# Serve styles.css
@app.get("/styles.css")
async def get_css():
    return FileResponse("static/styles.css", media_type="text/css")

# Serve app.js
@app.get("/app.js")
async def get_js():
    return FileResponse("static/app.js", media_type="application/javascript")

# API endpoints
@app.get("/api/terms")
async def get_terms():
    """Get all available economic terms"""
    terms = load_terms()
    if not terms:
        raise HTTPException(status_code=404, detail="Terms not found")
    return terms

@app.post("/api/ask")
async def ask_question(request: QuestionRequest):
    """API that uses Gemini to respond to the question"""
    # Find the concept in our terms list
    terms = load_terms()
    concept_data = next((term for term in terms if term["termino"] == request.concept), None)
    
    if not concept_data:
        raise HTTPException(status_code=404, detail=f"Concept '{request.concept}' not found")
    
    # Get data from the concept
    latex = concept_data["latex"]
    concept = concept_data["termino"]
    explanation = concept_data["explicacion_con_dinosaurios"]
    
    if not API_KEY:
        raise HTTPException(status_code=503, detail="Gemini API key not available")
    
    # Create a prompt for Gemini
    prompt = f"""Responde la siguiente pregunta usando lenguaje apropiado para un estudiante de primer año de economía, usa analogías y lenguaje ambientado en dinosaurios para que tenga un tono divertido y relajado. Usa la siguiente notación {latex} y mete entre signos de $ las ecuaciones cuando quieras utilizar mathmode, además NO utilices comandos como \text, manten el texto relativamente plano. La respuesta va a ser procesada por una webapp, entonces mantén la respuesta sin simbolos que puedan dañar el HTML, y no hables del prompt. Solo responde la pregunta basado en las instrucciones.
    
    {request.question}"""
    
    try:
        # Direct API call to Gemini
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent",
                headers={
                    "Content-Type": "application/json",
                    "x-goog-api-key": API_KEY
                },
                json={
                    "contents": [{"parts": [{"text": prompt}]}]
                },
                timeout=30.0
            )
            
            if response.status_code != 200:
                raise Exception(f"API Error: {response.status_code} - {response.text}")
            
            data = response.json()
            
            # Extract the response text from the API response
            gemini_response = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            
            if not gemini_response:
                gemini_response = "Lo siento, no se pudo generar una respuesta."
            
            # Format the response as plain text with markdown
            formatted_response = f"""Para responder sobre **{concept}**, usaré la información disponible.

{gemini_response}
"""
            
            return {"response": formatted_response}
            
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        # Fallback to a simple response in case of API error using markdown
        fallback_response = f"""Lo siento, hubo un problema al consultar la API de Gemini.

Para responder sobre **{concept}**, usaré la información disponible.

{explanation}

Error: {str(e)}
"""
        return {"response": fallback_response}