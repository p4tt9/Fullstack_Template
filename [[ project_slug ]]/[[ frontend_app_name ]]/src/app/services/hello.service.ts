import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HelloResponse } from '../models/hello-response.model';

@Injectable({ providedIn: 'root' })
export class HelloService {
  private readonly http = inject(HttpClient);

  getHello(): Observable<HelloResponse> {
    return this.http.get<HelloResponse>('/api/hello');
  }
}
