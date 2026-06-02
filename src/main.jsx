import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import DesktopGate from "./components/DesktopGate";
import { useIsDesktop } from "./hooks/useIsDesktop";
import { SITE } from "./data/chambers";

function Root() {
  const isDesktop = useIsDesktop();
  return isDesktop ? <App /> : <DesktopGate site={SITE} />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
