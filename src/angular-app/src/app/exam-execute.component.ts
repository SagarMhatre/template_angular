import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';

import { ExamStateService, QuestionSet, AttemptResult, AnswerResult } from './exam-state.service';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { shuffleOptions } from './utils/shuffle-options';

interface WebSpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface WebSpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: WebSpeechRecognitionAlternative;
}

interface WebSpeechRecognitionResultList {
  length: number;
  [index: number]: WebSpeechRecognitionResult;
}

interface WebSpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: WebSpeechRecognitionResultList;
}

interface WebSpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface WebSpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: WebSpeechRecognitionEvent) => void) | null;
  onerror: ((event: WebSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type WebSpeechRecognitionConstructor = new () => WebSpeechRecognition;

interface WebSpeechRecognitionWindow extends Window {
  SpeechRecognition?: WebSpeechRecognitionConstructor;
  webkitSpeechRecognition?: WebSpeechRecognitionConstructor;
}

@Component({
  selector: 'app-exam-execute',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './exam-execute.component.html',
  styleUrl: './exam-execute.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExamExecuteComponent implements OnInit, OnDestroy {
  private readonly examState = inject(ExamStateService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  protected readonly voiceEnabled = this.examState.voiceEnabledSignal();
  protected readonly flatQuestions = signal(this.flattenQuestions(this.examState.getQuestionSets()));
  protected readonly currentIndex = signal(0);
  protected readonly selections = signal<Record<string | number, Set<string>>>({});
  protected readonly durations = signal<Record<string | number, number>>({});
  protected readonly attemptStart = Date.now();
  protected readonly questionStart = signal(Date.now());
  protected readonly listening = signal(false);

  protected readonly currentQuestion = computed(() => this.flatQuestions()[this.currentIndex()]);
  protected readonly atFirst = computed(() => this.currentIndex() <= 0);
  protected readonly atLast = computed(() => this.currentIndex() >= this.flatQuestions().length - 1);
  protected readonly hasSelection = computed(() => this.currentSelectionCount() > 0);
  private micStream: MediaStream | null = null;
  private recognition: WebSpeechRecognition | null = null;
  private transcriptBuffer = '';
  private autoListenAfterSpeech = false;
  private lastHandledTranscript = '';
  private readonly spokenSections = new Set<string | number>();

  ngOnInit(): void {
    this.spokenSections.clear();
    if (this.voiceEnabled()) {
      this.speakQuestion();
    }
  }

  ngOnDestroy(): void {
    this.stopListening();
    this.stopSpeech();
  }

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
    this.lastHandledTranscript = '';
    this.maybeSpeakCurrent();
  }

  protected next(): void {
    if (this.atLast()) {
      return;
    }
    this.recordCurrentDuration();
    this.currentIndex.update((idx) => Math.min(this.flatQuestions().length - 1, idx + 1));
    this.questionStart.set(Date.now());
    this.lastHandledTranscript = '';
    this.maybeSpeakCurrent();
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

  protected speakQuestion(): void {
    const q = this.currentQuestion();
    if (!q) {
      return;
    }
    this.stopListeningInternal('manual', false);
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Speech synthesis is not available in this browser.');
      return;
    }
    this.stopSpeech();
    const segments: string[] = [];
    const shouldSpeakSection = q.sectionText && !this.spokenSections.has(q.sectionId);
    if (shouldSpeakSection) {
      segments.push(`Section ${q.sectionId}: ${this.formatSpeechText(q.sectionText)}`);
      this.spokenSections.add(q.sectionId);
    }
    segments.push(`Question ${q.id}: ${this.formatSpeechText(q.question)}`);
    if (q.options?.length) {
      const optionsText = q.options
        .map((opt, idx) => `Option ${idx + 1}: ${this.formatSpeechText(opt.text)}`)
        .join('. ');
      segments.push(`Options. ${optionsText}`);
    }
    const utterance = new SpeechSynthesisUtterance(segments.join('. '));
    this.autoListenAfterSpeech = true;
    utterance.onend = () => {
      if (this.autoListenAfterSpeech) {
        this.startListening();
      }
    };
    utterance.onerror = () => {
      this.autoListenAfterSpeech = false;
    };
    window.speechSynthesis.speak(utterance);
  }

  protected toggleListening(): void {
    if (this.listening()) {
      this.stopListening();
      return;
    }
    this.startListening();
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

    console.debug(
      'Execute option order',
      all.map((q) => ({
        setId: q.setId,
        sectionId: q.sectionId,
        questionId: q.id,
        options: q.options?.map((o) => o.text)
      }))
    );

    return all;
  }

  private startListening(): void {
    if (this.listening()) {
      return;
    }
    if (typeof navigator === 'undefined') {
      return;
    }
    const mediaDevices = navigator.mediaDevices;
    if (!mediaDevices?.getUserMedia) {
      console.warn('Microphone is not available in this browser.');
      return;
    }
    const recognitionCtor = this.getRecognitionConstructor();
    if (!recognitionCtor) {
      console.warn('Speech recognition is not available in this browser.');
      return;
    }
    this.transcriptBuffer = '';
    this.lastHandledTranscript = '';
    mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        this.micStream = stream;
        this.listening.set(true);
        this.beginRecognition(recognitionCtor);
      })
      .catch((err: unknown) => {
        console.error('Unable to access microphone', err);
        this.listening.set(false);
      });
  }

  private stopListening(): void {
    this.stopListeningInternal('manual');
  }

  private stopListeningInternal(reason: 'manual' | 'timeout' | 'number', finalize = true): void {
    this.autoListenAfterSpeech = false;
    this.listening.set(false);
    this.micStream?.getTracks().forEach((track) => track.stop());
    this.micStream = null;
    this.stopRecognition();
    if (finalize) {
      this.completeTranscript(reason);
    } else {
      this.transcriptBuffer = '';
      this.lastHandledTranscript = '';
    }
  }

  private stopSpeech(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }
    window.speechSynthesis.cancel();
  }

  private beginRecognition(recognitionCtor: WebSpeechRecognitionConstructor): void {
    this.stopRecognition();
    const recognition = new recognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (event) => this.handleRecognition(event);
    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error, event.message ?? '');
    };
    recognition.onend = () => {
      if (this.listening()) {
        recognition.start();
      }
    };
    this.recognition = recognition;
    recognition.start();
  }

  private handleRecognition(event: WebSpeechRecognitionEvent): void {
    const transcript = this.getResultTranscript(event);
    if (!transcript) {
      return;
    }
    const normalizedTranscript = transcript.toLowerCase().trim();
    if (normalizedTranscript && normalizedTranscript === this.lastHandledTranscript) {
      return;
    }
    this.lastHandledTranscript = normalizedTranscript;
    console.log('Speech transcript:', transcript);
    const selectedNumber = this.parseSpokenNumber(transcript);
    if (selectedNumber === null) {
      const command = this.parseSpokenCommand(transcript, this.atLast());
      if (command) {
        console.log('Parsed spoken command:', command);
        this.runCommand(command);
      }
      return;
    }
    console.log('Parsed spoken choice:', selectedNumber);
    this.selectOptionByIndex(selectedNumber - 1);
  }

  private getResultTranscript(event: WebSpeechRecognitionEvent): string {
    const result = event.results[event.resultIndex] ?? event.results[event.results.length - 1];
    if (!result) {
      return '';
    }
    const phrases: string[] = [];
    for (let i = 0; i < result.length; i += 1) {
      phrases.push(result[i].transcript.trim());
    }
    const combined = phrases.join(' ').trim();
    if (combined) {
      this.transcriptBuffer = `${this.transcriptBuffer} ${combined}`.trim();
    }
    return combined;
  }

  private parseSpokenNumber(transcript: string): number | null {
    const normalized = transcript.toLowerCase();
    const digitMatch = normalized.match(/\b([1-4])\b/);
    if (digitMatch) {
      return Number(digitMatch[1]);
    }
    const words: Record<string, number> = {
      one: 1,
      'option one': 1,
      two: 2,
      'option two': 2,
      three: 3,
      'option three': 3,
      four: 4,
      'option four': 4,
      first: 1,
      second: 2,
      third: 3,
      fourth: 4
    };
    const match = Object.entries(words).find(([word]) => normalized.includes(word));
    return match ? match[1] : null;
  }

  private selectOptionByIndex(index: number): void {
    if (index < 0) {
      return;
    }
    const q = this.currentQuestion();
    if (!q?.options?.length) {
      return;
    }
    const option = q.options[index];
    if (!option) {
      return;
    }
    const selections = { ...this.selections() };
    const set = new Set(selections[q.id] ?? []);
    set.add(option.text);
    selections[q.id] = set;
    this.selections.set(selections);
  }

  private stopRecognition(): void {
    if (!this.recognition) {
      return;
    }
    this.recognition.onresult = null;
    this.recognition.onerror = null;
    this.recognition.onend = null;
    this.recognition.stop();
    this.recognition.abort();
    this.recognition = null;
  }

  private completeTranscript(reason: 'manual' | 'timeout' | 'number'): void {
    const transcript = this.transcriptBuffer.trim();
    if (transcript) {
      console.log('Final speech transcript:', transcript, '| reason:', reason);
      const selectedNumber = this.parseSpokenNumber(transcript);
      if (selectedNumber !== null) {
        console.log('Parsed spoken choice (final):', selectedNumber);
        this.selectOptionByIndex(selectedNumber - 1);
        this.lastHandledTranscript = transcript.toLowerCase();
      } else {
        const command = this.parseSpokenCommand(transcript, this.atLast());
        if (command) {
          console.log('Parsed spoken command (final):', command);
          this.runCommand(command);
          this.lastHandledTranscript = transcript.toLowerCase();
        }
      }
    } else {
      console.log('No speech transcript captured | reason:', reason);
    }
    this.transcriptBuffer = '';
  }

  private getRecognitionConstructor(): WebSpeechRecognitionConstructor | null {
    if (typeof window === 'undefined') {
      return null;
    }
    const speechWindow = window as WebSpeechRecognitionWindow;
    return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
  }

  private formatSpeechText(text: string): string {
    return text.replace(/_{2,}/g, ' dash ').replace(/_/g, ' dash ');
  }

  private parseSpokenCommand(
    transcript: string,
    isLast: boolean
  ): 'next' | 'previous' | 'skip' | 'end' | null {
    const normalized = transcript.toLowerCase();
    if (!isLast && /\bnext\b/.test(normalized)) {
      return 'next';
    }
    if (/\b(prev|previous)\b/.test(normalized)) {
      return 'previous';
    }
    if (/\bskip\b/.test(normalized)) {
      return 'skip';
    }
    if (isLast && (/\bend\b/.test(normalized) || /\bfinish\b/.test(normalized))) {
      return 'end';
    }
    return null;
  }

  private runCommand(command: 'next' | 'previous' | 'skip' | 'end'): void {
    if (command === 'next') {
      this.next();
    } else if (command === 'previous') {
      this.prev();
    } else if (command === 'skip') {
      this.skip();
    } else if (command === 'end') {
      this.finish();
    }
  }

  private maybeSpeakCurrent(): void {
    if (this.voiceEnabled()) {
      this.speakQuestion();
    }
  }
}
