// Initialize Lucide Icons
lucide.createIcons();

// Set current year in footer
document.getElementById('year').textContent = new Date().getFullYear();

// Intersection Observer for scroll fade-in animations
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target); // Stop observing once it's visible
        }
    });
}, observerOptions);

document.querySelectorAll('.fade-in-up').forEach((el) => {
    observer.observe(el);
});
