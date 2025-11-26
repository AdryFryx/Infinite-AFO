// =============================================
// CONFIGURACIÓN BACKEND
// =============================================
const API_URL = "http://localhost:5000"; // cambia si usas otro puerto


// Función para manejar el registro
async function handleRegistration(event) {
    event.preventDefault();
    
    // Obtener valores del formulario
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const terms = document.getElementById('terms').checked;
    
    // Validaciones front
    if (!firstName || !lastName || !email || !username || !password || !confirmPassword) {
        showMessage('Por favor completa todos los campos', 'error');
        return;
    }
    
    if (!terms) {
        showMessage('Debes aceptar los términos y condiciones', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage('Las contraseñas no coinciden', 'error');
        return;
    }

    // Armar el payload que espera el backend
    const payload = {
        nombre_usuario: username,
        correo: email,
        contraseña: password
    };

    try {
        const response = await fetch(`${API_URL}/api/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.error || "No se pudo registrar el usuario", 'error');
            return;
        }

        // Éxito
        showMessage('¡Cuenta creada exitosamente! Redirigiendo al login...', 'success');

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);

    } catch (err) {
        console.error("Error en registro:", err);
        showMessage('Error de conexión con el servidor', 'error');
    }
}


// Función para verificar fortaleza de contraseña
function checkPasswordStrength(password) {
    const strengthIndicator = document.getElementById('passwordStrength');
    if (!strengthIndicator) return;
    
    let strength = 0;
    let feedback = '';
    
    if (password.length >= 6) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/\d/)) strength++;
    if (password.match(/[^a-zA-Z\d]/)) strength++;
    
    switch(strength) {
        case 0:
        case 1:
            feedback = '<span class="strength-weak">Débil</span>';
            break;
        case 2:
            feedback = '<span class="strength-medium">Media</span>';
            break;
        case 3:
        case 4:
            feedback = '<span class="strength-strong">Fuerte</span>';
            break;
    }
    
    strengthIndicator.innerHTML = `Seguridad: ${feedback}`;
}


// Función para verificar coincidencia de contraseñas
function checkPasswordMatch() {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const matchIndicator = document.getElementById('passwordMatch');
    
    if (!matchIndicator) return;
    
    if (confirmPassword === '') {
        matchIndicator.textContent = '';
    } else if (password === confirmPassword) {
        matchIndicator.innerHTML = '<span style="color: #198754;">✓ Las contraseñas coinciden</span>';
    } else {
        matchIndicator.innerHTML = '<span style="color: #dc3545;">✗ Las contraseñas no coinciden</span>';
    }
}


// Función para mostrar mensajes
function showMessage(message, type) {
    const existingMessage = document.querySelector('.auth-message');
    if (existingMessage) existingMessage.remove();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `alert alert-${type === 'success' ? 'success' : 'danger'} auth-message mt-3`;
    messageDiv.textContent = message;
    
    const form = document.getElementById('registerForm');
    form.appendChild(messageDiv);
    
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}


// Función para inicializar la página
function initializeRegister() {
    const form = document.getElementById('registerForm');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    if (form) {
        form.addEventListener('submit', handleRegistration);
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            checkPasswordStrength(this.value);
            checkPasswordMatch();
        });
    }
    
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', checkPasswordMatch);
    }
    
    // Si ya está autenticado, mandarlo al dashboard
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        window.location.href = 'dashboard.html';
    }
    
    // Crear elementos de feedback si no existen
    if (!document.getElementById('passwordStrength')) {
        const strengthDiv = document.createElement('div');
        strengthDiv.id = 'passwordStrength';
        strengthDiv.className = 'password-strength';
        passwordInput.parentNode.appendChild(strengthDiv);
    }
    
    if (!document.getElementById('passwordMatch')) {
        const matchDiv = document.createElement('div');
        matchDiv.id = 'passwordMatch';
        matchDiv.className = 'password-strength';
        confirmPasswordInput.parentNode.appendChild(matchDiv);
    }
}

// Inicializar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', initializeRegister);
