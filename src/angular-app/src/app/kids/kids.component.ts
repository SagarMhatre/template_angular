import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { KidRecord, PouchDbService } from '../pouchdb.service';

type KidForm = FormGroup<{
  kidId: FormControl<string>;
  nickname: FormControl<string>;
  birthYear: FormControl<number>;
  birthMonth: FormControl<number>;
}>;

@Component({
  selector: 'app-kids',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="kids-grid">
      <mat-card class="kids-card">
        <mat-card-header>
          <mat-card-title>Add kid</mat-card-title>
          <mat-card-subtitle>Create a new entry</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          @if (!showAddForm()) {
            <div class="form-actions">
              <button mat-flat-button color="primary" type="button" (click)="startAdd()">
                Add kid
              </button>
            </div>
            @if (addFeedback()) {
              <p class="status" [class.error]="addHasError()">{{ addFeedback() }}</p>
            }
          } @else {
            <form class="kids-form" [formGroup]="addForm" (ngSubmit)="addKid()" novalidate>
              <mat-form-field appearance="fill">
                <mat-label>ID</mat-label>
                <input
                  matInput
                  formControlName="kidId"
                  required
                  autocomplete="off"
                  [attr.aria-invalid]="addForm.controls.kidId.invalid && addForm.controls.kidId.touched"
                />
                @if (addForm.controls.kidId.invalid && addForm.controls.kidId.touched) {
                  <mat-error>ID is required.</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="fill">
                <mat-label>Nickname</mat-label>
                <input
                  matInput
                  formControlName="nickname"
                  required
                  autocomplete="off"
                  [attr.aria-invalid]="
                    addForm.controls.nickname.invalid && addForm.controls.nickname.touched
                  "
                />
                @if (addForm.controls.nickname.invalid && addForm.controls.nickname.touched) {
                  <mat-error>Nickname is required.</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="fill">
                <mat-label>Birth year</mat-label>
                <input
                  matInput
                  type="number"
                  formControlName="birthYear"
                  required
                  min="1900"
                  max="2100"
                  inputmode="numeric"
                  [attr.aria-invalid]="
                    addForm.controls.birthYear.invalid && addForm.controls.birthYear.touched
                  "
                />
                @if (addForm.controls.birthYear.invalid && addForm.controls.birthYear.touched) {
                  <mat-error>Enter a valid year.</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="fill">
                <mat-label>Birth month</mat-label>
                <mat-select formControlName="birthMonth" required>
                  @for (month of months(); track month.value) {
                    <mat-option [value]="month.value">{{ month.label }}</mat-option>
                  }
                </mat-select>
                @if (addForm.controls.birthMonth.invalid && addForm.controls.birthMonth.touched) {
                  <mat-error>Select a month.</mat-error>
                }
              </mat-form-field>

              <div class="form-actions gap">
                <button mat-flat-button color="primary" type="submit" [disabled]="addDisabled()">
                  @if (adding()) { Adding… } @else { Add kid }
                </button>
                <button mat-stroked-button type="button" (click)="cancelAdd()" [disabled]="adding()">
                  Cancel
                </button>
              </div>
            </form>
            @if (addFeedback()) {
              <p class="status" [class.error]="addHasError()">{{ addFeedback() }}</p>
            }
          }
        </mat-card-content>
      </mat-card>

      <mat-card class="kids-card">
        <mat-card-header>
          <mat-card-title>Kids</mat-card-title>
          <mat-card-subtitle>Tap a nickname to manage</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          @if (loading()) {
            <p>Loading…</p>
          } @else if (!kids().length) {
            <p>No kids yet.</p>
          } @else {
            <table class="kids-table" aria-label="Kids list">
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Nickname</th>
                </tr>
              </thead>
              <tbody>
                @for (kid of kids(); track kid._id) {
                  <tr>
                    <td>{{ kid.kidId }}</td>
                    <td>
                      <button
                        class="link-button"
                        type="button"
                        (click)="selectKid(kid)"
                        [disabled]="saving()"
                      >
                        {{ kid.nickname }} @if (kid.disabled) { (disabled) }
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }

          @if (selectedKid()) {
            <div class="edit-panel">
              <h3>Edit kid: {{ selectedKid()?.nickname }}</h3>
              <form class="kids-form" [formGroup]="editForm" (ngSubmit)="updateKid()" novalidate>
                <mat-form-field appearance="fill">
                  <mat-label>Nickname</mat-label>
                  <input
                    matInput
                    formControlName="nickname"
                    required
                    autocomplete="off"
                    [attr.aria-invalid]="
                      editForm.controls.nickname.invalid && editForm.controls.nickname.touched
                    "
                  />
                  @if (editForm.controls.nickname.invalid && editForm.controls.nickname.touched) {
                    <mat-error>Nickname is required.</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="fill">
                  <mat-label>Birth year</mat-label>
                  <input
                    matInput
                    type="number"
                    formControlName="birthYear"
                    required
                    min="1900"
                    max="2100"
                    inputmode="numeric"
                    [attr.aria-invalid]="
                      editForm.controls.birthYear.invalid && editForm.controls.birthYear.touched
                    "
                  />
                  @if (editForm.controls.birthYear.invalid && editForm.controls.birthYear.touched) {
                    <mat-error>Enter a valid year.</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="fill">
                  <mat-label>Birth month</mat-label>
                  <mat-select formControlName="birthMonth" required>
                    @for (month of months(); track month.value) {
                      <mat-option [value]="month.value">{{ month.label }}</mat-option>
                    }
                  </mat-select>
                  @if (
                    editForm.controls.birthMonth.invalid && editForm.controls.birthMonth.touched
                  ) {
                    <mat-error>Select a month.</mat-error>
                  }
                </mat-form-field>

                <div class="form-actions gap">
                  <button mat-flat-button color="primary" type="submit" [disabled]="saveDisabled()">
                    @if (saving()) { Saving… } @else { Save changes }
                  </button>
                  <button
                    mat-stroked-button
                    type="button"
                    (click)="toggleDisableKid()"
                    [disabled]="saving()"
                  >
                    @if (selectedKid()?.disabled) { Enable } @else { Disable }
                  </button>
                  <button
                    mat-button
                    color="warn"
                    type="button"
                    (click)="deleteKid()"
                    [disabled]="saving()"
                  >
                    Delete
                  </button>
                  <button mat-button type="button" (click)="clearSelection()" [disabled]="saving()">
                    Cancel
                  </button>
                </div>
              </form>
              @if (editFeedback()) {
                <p class="status" [class.error]="editHasError()">{{ editFeedback() }}</p>
              }
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styleUrl: './kids.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KidsComponent {
  private readonly pouchDb = inject(PouchDbService);

  protected readonly kids = signal<KidRecord[]>([]);
  protected readonly loading = signal(true);
  protected readonly showAddForm = signal(false);
  protected readonly adding = signal(false);
  protected readonly saving = signal(false);
  protected readonly addFeedback = signal('');
  protected readonly addHasError = signal(false);
  protected readonly editFeedback = signal('');
  protected readonly editHasError = signal(false);
  protected readonly selectedKid = signal<KidRecord | null>(null);

  protected readonly months = signal(
    Array.from({ length: 12 }).map((_, idx) => ({
      value: idx + 1,
      label: new Date(0, idx).toLocaleString(undefined, { month: 'long' })
    }))
  );

  protected readonly addForm: KidForm = this.createAddForm();

  protected readonly editForm: FormGroup<{
    nickname: FormControl<string>;
    birthYear: FormControl<number>;
    birthMonth: FormControl<number>;
  }> = new FormGroup({
    nickname: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    birthYear: new FormControl<number>(new Date().getFullYear(), {
      nonNullable: true,
      validators: [Validators.required]
    }),
    birthMonth: new FormControl<number>(new Date().getMonth() + 1, {
      nonNullable: true,
      validators: [Validators.required]
    })
  });

  protected readonly addDisabled = computed(() => this.adding() || this.addForm.invalid);

  protected readonly saveDisabled = computed(
    () => this.saving() || this.editForm.invalid || !this.selectedKid()
  );

  constructor() {
    void this.loadKids();
    this.resetAddForm();
  }

  protected clearSelection(): void {
    this.selectedKid.set(null);
    this.editForm.reset();
    this.editFeedback.set('');
    this.editHasError.set(false);
  }

  protected async loadKids(): Promise<void> {
    this.loading.set(true);
    try {
      const list = await this.pouchDb.listKids();
      this.kids.set(list);
    } catch (err) {
      this.addFeedback.set(err instanceof Error ? err.message : 'Unable to load kids.');
      this.addHasError.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  private resetAddForm(): void {
    const now = new Date();
    this.addForm.reset({
      kidId: '',
      nickname: '',
      birthYear: now.getFullYear(),
      birthMonth: now.getMonth() + 1
    });
  }

  private createAddForm(): KidForm {
    const now = new Date();
    return new FormGroup({
      kidId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      nickname: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      birthYear: new FormControl<number>(now.getFullYear(), {
        nonNullable: true,
        validators: [Validators.required]
      }),
      birthMonth: new FormControl<number>(now.getMonth() + 1, {
        nonNullable: true,
        validators: [Validators.required]
      })
    });
  }

  protected startAdd(): void {
    this.resetAddForm();
    this.showAddForm.set(true);
    this.addFeedback.set('');
    this.addHasError.set(false);
  }

  protected cancelAdd(): void {
    this.showAddForm.set(false);
    this.resetAddForm();
    this.addFeedback.set('');
    this.addHasError.set(false);
  }

  protected async addKid(): Promise<void> {
    if (this.addForm.invalid) {
      this.addForm.markAllAsTouched();
      this.addFeedback.set('Please complete all fields.');
      this.addHasError.set(true);
      return;
    }

    this.adding.set(true);
    this.addFeedback.set('');
    this.addHasError.set(false);

    const { kidId, nickname, birthYear, birthMonth } = this.addForm.getRawValue();

    try {
      await this.pouchDb.addKid(kidId.trim(), nickname.trim(), Number(birthYear), Number(birthMonth));
      this.addFeedback.set('Kid added.');
      this.resetAddForm();
      this.showAddForm.set(false);
      await this.loadKids();
    } catch (err) {
      this.addFeedback.set(err instanceof Error ? err.message : 'Unable to add kid.');
      this.addHasError.set(true);
    } finally {
      this.adding.set(false);
    }
  }

  protected selectKid(kid: KidRecord): void {
    this.selectedKid.set(kid);
    this.editForm.patchValue({
      nickname: kid.nickname,
      birthYear: kid.birthYear,
      birthMonth: kid.birthMonth
    });
    this.editFeedback.set('');
    this.editHasError.set(false);
  }

  protected async updateKid(): Promise<void> {
    const kid = this.selectedKid();
    if (!kid) {
      return;
    }

    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      this.editFeedback.set('Please complete all fields.');
      this.editHasError.set(true);
      return;
    }

    this.saving.set(true);
    this.editFeedback.set('');
    this.editHasError.set(false);

    const { nickname, birthYear, birthMonth } = this.editForm.getRawValue();

    try {
      await this.pouchDb.updateKid(kid.kidId, {
        nickname: nickname.trim(),
        birthYear: Number(birthYear),
        birthMonth: Number(birthMonth)
      });
      this.editFeedback.set('Kid updated.');
      await this.loadKids();
      const updated = this.kids().find((k) => k.kidId === kid.kidId) ?? null;
      this.selectedKid.set(updated);
    } catch (err) {
      this.editFeedback.set(err instanceof Error ? err.message : 'Unable to update kid.');
      this.editHasError.set(true);
    } finally {
      this.saving.set(false);
    }
  }

  protected async toggleDisableKid(): Promise<void> {
    const kid = this.selectedKid();
    if (!kid) {
      return;
    }
    this.saving.set(true);
    this.editFeedback.set('');
    this.editHasError.set(false);
    try {
      await this.pouchDb.updateKid(kid.kidId, { disabled: !kid.disabled });
      await this.loadKids();
      const updated = this.kids().find((k) => k.kidId === kid.kidId) ?? null;
      this.selectedKid.set(updated);
      this.editFeedback.set(updated?.disabled ? 'Kid disabled.' : 'Kid enabled.');
    } catch (err) {
      this.editFeedback.set(err instanceof Error ? err.message : 'Unable to update kid.');
      this.editHasError.set(true);
    } finally {
      this.saving.set(false);
    }
  }

  protected async deleteKid(): Promise<void> {
    const kid = this.selectedKid();
    if (!kid) {
      return;
    }
    this.saving.set(true);
    this.editFeedback.set('');
    this.editHasError.set(false);
    try {
      await this.pouchDb.deleteKid(kid.kidId);
      this.editFeedback.set('Kid deleted.');
      this.clearSelection();
      await this.loadKids();
    } catch (err) {
      this.editFeedback.set(err instanceof Error ? err.message : 'Unable to delete kid.');
      this.editHasError.set(true);
    } finally {
      this.saving.set(false);
    }
  }
}
