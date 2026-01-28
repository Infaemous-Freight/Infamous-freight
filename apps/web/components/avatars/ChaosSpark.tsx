import React from "react";

type ChaosSparkProps = {
  className?: string;
  status?: string;
  designation?: string;
};

export default function ChaosSpark({
  className,
  status = "You just broke the ceiling.",
  designation = "Chaos Spark",
}: ChaosSparkProps) {
  return (
    <div className={`avatar avatar--spark ${className ?? ""}`.trim()}>
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
