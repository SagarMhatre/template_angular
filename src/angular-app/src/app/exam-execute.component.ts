import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';

import { ExamStateService, QuestionSet, AttemptResult, AnswerResult } from './exam-state.service';
import { ConfirmDialogComponent } from './confirm-dialog.component';

@Component({
  selector: 'app-exam-execute',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatCheckboxModule, MatDialogModule],
  templateUrl: './exam-execute.component.html',
  styleUrl: './exam-execute.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExamExecuteComponent {
  private readonly examState = inject(ExamStateService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  protected readonly flatQuestions = signal(this.flattenQuestions(this.examState.getQuestionSets()));
  protected readonly currentIndex = signal(0);
  protected readonly selections = signal<Record<string | number, Set<string>>>({});
  protected readonly durations = signal<Record<string | number, number>>({});
  protected readonly attemptStart = Date.now();
  protected readonly questionStart = signal(Date.now());

  protected readonly currentQuestion = computed(() => this.flatQuestions()[this.currentIndex()]);
  protected readonly atFirst = computed(() => this.currentIndex() <= 0);
  protected readonly atLast = computed(() => this.currentIndex() >= this.flatQuestions().length - 1);
  protected readonly hasSelection = computed(() => this.currentSelectionCount() > 0);

  protected isSelected(optionText: string): boolean {
    const q = this.currentQuestion();
    if (!q) return false;
    return this.selections()[q.id]?.has(optionText) ?? false;
  }

  protected toggleOption(optionText: string): void {
    const q = this.currentQuestion();
    if (!q) return;
    const selections = { ...this.selections() };
    const set = new Set(selections[q.id] ?? []);
    if (set.has(optionText)) {
      set.delete(optionText);
    } else {
      set.add(optionText);
    }
    selections[q.id] = set;
    this.selections.set(selections);
  }

  protected prev(): void {
    if (this.atFirst()) {
      return;
    }
    this.recordCurrentDuration();
    this.currentIndex.update((idx) => Math.max(0, idx - 1));
    this.questionStart.set(Date.now());
  }

  protected next(): void {
    if (this.atLast()) {
      return;
    }
    this.recordCurrentDuration();
    this.currentIndex.update((idx) => Math.min(this.flatQuestions().length - 1, idx + 1));
    this.questionStart.set(Date.now());
  }

  protected skip(): void {
    this.recordCurrentDuration();
    if (this.atLast()) {
      this.finishWithConfirm('Skip the final question and end the exam?');
      return;
    }
    this.next();
  }

  protected finish(): void {
    this.finishWithConfirm('End the exam?');
  }

  private finishWithConfirm(message: string): void {
    this.dialog
      .open(ConfirmDialogComponent, { data: { message } })
      .afterClosed()
      .subscribe((proceed) => {
        if (proceed) {
          this.recordCurrentDuration();
          const result = this.buildResult();
          this.examState.setResult(result);
          void this.router.navigate(['/exam-results']);
        }
      });
  }

  private currentSelectionCount(): number {
    const q = this.currentQuestion();
    if (!q) return 0;
    return this.selections()[q.id]?.size ?? 0;
  }

  private recordCurrentDuration(): void {
    const q = this.currentQuestion();
    if (!q) return;
    const elapsed = Date.now() - this.questionStart();
    const map = { ...this.durations() };
    map[q.id] = (map[q.id] ?? 0) + elapsed;
    this.durations.set(map);
  }

  private buildResult(): AttemptResult {
    const answers: AnswerResult[] = this.flatQuestions().map((q) => {
      const opts = q.options ?? [];
      const selected = this.selections()[q.id] ?? new Set<string>();
      const correctIndices: number[] = [];
      const correctUnselected: number[] = [];
      const incorrectSelected: number[] = [];

      opts.forEach((opt, idx) => {
        const isSelected = selected.has(opt.text);
        if (opt.score > 0) {
          if (isSelected) {
            correctIndices.push(idx);
          } else {
            correctUnselected.push(idx);
          }
        } else if (isSelected) {
          incorrectSelected.push(idx);
        }
      });

      const score = opts.reduce((sum, opt, idx) => {
        return selected.has(opt.text) ? sum + opt.score : sum;
      }, 0);

      return {
        question_id: q.id,
        correct_selected: correctIndices,
        correct_unselected: correctUnselected,
        incorrect_selected: incorrectSelected,
        duration: this.durations()[q.id] ?? 0,
        score,
        is_correct: correctUnselected.length === 0 && incorrectSelected.length === 0
      };
    });

    const totalScore = answers.reduce((sum, a) => sum + a.score, 0);
    const setId = this.flatQuestions()[0]?.setId ?? '';

    return {
      question_set_id: setId,
      kid_id: 'kid-1',
      attempt_start: this.attemptStart,
      attempt_end: Date.now(),
      score: totalScore,
      answers
    };
  }

  private flattenQuestions(questionSets: QuestionSet[]) {
    const all: Array<{
      setName: string;
      setId: string | number;
      sectionId: string | number;
      sectionText: string;
      id: string | number;
      question: string;
      options?: { text: string; score: number }[];
    }> = [];

    questionSets.forEach((set) => {
      set.sections?.forEach((section) => {
        section.questions?.forEach((q) => {
          all.push({
            setName: set.name ?? String(set.id),
            setId: set.id,
            sectionId: section.id,
            sectionText: section.text ?? '',
            id: q.id,
            question: q.question,
            options: q.options
          });
        });
      });
    });

    return all;
  }
}
