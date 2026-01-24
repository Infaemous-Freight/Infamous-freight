export const config = {
  buildCommand:
    'cd web && bash scripts/validate-build.sh && cd .. && pnpm --filter web build',
};
