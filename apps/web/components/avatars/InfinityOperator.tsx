import React from "react";

type InfinityOperatorProps = {
  className?: string;
  status?: string;
  designation?: string;
};

export default function InfinityOperator({
  className,
  status = "System synchronized.",
  designation = "Infinity Operator",
}: InfinityOperatorProps) {
  return (
    <div className={`avatar ${className ?? ""}`.trim()}>
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
