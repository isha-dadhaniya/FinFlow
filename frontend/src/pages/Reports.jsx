import React from "react";
import { useWorkspace } from "../context/WorkspaceContext";
import PersonalReports from "./personal/PersonalReports";
import FamilyReports from "./family/FamilyReports";
import BusinessReports from "./business/BusinessReports";

export default function Reports() {
  const { activeMode } = useWorkspace();

  if (activeMode === "family") {
    return <FamilyReports />;
  }

  if (activeMode === "business") {
    return <BusinessReports />;
  }

  return <PersonalReports />;
}
