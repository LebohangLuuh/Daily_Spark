import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-navigation',
  imports: [CommonModule, RouterLink],
  templateUrl: './navigation.html',
})

export class NavigationComponent {
  contentTypes = ['joke', 'fact', 'idea', 'quote'];
  isMenuOpen = false;

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }
}
