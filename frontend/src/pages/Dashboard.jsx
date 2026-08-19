import React from "react";
import { useWorkspace } from "../context/WorkspaceContext";
import PersonalDashboard from "./personal/PersonalDashboard";
import FamilyDashboard from "./family/FamilyDashboard";
import BusinessDashboard from "./business/BusinessDashboard";

export default function Dashboard() {
  const { activeMode } = useWorkspace();

  if (activeMode === "family") {
    return <FamilyDashboard />;
  }

  if (activeMode === "business") {
    return <BusinessDashboard />;
  }

  return <PersonalDashboard />;
}
