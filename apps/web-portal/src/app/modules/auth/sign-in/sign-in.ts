import { Component, DestroyRef, inject, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, NgForm, ReactiveFormsModule, UntypedFormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from 'app/core/auth';

@Component({
    selector: 'app-sign-in',
    imports: [RouterLink, FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatCheckboxModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
    templateUrl: './sign-in.html',
    styleUrl: './sign-in.scss',
})
export class SignIn {

    private _authService = inject(AuthService);
    private _formBuilder = inject(FormBuilder);
    private _activatedRoute = inject(ActivatedRoute);
    private _router = inject(Router);
    private _destroyRef = inject(DestroyRef);

    @ViewChild('signInNgForm') signInNgForm!: NgForm;

    alert: { type: string; message: string } = {
        type: 'success',
        message: '',
    };
    signInForm!: UntypedFormGroup;
    showAlert: boolean = false;

    /**
  * On init
  */
    ngOnInit(): void {
        this.signInForm = this._formBuilder.group({
            email: ['niravkothiya2@gmail.com', [Validators.required, Validators.email]],
            password: ['nirav@123', Validators.required],
            rememberMe: [''],
        });
    }

    /**
  * Sign in
  */
    signIn(): void {
        // Return if the form is invalid
        if (this.signInForm.invalid) {
            return;
        }

        // Disable the form
        this.signInForm.disable();

        // Hide the alert
        this.showAlert = false;

        const { email, password } = this.signInForm.value;
        this._authService.signIn({ email, password }).pipe(takeUntilDestroyed(this._destroyRef)).subscribe({
            next: () => {
                const redirectURL = this._activatedRoute.snapshot.queryParamMap.get('redirectURL') ?? '/signed-in-redirect';
                this._router.navigateByUrl(redirectURL);
            },
            error: () => {
                this.signInForm.enable();
                this.signInNgForm.resetForm();
                this.alert = { type: 'error', message: 'Wrong email or password' };
                this.showAlert = true;
            },
        });
    }

}
