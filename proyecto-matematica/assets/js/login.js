// =============================================
// CONFIGURACIÓN DEL BACKEND
// =============================================
const API_URL = "http://localhost:5000"; // ajusta si tu Flask está en otro puerto


// Función para validar el login contra el backend
async function validateLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim(); // puede ser usuario o correo
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
                username: username,  // el back lo recibe como "identifier"
                password: password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.error || 'Usuario o contraseña incorrectos', 'error');
            return;
        }

        // Login exitoso
        const user = data.user;

        // Guardar usuario en localStorage para usarlo en el dashboard/ejercicios
        const userSession = {
            id: user.id,
            username: user.nombre_usuario,
            name: user.nombre_usuario,   // para compatibilidad con otros JS que usan .name
            email: user.correo,
            nivel: user.nivel,
            role: 'Estudiante'
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


// Función para mostrar mensajes
function showMessage(message, type) {
    const existingMessage = document.querySelector('.login-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `alert alert-${type === 'success' ? 'success' : 'danger'} login-message mt-3`;
    messageDiv.textContent = message;
    
    const form = document.getElementById('loginForm');
    form.appendChild(messageDiv);
    
    if (type === 'success') {
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }
}


// Función para recuperar contraseña
function handleForgotPassword(e) {
    e.preventDefault();
    window.location.href = './contraseña-olvidada.html';
}


// Función para manejar el registro
function handleRegister(e) {
    e.preventDefault();
    window.location.href = './registrarse.html';
}


// Función para verificar si ya hay un usuario logueado
function checkExistingSession() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser && window.location.pathname.includes('index.html')) {
        window.location.href = './dashboard.html';
    }
}


// Función para mostrar/ocultar contraseña
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('togglePassword');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.className = 'fas fa-eye-slash';
    } else {
        passwordInput.type = 'password';
        toggleIcon.className = 'fas fa-eye';
    }
}


// Función para agregar el icono de mostrar/ocultar contraseña
function addPasswordToggle() {
    const passwordField = document.getElementById('password');
    if (!passwordField) return;
    
    const passwordContainer = document.createElement('div');
    passwordContainer.className = 'password-container position-relative';
    
    passwordField.parentNode.insertBefore(passwordContainer, passwordField);
    passwordContainer.appendChild(passwordField);
    
    const toggleIcon = document.createElement('span');
    toggleIcon.id = 'togglePassword';
    toggleIcon.className = 'fas fa-eye password-toggle';
    toggleIcon.style.cssText = `
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        cursor: pointer;
        color: #666;
        z-index: 10;
    `;
    toggleIcon.addEventListener('click', togglePasswordVisibility);
    
    passwordContainer.appendChild(toggleIcon);
    
    passwordField.style.paddingRight = '40px';
}


// Función para inicializar la aplicación
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
    
    addPasswordToggle();
    checkExistingSession();
}


// Inicializar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', initializeApp);
