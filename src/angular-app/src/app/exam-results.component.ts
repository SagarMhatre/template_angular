import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

import { ExamStateService, AttemptResult, AnswerResult, QuestionSet } from './exam-state.service';

@Component({
  selector: 'app-exam-results',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatCheckboxModule, MatButtonToggleModule],
  templateUrl: './exam-results.component.html',
  styleUrl: './exam-results.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExamResultsComponent {
  private readonly examState = inject(ExamStateService);
  protected readonly result: AttemptResult | null = this.examState.getResult();
  protected readonly questionSets: QuestionSet[] = this.examState.getQuestionSets();
  protected readonly filter = signal<'all' | 'correct' | 'incorrect' | 'skipped'>('all');
  protected readonly answerMap: Map<string | number, AnswerResult> = new Map(
    this.result?.answers.map((a) => [a.question_id, a]) ?? []
  );
  protected readonly filteredAnswers = computed(() => this.applyFilter());
  protected readonly filteredAnswerIds = computed(
    () => new Set(this.filteredAnswers().map((a) => a.question_id))
  );

  protected setFilter(filter: 'all' | 'correct' | 'incorrect' | 'skipped'): void {
    this.filter.set(filter);
  }

  protected isSelected(questionId: string | number, optionIndex: number): boolean {
    const ans = this.answerMap.get(questionId);
    if (!ans) return false;
    return ans.correct_selected.includes(optionIndex) || ans.incorrect_selected.includes(optionIndex);
  }

  protected optionClass(questionId: string | number, optionIndex: number, score: number): string {
    const ans = this.answerMap.get(questionId);
    if (!ans) return '';
    const selected = ans.correct_selected.includes(optionIndex) || ans.incorrect_selected.includes(optionIndex);
    if (score > 0 && selected) return 'opt-selected-correct';
    if (score > 0 && !selected) return 'opt-unselected-correct';
    if (score <= 0 && selected) return 'opt-selected-incorrect';
    return '';
  }

  protected showQuestion(questionId: string | number): boolean {
    return this.filter() === 'all' || this.filteredAnswerIds().has(questionId);
  }

  protected showSection(sectionId: string | number, questionIds: Array<string | number>): boolean {
    if (this.filter() === 'all') {
      return true;
    }
    return questionIds.some((id) => this.filteredAnswerIds().has(id));
  }

  protected questionIds(section: { questions?: Array<{ id: string | number }> }): Array<string | number> {
    return section.questions?.map((q) => q.id) ?? [];
  }

  private applyFilter(): AnswerResult[] {
    if (!this.result) {
      return [];
    }
    switch (this.filter()) {
      case 'correct':
        return this.result.answers.filter(
          (a) => a.correct_selected.length > 0 && a.correct_unselected.length === 0 && a.incorrect_selected.length === 0
        );
      case 'incorrect':
        return this.result.answers.filter(
          (a) => a.incorrect_selected.length > 0 || a.correct_unselected.length > 0
        );
      case 'skipped':
        return this.result.answers.filter((a) => {
          const selectedCount = a.correct_selected.length + a.incorrect_selected.length;
          return selectedCount === 0;
        });
      default:
        return this.result.answers;
    }
  }
}
