
import { Routes } from '@angular/router';
import { ContentFormComponent } from './components/content-form/content-form';
import { ContentListComponent } from './components/content-list/content-list';

export const routes: Routes = [
  { path: '', redirectTo: '/content/joke', pathMatch: 'full' },
  { path: 'content/:type', component: ContentListComponent },
  { path: 'submit', component: ContentFormComponent },
  { path: '**', redirectTo: '/content/joke' }
];