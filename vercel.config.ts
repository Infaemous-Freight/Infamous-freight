export const config = {
  buildCommand:
    'if [ -d web ]; then bash web/scripts/validate-build.sh && pnpm --filter web build; else bash scripts/validate-build.sh && pnpm build; fi',
};
