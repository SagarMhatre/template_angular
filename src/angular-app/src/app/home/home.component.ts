import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [MatCardModule, MatButtonModule, RouterLink],
  template: `
    <mat-card class="home-card" aria-labelledby="home-title">
      <mat-card-header>
        <mat-card-title id="home-title">Welcome home</mat-card-title>
        <mat-card-subtitle>You are now signed in.</mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <p>Use the navigation to explore the application.</p>
      </mat-card-content>

      <mat-card-actions>
        <a mat-stroked-button color="primary" routerLink="/login">Return to login</a>
      </mat-card-actions>
    </mat-card>
  `,
  styleUrl: './home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {}
