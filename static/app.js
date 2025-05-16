// DOM Elements
const conceptDropdown = document.getElementById('concept-dropdown');
const conceptTitle = document.getElementById('concept-title');
const conceptContent = document.getElementById('concept-content');
const latexFormula = document.getElementById('latex-formula');
const dinoExplanation = document.getElementById('dino-explanation');
const questionSection = document.getElementById('question-section');
const questionForm = document.getElementById('question-form');
const questionInput = document.getElementById('question-input');
const responseSection = document.getElementById('response-section');
const loadingIndicator = document.getElementById('loading-indicator');
const geminiResponse = document.getElementById('gemini-response');

// Global variables
let termsData = [];
let currentConcept = null;

// Initialize the application
async function initializeApp() {
    try {
        await loadConcepts();
        setupEventListeners();
        // Auto-select the first concept after loading
        selectFirstConcept();
    } catch (error) {
        console.error('Failed to initialize the application:', error);
        alert('Error al cargar la aplicación. Por favor, recarga la página.');
    }
}

// Load concepts from the backend API
async function loadConcepts() {
    try {
        const response = await fetch('/api/terms');
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        termsData = await response.json();
        
        console.log('Terms data loaded:', termsData);
        
        // Populate dropdown
        if (Array.isArray(termsData) && termsData.length > 0) {
            termsData.forEach(term => {
                const option = document.createElement('option');
                option.value = term.termino;
                option.textContent = term.termino;
                conceptDropdown.appendChild(option);
                console.log('Added option:', term.termino);
            });
        } else {
            console.error('Terms data is not an array or is empty:', termsData);
        }
        
        console.log('Concepts loaded successfully');
    } catch (error) {
        console.error('Error loading concepts:', error);
        throw error;
    }
}

// Set up event listeners
function setupEventListeners() {
    // Handle concept selection
    conceptDropdown.addEventListener('change', handleConceptChange);
    
    // Handle question submission
    questionForm.addEventListener('submit', handleQuestionSubmit);
    
    // Also add click handler to the button
    document.getElementById('ask-button').addEventListener('click', handleQuestionSubmit);
    
    console.log('Event listeners set up');
}

// Handle concept selection change
function handleConceptChange() {
    const selectedConcept = conceptDropdown.value;
    console.log('Selected concept:', selectedConcept);
    
    // Reset response section
    responseSection.classList.add('hidden');
    geminiResponse.textContent = '';
    
    if (!selectedConcept) {
        // No concept selected
        console.log('No concept selected');
        conceptTitle.textContent = 'Selecciona un concepto';
        conceptContent.classList.add('hidden');
        questionSection.classList.add('hidden');
        return;
    }
    
    // Find the selected concept data
    currentConcept = termsData.find(term => term.termino === selectedConcept);
    console.log('Current concept data:', currentConcept);
    
    if (currentConcept) {
        // Update UI with concept data
        conceptTitle.textContent = currentConcept.termino;
        
        // Render LaTeX and Markdown
        // Wrap LaTeX in a math environment with delimiters
        latexFormula.innerHTML = `\\[${currentConcept.latex}\\]`;
        
        // Parse markdown and convert asterisks to bold for dinosaur explanation
        const processedExplanation = processBoldText(currentConcept.explicacion_con_dinosaurios);
        dinoExplanation.innerHTML = marked.parse(processedExplanation);
        
        // Show content and question section
        conceptContent.classList.remove('hidden');
        questionSection.classList.remove('hidden');
        
        // Render LaTeX
        setTimeout(() => {
            if (typeof MathJax !== 'undefined') {
                console.log('Rendering LaTeX with MathJax');
                try {
                    // Try different MathJax API methods depending on version
                    if (typeof MathJax.typeset === 'function') {
                        MathJax.typeset();
                    } else if (typeof MathJax.typesetPromise === 'function') {
                        MathJax.typesetPromise();
                    } else if (typeof MathJax.Hub?.Queue === 'function') {
                        MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
                    }
                } catch (err) {
                    console.error('MathJax error:', err);
                }
            } else {
                console.warn('MathJax not available or not fully loaded');
            }
        }, 300); // Give more time for MathJax to load
    } else {
        console.error('Selected concept not found in data:', selectedConcept);
    }
}

// Manually trigger a selection of the first item after loading (optional)
function selectFirstConcept() {
    if (termsData.length > 0 && conceptDropdown.options.length > 1) {
        // Select the first non-placeholder option
        conceptDropdown.selectedIndex = 1;
        // Trigger the change event manually
        conceptDropdown.dispatchEvent(new Event('change'));
        console.log('First concept auto-selected');
    }
}

// Handle question submission
async function handleQuestionSubmit(event) {
    event.preventDefault();
    console.log('Form submitted');
    
    const question = questionInput.value.trim();
    console.log('Question:', question);
    console.log('Current concept:', currentConcept);
    
    if (!question || !currentConcept) {
        console.error('Missing question or concept');
        alert('Por favor, ingresa una pregunta válida');
        return;
    }
    
    // Show loading indicator
    responseSection.classList.remove('hidden');
    loadingIndicator.classList.remove('hidden');
    geminiResponse.textContent = '';
    console.log('Loading indicator shown');
    
    try {
        console.log('Making API request to /api/ask');
        console.log('Request payload:', {
            concept: currentConcept.termino,
            question: question
        });
        
        const response = await fetch('/api/ask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                concept: currentConcept.termino,
                question: question
            })
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error response:', errorText);
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API response received:', data);
        
        // Update UI with response
        // Process the response text for markdown and bold text
        const processedResponse = processBoldText(data.response);
        geminiResponse.innerHTML = marked.parse(processedResponse);
        console.log('Response displayed in UI');
        
        // Render LaTeX in response if present
        setTimeout(() => {
            if (typeof MathJax !== 'undefined') {
                console.log('Rendering LaTeX in response with MathJax');
                try {
                    // Ensure content is properly prepared for MathJax
                    geminiResponse.classList.add('math'); // Add class for MathJax processing
                    
                    // Try different MathJax API methods depending on version
                    if (typeof MathJax.typeset === 'function') {
                        MathJax.typeset([geminiResponse]);
                    } else if (typeof MathJax.typesetPromise === 'function') {
                        MathJax.typesetPromise([geminiResponse]);
                    } else if (typeof MathJax.Hub?.Queue === 'function') {
                        MathJax.Hub.Queue(["Typeset", MathJax.Hub, geminiResponse]);
                    }
                } catch (err) {
                    console.error('MathJax error in response:', err);
                }
            } else {
                console.warn('MathJax not available for response');
            }
        }, 500); // Give more time for MathJax to load
    } catch (error) {
        console.error('Error asking question:', error);
        geminiResponse.textContent = 'Error: No se pudo obtener una respuesta. Por favor, intenta nuevamente.';
    } finally {
        // Hide loading indicator
        loadingIndicator.classList.add('hidden');
    }
}

// Function to process text with asterisks and make it bold
// This function converts *text* to <strong>text</strong> before markdown processing
function processBoldText(text) {
    if (!text) return '';
    
    // Store math expressions to prevent processing inside them
    const mathExpressions = [];
    
    // Store display math: $$ ... $$ and \[ ... \]
    text = text.replace(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\])/g, match => {
        mathExpressions.push(match);
        return `__MATH_EXPR_${mathExpressions.length - 1}__`;
    });
    
    // Store inline math: $ ... $ and \( ... \)
    text = text.replace(/(\$[^\$\n]+?\$|\\\([^\)]+?\\\))/g, match => {
        mathExpressions.push(match);
        return `__MATH_EXPR_${mathExpressions.length - 1}__`;
    });
    
    // Store markdown code blocks to prevent processing inside them
    const codeBlocks = [];
    text = text.replace(/```[\s\S]*?```/g, match => {
        codeBlocks.push(match);
        return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
    });
    
    // Store inline code to prevent processing inside it
    const inlineCodes = [];
    text = text.replace(/`[^`]*`/g, match => {
        inlineCodes.push(match);
        return `__INLINE_CODE_${inlineCodes.length - 1}__`;
    });
    
    // Process asterisks (but not double asterisks which are markdown bold)
    text = text.replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>');
    
    // Restore code blocks
    codeBlocks.forEach((block, i) => {
        text = text.replace(`__CODE_BLOCK_${i}__`, block);
    });
    
    // Restore inline code
    inlineCodes.forEach((code, i) => {
        text = text.replace(`__INLINE_CODE_${i}__`, code);
    });
    
    // Restore math expressions
    mathExpressions.forEach((expr, i) => {
        text = text.replace(`__MATH_EXPR_${i}__`, expr);
    });
    
    return text;
}

// Configure marked.js options for Markdown rendering
marked.setOptions({
    breaks: true,           // Convert line breaks to <br>
    gfm: true,              // GitHub flavored markdown
    headerIds: false,       // Don't add IDs to headers
    mangle: false,          // Don't mangle email addresses
    sanitize: false,        // Don't sanitize HTML (we trust our content)
    smartypants: true,      // Use "smart" typographic punctuation
});

// MathJax configuration is now in the HTML file

// Start the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeApp);