// Simulación de base de datos de usuarios (debe coincidir con login.js)
const users = [
    { username: 'marco', password: '1234', name: 'Marco Gonzalez', email: 'marco@infiniteafo.com' },
    { username: 'rodrigo', password: '1234', name: 'Rodrigo Terraza', email: 'rodrigo@infiniteafo.com' },
    { username: 'gabriel', password: '1234', name: 'Gabriel Villa', email: 'gabriel@infiniteafo.com' },
    { username: 'matias', password: '1234', name: 'Matias Flores', email: 'matias@infiniteafo.com' }
];

// Función para manejar el envío del formulario de recuperación
function handleForgotPassword(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    
    if (!email) {
        showMessage('Por favor ingresa tu correo electrónico', 'error');
        return;
    }
    
    // Simular verificación de email
    const userExists = users.find(user => user.email === email);
    
    if (userExists) {
        // Simular envío de email
        showMessage(`Se ha enviado un enlace de recuperación a: ${email}`, 'success');
        
        // Limpiar formulario
        document.getElementById('forgotPasswordForm').reset();
        
        // Redirigir después de 3 segundos
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);
    } else {
        showMessage('No encontramos una cuenta asociada a este correo electrónico', 'error');
    }
}

// Función para mostrar mensajes
function showMessage(message, type) {
    // Remover mensajes anteriores
    const existingMessage = document.querySelector('.auth-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Crear elemento de mensaje
    const messageDiv = document.createElement('div');
    messageDiv.className = `alert alert-${type === 'success' ? 'success' : 'danger'} auth-message mt-3`;
    messageDiv.textContent = message;
    
    // Insertar después del formulario
    const form = document.getElementById('forgotPasswordForm');
    form.appendChild(messageDiv);
    
    // Auto-remover después de 5 segundos (solo para éxito)
    if (type === 'success') {
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }
}

// Función para inicializar la página
function initializeForgotPassword() {
    const form = document.getElementById('forgotPasswordForm');
    if (form) {
        form.addEventListener('submit', handleForgotPassword);
    }
    
    // Verificar si ya está autenticado
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        window.location.href = 'dashboard.html';
    }
}

// Inicializar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', initializeForgotPassword);