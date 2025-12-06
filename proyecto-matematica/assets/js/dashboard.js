// =============================================
// CONFIGURACIÓN DEL BACKEND
// =============================================
const API_URL = "http://localhost:5000";

let performanceChart = null;

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
    const currentUserElement = document.getElementById("currentUser");
    const welcomeUserElement = document.getElementById("welcomeUser");

    const nombre =
        user.nombre_usuario ||
        user.name ||
        user.username ||
        user.email ||
        "Estudiante";

    if (currentUserElement) currentUserElement.textContent = nombre;
    if (welcomeUserElement) welcomeUserElement.textContent = nombre;
}

// -------------------- BACKEND: RESULTADOS --------------------
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

// -------------------- CÁLCULO DE MÉTRICAS --------------------
function computeMetrics(results) {
    if (!results || results.length === 0) {
        return {
            participation: 0,
            activityCompletion: 0,
            timeDedication: 0,
            resourceInteraction: 0,
            taskAccuracy: 0
        };
    }

    const n = results.length;
    const avgScore =
        results.reduce((sum, r) => sum + (r.puntaje || 0), 0) / n;

    const participation = Math.min(100, n * 15);
    const timeDedication = Math.min(100, n * 10);
    const resourceInteraction = Math.min(100, 40 + n * 5);
    const activityCompletion = avgScore;
    const taskAccuracy = avgScore;

    return {
        participation: Math.round(participation),
        activityCompletion: Math.round(activityCompletion),
        timeDedication: Math.round(timeDedication),
        resourceInteraction: Math.round(resourceInteraction),
        taskAccuracy: Math.round(taskAccuracy)
    };
}

// -------------------- GRÁFICO RADAR --------------------
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
                "Precisión"
            ],
            datasets: [
                {
                    label: "Desempeño del Estudiante",
                    data: [
                        metrics.participation,
                        metrics.activityCompletion,
                        metrics.timeDedication,
                        metrics.resourceInteraction,
                        metrics.taskAccuracy
                    ],
                    backgroundColor: "rgba(54, 162, 235, 0.2)",
                    borderColor: "rgba(54, 162, 235, 1)",
                    borderWidth: 2,
                    pointBackgroundColor: "rgba(54, 162, 235, 1)"
                }
            ]
        },
        options: {
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        stepSize: 20
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: "top"
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `${context.label}: ${context.raw}%`;
                        }
                    }
                }
            }
        }
    });
}

// -------------------- HISTORIAL --------------------
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

    const rows = results.map(r => {
        const fecha = r.fecha
            ? new Date(r.fecha).toLocaleDateString("es-CL", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit"
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
                <td>${correctas}/${totalPreg}</td>
                <td>${puntaje}%</td>
            </tr>
        `;
    });

    historyTable.innerHTML = rows.join("");
}

// -------------------- NAVEGACIÓN SIDEBAR --------------------
function setupNavigation() {
    const sidebarLinks = document.querySelectorAll(".sidebar-link");

    sidebarLinks.forEach(link => {
        link.addEventListener("click", function (e) {
            e.preventDefault();

            document
                .querySelectorAll(".sidebar-item")
                .forEach(item => item.classList.remove("active"));

            this.parentElement.classList.add("active");

            const target = this.getAttribute("href").substring(1);
            showSection(target);
        });
    });
}

function showSection(section) {
    const sections = ["modulesSection", "progressSection", "historySection"];

    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
    });

    switch (section) {
        case "modules": {
            const el = document.getElementById("modulesSection");
            if (el) el.style.display = "block";
            break;
        }
        case "progress": {
            const el = document.getElementById("progressSection");
            if (el) el.style.display = "block";
            break;
        }
        case "history": {
            const el = document.getElementById("historySection");
            if (el) el.style.display = "block";
            break;
        }
        default: {
            const el = document.getElementById("modulesSection");
            if (el) el.style.display = "block";
        }
    }
}

// -------------------- MÓDULOS --------------------
function setupModuleButtons() {
    const moduleButtons = document.querySelectorAll(".start-module-btn");

    moduleButtons.forEach(btn => {
        btn.addEventListener("click", function () {
            const moduleType = this.getAttribute("data-module");
            startModule(moduleType);
        });
    });
}

function startModule(moduleType) {
    window.location.href = `ejercicio.html?module=${moduleType}`;
}

// -------------------- LOGOUT --------------------
function setupLogout() {
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
}

// -------------------- INICIALIZACIÓN --------------------
async function initializeDashboard() {
    const user = checkAuthentication();
    if (!user) return;

    loadUserInfo(user);
    setupNavigation();
    setupModuleButtons();
    setupLogout();

    const results = await fetchUserResults(user.id);
    const metrics = computeMetrics(results);

    initializeCharts(metrics);
    loadHistory(results);
    showSection("modules");
}

document.addEventListener("DOMContentLoaded", initializeDashboard);
