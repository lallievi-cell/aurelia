import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AureliaGame } from "@/components/AureliaGame";
import "../src/styles.css";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <AureliaGame />
    </StrictMode>,
  );
}
