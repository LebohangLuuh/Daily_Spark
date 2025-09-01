
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Content } from '../models/content';

@Injectable({
  providedIn: 'root'
})
export class ContentService {
  private apiUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) { }

  getContentByType(type: string, page: number = 1, limit: number = 20): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<{ content: Content[], page: number, hasMore: boolean }>(`${this.apiUrl}/content/${type}`, { params });
  }

  addContent(content: Partial<Content>): Observable<Content> {
    return this.http.post<Content>(`${this.apiUrl}/content`, content);
  }

  getContentById(id: string): Observable<Content> {
    return this.http.get<Content>(`${this.apiUrl}/content/id/${id}`);
  }
}