/**
 * Header Logo — Animación de frontend
 *
 * Secuencia:
 * 1. Logo chico visible al cargar.
 * 2. A los 3 s el segundo path (barra) comienza a titilar.
 * 3. La barra desaparece al instante, 1 s después el punto desaparece igual.
 * 4. Una vez borrados, el SVG chico desaparece y aparece el SVG completo.
 */
document.addEventListener('DOMContentLoaded', () => {
    const logos = document.querySelectorAll('.js-header-logo');
    if (!logos.length) return;

    logos.forEach((logo) => {
        const smallContainer = logo.querySelector('.js-header-logo-small');
        const fullContainer  = logo.querySelector('.js-header-logo-full');
        const dot             = logo.querySelector('.js-header-logo-dot');
        const bar             = logo.querySelector('.js-header-logo-bar');

        if (!smallContainer || !fullContainer || !dot || !bar) return;

        /* Fase 1: a los 3 s → la barra comienza a titilar */
        const blinkTimer = setTimeout(() => {
            bar.classList.add('header-logo--blink');
        }, 1000);

        /* Fase 2: detener titileo y borrar la barra al instante */
        const eraseTimer = setTimeout(() => {
            bar.classList.remove('header-logo--blink');
            bar.classList.add('header-logo--erase');

            /* Tras 1 s, borrar el punto al instante */
            setTimeout(() => {
                dot.classList.add('header-logo--erase');

                /* Tras breve pausa, ocultar logo chico y mostrar el completo */
                setTimeout(() => {
                    smallContainer.classList.add('header-logo__small--hidden');
                    fullContainer.classList.add('header-logo__full--visible');
                    fullContainer.classList.add('header-logo__full--animate-in');
                }, 1000);
            }, 500);
        }, 4000);

        /* Limpieza: si el usuario navega antes de que termine (SPA / view transitions) */
        logo.addEventListener('onlines:cleanup', () => {
            clearTimeout(blinkTimer);
            clearTimeout(eraseTimer);
        }, { once: true });
    });
});
