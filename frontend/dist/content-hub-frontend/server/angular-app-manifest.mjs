
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
    'index.csr.html': {size: 8803, hash: 'abc5c3344166e070f9336f628a4908896c3e4f89938488684c6650f9eb1355cd', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 949, hash: 'f6bf1b99e9fd9529f9c6717304cb3a4a8ad0ea831ed9af36bfc3016e8c5774fb', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'content/quote/index.html': {size: 42662, hash: '265c696985a79ed109bcc611f42de2e938da2f198ef351dc9f1c2bd27aae4404', text: () => import('./assets-chunks/content_quote_index_html.mjs').then(m => m.default)},
    'content/idea/index.html': {size: 45204, hash: 'bbb09ac97f1b64d732dfe4b87091dad83daa9371c8f0a195695fe50ef072a026', text: () => import('./assets-chunks/content_idea_index_html.mjs').then(m => m.default)},
    'submit/index.html': {size: 46719, hash: '832f92506b675793a3c880e3aa7eef9dc94aab4fe7fc88ce0c2273e08497450a', text: () => import('./assets-chunks/submit_index_html.mjs').then(m => m.default)},
    'content/joke/index.html': {size: 40203, hash: '91d2f610a2972ad006dedeb31017994049ec0afc021f5ce1420dda1db887d1b3', text: () => import('./assets-chunks/content_joke_index_html.mjs').then(m => m.default)},
    'content/fact/index.html': {size: 43766, hash: 'b59ab2d4108dd7b598e00eec05e2dd5312d0d755adc0856894eeb7ca03bac270', text: () => import('./assets-chunks/content_fact_index_html.mjs').then(m => m.default)},
    'styles-ZWKTBVKY.css': {size: 39399, hash: 'VpkMrgFP9C8', text: () => import('./assets-chunks/styles-ZWKTBVKY_css.mjs').then(m => m.default)}
  },
};
