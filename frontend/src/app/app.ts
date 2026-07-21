import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Header } from './components/header/header';
import { Main } from './components/main/main';
import { Footer } from './components/footer/footer';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, Header, Footer, Main], 
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
}
