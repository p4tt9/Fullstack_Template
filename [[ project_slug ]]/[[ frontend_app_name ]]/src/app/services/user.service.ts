import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthenticatedUser } from '../models/authenticated-[[ keycloak_test_username ]].model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);

  getCurrentUser(): Observable<AuthenticatedUser> {
    return this.http.get<AuthenticatedUser>('/api/me');
  }
}
