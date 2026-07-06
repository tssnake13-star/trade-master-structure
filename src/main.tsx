import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/school-skin.css";
import "./styles/preview-skin.css";

const root = document.getElementById("root")!;

// If the server delivered pre-rendered markup (the landing "/" is baked to static
// HTML at build time — real element children, not just the placeholder comment),
// hydrate it in place. Otherwise (dev, or the bare shell served on cabinet routes)
// mount fresh.
if (root.childElementCount > 0) {
  hydrateRoot(root, <App />);
} else {
  createRoot(root).render(<App />);
}
