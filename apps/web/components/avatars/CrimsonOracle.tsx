import React from "react";

type CrimsonOracleProps = {
  className?: string;
  status?: string;
  designation?: string;
};

export default function CrimsonOracle({
  className,
  status = "Growth probability exceeds threshold.",
  designation = "Crimson Oracle",
}: CrimsonOracleProps) {
  return (
    <div className={`avatar avatar--oracle ${className ?? ""}`.trim()}>
      <div className="avatar__frame" aria-hidden="true">
        <div className="avatar__silhouette">
          <div className="avatar__eyes">
            <span className="avatar__eye" />
            <span className="avatar__eye" />
          </div>
        </div>
      </div>
      <div className="avatar__status">{designation}</div>
      <div className="status-chip">{status}</div>
    </div>
  );
}
