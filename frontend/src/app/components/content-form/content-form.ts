import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ContentService } from '../../services/content';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-content-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './content-form.html',
})
export class ContentFormComponent {
  contentForm: FormGroup;
  types = ['joke', 'fact', 'idea', 'quote'];
  submitted = false;
  errorMessage = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly contentService: ContentService,
    private readonly router: Router
  ) {
    this.contentForm = this.fb.group({
      text: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(2000)]],
      type: ['joke', Validators.required],
      author: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]]
    });
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.contentForm.valid) {
      this.contentService.addContent(this.contentForm.value).subscribe({
        next: (content) => {
          this.router.navigate(['/content', content.type]);
        },
        error: (error) => {
          this.errorMessage = 'Failed to submit content. Please try again.';
          console.error('Error submitting content:', error);
        }
      });
    }
  }
}