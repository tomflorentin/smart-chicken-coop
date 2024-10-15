export const getAuthentication = (): string => {
    const fromStorage = localStorage.getItem('password');
    if (fromStorage) return fromStorage;
    const password = prompt('Entrez le mot de passe pour accéder à l\'application');
    if (password) {
        localStorage.setItem('password', password);
    } else {
        alert('Mot de passe requis pour accéder à l\'application');
        return getAuthentication();
    }
    return password;
}
