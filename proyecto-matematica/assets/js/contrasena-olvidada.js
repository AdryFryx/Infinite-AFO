// Usuarios de ejemplo
const users = [
    { username: 'marco', password: '1234', name: 'Marco Gonzalez', email: 'marco@infiniteafo.com' },
    { username: 'rodrigo', password: '1234', name: 'Rodrigo Terraza', email: 'rodrigo@infiniteafo.com' },
    { username: 'gabriel', password: '1234', name: 'Gabriel Villa', email: 'gabriel@infiniteafo.com' },
    { username: 'matias', password: '1234', name: 'Matias Flores', email: 'matias@infiniteafo.com' }
];

function handleForgotPassword(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    
    if (!email) {
        showMessage('Por favor ingresa tu correo electrónico', 'error');
        return;
    }
    
    const userExists = users.find(user => user.email === email);
    
    if (userExists) {
        showMessage(`Se ha enviado un enlace de recuperación a: ${email}`, 'success');
        
        document.getElementById('forgotPasswordForm').reset();
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);
    } else {
        showMessage('No encontramos una cuenta asociada a este correo electrónico', 'error');
    }
}

function showMessage(message, type) {
    const existingMessage = document.querySelector('.auth-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `alert alert-${type === 'success' ? 'success' : 'danger'} auth-message mt-3`;
    messageDiv.textContent = message;
    
    const form = document.getElementById('forgotPasswordForm');
    form.appendChild(messageDiv);
    
    if (type === 'success') {
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }
}

function initializeForgotPassword() {
    const form = document.getElementById('forgotPasswordForm');
    if (form) {
        form.addEventListener('submit', handleForgotPassword);
    }
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        window.location.href = 'dashboard.html';
    }
}

document.addEventListener('DOMContentLoaded', initializeForgotPassword);
