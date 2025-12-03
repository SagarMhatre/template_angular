import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { PouchDbService } from '../pouchdb.service';

type LlmSettingsForm = FormGroup<{
  llmUrl: FormControl<string>;
  apiKey: FormControl<string>;
}>;

@Component({
  selector: 'app-settings',
  imports: [MatCardModule, MatButtonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule],
  template: `
    <mat-card class="settings-card" aria-live="polite">
      <mat-card-header>
        <mat-card-title>Settings</mat-card-title>
        <mat-card-subtitle>Export all local data</mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <p>Download a JSON export of the entire local PouchDB database.</p>
        @if (feedback()) {
          <p class="status" [class.error]="hasError()">{{ feedback() }}</p>
        }
      </mat-card-content>

      <mat-card-actions align="end">
        <button mat-stroked-button color="primary" (click)="exportDb()" [disabled]="exporting()">
          @if (exporting()) { Exporting… } @else { Export database }
        </button>
      </mat-card-actions>
    </mat-card>

    <mat-card class="settings-card" aria-live="polite">
      <mat-card-header>
        <mat-card-title>LLM Connection</mat-card-title>
        <mat-card-subtitle>Store the API key and optional URL</mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <form class="settings-form" [formGroup]="llmForm" (ngSubmit)="saveLlmSettings()" novalidate>
          <mat-form-field appearance="fill">
            <mat-label>LLM URL (optional)</mat-label>
            <input
              matInput
              type="url"
              formControlName="llmUrl"
              autocomplete="url"
            />
          </mat-form-field>

          <mat-form-field appearance="fill">
            <mat-label>API Key</mat-label>
            <input
              matInput
              type="text"
              formControlName="apiKey"
              required
              autocomplete="off"
              [attr.aria-invalid]="llmForm.controls.apiKey.invalid && llmForm.controls.apiKey.touched"
            />
            @if (llmForm.controls.apiKey.invalid && llmForm.controls.apiKey.touched) {
              <mat-error>API key is required.</mat-error>
            }
          </mat-form-field>

          <div class="form-actions">
            <button mat-flat-button color="primary" type="submit" [disabled]="saveDisabled()">
              @if (savingSettings()) { Saving… } @else { Save LLM settings }
            </button>
          </div>
        </form>

        @if (llmFeedback()) {
          <p class="status" [class.error]="llmHasError()">{{ llmFeedback() }}</p>
        }
      </mat-card-content>
    </mat-card>
  `,
  styleUrl: './settings.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent {
  private readonly pouchDb = inject(PouchDbService);

  protected readonly exporting = signal(false);
  protected readonly feedback = signal('');
  protected readonly hasError = signal(false);
  protected readonly savingSettings = signal(false);
  protected readonly llmFeedback = signal('');
  protected readonly llmHasError = signal(false);
  protected readonly loadingSettings = signal(true);

  protected readonly llmForm: LlmSettingsForm = new FormGroup({
    llmUrl: new FormControl('', {
      nonNullable: true
    }),
    apiKey: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    })
  });

  protected readonly saveDisabled = computed(
    () => this.savingSettings() || this.loadingSettings() || this.llmForm.invalid
  );

  constructor() {
    void this.loadLlmSettings();
  }

  private async loadLlmSettings(): Promise<void> {
    this.loadingSettings.set(true);
    try {
      const existing = await this.pouchDb.getLlmSettings();
      if (existing) {
        this.llmForm.patchValue({
          llmUrl: existing.llmUrl,
          apiKey: existing.apiKey
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load LLM settings.';
      this.llmFeedback.set(message);
      this.llmHasError.set(true);
    } finally {
      this.loadingSettings.set(false);
    }
  }

  protected async saveLlmSettings(): Promise<void> {
    if (this.llmForm.invalid) {
      this.llmForm.markAllAsTouched();
      this.llmFeedback.set('Please provide a valid API key.');
      this.llmHasError.set(true);
      return;
    }

    this.savingSettings.set(true);
    this.llmFeedback.set('');
    this.llmHasError.set(false);

    const { llmUrl, apiKey } = this.llmForm.getRawValue();

    try {
      await this.pouchDb.saveLlmSettings(llmUrl, apiKey);
      this.llmFeedback.set('LLM settings saved.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save LLM settings.';
      this.llmFeedback.set(message);
      this.llmHasError.set(true);
    } finally {
      this.savingSettings.set(false);
    }
  }

  protected async exportDb(): Promise<void> {
    this.exporting.set(true);
    this.feedback.set('');
    this.hasError.set(false);

    try {
      const data = await this.pouchDb.exportAll();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'pouchdb-export.json';
      link.click();

      URL.revokeObjectURL(url);
      this.feedback.set('Export complete. Downloaded pouchdb-export.json.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export failed.';
      this.feedback.set(message);
      this.hasError.set(true);
    } finally {
      this.exporting.set(false);
    }
  }
}
