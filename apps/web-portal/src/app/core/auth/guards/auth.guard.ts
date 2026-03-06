import { inject } from '@angular/core';
import { type CanActivateChildFn, type CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../auth.service';

export const AuthGuard: CanActivateFn | CanActivateChildFn = (_route, state) => {
  const router = inject(Router);

  return inject(AuthService).check().pipe(
    map((authenticated) =>
      authenticated ? true : router.parseUrl(`sign-in?${state.url === '/sign-out' ? '' : `redirectURL=${state.url}`}`)
    )
  );
};
