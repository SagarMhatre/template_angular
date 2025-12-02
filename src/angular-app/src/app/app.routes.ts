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
