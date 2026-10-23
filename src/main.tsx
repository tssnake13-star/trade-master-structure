import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/school-skin.css";
import "./styles/preview-skin.css";
import "./styles/fx.css";

// Кабинет и терминал лежат отдельными файлами (23.10.2026). После новой выкладки старые файлы
// с сервера пропадают: если вкладка открыта с прошлой версии, переход в кабинет не найдёт свой файл.
// Тогда один раз перезагружаем страницу, она возьмёт свежую версию. Повтор не чаще раза в 30 секунд,
// чтобы не зациклиться, если файл не грузится по другой причине.
window.addEventListener("vite:preloadError", (event) => {
  let last = 0;
  try {
    last = Number(sessionStorage.getItem("tlt-chunk-reload")) || 0;
    sessionStorage.setItem("tlt-chunk-reload", String(Date.now()));
  } catch {
    return;
  }
  if (Date.now() - last < 30_000) return;
  event.preventDefault();
  window.location.reload();
});

createRoot(document.getElementById("root")!).render(<App />);
