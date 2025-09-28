
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ContentService } from '../../services/content';
import { Content } from '../../models/content';
import { CommonModule, TitleCasePipe } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-content-list',
  imports: [CommonModule, TitleCasePipe],
  templateUrl: './content-list.html',
})
export class ContentListComponent implements OnInit {
  type: string = '';
  content: Content[] = [];
  page: number = 1;
  hasMore: boolean = true;
  loading: boolean = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly contentService: ContentService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.type = params['type'];
      this.page = 1;
      this.content = [];
      this.loadContent();
    });
  }

  loadContent(): void {
    if (this.loading) return;

    this.loading = true;
    this.contentService.getContentByType(this.type, this.page, 20).subscribe({
      next: (response) => {
        this.content = [...this.content, ...response.content];
        this.hasMore = response.hasMore;
        this.page++;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading content:', error);
        this.loading = false;
      }
    });
  }

  onScroll(): void {
    if (this.hasMore && !this.loading) {
      this.loadContent();
    }
  }
}