import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { SessionService } from './session.service';

/**
 * The back office is closed until an operator signs in. A visitor carrying a
 * remembered token gets it resolved here, once, before the route is decided -
 * otherwise a page refresh would look exactly like a sign-out.
 */
export const operatorGuard: CanActivateFn = () => {
  const session = inject(SessionService);
  const router = inject(Router);

  if (session.signedIn()) {
    return true;
  }

  const restoring = session.restore();
  if (!restoring) {
    return router.createUrlTree(['/sign-in']);
  }

  return restoring.pipe(
    map(() => true as const),
    catchError(() => of(router.createUrlTree(['/sign-in']))),
  );
};
