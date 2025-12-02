import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

type LoginFormGroup = FormGroup<{
  username: FormControl<string>;
  password: FormControl<string>;
}>;

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  template: `
    <mat-card class="login-card" aria-labelledby="login-title">
      <mat-card-header>
        <mat-card-title id="login-title">Sign in</mat-card-title>
        <mat-card-subtitle>Enter your credentials to continue.</mat-card-subtitle>
      </mat-card-header>

      <form
        class="login-form"
        [formGroup]="loginForm"
        (ngSubmit)="onSubmit()"
        novalidate
        [attr.aria-busy]="submitting()"
      >
        <mat-form-field appearance="fill">
          <mat-label>Username</mat-label>
          <input
            matInput
            id="username"
            type="text"
            formControlName="username"
            name="username"
            autocomplete="username"
            required
            [attr.aria-invalid]="loginForm.controls.username.invalid && loginForm.controls.username.touched"
          />
          @if (loginForm.controls.username.invalid && loginForm.controls.username.touched) {
            <mat-error>Username is required (min 3 characters).</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>Password</mat-label>
          <input
            matInput
            id="password"
            type="password"
            formControlName="password"
            name="password"
            autocomplete="current-password"
            required
            minlength="8"
            [attr.aria-invalid]="loginForm.controls.password.invalid && loginForm.controls.password.touched"
          />
          @if (loginForm.controls.password.invalid && loginForm.controls.password.touched) {
            <mat-error>Password is required (min 8 characters).</mat-error>
          }
        </mat-form-field>

        <button mat-flat-button color="primary" type="submit" [disabled]="disableSubmit()">
          @if (submitting()) {
            <span>Signing in…</span>
          } @else {
            <span>Sign in</span>
          }
        </button>
      </form>

      @if (feedback()) {
        <p class="status" role="status" aria-live="polite">{{ feedback() }}</p>
      }
    </mat-card>
  `,
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);

  protected readonly submitting = signal(false);
  protected readonly feedback = signal('');

  protected readonly loginForm: LoginFormGroup = this.formBuilder.group({
    username: this.formBuilder.control('', [Validators.required, Validators.minLength(3)]),
    password: this.formBuilder.control('', [Validators.required, Validators.minLength(8)])
  });

  protected readonly disableSubmit = computed(
    () => this.submitting() || this.loginForm.invalid
  );

  protected onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.feedback.set('Please provide both a username and password.');
      return;
    }

    this.submitting.set(true);
    this.feedback.set('');

    queueMicrotask(() => {
      const { username } = this.loginForm.getRawValue();
      this.submitting.set(false);
      this.feedback.set(`Signed in as ${username}.`);
    });
  }
}
