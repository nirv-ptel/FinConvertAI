import { Routes } from '@angular/router';

import { AuthGuard, NoAuthGuard } from './core/auth';
import { Layout } from './modules/layout/layout';

export const routes: Routes = [
    { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    { path: 'signed-in-redirect', pathMatch: 'full', redirectTo: 'dashboard' },
    // Auth routes for guests
    {
        path: '',
        canActivate: [NoAuthGuard],
        canActivateChild: [NoAuthGuard],
        children: [
            { path: 'sign-in', loadComponent: () => import('./modules/auth/sign-in/sign-in').then(m => m.SignIn) },
            { path: 'sign-up', loadComponent: () => import('./modules/auth/sign-up/sign-up').then(m => m.SignUp) },
        ]
    },
    // Authenticated routes
    {
        path: '',
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard],
        component: Layout,
        children: [
            { path: 'dashboard', loadChildren: () => import('./modules/pages/dashboard/dashboard.routes') },
            { path: 'upload', loadChildren: () => import('./modules/pages/upload/upload.routes') },
            { path: 'conversions', loadChildren: () => import('./modules/pages/conversions/conversions.routes') },
            { path: 'preview/:id', loadChildren: () => import('./modules/pages/preview/preview.routes') },
            { path: 'welcome', loadChildren: () => import('./modules/pages/welcome/welcome.routes') },
        ]
    }
];
