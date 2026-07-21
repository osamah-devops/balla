import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
@Component({
  selector: 'app-main',
  imports: [CommonModule, RouterOutlet],
  templateUrl: './main.html',
  styleUrl: './main.css',
})
export class Main {}
