document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('error');

    errorElement.textContent = '';

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            const error = await response.json();
            errorElement.textContent = error.message || 'Ugyldigt brugernavn eller adgangskode';
            return;
        }

        const data = await response.json();

        sessionStorage.setItem('userId', data.userId);
        sessionStorage.setItem('userName', data.name);
        sessionStorage.setItem('userRole', data.role);

        if (data.role === 'TEAMLEAD') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'taskboard.html';
        }

    } catch (err) {
        errorElement.textContent = 'Der opstod en fejl. Prøv igen.';
        console.error('Login error:', err);
    }
});