function toggleDropdown() {
    document.getElementById('moreDropdown').classList.toggle('open');
}
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('moreDropdown');
    if (dropdown && !dropdown.contains(e.target)) {
        dropdown.classList.remove('open');
    }
});
function toggleMobileMenu() {
    document.getElementById('mobileMenu').classList.toggle('open');
}
document.querySelectorAll('.mobile-menu a').forEach(link => {
    link.addEventListener('click', () => {
        document.getElementById('mobileMenu').classList.remove('open');
    });
});
