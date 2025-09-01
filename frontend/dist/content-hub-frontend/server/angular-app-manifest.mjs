
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "redirectTo": "/content/joke",
    "route": "/"
  },
  {
    "renderMode": 2,
    "route": "/content/joke"
  },
  {
    "renderMode": 2,
    "route": "/content/fact"
  },
  {
    "renderMode": 2,
    "route": "/content/idea"
  },
  {
    "renderMode": 2,
    "route": "/content/quote"
  },
  {
    "renderMode": 0,
    "route": "/content/*"
  },
  {
    "renderMode": 2,
    "route": "/submit"
  },
  {
    "renderMode": 2,
    "redirectTo": "/content/joke",
    "route": "/**"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 8785, hash: '4094537dfdd6584b0f01170ba8f27a2550e96bc2204850e5392c3573d01acd0e', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 949, hash: '462eb5b99c6be3fcedb8405dbb251b61300f03f85631091352f126b44390ee06', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'content/quote/index.html': {size: 42263, hash: '38ed8c573058bda97169892de21994796e7d75d395055bba9f67c906afd03187', text: () => import('./assets-chunks/content_quote_index_html.mjs').then(m => m.default)},
    'content/idea/index.html': {size: 41505, hash: 'b6cb70e7e5359e95f2621f9dc49168f4e1767fc3496e26ef8ede679a2346573a', text: () => import('./assets-chunks/content_idea_index_html.mjs').then(m => m.default)},
    'submit/index.html': {size: 46701, hash: '98703fae72417a6a8525abdd389a187949537d72ebc9076d80ffbaade7e7f718', text: () => import('./assets-chunks/submit_index_html.mjs').then(m => m.default)},
    'content/joke/index.html': {size: 40834, hash: '9a2c6979213b7eb867ba77bd82b718790311d505379ddf0b4f5a97e2d364443d', text: () => import('./assets-chunks/content_joke_index_html.mjs').then(m => m.default)},
    'content/fact/index.html': {size: 38535, hash: 'd1f0917d85152bf15bcd55fd1c0217b529d9a16608db8d86e58df0888f06b277', text: () => import('./assets-chunks/content_fact_index_html.mjs').then(m => m.default)},
    'styles-BBAXAUAP.css': {size: 39345, hash: 'bU2J28vw21k', text: () => import('./assets-chunks/styles-BBAXAUAP_css.mjs').then(m => m.default)}
  },
};
