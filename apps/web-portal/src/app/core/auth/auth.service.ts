import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, Observable, of, switchMap, throwError } from 'rxjs';
import { User, UserService } from '../user/user.service';
import { AuthUtils } from './auth.utils';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private _httpClient = inject(HttpClient);
    private _userService = inject(UserService);
    private _baseUrl = 'http://localhost:4000';

    private readonly _authenticated = signal(false);

    /** Readonly signal - use in templates: authService.authenticated() */
    readonly authenticated = this._authenticated.asReadonly();

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    set accessToken(token: string) {
        localStorage.setItem('accessToken', token);
    }

    get accessToken(): string {
        return localStorage.getItem('accessToken') ?? '';
    }

    set tenantId(tenantId: string) {
        localStorage.setItem('tenantId', tenantId);
    }

    get tenantId(): string {
        return localStorage.getItem('tenantId') ?? '';
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    forgotPassword(email: string): Observable<unknown> {
        return this._httpClient.post(`${this._baseUrl}/auth/forgot-password`, { email });
    }

    resetPassword(password: string, token: string): Observable<unknown> {
        return this._httpClient.post(`${this._baseUrl}/auth/reset-password`, { password, token });
    }

    signIn(credentials: { email: string; password: string }): Observable<unknown> {
        if (this._authenticated()) {
            return throwError(() => 'User is already logged in.');
        }

        return this._httpClient.post<any>(`${this._baseUrl}/auth/login`, credentials).pipe(
            switchMap((response) => {
                const token = response.data?.token;
                const tenantId = response.data?.tenantId;
                if (!token) return throwError(() => 'Invalid response from server');

                this.accessToken = token;
                if (tenantId) {
                    this.tenantId = tenantId;
                }

                this._authenticated.set(true);
                // Profile will be fetched separately or user data can be extracted from JWT
                return of(response);
            })
        );
    }

    signOut(): Observable<boolean> {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('tenantId');
        this._authenticated.set(false);
        return of(true);
    }

    signUp(user: any): Observable<unknown> {
        return this._httpClient.post(`${this._baseUrl}/auth/signup`, user);
    }

    check(): Observable<boolean> {
        if (this._authenticated()) {
            return of(true);
        }

        if (!this.accessToken || !this.tenantId) {
            return of(false);
        }

        this._authenticated.set(true);
        return of(true);
    }
}
