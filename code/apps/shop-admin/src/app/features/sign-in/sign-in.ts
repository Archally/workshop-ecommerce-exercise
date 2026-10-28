import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { toDisplayError, toStatusCode } from '../../core/api-config';
import { SessionService } from '../../core/operators/session.service';

@Component({
  selector: 'app-sign-in',
  imports: [FormsModule],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.css',
})
export class SignIn {
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  protected readonly login = signal('');
  protected readonly password = signal('');
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected submit(): void {
    const login = this.login().trim();
    const password = this.password();
    if (!login || !password) {
      this.errorMessage.set('Enter both a login and a password.');
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);
    this.session.signIn(login, password).subscribe({
      next: () => {
        this.submitting.set(false);
        void this.router.navigateByUrl('/products');
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        // A 401 is a refusal and carries the service's own message, which never
        // says which half was wrong. Anything else is a real failure.
        this.errorMessage.set(
          toStatusCode(err) === 401
            ? 'Login or password is incorrect.'
            : toDisplayError(err, 'Could not reach customer-service on :3003.'),
        );
      },
    });
  }
}
