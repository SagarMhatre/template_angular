import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';

import { ExamStateService, QuestionSet } from './exam-state.service';
import { shuffleOptions } from './utils/shuffle-options';

@Component({
  selector: 'app-exam-preview',
  imports: [MatCardModule, MatButtonModule],
  template: `
    <section class="preview">
      <h2>Exam Preview</h2>
      @if (!previewQuestionSets.length) {
        <p>No exam data found. Please add content in the editor.</p>
      } @else {
        <div class="actions">
          <button mat-flat-button color="primary" type="button" (click)="goExecute()">
            Execute exam
          </button>
        </div>
        @for (set of previewQuestionSets; track set.id) {
          <mat-card class="set-card">
            <mat-card-header>
              <mat-card-title>{{ set.name }}</mat-card-title>
              <mat-card-subtitle>
                ID: {{ set.id }} | Max score: {{ set.max_score ?? 'N/A' }}
              </mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              @if (!set.sections?.length) {
                <p>No sections.</p>
              } @else {
                @for (section of set.sections; track section.id) {
                  <div class="section">
                    <h3>Section {{ section.id }}: {{ section.text }}</h3>
                    @if (!section.questions?.length) {
                      <p>No questions.</p>
                    } @else {
                      <ol>
                        @for (q of section.questions; track q.id) {
                          <li>
                            <div class="question">
                              <strong>{{ q.id }}</strong> - {{ q.question }}
                            </div>
                            @if (q.options?.length) {
                              <ul class="options">
                                @for (opt of q.options; track opt.text) {
                                  <li [class.positive]="opt.score > 0" [class.negative]="opt.score < 0">
                                    {{ opt.text }} <span class="score">({{ opt.score }})</span>
                                  </li>
                                }
                              </ul>
                            }
                          </li>
                        }
                      </ol>
                    }
                  </div>
                }
              }
            </mat-card-content>
          </mat-card>
        }
      }
    </section>
  `,
  styleUrl: './exam-preview.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExamPreviewComponent {
  private readonly examState = inject(ExamStateService);
  private readonly router = inject(Router);
  protected readonly previewQuestionSets: QuestionSet[] = this.buildPreviewQuestionSets();

  protected goExecute(): void {
    void this.router.navigate(['/exam-execute']);
  }

  private buildPreviewQuestionSets(): QuestionSet[] {
    return this.examState.getQuestionSets().map((set) => ({
      ...set,
      sections: set.sections?.map((section) => ({
        ...section,
        questions: section.questions?.map((q) => ({
          ...q,
          options: shuffleOptions(q.options)
        }))
      }))
    }));
  }
}
