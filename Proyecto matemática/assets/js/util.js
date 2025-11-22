// Utilidades generales para la aplicación

// Función para formatear fechas
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
}

// Función para calcular porcentaje
function calculatePercentage(part, total) {
    return total > 0 ? Math.round((part / total) * 100) : 0;
}

// Función para generar ID único
function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

// Función para validar email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Función para mostrar notificaciones
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = `
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
    `;
    
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

// Función para guardar datos en localStorage
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error guardando en localStorage:', error);
        return false;
    }
}

// Función para cargar datos de localStorage
function loadFromLocalStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error cargando de localStorage:', error);
        return null;
    }
}

// Función para limpiar datos específicos de localStorage
function clearStorageData(keys) {
    if (Array.isArray(keys)) {
        keys.forEach(key => localStorage.removeItem(key));
    } else {
        localStorage.removeItem(keys);
    }
}

// Exportar funciones para uso global
window.AppUtils = {
    formatDate,
    calculatePercentage,
    generateId,
    isValidEmail,
    showNotification,
    saveToLocalStorage,
    loadFromLocalStorage,
    clearStorageData
};