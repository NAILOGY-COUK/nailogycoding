/*
 * <nl-carousel>: one-slide-at-a-time carousel for the NAILOGY hero.
 * Slides are [data-nl-slide] children; controls are [data-nl-prev], [data-nl-next], [data-nl-dot].
 * Optional data-autoplay (ms) pauses on hover/focus and respects prefers-reduced-motion.
 */
if (!customElements.get('nl-carousel')) {
  customElements.define(
    'nl-carousel',
    class NlCarousel extends HTMLElement {
      connectedCallback() {
        this.slides = Array.from(this.querySelectorAll('[data-nl-slide]'));
        this.dots = Array.from(this.querySelectorAll('[data-nl-dot]'));
        this.index = Math.max(0, this.slides.findIndex((slide) => !slide.hidden));
        if (this.slides.length < 2) return;

        this.querySelector('[data-nl-prev]')?.addEventListener('click', () => this.go(this.index - 1, true));
        this.querySelector('[data-nl-next]')?.addEventListener('click', () => this.go(this.index + 1, true));
        this.dots.forEach((dot) => dot.addEventListener('click', () => this.go(Number(dot.dataset.nlDot), true)));

        this.addEventListener('keydown', (event) => {
          if (!event.target.closest('button')) return;
          if (event.key === 'ArrowLeft') this.go(this.index - 1, true);
          if (event.key === 'ArrowRight') this.go(this.index + 1, true);
        });

        this.addEventListener('touchstart', (event) => (this.touchX = event.touches[0].clientX), { passive: true });
        this.addEventListener(
          'touchend',
          (event) => {
            if (this.touchX == null) return;
            const delta = event.changedTouches[0].clientX - this.touchX;
            if (Math.abs(delta) > 50) this.go(this.index + (delta < 0 ? 1 : -1), true);
            this.touchX = null;
          },
          { passive: true }
        );

        this.setupAutoplay();

        if (window.Shopify && Shopify.designMode) {
          document.addEventListener('shopify:block:select', (event) => {
            const i = this.slides.findIndex((slide) => slide.contains(event.target) || slide === event.target);
            if (i > -1) {
              this.go(i);
              this.stop();
            }
          });
        }
      }

      disconnectedCallback() {
        this.stop();
      }

      go(target, fromUser = false) {
        const count = this.slides.length;
        const next = (target + count) % count;
        if (next === this.index) return;
        this.slides[this.index].hidden = true;
        this.slides[next].hidden = false;
        this.slides[next].classList.remove('nl-fade');
        void this.slides[next].offsetWidth;
        this.slides[next].classList.add('nl-fade');
        this.dots.forEach((dot, i) => dot.setAttribute('aria-current', i === next ? 'true' : 'false'));
        this.index = next;
        if (fromUser) this.stop();
      }

      setupAutoplay() {
        const delay = Number(this.dataset.autoplay);
        if (!delay || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        this.delay = delay;
        this.paused = false;
        const pause = () => (this.paused = true);
        const resume = () => (this.paused = false);
        this.addEventListener('mouseenter', pause);
        this.addEventListener('mouseleave', resume);
        this.addEventListener('focusin', pause);
        this.addEventListener('focusout', resume);
        this.timer = setInterval(() => {
          if (!this.paused && !document.hidden) this.go(this.index + 1);
        }, delay);
      }

      stop() {
        clearInterval(this.timer);
        this.timer = null;
      }
    }
  );
}
