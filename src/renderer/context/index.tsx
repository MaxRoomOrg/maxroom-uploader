import { useToggle } from "@mantine/hooks";
import { useContext, useMemo, createContext } from "react";
import type { PropsWithChildren, JSX } from "react";

interface AppContextProps {
  isVisible: boolean;
  toggleVisibility?: () => void;
}

const AppContext = createContext<AppContextProps>({
  isVisible: false,
});

export const useAppContext = () => {
  return useContext(AppContext);
};

export function AppProvider({ children }: PropsWithChildren): JSX.Element {
  const [isVisible, toggleVisibility] = useToggle();

  const value = useMemo<AppContextProps>(() => {
    return {
      isVisible,
      toggleVisibility,
    };
  }, [isVisible, toggleVisibility]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
