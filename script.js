document.addEventListener('DOMContentLoaded', () => {
    const rainContainer = document.querySelector('.rain-container');
    const numRaindrops = 150;

    for (let i = 0; i < numRaindrops; i++) {
        const raindrop = document.createElement('div');
        raindrop.classList.add('raindrop');
        raindrop.style.left = `${Math.random() * 100}vw`;
        raindrop.style.animationDuration = `${Math.random() * 2 + 1}s`;
        raindrop.style.animationDelay = `${Math.random() * 2}s`;
        rainContainer.appendChild(raindrop);
    }
});
