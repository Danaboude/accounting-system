import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/invoices/invoices.component').then((m) => m.InvoicesComponent),
  },
  { path: '**', redirectTo: '' },
];
