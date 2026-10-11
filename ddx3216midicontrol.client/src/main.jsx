import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { Provider } from "react-redux";
import { store } from "./router/stores/Store.jsx";
import { ApiPoller } from "./functions/ApiPoller.jsx";
import AuthGate from "./components/auth/AuthGate.jsx";

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <AuthGate>
      <ApiPoller />
      <App />
    </AuthGate>
  </Provider>,
);
