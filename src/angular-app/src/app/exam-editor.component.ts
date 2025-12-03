import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';

import { ExamStateService, QuestionSet } from './exam-state.service';

@Component({
  selector: 'app-exam-editor',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './exam-editor.component.html',
  styleUrl: './exam-editor.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExamEditorComponent {
  private readonly examState = inject(ExamStateService);
  private readonly router = inject(Router);

  protected readonly submitted = signal(false);
  protected readonly error = signal('');
  protected readonly validationMessage = signal('');
  protected readonly validated = signal(false);
  private readonly validatedQuestionSets = signal<QuestionSet[]>([]);
  protected readonly form = new FormGroup({
    content: new FormControl(
      `{
  "id": 9,
  "name": "P1_Term1_English_202512021514",
  "active": true,
  "question_set_template_id": "5",
  "question_set_template_version": 202512011515,
  "max_score": 20,
  "sections": [
    {
      "id": "A",
      "text": "Fill in the blanks with the appropriate word",
      "questions": [
        {
          "id": "A.1",
          "question": "___ to bed early every night.",
          "options": [
            { "text": "Go", "score": 2 },
            { "text": "Help", "score": 0 },
            { "text": "Take", "score": 0 },
            { "text": "Wake", "score": 0 }
          ]
        },
        {
          "id": "A.2",
          "question": "___ up early in the morning.",
          "options": [
            { "text": "Get", "score": 2 },
            { "text": "Sit", "score": 0 },
            { "text": "Put", "score": 0 },
            { "text": "Cut", "score": 0 }
          ]
        }
      ]
    },
    {
      "id": "B",
      "text": "Choose the correct word",
      "questions": [
        {
          "id": "B.1",
          "question": "Which word is the name of an animal?",
          "options": [
            { "text": "Cat", "score": 2 },
            { "text": "Hat", "score": 0 },
            { "text": "Mat", "score": 0 },
            { "text": "Bag", "score": 0 }
          ]
        },
        {
          "id": "B.2",
          "question": "Which word starts with the sound 'S'?",
          "options": [
            { "text": "Sun", "score": 2 },
            { "text": "Run", "score": 0 },
            { "text": "Fun", "score": 0 },
            { "text": "Man", "score": -1 }
          ]
        }
      ]
    }
  ]
}`,
      { nonNullable: true, validators: [Validators.required] }
    )
  });

  protected resetValidation(): void {
    this.validated.set(false);
    this.validationMessage.set('');
    this.error.set('');
    this.submitted.set(false);
    this.validatedQuestionSets.set([]);
  }

  protected clear(): void {
    this.form.controls.content.setValue('');
    this.resetValidation();
  }

  protected validate(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Please paste valid JSON.');
      this.validated.set(false);
      this.validatedQuestionSets.set([]);
      return;
    }

    this.error.set('');
    this.submitted.set(false);

    const raw = this.form.controls.content.value;

    try {
      const parsed = this.safeParse(raw);
      const questionSets = this.shuffleQuestionSets(this.normalizeQuestionSets(parsed));
      if (!questionSets.length) {
        this.error.set('No question_sets found.');
        this.validated.set(false);
        this.validatedQuestionSets.set([]);
        return;
      }
      this.validatedQuestionSets.set(questionSets);
      this.validationMessage.set('Content validated. You can submit now.');
      this.validated.set(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid JSON.';
      this.validated.set(false);
      this.validatedQuestionSets.set([]);
      this.error.set(message);
    }
  }

  protected submit(): void {
    if (this.form.invalid || !this.validated()) {
      this.form.markAllAsTouched();
      this.error.set('Please validate the content before submitting.');
      return;
    }

    const questionSets = this.validatedQuestionSets();

    if (!questionSets.length) {
      this.error.set('Please validate the content before submitting.');
      this.validated.set(false);
      return;
    }

    this.error.set('');
    this.validationMessage.set('');
    this.submitted.set(true);
    this.examState.setQuestionSets(questionSets);
    void this.router.navigate(['/exam-preview']);
  }

  private safeParse(raw: string): unknown {
    const trimmed = raw.trim();

    try {
      return JSON.parse(trimmed);
    } catch {
      // Accept unquoted top-level "question_sets" key as entered in the prompt.
      const adjusted = trimmed.replace(/(^\s*\{)\s*question_sets\s*:/, '$1"question_sets":');
      return JSON.parse(adjusted);
    }
  }

  private normalizeQuestionSets(input: unknown): QuestionSet[] {
    if (!input) {
      return [];
    }

    if (Array.isArray(input)) {
      return input as QuestionSet[];
    }

    if (typeof input === 'object' && input !== null && 'question_sets' in input) {
      const qs = (input as { question_sets?: unknown }).question_sets;
      if (Array.isArray(qs)) {
        return qs as QuestionSet[];
      }
    }

    if (typeof input === 'object' && input !== null) {
      return [input as QuestionSet];
    }

    return [];
  }

  private shuffleQuestionSets(questionSets: QuestionSet[]): QuestionSet[] {
    // Shuffle deterministically once on submission so preview and execute share the same order.
    let seed = 1234567;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    const shuffleArray = <T>(items: T[]): T[] => {
      const copy = [...items];
      for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(rand() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    return questionSets.map((set) => ({
      ...set,
      sections: set.sections?.map((section) => ({
        ...section,
        questions: section.questions?.map((q) => ({
          ...q,
          options: q.options ? shuffleArray(q.options) : q.options
        }))
      }))
    }));
  }
}
