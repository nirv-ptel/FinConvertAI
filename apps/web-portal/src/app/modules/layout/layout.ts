import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth';
import { UserService } from '../../core/user/user.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class Layout {
  private _auth = inject(AuthService);
  private _user = inject(UserService);
  private _router = inject(Router);

  sidebarCollapsed = signal(false);

  get userName(): string {
    return this._user.user?.name || 'User';
  }

  get userEmail(): string {
    return this._user.user?.email || '';
  }

  toggleSidebar() {
    this.sidebarCollapsed.update((v) => !v);
  }

  signOut() {
    this._auth.signOut().subscribe(() => {
      this._router.navigate(['/sign-in']);
    });
  }
}
