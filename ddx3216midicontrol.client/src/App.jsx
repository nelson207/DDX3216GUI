import { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./App.css";
import TopNavBar from "./components/navbar/TopNavBar";
import ChannelSelectNavBar from "./components/NavBar/ChannelSelectNavBar";
import ChannelProcNavBar from "./components/NavBar/ChannelProcNavBar";
import ChannelFXPanel from "./components/panels/FxPanel";
<<<<<<< HEAD
import FadersPanel from "./components/panels/FadersPanel";
import ProcPanel from "./components/panels/ProcPanel";
=======
import ProcPanel from "./components/panels/procpanel";
import FadersPanel from "./components/panels/FadersPanel";
>>>>>>> 4cc5cafa7afe3325d95da46839077f2761b768a9

function App() {
  //Channel Selection
  const [activeView, setActiveView] = useState("ch1_16");
  const [channelSelected, setChannelSelected] = useState(1);
  const [processorSelected, setProcessorSelected] = useState("EQ");

  const isChannelFXMenu = activeView === "ch_fx";
  const isChannelProcessorMenu = activeView === "ch_proc";
  const showFaders = !isChannelFXMenu && !isChannelProcessorMenu;

  return (
    <>
      <div className="NavBar h-top-nav-area">
        <TopNavBar activeView={activeView} setActiveView={setActiveView} />
      </div>
      <div className="SecondNav h-second-nav-area">
        {isChannelProcessorMenu && (
          <ChannelSelectNavBar
            selected={channelSelected}
            onSelect={setChannelSelected}
          />
        )}
        {isChannelProcessorMenu && (
          <ChannelProcNavBar
            selected={processorSelected}
            onSelect={setProcessorSelected}
          ></ChannelProcNavBar>
        )}
      </div>
      <div className="Mixer h-mixer-area">
        {showFaders && <FadersPanel activeView={activeView}></FadersPanel>}

        {isChannelProcessorMenu && (
          <ProcPanel
            selectedChannel={channelSelected}
            selectedProcessor={processorSelected}
          />
        )}
        {isChannelFXMenu && <ChannelFXPanel />}
      </div>
    </>
  );
}

export default App;
