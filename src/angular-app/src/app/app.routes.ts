import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home'
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.component').then((m) => m.HomeComponent)
  },
  {
    path: 'settings',
    loadComponent: () => import('./settings/settings.component').then((m) => m.SettingsComponent)
  },
  {
    path: 'kids',
    loadComponent: () => import('./kids/kids.component').then((m) => m.KidsComponent)
  },
  {
    path: 'exam-editor',
    loadComponent: () => import('./exam-editor.component').then((m) => m.ExamEditorComponent)
  },
  {
    path: 'exam-preview',
    loadComponent: () => import('./exam-preview.component').then((m) => m.ExamPreviewComponent)
  },
  {
    path: 'exam-execute',
    loadComponent: () => import('./exam-execute.component').then((m) => m.ExamExecuteComponent)
  },
  {
    path: 'exam-results',
    loadComponent: () => import('./exam-results.component').then((m) => m.ExamResultsComponent)
  },
  {
    path: 'exam-analyse',
    loadComponent: () => import('./exam-analyse.component').then((m) => m.ExamAnalyseComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.component').then((m) => m.HomeComponent)
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
