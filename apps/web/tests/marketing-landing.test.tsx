// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import InfamousFreightWebApp from "../app/(marketing)/_components/InfamousFreightWebApp";

describe("marketing landing page navigation", () => {
  it("renders functional CTAs to live app routes", () => {
    render(<InfamousFreightWebApp />);

    expect(screen.getByRole("link", { name: "Customer Portal" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: "Book Shipment" })).toHaveAttribute("href", "/register");
    expect(screen.getByRole("link", { name: "View Customer Portal" })).toHaveAttribute("href", "/dashboard");
  });

  it("surfaces platform and mobile workflow links", () => {
    render(<InfamousFreightWebApp />);

    expect(screen.getByRole("link", { name: "Operations Dashboard" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: "Loadboard" })).toHaveAttribute("href", "/loadboard");
    expect(screen.getByRole("link", { name: "Shipment Tracking" })).toHaveAttribute("href", "/shipments");
    expect(screen.getByRole("link", { name: "Billing & Payments" })).toHaveAttribute("href", "/settings/billing");
    expect(screen.getByRole("link", { name: "Shipment Workflow" })).toHaveAttribute("href", "/shipments");
  });
});
