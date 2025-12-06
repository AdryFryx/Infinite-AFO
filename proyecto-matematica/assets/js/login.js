// =============================================
// CONFIGURACIÓN DEL BACKEND
// =============================================
const API_URL = "http://localhost:5000";

// -------------------- LOGIN --------------------
async function validateLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
        showMessage('Por favor ingresa usuario/correo y contraseña', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.error || 'Usuario o contraseña incorrectos', 'error');
            return;
        }

        const user = data.user;

        const userSession = {
            id: user.id,
            username: user.nombre_usuario,
            name: user.nombre_usuario,
            email: user.correo,
            nivel: user.nivel
        };

        localStorage.setItem('currentUser', JSON.stringify(userSession));

        showMessage(`¡Bienvenido ${userSession.name}!`, 'success');

        setTimeout(() => {
            window.location.href = './dashboard.html';
        }, 1000);

    } catch (err) {
        console.error("Error en login:", err);
        showMessage('Error al conectar con el servidor', 'error');
    }
}

// -------------------- MENSAJES --------------------
function showMessage(message, type) {
    const existing = document.querySelector('.login-message');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.className = `alert alert-${type === 'success' ? 'success' : 'danger'} login-message mt-3`;
    div.textContent = message;

    const form = document.getElementById('loginForm');
    form.appendChild(div);

    if (type === 'success') {
        setTimeout(() => {
            if (div.parentNode) div.remove();
        }, 4000);
    }
}

// -------------------- NAVEGACIÓN EXTRA --------------------
function handleForgotPassword(e) {
    // enlace principal ya existe en el <a>, esto es opcional
    // si quieres controlar aquí:
    // e.preventDefault();
    // window.location.href = './contrasena-olvidada.html';
}

function handleRegister(e) {
    // idem, el <a> ya tiene href
}

// -------------------- SESIÓN EXISTENTE --------------------
function checkExistingSession() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser && window.location.pathname.includes('index.html')) {
        window.location.href = './dashboard.html';
    }
}

// -------------------- INICIALIZACIÓN --------------------
function initializeApp() {
    const loginForm = document.getElementById('loginForm');
    const forgotPasswordBtn = document.getElementById('forgotPassword');
    const registerBtn = document.getElementById('register');

    if (loginForm) {
        loginForm.addEventListener('submit', validateLogin);
    }

    if (forgotPasswordBtn) {
        forgotPasswordBtn.addEventListener('click', handleForgotPassword);
    }

    if (registerBtn) {
        registerBtn.addEventListener('click', handleRegister);
    }

    checkExistingSession();
}

document.addEventListener('DOMContentLoaded', initializeApp);
