import React from "react";
import { useWorkspace } from "../context/WorkspaceContext";
import FamilyMembers from "./family/FamilyMembers";
import Employees from "./business/Employees";

export default function Members() {
  const { activeMode } = useWorkspace();

  if (activeMode === "business") {
    return <Employees />;
  }

  return <FamilyMembers />;
}
