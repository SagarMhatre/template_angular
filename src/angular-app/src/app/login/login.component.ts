import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';

import { PouchDbService } from '../pouchdb.service';

type LoginFormGroup = FormGroup<{
  password: FormControl<string>;
  file: FormControl<File | null>;
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
        <mat-card-subtitle>
          @if (hasCredentials() === null) {
            Checking credentials...
          } @else if (hasCredentials() === false) {
            Create your 4-digit PIN to continue.
          } @else {
            Upload a JSON file (optional) and enter your 4-digit PIN.
          }
        </mat-card-subtitle>
      </mat-card-header>

      <form
        class="login-form"
        [formGroup]="loginForm"
        (ngSubmit)="onSubmit()"
        novalidate
        [attr.aria-busy]="submitting()"
      >
        <div class="file-upload">
          <input
            #fileInput
            type="file"
            accept=".json,application/json"
            class="file-input"
            (change)="onFileSelected($event)"
          />
          <button
            mat-stroked-button
            color="primary"
            type="button"
            (click)="fileInput.click()"
            aria-label="Upload JSON file"
          >
            Upload JSON file
          </button>
          @if (uploadedFileName()) {
            <span class="file-name">Selected: {{ uploadedFileName() }}</span>
          }
        </div>

        <mat-form-field appearance="fill">
          <mat-label>4-digit PIN</mat-label>
          <input
            matInput
            id="password"
            type="password"
            formControlName="password"
            name="password"
            autocomplete="one-time-code"
            required
            maxlength="4"
            inputmode="numeric"
            pattern="\\d{4}"
            [attr.aria-invalid]="loginForm.controls.password.invalid && loginForm.controls.password.touched"
          />
          @if (loginForm.controls.password.invalid && loginForm.controls.password.touched) {
            <mat-error>PIN must be exactly 4 digits.</mat-error>
          }
        </mat-form-field>

        <button mat-flat-button color="primary" type="submit" [disabled]="disableSubmit()">
          @if (submitting()) {
            <span>Processing…</span>
          } @else {
            <span>{{ primaryActionLabel() }}</span>
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
  private readonly pouchDb = inject(PouchDbService);
  private readonly router = inject(Router);
  protected readonly submitting = signal(false);
  protected readonly feedback = signal('');
  protected readonly uploadedFileName = signal('');
  protected readonly hasCredentials = signal<boolean | null>(null);

  protected readonly loginForm: LoginFormGroup = new FormGroup({
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{4}$/)]
    }),
    file: new FormControl<File | null>(null)
  });

  protected readonly disableSubmit = computed(
    () => this.submitting() || this.loginForm.invalid || this.hasCredentials() === null
  );

  protected readonly primaryActionLabel = computed(() => {
    if (this.hasCredentials() === null) {
      return 'Checking...';
    }
    return this.hasCredentials() === false ? 'Sign up' : 'Sign in';
  });

  constructor() {
    void this.loadCredentialState();
  }

  private async loadCredentialState(): Promise<void> {
    try {
      const exists = await this.pouchDb.hasCredentials();
      this.hasCredentials.set(exists);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to check credentials.';
      this.feedback.set(message);
      this.hasCredentials.set(false);
    }
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0);

    if (!file) {
      this.uploadedFileName.set('');
      this.loginForm.controls.file.setValue(null);
      return;
    }

    this.loginForm.controls.file.setValue(file);
    this.uploadedFileName.set(file.name);
  }

  protected async onSubmit(): Promise<void> {
    if (this.loginForm.invalid || this.hasCredentials() === null) {
      this.loginForm.markAllAsTouched();
      this.feedback.set('Please enter a valid 4-digit PIN.');
      return;
    }

    this.submitting.set(true);
    this.feedback.set('');

    const { password } = this.loginForm.getRawValue();

    try {
      if (this.hasCredentials() === false) {
        await this.pouchDb.saveCredentials(password);
        this.hasCredentials.set(true);
        this.feedback.set('PIN created. Redirecting to home...');
      } else {
        const valid = await this.pouchDb.validatePin(password);
        if (!valid) {
          this.loginForm.controls.password.markAsTouched();
          this.feedback.set('Incorrect PIN. Try again.');
          return;
        }
        this.feedback.set(
          this.uploadedFileName()
            ? `Signed in with file "${this.uploadedFileName()}".`
            : 'Signed in.'
        );
      }

      void this.router.navigate(['/home']);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to process request.';
      this.feedback.set(message);
    } finally {
      this.submitting.set(false);
    }
  }
}
