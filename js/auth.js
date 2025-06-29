// Módulo de autenticación
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

function handleLogin(e) {
    e.preventDefault();

    const Usuario = document.getElementById('dni').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    if (Usuario === 'secretaria.trabajo' && password === 'centrodeacopio2025') {
        if (errorMessage) errorMessage.style.display = 'none';
        window.location.href = 'pages-secretaria/dashboard-secretaria.html';
    } else {
        if (errorMessage) errorMessage.style.display = 'block';
    }
}