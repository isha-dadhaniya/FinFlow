import React from "react";
import PageHeader from "./PageHeader";

export default function PlaceholderPage({ title, subtitle = "This module will be available in a future update." }) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle={subtitle} />
    </div>
  );
}
