/**
 * Route definitions for budget measurement.
 * 
 * Maps budget keys (which may contain dynamic segments like [slug])
 * to actual URLs that can be measured in production builds.
 */

export interface RouteDefinition {
  /** Key from budgets.json */
  budgetKey: string;
  /** Actual URL to measure */
  url: string;
  /** Display name for reports */
  name: string;
}

/**
 * Routes to measure against budgets.
 * 
 * Dynamic segments are filled with realistic values so measurements
 * reflect actual usage patterns.
 */
export const ROUTES: RouteDefinition[] = [
  {
    budgetKey: '/',
    url: '/',
    name: 'Landing',
  },
  {
    budgetKey: '/hackathons',
    url: '/hackathons',
    name: 'Hackathon Listing',
  },
  {
    budgetKey: '/hackathons/[slug]',
    url: '/hackathons/example-hackathon',
    name: 'Hackathon Detail',
  },
  {
    budgetKey: '/hackathons/[slug]/submit',
    url: '/hackathons/example-hackathon/submit',
    name: 'Submit Project',
  },
  {
    budgetKey: '/hackathons/[slug]/vote',
    url: '/hackathons/example-hackathon/vote',
    name: 'Vote',
  },
  {
    budgetKey: '/hackathons/[slug]/projects/[team]',
    url: '/hackathons/example-hackathon/projects/1',
    name: 'Project Detail',
  },
  {
    budgetKey: '/statistics',
    url: '/statistics',
    name: 'Statistics',
  },
  {
    budgetKey: '/u/[username]',
    url: '/u/example-user',
    name: 'User Profile',
  },
];
