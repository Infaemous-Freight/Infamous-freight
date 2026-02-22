import dynamic from "next/dynamic";

const AvatarManager = dynamic(() => import("../../components/AvatarManager"), {
  ssr: false,
  loading: () => <main style={{ padding: 24 }}>Loading avatar settings…</main>,
});

export default function AvatarSettingsPage(): React.ReactElement {
  return <AvatarManager />;
}
