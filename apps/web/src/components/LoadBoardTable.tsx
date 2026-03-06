import type { Load } from "@infamous/shared";

export function LoadBoardTable({ loads }: { loads: Load[] }) {
  return <pre>{JSON.stringify(loads, null, 2)}</pre>;
}
