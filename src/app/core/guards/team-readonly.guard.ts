import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PortfolioContextService } from '../infrastructure/context/portfolio-context.service';

export const teamReadOnlyGuard: CanActivateFn = (route, state) => {
  const portfolioContext = inject(PortfolioContextService);
  const router = inject(Router);

  if (portfolioContext.isTeamContext()) {
    router.navigate(['/dashboard'], {
      queryParams: {
        message: 'team_readonly_restriction'
      }
    });
    return false;
  }

  return true;
};
