import Link from "next/link";
import { getMyProfile } from "@/lib/db";

export default async function Dashboard() {
  let profile;
  try {
    profile = await getMyProfile();
  } catch (error) {
    return (
      <div className="marketplace-stack">
        <h1 className="marketplace-title">Dashboard</h1>
        <div className="card marketplace-card">
          <div className="marketplace-muted">
            Your session has expired or you are not signed in.
          </div>
          <div className="marketplace-actions">
            <Link className="btn btn-primary" href="/login">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="marketplace-stack">
      <h1 className="marketplace-title">Dashboard</h1>
      <div className="card marketplace-card">
        <div className="marketplace-muted">Signed in as</div>
        <div className="marketplace-card-title">
          {profile.display_name ?? profile.id}
        </div>
        <div className="marketplace-muted">
          Role: <span className="marketplace-highlight">{profile.role}</span>
        </div>
        <div className="marketplace-muted">
          Verified: <span className="marketplace-highlight">{String(profile.is_verified)}</span>
        </div>
      </div>

      <div className="marketplace-actions">
        <Link className="btn btn-primary" href="/loads">
          Browse Loads
        </Link>
        {(profile.role === "shipper" ||
          profile.role === "dispatcher" ||
          profile.role === "admin") && (
          <Link className="btn btn-secondary" href="/loads/new">
            Post Load
          </Link>
        )}
      </div>
    </div>
  );
}
