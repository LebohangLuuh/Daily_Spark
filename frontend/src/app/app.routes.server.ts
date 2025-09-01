import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'content/:type',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => [
      { type: 'joke' },
      { type: 'fact' },
      { type: 'idea' },
      { type: 'quote' }
    ]
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
