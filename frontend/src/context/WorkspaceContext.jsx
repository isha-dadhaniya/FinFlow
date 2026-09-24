import React, { createContext, useContext, useState, useEffect } from "react";

const WorkspaceContext = createContext();

const MODE_CONFIG = {
  personal: {
    id: "personal",
    label: "Personal",
    emoji: "🧑",
    description: "Personal Workspace",
    color: "#005B4F",
    bgAccent: "bg-[#005B4F]/5",
  },
  family: {
    id: "family",
    label: "Family",
    emoji: "👨‍👩‍👧",
    description: "Family Workspace",
    color: "#2A9D8F",
    bgAccent: "bg-[#2A9D8F]/5",
  },
  business: {
    id: "business",
    label: "Business",
    emoji: "🏢",
    description: "Business Workspace",
    color: "#005B4F",
    bgAccent: "bg-[#005B4F]/5",
  },
};

const ALL_MODES = ["personal", "family", "business"];

export const WorkspaceProvider = ({ children }) => {
  // Get user's selected modes from localStorage
  const getUserModes = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (Array.isArray(user.selectedModes) && user.selectedModes.length > 0) {
        // Filter only valid modes
        const valid = user.selectedModes.filter((m) => ALL_MODES.includes(m));
        if (valid.length > 0) return valid;
      }
      if (user.accountType && ALL_MODES.includes(user.accountType)) {
        return [user.accountType];
      }
      return ["personal"];
    } catch {
      return ["personal"];
    }
  };

  const getUserDefaultMode = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user.defaultMode && ALL_MODES.includes(user.defaultMode)) {
        return user.defaultMode;
      }
      const modes = getUserModes();
      return modes[0] || "personal";
    } catch {
      return "personal";
    }
  };

  const [selectedModes, setSelectedModes] = useState(getUserModes);

  const [activeMode, setActiveMode] = useState(() => {
    const saved = localStorage.getItem("finflow_active_mode");
    const userModes = getUserModes();
    // Only allow active mode if it is one of the user's selected modes
    if (saved && userModes.includes(saved)) return saved;
    return getUserDefaultMode();
  });

  // Sync activeMode to localStorage
  useEffect(() => {
    if (selectedModes.includes(activeMode)) {
      localStorage.setItem("finflow_active_mode", activeMode);
    } else {
      const fallback = selectedModes[0] || "personal";
      setActiveMode(fallback);
      localStorage.setItem("finflow_active_mode", fallback);
    }
  }, [activeMode, selectedModes]);

  // Refresh modes when user data changes
  const refreshModes = () => {
    const modes = getUserModes();
    setSelectedModes(modes);
    if (!modes.includes(activeMode)) {
      setActiveMode(modes[0] || "personal");
    }
  };

  // Update selected modes (e.g. from Settings)
  const updateSelectedModes = (newModes) => {
    const validModes = newModes.filter((m) => ALL_MODES.includes(m));
    const finalModes = validModes.length > 0 ? validModes : ["personal"];
    setSelectedModes(finalModes);

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      user.selectedModes = finalModes;
      if (!finalModes.includes(user.defaultMode)) {
        user.defaultMode = finalModes[0];
      }
      localStorage.setItem("user", JSON.stringify(user));
    } catch (e) {
      console.error("Error saving user selectedModes:", e);
    }

    if (!finalModes.includes(activeMode)) {
      setActiveMode(finalModes[0]);
    }
  };

  // Allow switching ONLY to user's selected modes
  const switchMode = (mode) => {
    if (selectedModes.includes(mode)) {
      setActiveMode(mode);
    }
  };

  const activeModeConfig = MODE_CONFIG[activeMode] || MODE_CONFIG.personal;

  // Show switcher only if user selected more than 1 profile
  const showSwitcher = selectedModes.length > 1;

  // Available modes strictly derived from user's selected modes
  const availableModes = selectedModes.map((m) => ({
    ...MODE_CONFIG[m],
    isActive: m === activeMode,
    isSelected: true,
  }));

  return (
    <WorkspaceContext.Provider
      value={{
        activeMode,
        activeModeConfig,
        selectedModes,
        availableModes,
        showSwitcher,
        switchMode,
        refreshModes,
        updateSelectedModes,
        MODE_CONFIG,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
};
