/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'backend-routes-no-repositories',
      comment:
        'Backend routes must go through services, not repositories directly ' +
        '(apps/backend/src/routes -> apps/backend/src/services -> apps/backend/src/repositories).',
      severity: 'error',
      from: { path: '^apps/backend/src/routes' },
      to: { path: '^apps/backend/src/repositories' },
    },
    {
      name: 'backend-services-no-routes',
      comment: 'Services must not import routes.',
      severity: 'error',
      from: { path: '^apps/backend/src/services' },
      to: { path: '^apps/backend/src/routes' },
    },
    {
      name: 'backend-repositories-no-routes-or-services',
      comment: 'Repositories must not import routes or services.',
      severity: 'error',
      from: { path: '^apps/backend/src/repositories' },
      to: { path: '^apps/backend/src/(routes|services)' },
    },
    {
      name: 'packages-no-apps',
      comment: 'packages/* must never import from apps/*.',
      severity: 'error',
      from: { path: '^packages' },
      to: { path: '^apps' },
    },
    {
      name: 'no-circular',
      comment: 'No circular dependencies.',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
    },
    exclude: {
      path: '(^|/)(node_modules|dist|dist-e2e-real-backend|generated|\\.wrangler|coverage|build)(/|$)',
    },
  },
};
