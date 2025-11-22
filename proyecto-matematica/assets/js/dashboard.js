// Datos de ejemplo para métricas (según Salazar, Ovalle y Duque, 2016)
const studentMetrics = {
    participation: 90,      // Nivel de participación
    activityCompletion: 85, // Grado de cumplimiento
    timeDedication: 65,     // Tiempo de dedicación
    resourceInteraction: 75, // Interacción con recursos
    taskAccuracy: 82        // Precisión en resolución
};

// Historial de prácticas
const practiceHistory = [
    { date: '2024-01-15', module: 'Cuadráticas', exercises: 5, correct: 4, time: '12 min' },
    { date: '2024-01-14', module: 'Trigonométricas', exercises: 5, correct: 3, time: '15 min' },
    { date: '2024-01-12', module: 'Cuadráticas', exercises: 5, correct: 5, time: '10 min' },
    { date: '2024-01-10', module: 'Trigonométricas', exercises: 5, correct: 2, time: '18 min' }
];

// Variables globales
let performanceChart = null;

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
    const welcomeUserElement = document.getElementById('welcomeUser');
    
    if (currentUserElement) {
        currentUserElement.textContent = user.name;
    }
    
    if (welcomeUserElement) {
        welcomeUserElement.textContent = user.name;
    }
}

// Función para configurar la navegación del sidebar
function setupNavigation() {
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remover clase active de todos los items
            document.querySelectorAll('.sidebar-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Agregar clase active al item actual
            this.parentElement.classList.add('active');
            
            // Mostrar sección correspondiente
            const target = this.getAttribute('href').substring(1);
            showSection(target);
        });
    });
}

// Función para mostrar sección específica
function showSection(section) {
    // Ocultar todas las secciones
    const sections = ['modulesSection', 'progressSection', 'historySection'];
    sections.forEach(sectionId => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.style.display = 'none';
        }
    });
    
    // Mostrar sección seleccionada
    switch(section) {
        case 'modules':
            const modulesSection = document.getElementById('modulesSection');
            if (modulesSection) modulesSection.style.display = 'block';
            break;
        case 'progress':
            const progressSection = document.getElementById('progressSection');
            if (progressSection) {
                progressSection.style.display = 'block';
                initializeCharts(); // Re-inicializar gráficos si es necesario
            }
            break;
        case 'history':
            const historySection = document.getElementById('historySection');
            if (historySection) {
                historySection.style.display = 'block';
                loadHistory();
            }
            break;
        default:
            const defaultSection = document.getElementById('modulesSection');
            if (defaultSection) defaultSection.style.display = 'block';
    }
}

// Función para inicializar gráficos
function initializeCharts() {
    const ctx = document.getElementById('performanceChart');
    if (!ctx) return;
    
    // Destruir gráfico anterior si existe
    if (performanceChart) {
        performanceChart.destroy();
    }
    
    // Crear nuevo gráfico
    performanceChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: [
                'Participación', 
                'Cumplimiento', 
                'Dedicación', 
                'Interacción', 
                'Precisión'
            ],
            datasets: [{
                label: 'Desempeño del Estudiante',
                data: [
                    studentMetrics.participation,
                    studentMetrics.activityCompletion,
                    studentMetrics.timeDedication,
                    studentMetrics.resourceInteraction,
                    studentMetrics.taskAccuracy
                ],
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(54, 162, 235, 1)'
            }]
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
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.raw}%`;
                        }
                    }
                }
            }
        }
    });
}

// Función para cargar historial en la tabla
function loadHistory() {
    const historyTable = document.getElementById('historyTable');
    if (!historyTable) return;
    
    historyTable.innerHTML = practiceHistory.map(session => `
        <tr>
            <td>${session.date}</td>
            <td>${session.module}</td>
            <td>${session.exercises}</td>
            <td>${session.correct}/${session.exercises} (${Math.round((session.correct/session.exercises)*100)}%)</td>
            <td>${session.time}</td>
        </tr>
    `).join('');
}

// Función para manejar el inicio de módulos
function setupModuleButtons() {
    const moduleButtons = document.querySelectorAll('.start-module-btn');
    
    moduleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const moduleType = this.getAttribute('data-module');
            startModule(moduleType);
        });
    });
}

// Función para iniciar módulo
function startModule(moduleType) {
    // Redirigir a la página de ejercicio con el módulo como parámetro
    window.location.href = `ejercicio.html?module=${moduleType}`;
}

// Función para configurar el cierre de sesión
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                localStorage.removeItem('currentUser');
                window.location.href = 'index.html';
            }
        });
    }
}

// Función principal de inicialización del dashboard
function initializeDashboard() {
    const user = checkAuthentication();
    if (!user) return;
    
    loadUserInfo(user);
    setupNavigation();
    setupModuleButtons();
    initializeCharts();
    loadHistory();
    setupLogout();
    
    // Mostrar sección por defecto
    showSection('modules');
}

// Inicializar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', initializeDashboard);