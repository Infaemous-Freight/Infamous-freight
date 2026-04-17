import { RouteScaffold } from "@/app/_components/RouteScaffold";

export default function ProfilePage() {
  return (
    <RouteScaffold
      eyebrow="Account"
      title="Profile"
      description="Update account identity details, communication preferences, and role-level workspace access settings."
      primaryAction={{ href: "/settings", label: "Open Settings" }}
      secondaryAction={{ href: "/dashboard", label: "Back to Dashboard" }}
      highlights={[
        "Personal and organization profile fields",
        "Notification and alert preferences",
        "Role and permission visibility",
      ]}
    />
  );
}
