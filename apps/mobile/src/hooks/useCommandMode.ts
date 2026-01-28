import { useCallback, useState } from "react";
import * as Haptics from "expo-haptics";

export function useCommandMode() {
  const [commandMode, setCommandMode] = useState(false);

  const toggle = useCallback(async () => {
    setCommandMode((v) => !v);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  return { commandMode, setCommandMode, toggle };
}
