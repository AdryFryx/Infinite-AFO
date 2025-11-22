// =============================================
// CONFIGURACIÓN DEL BACKEND
// =============================================
const API_URL = "http://localhost:5000";

// Variables globales
let currentExercise = null;
let currentModule = null;

// -------------------- Autenticación --------------------
function checkAuthentication() {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) {
        window.location.href = "index.html";
        return null;
    }
    return currentUser;
}

function loadUserInfo(user) {
    const el = document.getElementById("currentUser");
    if (el) el.textContent = user.nombre_usuario || user.name || "Estudiante";
}

// -------------------- Cargar ejercicio desde backend --------------------
async function loadExercise() {
    const params = new URLSearchParams(window.location.search);
    const module = params.get("module") || "quadratic";
    currentModule = module;

    try {
        const res = await fetch(`${API_URL}/api/exercise?module=${module}`);
        if (!res.ok) throw new Error("Error al consultar backend");
        currentExercise = await res.json();
        console.log("Ejercicio recibido desde backend:", currentExercise);
    } catch (err) {
        console.error(err);
        alert("No se pudo cargar el ejercicio desde el servidor.");
        window.location.href = "dashboard.html";
        return;
    }

    // Campos del ejercicio (soporta titulo/title, etc.)
    const title       = currentExercise.titulo       || currentExercise.title       || "Ejercicio";
    const moduleName  = currentExercise.modulo       || currentExercise.module      || "";
    const difficulty  = currentExercise.dificultad   || currentExercise.difficulty  || "";
    const desc        = currentExercise.descripcion  || currentExercise.description || "";
    const image       = currentExercise.imagen       || currentExercise.image       || "";
    const imgCaption  = currentExercise.imagen_caption || currentExercise.imageCaption || "";
    const contextText = currentExercise.contexto     || currentExercise.context     || "";

    document.getElementById("exerciseTitle").textContent      = title;
    document.getElementById("moduleBadge").textContent        = moduleName;
    document.getElementById("difficultyBadge").textContent    = difficulty;
    document.getElementById("exerciseDescription").textContent= desc;
    document.getElementById("exerciseImage").src              = image;
    document.getElementById("imageCaption").textContent       = imgCaption;
    document.getElementById("contextText").textContent        = contextText;

    // Preguntas
    const questions = currentExercise.questions || currentExercise.preguntas || [];
    console.log("Preguntas recibidas:", questions);

    questions.forEach((q, i) => {
        const qTextEl = document.getElementById(`question${i + 1}Text`);
        const ansInput = document.getElementById(`answer${i + 1}`);

        if (!qTextEl || !ansInput) return;

        const enunciado = q.enunciado || q.text || "";
        const unidad    = q.unidad    || q.unit || "";
        qTextEl.textContent = enunciado;
        if (ansInput.nextElementSibling) {
            ansInput.nextElementSibling.textContent = unidad;
        }
    });
}

// -------------------- Validar respuestas --------------------
function validateAnswers(userAnswers) {
    const results = [];
    let correctCount = 0;

    const questions = currentExercise.questions || currentExercise.preguntas || [];

    questions.forEach((q, i) => {
        const userAns = userAnswers[i];

        const correct = q.respuesta_correcta || q.answer;
        const unit    = q.unidad || q.unit || "";
        const hint    = q.pista  || q.hint || "";

        const isCorrect =
            !isNaN(parseFloat(userAns)) &&
            !isNaN(parseFloat(correct)) &&
            Math.abs(parseFloat(userAns) - parseFloat(correct)) < 0.01;

        if (isCorrect) correctCount++;

        results.push({
            question: q.enunciado || q.text || "",
            userAnswer: userAns,
            correctAnswer: correct,
            isCorrect,
            unit,
            hint
        });
    });

    return {
        results,
        score: questions.length > 0
            ? Math.round((correctCount / questions.length) * 100)
            : 0,
        correctCount,
        totalQuestions: questions.length
    };
}

// -------------------- Mostrar resultados --------------------
function getScoreClass(score) {
    if (score >= 80) return "score-excellent";
    if (score >= 60) return "score-good";
    return "score-poor";
}

function getFeedbackMessage(score) {
    if (score === 100) return "¡Excelente! Dominas completamente este tema. 🎉";
    if (score >= 80)   return "Muy bien, comprendes bien el concepto. 👍";
    if (score >= 60)   return "Buen intento. Revisa los conceptos y vuelve a intentarlo. 💪";
    return "Necesitas repasar este tema. No te rindas, sigue practicando. 📚";
}

function showResults(validationResults) {
    const modalTitle = document.getElementById("resultsModalTitle");
    const modalBody  = document.getElementById("resultsModalBody");

    modalTitle.textContent = `Resultados - ${currentExercise.titulo || currentExercise.title || ""}`;

    let html = `
        <div class="results-score ${getScoreClass(validationResults.score)}">
            Puntuación: ${validationResults.score}%
        </div>
        <p>Respuestas correctas: ${validationResults.correctCount}/${validationResults.totalQuestions}</p>
    `;

    validationResults.results.forEach((res, idx) => {
        html += `
            <div class="results-item ${res.isCorrect ? "correct" : "incorrect"}">
                <strong>Pregunta ${idx + 1}:</strong> ${res.question}<br>
                <strong>Tu respuesta:</strong> ${res.userAnswer || "Sin responder"} ${res.unit}<br>
                <strong>Respuesta correcta:</strong> ${res.correctAnswer} ${res.unit}<br>
                ${!res.isCorrect && res.hint ? `<small class="text-muted"><i class="fas fa-lightbulb me-1"></i>${res.hint}</small>` : ""}
            </div>
        `;
    });

    html += `
        <div class="mt-3">
            <strong>Retroalimentación:</strong><br>
            ${getFeedbackMessage(validationResults.score)}
        </div>
    `;

    modalBody.innerHTML = html;

    const modal = new bootstrap.Modal(document.getElementById("resultsModal"));
    modal.show();
}

// -------------------- Submit, reset, init --------------------
function handleSubmit(e) {
    e.preventDefault();

    const userAnswers = [
        document.getElementById("answer1").value.trim(),
        document.getElementById("answer2").value.trim(),
        document.getElementById("answer3").value.trim()
    ];

    if (userAnswers.some(a => a === "")) {
        alert("Por favor responde todas las preguntas antes de enviar.");
        return;
    }

    const results = validateAnswers(userAnswers);
    showResults(results);
}

function resetForm() {
    document.getElementById("exerciseForm").reset();
    document.querySelectorAll(".answer-input").forEach(inp => {
        inp.classList.remove("correct", "incorrect");
    });
}

async function initializeExercisePage() {
    const user = checkAuthentication();
    if (!user) return;

    loadUserInfo(user);
    await loadExercise();

    document.getElementById("exerciseForm").addEventListener("submit", handleSubmit);
    document.getElementById("resetBtn").addEventListener("click", resetForm);
    document.getElementById("cancelBtn").addEventListener("click", () => {
        window.location.href = "dashboard.html";
    });
    document.getElementById("logoutBtn").addEventListener("click", e => {
        e.preventDefault();
        if (confirm("¿Estás seguro de que quieres cerrar sesión?")) {
            localStorage.removeItem("currentUser");
            window.location.href = "index.html";
        }
    });
    document.getElementById("nextExerciseBtn").addEventListener("click", () => {
        window.location.reload();
    });
}

document.addEventListener("DOMContentLoaded", initializeExercisePage);
