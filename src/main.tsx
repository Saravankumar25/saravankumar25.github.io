import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";

// Retain bookmarked fragment routes while publishing real static URLs for crawlers.
if (location.hash.startsWith("#/")) {
  const legacy = location.hash.slice(1).replace(/^\/journal(?=\/|$)/, "/blogs");
  location.replace(legacy.split("#")[0].replace(/\/$/, "") + "/" + (legacy.includes("#") ? "#" + legacy.split("#")[1] : ""));
}
const application = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
const root = document.getElementById("root")!;
if (root.hasChildNodes()) hydrateRoot(root, application);
else createRoot(root).render(application);
