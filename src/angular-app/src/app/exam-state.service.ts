import { Injectable, signal } from '@angular/core';

type QuestionOption = {
  text: string;
  score: number;
};

type Question = {
  id: string | number;
  question: string;
  options?: QuestionOption[];
};

type Section = {
  id: string | number;
  text: string;
  questions?: Question[];
};

export type QuestionSet = {
  id: string | number;
  name: string;
  active?: boolean;
  question_set_template_id?: string | number;
  question_set_template_version?: number;
  max_score?: number;
  sections?: Section[];
};

export type AnswerResult = {
  question_id: string | number;
  correct_selected: number[];
  correct_unselected: number[];
  incorrect_selected: number[];
  duration: number;
  score: number;
  is_correct: boolean;
};

export type AttemptResult = {
  question_set_id: string | number;
  kid_id?: string;
  attempt_start: number;
  attempt_end: number;
  score: number;
  answers: AnswerResult[];
};

@Injectable({
  providedIn: 'root'
})
export class ExamStateService {
  protected readonly questionSets = signal<QuestionSet[]>([]);
  protected readonly lastResult = signal<AttemptResult | null>(null);

  setQuestionSets(questionSets: QuestionSet[]): void {
    this.questionSets.set(questionSets);
  }

  getQuestionSets(): QuestionSet[] {
    return this.questionSets();
  }

  setResult(result: AttemptResult): void {
    this.lastResult.set(result);
  }

  getResult(): AttemptResult | null {
    return this.lastResult();
  }
}
