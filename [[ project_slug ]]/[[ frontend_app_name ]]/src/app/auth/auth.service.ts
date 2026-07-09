import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

interface TokenResponse {
  access_token: string;
  expires_in: number;
  id_token?: string;
  refresh_token?: string;
  token_type: string;
}

const authConfig = {
[% if auth_mode == "bundled" %]
  issuer: `${window.location.origin}/auth/realms/[[ keycloak_realm ]]`,
[% else %]
  issuer: '[[ external_auth_issuer_uri ]]',
[% endif %]
  clientId: '[[ keycloak_client_id ]]',
  scope: 'openid profile email roles'
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly accessTokenKey = 'auth.access_token';
  private readonly idTokenKey = 'auth.id_token';
  private readonly refreshTokenKey = 'auth.refresh_token';
  private readonly pkceVerifierKey = 'auth.pkce_verifier';
  private readonly stateKey = 'auth.state';

  readonly authenticated = signal(this.hasValidAccessToken());

  accessToken(): string | null {
    const token = sessionStorage.getItem(this.accessTokenKey);
    return token && this.isTokenValid(token) ? token : null;
  }

  async handleCallback(): Promise<boolean> {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    if (!code) {
      this.authenticated.set(this.hasValidAccessToken());
      return false;
    }

    if (!state || state !== sessionStorage.getItem(this.stateKey)) {
      this.clearSession();
      throw new Error('Invalid OAuth state');
    }

    const verifier = sessionStorage.getItem(this.pkceVerifierKey);
    if (!verifier) {
      this.clearSession();
      throw new Error('Missing PKCE verifier');
    }

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: authConfig.clientId,
      code,
      redirect_uri: this.redirectUri(),
      code_verifier: verifier
    });

    const token = await firstValueFrom(this.http.post<TokenResponse>(
      `${authConfig.issuer}/protocol/openid-connect/token`,
      body.toString(),
      {
        headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' })
      }
    ));

    this.storeToken(token);
    window.history.replaceState({}, document.title, window.location.pathname);
    return true;
  }

  async login(): Promise<void> {
    const verifier = this.randomString(64);
    const challenge = await this.pkceChallenge(verifier);
    const state = this.randomString(32);

    sessionStorage.setItem(this.pkceVerifierKey, verifier);
    sessionStorage.setItem(this.stateKey, state);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: authConfig.clientId,
      redirect_uri: this.redirectUri(),
      scope: authConfig.scope,
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256'
    });

    window.location.href = `${authConfig.issuer}/protocol/openid-connect/auth?${params.toString()}`;
  }

  logout(): void {
    const redirectUri = this.redirectUri();
    this.clearSession();
    window.location.href = `${authConfig.issuer}/protocol/openid-connect/logout?client_id=${authConfig.clientId}&post_logout_redirect_uri=${encodeURIComponent(redirectUri)}`;
  }

  private storeToken(token: TokenResponse): void {
    sessionStorage.setItem(this.accessTokenKey, token.access_token);

    if (token.id_token) {
      sessionStorage.setItem(this.idTokenKey, token.id_token);
    }

    if (token.refresh_token) {
      sessionStorage.setItem(this.refreshTokenKey, token.refresh_token);
    }

    sessionStorage.removeItem(this.pkceVerifierKey);
    sessionStorage.removeItem(this.stateKey);
    this.authenticated.set(this.hasValidAccessToken());
  }

  private clearSession(): void {
    sessionStorage.removeItem(this.accessTokenKey);
    sessionStorage.removeItem(this.idTokenKey);
    sessionStorage.removeItem(this.refreshTokenKey);
    sessionStorage.removeItem(this.pkceVerifierKey);
    sessionStorage.removeItem(this.stateKey);
    this.authenticated.set(false);
  }

  private hasValidAccessToken(): boolean {
    const token = sessionStorage.getItem(this.accessTokenKey);
    return !!token && this.isTokenValid(token);
  }

  private isTokenValid(token: string): boolean {
    const payload = this.decodeJwtPayload(token);
    return !!payload?.exp && payload.exp * 1000 > Date.now() + 30000;
  }

  private decodeJwtPayload(token: string): { exp?: number } | null {
    try {
      const [, payload] = token.split('.');
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(normalized));
    } catch {
      return null;
    }
  }

  private redirectUri(): string {
    return `${window.location.origin}/`;
  }

  private randomString(length: number): string {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return this.base64Url(bytes);
  }

  private async pkceChallenge(verifier: string): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
    return this.base64Url(new Uint8Array(digest));
  }

  private base64Url(bytes: Uint8Array): string {
    const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
}
