/**
 * Home Quote Block — View Script (Animaciones de frontend)
 *
 * 1. Patrón de puntos con máscara que sigue el cursor (MagicUI DotPattern):
 *    lo resuelve el componente compartido blocks/patron-puntos/.
 * 2. Texto se revela palabra por palabra mientras el bloque queda pineado.
 */
(function () {
    'use strict';

    var BLOCK_SELECTOR = '.home-quote-block';
    var STICKY_SELECTOR = '.js-quote-sticky';
    var DOTS_SELECTOR = '.js-quote-dots';
    var WORD_SELECTOR = '.js-quote-word';
    var REVEALED_CLASS = 'is-revealed';
    var ANIMATING_CLASS = 'is-animating';

    /* Logs de diagnóstico en consola. Poner en false para silenciarlos. */
    var DEBUG = false;

    /* Distribución del pintado a lo largo del recorrido pineado. Los rangos cubren
       el recorrido completo (0 → 1): el pintado arranca apenas el bloque se pinea y
       termina justo cuando se despega, sin tramos muertos en ninguno de los extremos.
       La distancia del recorrido se define en el CSS con --quote-scroll-distance. */
    var GROUP_RANGES = {
        titulo: { start: 0, end: 0.7333 },
        subtitulo: { start: 0.7333, end: 1 }
    };

    /* ---- Utilidades ---- */
    function log() {
        if (!DEBUG || !window.console || !window.console.log) return;
        var args = Array.prototype.slice.call(arguments);
        args.unshift('[home-quote-block]');
        window.console.log.apply(window.console, args);
    }

    function throttle(fn, ms) {
        var last = 0;
        return function () {
            var now = Date.now();
            if (now - last >= ms) {
                last = now;
                fn.apply(this, arguments);
            }
        };
    }

    /* ---- Revelado de texto mientras el bloque está pineado ---- */
    /* El progreso es función pura de la posición de scroll: no hay estado que
       mantener, así que bajar y subir se comportan igual y de forma reversible. */
    function initTextReveal(block) {
        var groups = {};
        var groupOrder = ['titulo', 'subtitulo'];

        groupOrder.forEach(function (name) {
            var el = block.querySelector('[data-quote-group="' + name + '"]');
            if (el) {
                groups[name] = el.querySelectorAll('.' + WORD_SELECTOR.replace('.', ''));
            }
        });

        /* Si no hay palabras, salir */
        var totalWords = 0;
        groupOrder.forEach(function (name) {
            if (groups[name]) totalWords += groups[name].length;
        });
        if (totalWords === 0) return;

        block.classList.add(ANIMATING_CLASS);

        var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        /* Redondeo hacia arriba: cualquier progreso mayor a cero ya pinta la primera
           palabra, y la última se pinta recién al cerrar el rango del grupo. Así los
           extremos se comportan igual bajando que subiendo. */
        function paintWords(words, localProgress) {
            var revealCount = Math.ceil(localProgress * words.length);
            for (var i = 0; i < words.length; i++) {
                if (i < revealCount) {
                    words[i].classList.add(REVEALED_CLASS);
                } else {
                    words[i].classList.remove(REVEALED_CLASS);
                }
            }
        }

        function paintAll() {
            groupOrder.forEach(function (name) {
                if (groups[name]) paintWords(groups[name], 1);
            });
        }

        log('Init', {
            palabrasTitulo: groups.titulo ? groups.titulo.length : 0,
            palabrasSubtitulo: groups.subtitulo ? groups.subtitulo.length : 0,
            reducedMotion: reducedMotion
        });

        /* Sin animación: todo pintado y sin listeners */
        if (reducedMotion) {
            paintAll();
            return;
        }

        var ultimoTramo = null;
        var sticky = block.querySelector(STICKY_SELECTOR);
        var recorrido = 0;
        var arranque = 0;

        /* El recorrido pineado es --quote-scroll-distance, y arranca recién después
           de la separación superior del bloque (su padding-top, que offsetTop refleja
           porque el sticky es hijo directo del <section> posicionado). */
        function medir() {
            var estilos = window.getComputedStyle(block);
            recorrido = parseFloat(estilos.getPropertyValue('--quote-scroll-distance')) || 0;
            arranque = sticky ? sticky.offsetTop : 0;
        }

        medir();

        function updateWords() {
            if (recorrido <= 0) {
                paintAll();
                return;
            }

            var rect = block.getBoundingClientRect();
            var progress = Math.max(0, Math.min(1, (-rect.top - arranque) / recorrido));

            groupOrder.forEach(function (name) {
                var range = GROUP_RANGES[name];
                var words = groups[name];
                if (!range || !words || !words.length) return;

                /* Progreso local dentro del rango del grupo */
                var localProgress;
                if (progress <= range.start) {
                    localProgress = 0;
                } else if (progress >= range.end) {
                    localProgress = 1;
                } else {
                    localProgress = (progress - range.start) / (range.end - range.start);
                }

                paintWords(words, localProgress);
            });

            /* Log solo al cambiar de tramo, para no inundar la consola */
            var tramo = progress <= 0 ? 'inicio' : (progress >= 1 ? 'fin' : 'pineado');
            if (tramo !== ultimoTramo) {
                ultimoTramo = tramo;
                log('Tramo', tramo, Math.round(progress * 100) + '%', 'recorrido', Math.round(recorrido) + 'px');
            }
        }

        var scrollHandler = throttle(updateWords, 16);
        var resizeHandler = throttle(function () {
            medir();
            updateWords();
        }, 16);
        var scrollBound = false;

        if ('IntersectionObserver' in window) {
            var observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        if (!scrollBound) {
                            window.addEventListener('scroll', scrollHandler, { passive: true });
                            window.addEventListener('resize', resizeHandler);
                            scrollBound = true;
                            updateWords();
                        }
                    } else {
                        if (scrollBound) {
                            window.removeEventListener('scroll', scrollHandler);
                            window.removeEventListener('resize', resizeHandler);
                            scrollBound = false;
                        }
                    }
                });
            }, { threshold: 0 });
            observer.observe(block);
        } else {
            window.addEventListener('scroll', scrollHandler, { passive: true });
            window.addEventListener('resize', resizeHandler);
            scrollBound = true;
            updateWords();
        }
    }

    /* ---- Init ---- */
    function initQuoteBlock() {
        var block = document.querySelector(BLOCK_SELECTOR);
        if (!block) return;

        /* Los puntos viven dentro del contenedor pineado; el texto se calcula
           sobre el bloque completo, que incluye el recorrido del scroll.

           El componente escucha el mouse sobre el padre del contenedor, que es
           el sticky: el mismo elemento sobre el que se medía el cursor antes. */
        var dots = block.querySelector(DOTS_SELECTOR);
        if (dots) {
            window.onlinesPatronPuntos.init({ contenedor: dots });
        }

        initTextReveal(block);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initQuoteBlock);
    } else {
        initQuoteBlock();
    }
})();
