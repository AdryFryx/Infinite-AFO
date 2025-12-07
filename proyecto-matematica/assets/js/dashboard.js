// =============================================
// CONFIGURACIÓN DEL BACKEND
// =============================================
const API_URL = "http://localhost:5000";

let performanceChart = null;

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
    const currentUserElement = document.getElementById("currentUser");
    const welcomeUserElement = document.getElementById("welcomeUser");

    const nombre =
        user.nombre_usuario ||
        user.name ||
        user.username ||
        user.correo ||
        "Estudiante";

    if (currentUserElement) currentUserElement.textContent = nombre;
    if (welcomeUserElement) welcomeUserElement.textContent = nombre;
}

// -------------------- Llamadas al backend --------------------
async function fetchUserResults(userId) {
    try {
        const res = await fetch(`${API_URL}/api/user-results/${userId}`);
        if (!res.ok) throw new Error("Error al consultar resultados");
        const data = await res.json();
        if (!Array.isArray(data)) return [];
        console.log("Resultados del usuario:", data);
        return data;
    } catch (err) {
        console.error("Error cargando resultados:", err);
        return [];
    }
}

// -------------------- Cálculo de métricas globales --------------------
function computeGlobalMetrics(results) {
    if (!results || results.length === 0) {
        return {
            participation: 0,
            activityCompletion: 0,
            timeDedication: 0,
            resourceInteraction: 0,
            taskAccuracy: 0,
        };
    }

    const n = results.length;
    const avgScore =
        results.reduce((sum, r) => sum + (r.puntaje || 0), 0) / n;

    const participation = Math.min(100, n * 15);      // +15 por práctica
    const timeDedication = Math.min(100, n * 10);     // +10 por práctica
    const resourceInteraction = Math.min(100, 40 + n * 5); // base 40
    const activityCompletion = avgScore;
    const taskAccuracy = avgScore;

    return {
        participation: Math.round(participation),
        activityCompletion: Math.round(activityCompletion),
        timeDedication: Math.round(timeDedication),
        resourceInteraction: Math.round(resourceInteraction),
        taskAccuracy: Math.round(taskAccuracy),
    };
}

// -------------------- Métricas por módulo --------------------
function computeModuleMetrics(results) {
    const modules = {
        quadratic: {
            label: "Funciones Cuadráticas",
            count: 0,
            sumScore: 0,
            avgScore: 0,
        },
        trigonometric: {
            label: "Funciones Trigonométricas",
            count: 0,
            sumScore: 0,
            avgScore: 0,
        },
    };

    results.forEach((r) => {
        const nombre = (r.nombre_nivel || "").toLowerCase();
        const puntaje = r.puntaje || 0;

        let key = null;
        if (nombre.includes("cuadr")) key = "quadratic";
        else if (nombre.includes("trigono")) key = "trigonometric";

        if (!key) return;

        modules[key].count += 1;
        modules[key].sumScore += puntaje;
    });

    Object.values(modules).forEach((m) => {
        m.avgScore = m.count > 0 ? Math.round(m.sumScore / m.count) : 0;
    });

    return modules;
}

// -------------------- Actualizar tarjetas globales --------------------
function updateGlobalCards(metrics) {
    // Lateral: rendimiento general
    const generalBar = document.getElementById("generalProgressBar");
    const generalText = document.getElementById("generalText");

    if (generalBar) {
        generalBar.style.width = `${metrics.taskAccuracy}%`;
    }
    if (generalText) {
        generalText.textContent = `Tasa de acierto: ${metrics.taskAccuracy}%`;
    }

    // Detalle: precisión
    const precisionBar = document.getElementById("precisionProgress");
    const precisionText = document.getElementById("precisionText");
    if (precisionBar) precisionBar.style.width = `${metrics.taskAccuracy}%`;
    if (precisionText)
        precisionText.textContent = `${metrics.taskAccuracy}% de respuestas correctas`;

    // Detalle: tiempo de dedicación
    const timeBar = document.getElementById("timeProgress");
    const timeText = document.getElementById("timeText");
    if (timeBar) timeBar.style.width = `${metrics.timeDedication}%`;
    if (timeText)
        timeText.textContent = `Índice relativo de dedicación: ${metrics.timeDedication}%`;

    // Detalle: participación
    const partBar = document.getElementById("participationProgress");
    const partText = document.getElementById("participationText");
    if (partBar) partBar.style.width = `${metrics.participation}%`;
    if (partText)
        partText.textContent = `Participación estimada: ${metrics.participation}%`;

    // Detalle: interacción
    const interBar = document.getElementById("interactionProgress");
    const interText = document.getElementById("interactionText");
    if (interBar) interBar.style.width = `${metrics.resourceInteraction}%`;
    if (interText)
        interText.textContent = `Interacción con recursos: ${metrics.resourceInteraction}%`;
}

// -------------------- Actualizar tarjetas de módulos --------------------
function updateModuleCards(moduleMetrics) {
    const cards = document.querySelectorAll(".module-card");

    cards.forEach((card) => {
        const btn = card.querySelector(".start-module-btn");
        if (!btn) return;

        const moduleKey = btn.getAttribute("data-module");
        const data = moduleMetrics[moduleKey];
        if (!data) return;

        const bar = card.querySelector(".module-progress .progress-bar");
        const text = card.querySelector(".module-progress small");

        if (bar) {
            bar.style.width = `${data.avgScore}%`;
        }

        if (text) {
            if (data.count === 0) {
                text.textContent =
                    "Aún no registras prácticas en este módulo";
            } else {
                text.textContent = `${data.avgScore}% de acierto promedio en ${data.count} práctica(s)`;
            }
        }
    });
}

// -------------------- Gráfico de desempeño --------------------
function initializeCharts(metrics) {
    const ctx = document.getElementById("performanceChart");
    if (!ctx) return;

    if (performanceChart) {
        performanceChart.destroy();
    }

    performanceChart = new Chart(ctx, {
        type: "radar",
        data: {
            labels: [
                "Participación",
                "Cumplimiento",
                "Dedicación",
                "Interacción",
                "Precisión",
            ],
            datasets: [
                {
                    label: "Desempeño del Estudiante",
                    data: [
                        metrics.participation,
                        metrics.activityCompletion,
                        metrics.timeDedication,
                        metrics.resourceInteraction,
                        metrics.taskAccuracy,
                    ],
                    backgroundColor: "rgba(54, 162, 235, 0.2)",
                    borderColor: "rgba(54, 162, 235, 1)",
                    borderWidth: 2,
                    pointBackgroundColor: "rgba(54, 162, 235, 1)",
                },
            ],
        },
        options: {
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        stepSize: 20,
                    },
                },
            },
            plugins: {
                legend: {
                    display: true,
                    position: "top",
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `${context.label}: ${context.raw}%`;
                        },
                    },
                },
            },
        },
    });
}

// -------------------- Historial de prácticas --------------------
function loadHistory(results) {
    const historyTable = document.getElementById("historyTable");
    if (!historyTable) return;

    if (!results || results.length === 0) {
        historyTable.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted">
                    Aún no hay prácticas registradas. ¡Resuelve tu primer ejercicio! 💪
                </td>
            </tr>
        `;
        return;
    }

    const rows = results.map((r) => {
        const fecha = r.fecha
            ? new Date(r.fecha).toLocaleDateString("es-CL", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
              })
            : "-";

        const modulo = r.nombre_nivel || r.titulo_ejercicio || "Módulo";
        const totalPreg = r.total_preguntas || 0;
        const puntaje = r.puntaje || 0;
        const correctas = totalPreg
            ? Math.round((puntaje / 100) * totalPreg)
            : 0;

        return `
            <tr>
                <td>${fecha}</td>
                <td>${modulo}</td>
                <td>${totalPreg}</td>
                <td>${correctas}/${totalPreg} (${puntaje}%)</td>
                <td>-</td>
            </tr>
        `;
    });

    historyTable.innerHTML = rows.join("");
}

// -------------------- Sidebar navegación --------------------
function setupNavigation() {
    const sidebarLinks = document.querySelectorAll(".sidebar-link");

    sidebarLinks.forEach((link) => {
        link.addEventListener("click", function (e) {
            e.preventDefault();

            document
                .querySelectorAll(".sidebar-item")
                .forEach((item) => item.classList.remove("active"));

            this.parentElement.classList.add("active");

            const target = this.getAttribute("href").substring(1);
            showSection(target);
        });
    });
}

function showSection(section) {
    const sections = ["modulesSection", "progressSection", "historySection"];

    sections.forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
    });

    if (section === "progress") {
        const el = document.getElementById("progressSection");
        if (el) el.style.display = "block";
    } else if (section === "history") {
        const el = document.getElementById("historySection");
        if (el) el.style.display = "block";
    } else {
        const el = document.getElementById("modulesSection");
        if (el) el.style.display = "block";
    }
}

// -------------------- Botones de módulos --------------------
function setupModuleButtons() {
    const moduleButtons = document.querySelectorAll(".start-module-btn");

    moduleButtons.forEach((btn) => {
        btn.addEventListener("click", function () {
            const moduleType = this.getAttribute("data-module");
            startModule(moduleType);
        });
    });
}

function startModule(moduleType) {
    window.location.href = `ejercicio.html?module=${moduleType}`;
}

// -------------------- Logout --------------------
function setupLogout() {
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
}

// -------------------- Inicialización principal --------------------
async function initializeDashboard() {
    const user = checkAuthentication();
    if (!user) return;

    loadUserInfo(user);
    setupNavigation();
    setupModuleButtons();
    setupLogout();

    const results = await fetchUserResults(user.id);

    const globalMetrics = computeGlobalMetrics(results);
    const moduleMetrics = computeModuleMetrics(results);

    updateGlobalCards(globalMetrics);
    updateModuleCards(moduleMetrics);
    initializeCharts(globalMetrics);
    loadHistory(results);

    showSection("modules");
}

// -------------------- DOM READY --------------------
document.addEventListener("DOMContentLoaded", initializeDashboard);
