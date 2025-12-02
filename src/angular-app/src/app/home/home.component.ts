import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

import { PouchDbService, SavedRecord } from '../pouchdb.service';

@Component({
  selector: 'app-home',
  imports: [MatCardModule, MatButtonModule],
  template: `
    <mat-card class="home-card" aria-live="polite">
      <mat-card-header>
        <mat-card-title>Local entries</mat-card-title>
        <mat-card-subtitle>Stores records in PouchDB</mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <p>Press the button to add a document to the local database.</p>

        @if (lastSaved()) {
          <p class="status">
            Added entry <strong>{{ lastSaved()?._id }}</strong> with counter
            <strong>{{ lastSaved()?.counter }}</strong>.
          </p>
        }

        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
      </mat-card-content>

      <mat-card-actions align="end">
        <button mat-flat-button color="primary" (click)="addEntry()" [disabled]="saving()">
          @if (saving()) { Adding... } @else { Add entry }
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styleUrl: './home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
  private readonly pouchDb = inject(PouchDbService);

  protected readonly saving = signal(false);
  protected readonly lastSaved = signal<SavedRecord | null>(null);
  protected readonly error = signal('');

  protected async addEntry(): Promise<void> {
    this.saving.set(true);
    this.error.set('');

    try {
      const saved = await this.pouchDb.addTestCounterEntry();
      this.lastSaved.set(saved);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to save entry.';
      this.error.set(message);
    } finally {
      this.saving.set(false);
    }
  }
}
