// =============================================
// CONFIGURACIÓN DEL BACKEND
// =============================================
const API_URL = "http://localhost:5000"; // Cambiar por tu backend si lo subes


// =============================================
// ELIMINAMOS exercises LOCAL Y AHORA TODO VIENE DESDE BACKEND
// =============================================
// const exercises = {...}  // ← YA NO SE USA


// Variables globales
let currentExercise = null;
let currentModule = null;


// Función para verificar autenticación
function checkAuthentication() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {z
        window.location.href = 'index.html';
        return null;
    }
    return currentUser;
}


// Función para cargar información del usuario
function loadUserInfo(user) {
    const currentUserElement = document.getElementById('currentUser');
    if (currentUserElement) {
        currentUserElement.textContent = user.nombre_usuario || user.name;
    }
}


// ============================================================
// NUEVA FUNCIÓN loadExercise() — CARGA DESDE BACKEND
// ============================================================
async function loadExercise() {
    const urlParams = new URLSearchParams(window.location.search);
    const module = urlParams.get('module') || 'quadratic';
    currentModule = module;

    try {
        const response = await fetch(`${API_URL}/api/exercise?module=${module}`);
        if (!response.ok) throw new Error("Error al consultar el backend");

        currentExercise = await response.json();

    } catch (err) {
        console.error("Error:", err);
        alert("No se pudo cargar el ejercicio desde el servidor.");
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

    // Cargar preguntas dinámicamente
    currentExercise.questions.forEach((question, index) => {
        const questionElement = document.getElementById(`question${index + 1}Text`);
        const answerInput = document.getElementById(`answer${index + 1}`);

        if (questionElement) {
            questionElement.textContent = question.text;
        }

        if (answerInput && answerInput.nextElementSibling) {
            answerInput.nextElementSibling.textContent = question.unit || "";
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
    
    const emptyAnswers = userAnswers.filter(answer => answer === '');
    if (emptyAnswers.length > 0) {
        alert('Por favor responde todas las preguntas antes de enviar.');
        return;
    }
    
    const validationResults = validateAnswers(userAnswers);
    showResults(validationResults);
    
    saveExerciseResults(validationResults);
}


// Guardar resultados en localStorage
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


// Inicializar página
async function initializeExercisePage() {
    const user = checkAuthentication();
    if (!user) return;
    
    loadUserInfo(user);
    
    await loadExercise(); // <--- ESPERA LA CARGA DEL BACKEND
    
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
        window.location.reload();
    });
}


// Inicializar cuando cargue el DOM
document.addEventListener('DOMContentLoaded', initializeExercisePage);
