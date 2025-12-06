// =============================================
// CONFIGURACIÓN DEL BACKEND
// =============================================
const API_URL = "http://localhost:5000";

let currentExercise = null;
let currentModule = null;

// -------------------- AUTENTICACIÓN --------------------
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

// -------------------- CARGAR EJERCICIO --------------------
async function loadExercise() {
    const params = new URLSearchParams(window.location.search);
    const module = params.get("module") || "quadratic";
    currentModule = module;

    const currentUser = JSON.parse(localStorage.getItem("currentUser")) || {};
    const nivel = (currentUser.nivel || "intermedio").toLowerCase();

    console.log("Cargando ejercicio:", { module, nivel });

    try {
        const res = await fetch(
            `${API_URL}/api/exercise?module=${encodeURIComponent(module)}&nivel=${encodeURIComponent(nivel)}`
        );
        if (!res.ok) throw new Error("Error al consultar backend");
        currentExercise = await res.json();
        console.log("Ejercicio recibido:", currentExercise);
    } catch (err) {
        console.error(err);
        alert("No se pudo cargar el ejercicio desde el servidor.");
        window.location.href = "dashboard.html";
        return;
    }

    const title       = currentExercise.titulo       || currentExercise.title       || "Ejercicio";
    const moduleName  = currentExercise.modulo       || currentExercise.module      || "";
    const difficulty  = currentExercise.dificultad   || currentExercise.difficulty  || "";
    const desc        = currentExercise.descripcion  || currentExercise.description || "";
    const image       = currentExercise.imagen       || currentExercise.image       || "";
    const imgCaption  = currentExercise.imagen_caption || currentExercise.imageCaption || "";
    const contextText = currentExercise.contexto     || currentExercise.context     || "";

    const titleEl       = document.getElementById("exerciseTitle");
    const moduleEl      = document.getElementById("moduleBadge");
    const difficultyEl  = document.getElementById("difficultyBadge");
    const descEl        = document.getElementById("exerciseDescription");
    const imageEl       = document.getElementById("exerciseImage");
    const captionEl     = document.getElementById("imageCaption");
    const contextEl     = document.getElementById("contextText");

    if (titleEl)      titleEl.textContent = title;
    if (moduleEl)     moduleEl.textContent = moduleName;
    if (difficultyEl) difficultyEl.textContent = difficulty || nivel;
    if (descEl)       descEl.textContent = desc || "Resuelve el siguiente ejercicio.";
    if (imageEl && image) imageEl.src = image;
    if (captionEl)    captionEl.textContent = imgCaption || "";
    if (contextEl)    contextEl.textContent = contextText;

    const questions = currentExercise.questions || currentExercise.preguntas || [];
    console.log("Preguntas:", questions);

    questions.forEach((q, i) => {
        const qTextEl  = document.getElementById(`question${i + 1}Text`);
        const ansInput = document.getElementById(`answer${i + 1}`);

        if (!qTextEl || !ansInput) return;

        const enunciado = q.enunciado || q.text || "";
        const unidad    = q.unidad    || q.unit || "";

        qTextEl.textContent = enunciado;
        if (ansInput.nextElementSibling) {
            ansInput.nextElementSibling.textContent = unidad || "unidad";
        }
    });
}

// -------------------- VALIDAR RESPUESTAS --------------------
function validateAnswers(userAnswers) {
    const results = [];
    let correctCount = 0;

    const questions = currentExercise.questions || currentExercise.preguntas || [];

    questions.forEach((q, i) => {
        const userAns = userAnswers[i];

        const correct = q.respuesta_correcta || q.answer;
        const unit    = q.unidad || q.unit || "";
        const hint    = q.pista  || q.hint || "";

        let isCorrect = false;

        const numUser    = parseFloat(userAns);
        const numCorrect = parseFloat(correct);

        if (!isNaN(numUser) && !isNaN(numCorrect)) {
            isCorrect = Math.abs(numUser - numCorrect) < 0.01;
        }

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

    const total = questions.length;
    const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    return {
        results,
        score,
        correctCount,
        totalQuestions: total
    };
}

// -------------------- GUARDAR RESULTADO EN BACKEND --------------------
async function sendResultToBackend(validationResults) {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser || !currentUser.id) return;

    // Mapear módulo a id_nivel (según tu tabla niveles)
    // 1: Funciones Cuadráticas, 2: Funciones Trigonométricas
    let idNivel = 1;
    if (currentModule === "trigonometric") {
        idNivel = 2;
    }

    const payload = {
        id_usuario: currentUser.id,
        id_nivel: idNivel,
        id_ejercicio: null,  // porque ahora son ejercicios generados dinámicamente
        puntaje: validationResults.score,
        total_preguntas: validationResults.totalQuestions
    };

    try {
        const res = await fetch(`${API_URL}/api/exercise-result`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) {
            console.error("Error guardando resultado:", data);
        } else {
            console.log("Resultado guardado:", data);
        }
    } catch (err) {
        console.error("Error de red al guardar resultado:", err);
    }
}

// -------------------- MOSTRAR RESULTADOS --------------------
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

    const title = currentExercise.titulo || currentExercise.title || "Ejercicio";

    if (modalTitle) {
        modalTitle.textContent = `Resultados - ${title}`;
    }

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
                ${
                    !res.isCorrect && res.hint
                        ? `<small class="text-muted"><i class="fas fa-lightbulb me-1"></i>${res.hint}</small>`
                        : ""
                }
            </div>
        `;
    });

    html += `
        <div class="mt-3">
            <strong>Retroalimentación:</strong><br>
            ${getFeedbackMessage(validationResults.score)}
        </div>
    `;

    if (modalBody) {
        modalBody.innerHTML = html;
    }

    const modalEl = document.getElementById("resultsModal");
    if (modalEl) {
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }
}

// -------------------- MANEJO DE FORMULARIO --------------------
async function handleSubmit(e) {
    e.preventDefault();

    const a1 = document.getElementById("answer1")?.value.trim() || "";
    const a2 = document.getElementById("answer2")?.value.trim() || "";
    const a3 = document.getElementById("answer3")?.value.trim() || "";

    const userAnswers = [a1, a2, a3];

    const answered = userAnswers.filter(a => a !== "").length;
    if (answered === 0) {
        alert("Por favor responde al menos una pregunta antes de enviar.");
        return;
    }

    const results = validateAnswers(userAnswers);
    showResults(results);
    await sendResultToBackend(results);
}

function resetForm() {
    const form = document.getElementById("exerciseForm");
    if (form) form.reset();

    document.querySelectorAll(".answer-input").forEach(inp => {
        inp.classList.remove("correct", "incorrect");
    });
}

// -------------------- INICIALIZACIÓN --------------------
async function initializeExercisePage() {
    const user = checkAuthentication();
    if (!user) return;

    loadUserInfo(user);
    await loadExercise();

    const form = document.getElementById("exerciseForm");
    if (form) form.addEventListener("submit", handleSubmit);

    const resetBtn = document.getElementById("resetBtn");
    if (resetBtn) resetBtn.addEventListener("click", resetForm);

    const cancelBtn = document.getElementById("cancelBtn");
    if (cancelBtn) cancelBtn.addEventListener("click", () => {
        window.location.href = "dashboard.html";
    });

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", e => {
            e.preventDefault();
            if (confirm("¿Estás seguro de que quieres cerrar sesión?")) {
                localStorage.removeItem("currentUser");
                window.location.href = "index.html";
            }
        });
    }

    const nextBtn = document.getElementById("nextExerciseBtn");
    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            window.location.reload();
        });
    }
}

document.addEventListener("DOMContentLoaded", initializeExercisePage);
