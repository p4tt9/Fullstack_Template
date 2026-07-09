export interface AuthenticatedUser {
  username: string;
  name: string | null;
  email: string | null;
  roles: string[];
}
