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
    if (el) {
        el.textContent =
            user.nombre_usuario ||
            user.name ||
            user.username ||
            user.correo ||
            "Estudiante";
    }
}

// -------------------- Cargar ejercicio desde backend --------------------
async function loadExercise() {
    const params = new URLSearchParams(window.location.search);
    const module = params.get("module") || "quadratic";
    currentModule = module;

    // Nivel según el usuario (basico / intermedio / avanzado)
    const currentUser = JSON.parse(localStorage.getItem("currentUser")) || {};
    const nivel = (currentUser.nivel || "intermedio").toLowerCase();

    console.log("Cargando ejercicio para módulo:", module, "nivel:", nivel);

    try {
        const res = await fetch(
            `${API_URL}/api/exercise?module=${encodeURIComponent(
                module
            )}&nivel=${encodeURIComponent(nivel)}`
        );
        if (!res.ok) throw new Error("Error al consultar backend");
        currentExercise = await res.json();
        console.log("Ejercicio recibido desde backend:", currentExercise);
    } catch (err) {
        console.error(err);
        alert("No se pudo cargar el ejercicio desde el servidor.");
        window.location.href = "dashboard.html";
        return;
    }

    // Campos flexibles
    const title =
        currentExercise.titulo || currentExercise.title || "Ejercicio";
    const moduleName =
        currentExercise.modulo || currentExercise.module || "";
    const difficulty =
        currentExercise.dificultad || currentExercise.difficulty || "";
    const desc =
        currentExercise.descripcion ||
        currentExercise.description ||
        "Resuelve el siguiente ejercicio.";
    const image = currentExercise.imagen || currentExercise.image || "";
    const imgCaption =
        currentExercise.imagen_caption ||
        currentExercise.imageCaption ||
        "";
    const contextText =
        currentExercise.contexto || currentExercise.context || "";

    const titleEl = document.getElementById("exerciseTitle");
    const moduleEl = document.getElementById("moduleBadge");
    const difficultyEl = document.getElementById("difficultyBadge");
    const descEl = document.getElementById("exerciseDescription");
    const imageEl = document.getElementById("exerciseImage");
    const captionEl = document.getElementById("imageCaption");
    const contextEl = document.getElementById("contextText");

    if (titleEl) titleEl.textContent = title;
    if (moduleEl) moduleEl.textContent = moduleName;
    if (difficultyEl) difficultyEl.textContent = difficulty;
    if (descEl) descEl.textContent = desc;
    if (imageEl && image) imageEl.src = image;
    if (captionEl) captionEl.textContent = imgCaption;
    if (contextEl) contextEl.textContent = contextText;

    // Preguntas
    const questions =
        currentExercise.questions || currentExercise.preguntas || [];
    console.log("Preguntas recibidas:", questions);

    // Ocultar todas (1..5)
    for (let i = 1; i <= 5; i++) {
        const qTextEl = document.getElementById(`question${i}Text`);
        const block = qTextEl ? qTextEl.closest(".question-item") : null;
        const unitSpan = document.getElementById(`unit${i}`);
        if (block) block.style.display = "none";
        if (unitSpan) unitSpan.textContent = "";
    }

    // Mostrar solo las que vienen desde el backend
    questions.forEach((q, index) => {
        const i = index + 1;
        if (i > 5) return;

        const qTextEl = document.getElementById(`question${i}Text`);
        const block = qTextEl ? qTextEl.closest(".question-item") : null;
        const unitSpan = document.getElementById(`unit${i}`);

        const enunciado = q.enunciado || q.text || "";
        const unidad = q.unidad || q.unit || "";

        if (qTextEl) qTextEl.textContent = enunciado;
        if (unitSpan) unitSpan.textContent = unidad;
        if (block) block.style.display = "block";
    });
}

// -------------------- Validar respuestas --------------------
function validateAnswers(userAnswers) {
    const results = [];
    let correctCount = 0;

    const questions =
        currentExercise.questions || currentExercise.preguntas || [];

    questions.forEach((q, index) => {
        const userAns = userAnswers[index];

        const correct = q.respuesta_correcta ?? q.answer;
        const unit = q.unidad || q.unit || "";
        const hint = q.pista || q.hint || "";

        let isCorrect = false;

        const numUser = parseFloat(userAns);
        const numCorrect = parseFloat(correct);

        if (!isNaN(numUser) && !isNaN(numCorrect)) {
            isCorrect = Math.abs(numUser - numCorrect) < 0.01;
        } else {
            isCorrect =
                String(userAns).trim().toLowerCase() ===
                String(correct).trim().toLowerCase();
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

// -------------------- Guardar resultado en backend --------------------
async function saveResultToBackend(validationResults) {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) return;

    const questions =
        currentExercise.questions || currentExercise.preguntas || [];
    const puntaje = validationResults.score;
    const total_preguntas = questions.length;

    // 🚨 IMPORTANTE: ahora el backend espera "module", NO id_nivel/id_ejercicio
    const payload = {
        id_usuario: currentUser.id,
        module: currentModule,        // "quadratic" o "trigonometric"
        puntaje: puntaje,
        total_preguntas: total_preguntas
    };

    try {
        const res = await fetch(`${API_URL}/api/exercise-result`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            console.error("No se pudo guardar resultado:", data);
        } else {
            console.log("Resultado guardado correctamente:", data);
        }
    } catch (err) {
        console.error("Error al guardar resultado:", err);
    }
}

// -------------------- Mostrar resultados --------------------
function getScoreClass(score) {
    if (score >= 80) return "score-excellent";
    if (score >= 60) return "score-good";
    return "score-poor";
}

function getFeedbackMessage(score) {
    if (score === 100) return "¡Excelente! Dominas completamente este tema. 🎉";
    if (score >= 80) return "Muy bien, comprendes bien el concepto. 👍";
    if (score >= 60)
        return "Buen intento. Revisa los conceptos y vuelve a intentarlo. 💪";
    return "Necesitas repasar este tema. No te rindas, sigue practicando. 📚";
}

function showResults(validationResults) {
    const modalTitle = document.getElementById("resultsModalTitle");
    const modalBody = document.getElementById("resultsModalBody");

    const title =
        currentExercise.titulo || currentExercise.title || "Ejercicio";

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

    if (modalBody) modalBody.innerHTML = html;

    const modalEl = document.getElementById("resultsModal");
    if (modalEl) {
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }
}

// -------------------- Submit, reset, init --------------------
function handleSubmit(e) {
    e.preventDefault();

    const questions =
        currentExercise.questions || currentExercise.preguntas || [];
    const userAnswers = [];

    for (let i = 0; i < questions.length; i++) {
        const input = document.getElementById(`answer${i + 1}`);
        const value = input ? input.value.trim() : "";
        userAnswers.push(value);
    }

    if (userAnswers.some((a) => a === "")) {
        alert("Por favor responde todas las preguntas antes de enviar.");
        return;
    }

    const results = validateAnswers(userAnswers);
    showResults(results);
    saveResultToBackend(results); // 👈 ahora sí se guarda con el formato correcto
}

function resetForm() {
    const form = document.getElementById("exerciseForm");
    if (form) form.reset();

    document.querySelectorAll(".answer-input").forEach((inp) => {
        inp.classList.remove("correct", "incorrect");
    });
}

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
    if (cancelBtn)
        cancelBtn.addEventListener("click", () => {
            window.location.href = "dashboard.html";
        });

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
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
