import { inject } from '@angular/core';
import { type CanActivateChildFn, type CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../auth.service';

export const NoAuthGuard: CanActivateFn | CanActivateChildFn = (_route, _state) => {
  const router = inject(Router);

  return inject(AuthService).check().pipe(
    map((authenticated) => (authenticated ? router.parseUrl('/') : true))
  );
};
