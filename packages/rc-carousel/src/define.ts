import { RCCarousel, RCCarouselItem } from './index.js';

customElements.get('rc-carousel-item') || customElements.define('rc-carousel-item', RCCarouselItem);
customElements.get('rc-carousel') || customElements.define('rc-carousel', RCCarousel);

export * from './index.js';
