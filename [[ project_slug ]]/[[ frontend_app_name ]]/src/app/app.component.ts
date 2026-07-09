import { Component, inject, signal } from '@angular/core';
import { AuthService } from './auth/auth.service';
import { AuthenticatedUser } from './models/authenticated-[[ keycloak_test_username ]].model';
import { HelloService } from './services/hello.service';
import { UserService } from './services/[[ keycloak_test_username ]].service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private readonly authService = inject(AuthService);
  private readonly helloService = inject(HelloService);
  private readonly userService = inject(UserService);

  readonly authenticated = this.authService.authenticated;
  readonly message = signal('Loading [[ backend_artifact_id ]] response...');
  readonly error = signal<string | null>(null);
  readonly [[ keycloak_test_username ]] = signal<AuthenticatedUser | null>(null);
  readonly authError = signal<string | null>(null);

  constructor() {
    void this.initializeAuth();
    this.loadHello();
  }

  login(): void {
    void this.authService.login();
  }

  logout(): void {
    this.authService.logout();
  }

  private async initializeAuth(): Promise<void> {
    try {
      await this.authService.handleCallback();

      if (this.authenticated()) {
        this.loadUser();
      }
    } catch {
      this.authError.set('Login callback failed');
    }
  }

  private loadHello(): void {
    this.helloService.getHello().subscribe({
      next: (response) => {
        this.message.set(response.message);
        this.error.set(null);
      },
      error: () => {
        this.message.set('Backend unavailable');
        this.error.set('GET /api/hello failed');
      }
    });
  }

  private loadUser(): void {
    this.userService.getCurrentUser().subscribe({
      next: ([[ keycloak_test_username ]]) => {
        this.[[ keycloak_test_username ]].set([[ keycloak_test_username ]]);
        this.authError.set(null);
      },
      error: () => {
        this.[[ keycloak_test_username ]].set(null);
        this.authError.set('GET /api/me failed');
      }
    });
  }
}
