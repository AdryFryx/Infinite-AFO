// Datos de ejercicios de ejemplo
const exercises = {
    quadratic: {
        title: "Movimiento Parabólico - Proyectil",
        module: "Funciones Cuadráticas",
        difficulty: "Intermedio",
        description: "Analiza el movimiento de un proyectil lanzado desde el suelo",
        image: "./assets/images/parabolic-motion.png",
        imageCaption: "Trayectoria parabólica del proyectil",
        context: "Un proyectil es lanzado desde el suelo con una velocidad inicial de 50 m/s con un ángulo de 45°. La altura del proyectil sigue la función: h(t) = -5t² + 35.35t",
        questions: [
            {
                text: "¿Cuál es la altura máxima que alcanza el proyectil?",
                type: "numeric",
                answer: "62.5",
                unit: "metros",
                hint: "Usa la fórmula del vértice de la parábola"
            },
            {
                text: "¿En qué tiempo alcanza la altura máxima?",
                type: "numeric", 
                answer: "3.535",
                unit: "segundos",
                hint: "El tiempo en el vértice es t = -b/(2a)"
            },
            {
                text: "¿A qué distancia cae el proyectil?",
                type: "numeric",
                answer: "125",
                unit: "metros", 
                hint: "Encuentra cuando h(t) = 0 y calcula la distancia horizontal"
            }
        ]
    },
    trigonometric: {
        title: "Ondas Senoidales - Muelle",
        module: "Funciones Trigonométricas", 
        difficulty: "Intermedio",
        description: "Analiza el movimiento armónico simple de un muelle",
        image: "./assets/images/sine-wave.png",
        imageCaption: "Movimiento oscilatorio del muelle",
        context: "Un muelle sigue un movimiento armónico simple descrito por la función: x(t) = 2·sin(πt) + 3·cos(πt), donde x es la posición en cm y t el tiempo en segundos.",
        questions: [
            {
                text: "¿Cuál es la amplitud máxima del movimiento?",
                type: "numeric",
                answer: "3.606",
                unit: "cm",
                hint: "Calcula √(A² + B²) para la amplitud"
            },
            {
                text: "¿Cuál es el periodo de oscilación?",
                type: "numeric",
                answer: "2",
                unit: "segundos", 
                hint: "Periodo = 2π/ω"
            },
            {
                text: "¿En qué posición se encuentra en t = 0.5 segundos?",
                type: "numeric",
                answer: "3",
                unit: "cm",
                hint: "Sustituye t=0.5 en la función"
            }
        ]
    }
};

// Variables globales
let currentExercise = null;
let currentModule = null;

// Función para verificar autenticación
function checkAuthentication() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return null;
    }
    return currentUser;
}

// Función para cargar información del usuario
function loadUserInfo(user) {
    const currentUserElement = document.getElementById('currentUser');
    if (currentUserElement) {
        currentUserElement.textContent = user.name;
    }
}

// Función para cargar el ejercicio basado en el módulo
function loadExercise() {
    const urlParams = new URLSearchParams(window.location.search);
    const module = urlParams.get('module') || 'quadratic';
    
    currentModule = module;
    currentExercise = exercises[module];
    
    if (!currentExercise) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    // Actualizar la interfaz con los datos del ejercicio
    document.getElementById('exerciseTitle').textContent = currentExercise.title;
    document.getElementById('moduleBadge').textContent = currentExercise.module;
    document.getElementById('difficultyBadge').textContent = currentExercise.difficulty;
    document.getElementById('exerciseDescription').textContent = currentExercise.description;
    document.getElementById('exerciseImage').src = currentExercise.image;
    document.getElementById('imageCaption').textContent = currentExercise.imageCaption;
    document.getElementById('contextText').textContent = currentExercise.context;
    
    // Cargar preguntas
    currentExercise.questions.forEach((question, index) => {
        const questionElement = document.getElementById(`question${index + 1}Text`);
        const answerInput = document.getElementById(`answer${index + 1}`);
        
        if (questionElement) {
            questionElement.textContent = question.text;
        }
        
        if (answerInput && answerInput.nextElementSibling) {
            answerInput.nextElementSibling.textContent = question.unit;
        }
    });
}

// Función para validar respuestas
function validateAnswers(userAnswers) {
    const results = [];
    let correctCount = 0;
    
    currentExercise.questions.forEach((question, index) => {
        const userAnswer = userAnswers[index];
        const correctAnswer = question.answer;
        const isCorrect = Math.abs(parseFloat(userAnswer) - parseFloat(correctAnswer)) < 0.01;
        
        if (isCorrect) correctCount++;
        
        results.push({
            question: question.text,
            userAnswer: userAnswer,
            correctAnswer: correctAnswer,
            isCorrect: isCorrect,
            unit: question.unit,
            hint: question.hint
        });
    });
    
    return {
        results: results,
        score: Math.round((correctCount / currentExercise.questions.length) * 100),
        correctCount: correctCount,
        totalQuestions: currentExercise.questions.length
    };
}

// Función para mostrar resultados
function showResults(validationResults) {
    const modalTitle = document.getElementById('resultsModalTitle');
    const modalBody = document.getElementById('resultsModalBody');
    
    modalTitle.textContent = `Resultados - ${currentExercise.title}`;
    
    let resultsHTML = `
        <div class="results-score ${getScoreClass(validationResults.score)}">
            Puntuación: ${validationResults.score}%
        </div>
        <p>Respuestas correctas: ${validationResults.correctCount}/${validationResults.totalQuestions}</p>
    `;
    
    validationResults.results.forEach((result, index) => {
        resultsHTML += `
            <div class="results-item ${result.isCorrect ? 'correct' : 'incorrect'}">
                <strong>Pregunta ${index + 1}:</strong> ${result.question}<br>
                <strong>Tu respuesta:</strong> ${result.userAnswer || 'Sin responder'} ${result.unit}<br>
                <strong>Respuesta correcta:</strong> ${result.correctAnswer} ${result.unit}<br>
                ${!result.isCorrect ? `<small class="text-muted"><i class="fas fa-lightbulb me-1"></i>${result.hint}</small>` : ''}
            </div>
        `;
    });
    
    resultsHTML += `
        <div class="mt-3">
            <strong>Retroalimentación:</strong><br>
            ${getFeedbackMessage(validationResults.score)}
        </div>
    `;
    
    modalBody.innerHTML = resultsHTML;
    
    // Mostrar modal
    const resultsModal = new bootstrap.Modal(document.getElementById('resultsModal'));
    resultsModal.show();
}

// Función para obtener clase CSS según puntuación
function getScoreClass(score) {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    return 'score-poor';
}

// Función para obtener mensaje de retroalimentación
function getFeedbackMessage(score) {
    if (score === 100) {
        return "¡Excelente! Dominas completamente este tema. 🎉";
    } else if (score >= 80) {
        return "Muy bien, comprendes bien el concepto. Sigue practicando. 👍";
    } else if (score >= 60) {
        return "Buen intento. Revisa los conceptos y vuelve a intentarlo. 💪";
    } else {
        return "Necesitas repasar este tema. No te rindas, sigue practicando. 📚";
    }
}

// Función para manejar el envío del formulario
function handleSubmit(event) {
    event.preventDefault();
    
    const userAnswers = [
        document.getElementById('answer1').value.trim(),
        document.getElementById('answer2').value.trim(),
        document.getElementById('answer3').value.trim()
    ];
    
    // Validar que todas las preguntas tengan respuesta
    const emptyAnswers = userAnswers.filter(answer => answer === '');
    if (emptyAnswers.length > 0) {
        alert('Por favor responde todas las preguntas antes de enviar.');
        return;
    }
    
    const validationResults = validateAnswers(userAnswers);
    showResults(validationResults);
    
    // Guardar resultados en localStorage para estadísticas
    saveExerciseResults(validationResults);
}

// Función para guardar resultados
function saveExerciseResults(results) {
    const exerciseHistory = JSON.parse(localStorage.getItem('exerciseHistory')) || [];
    
    const exerciseResult = {
        date: new Date().toISOString(),
        module: currentModule,
        title: currentExercise.title,
        score: results.score,
        correctAnswers: results.correctCount,
        totalQuestions: results.totalQuestions
    };
    
    exerciseHistory.push(exerciseResult);
    localStorage.setItem('exerciseHistory', JSON.stringify(exerciseHistory));
}

// Función para limpiar respuestas
function resetForm() {
    document.getElementById('exerciseForm').reset();
    document.querySelectorAll('.answer-input').forEach(input => {
        input.classList.remove('correct', 'incorrect');
    });
}

// Función para inicializar la página
function initializeExercisePage() {
    const user = checkAuthentication();
    if (!user) return;
    
    loadUserInfo(user);
    loadExercise();
    
    // Event listeners
    document.getElementById('exerciseForm').addEventListener('submit', handleSubmit);
    document.getElementById('resetBtn').addEventListener('click', resetForm);
    document.getElementById('cancelBtn').addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        }
    });
    document.getElementById('nextExerciseBtn').addEventListener('click', function() {
        // Recargar página con mismo módulo (en futuro: siguiente ejercicio)
        window.location.reload();
    });
}

// Inicializar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', initializeExercisePage);