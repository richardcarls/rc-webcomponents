/**
 * Lit's hydration support for server-rendered elements. Import it once, before
 * any element definition, on a page whose HTML came from Lit's server
 * renderer. Elements then adopt their declarative shadow roots instead of
 * rendering new ones.
 */
import '@lit-labs/ssr-client/lit-element-hydrate-support.js';
