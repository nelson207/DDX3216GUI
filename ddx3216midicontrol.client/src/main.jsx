import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { Provider } from "react-redux";
import { store } from "./router/stores/store.jsx";
import { ApiPoller } from "./functions/ApiPoller.jsx";

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <ApiPoller />
    <App />
  </Provider>,
);
