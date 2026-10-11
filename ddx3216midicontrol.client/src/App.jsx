import { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./App.css";
import TopNavBar from "./components/navbar/TopNavBar";
import ChannelFXPanel from "./components/panels/FxPanel";
import FadersPanel from "./components/panels/FadersPanel";
import ProcPanel from "./components/panels/ProcPanel";

function App() {
  //Channel Selection
  const [activeView, setActiveView] = useState("ch1_16");
  const [channelSelected, setChannelSelected] = useState(1);
  const [processorSelected, setProcessorSelected] = useState("EQ");

  const isChannelFXMenu = activeView === "ch_fx";
  const isChannelProcessorMenu = activeView === "ch_proc";
  const showFaders = !isChannelFXMenu && !isChannelProcessorMenu;

  return (
    <div className="app-shell">
      <header className="app-top">
        <TopNavBar activeView={activeView} setActiveView={setActiveView} />
      </header>
      <main className={`app-main${showFaders ? " app-main-mixer" : ""}`}>
        {showFaders && <FadersPanel activeView={activeView} />}

        {isChannelProcessorMenu && (
          <ProcPanel
            selectedChannel={channelSelected}
            onSelectChannel={setChannelSelected}
            selectedProcessor={processorSelected}
            onSelectProcessor={setProcessorSelected}
          />
        )}
        {isChannelFXMenu && <ChannelFXPanel />}
      </main>
      <div className="rotate-hint" aria-hidden="true">
        Rotate your device to landscape for the mixer view
      </div>
    </div>
  );
}

export default App;
