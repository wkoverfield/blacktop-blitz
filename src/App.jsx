import { useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import MainMenu from "./components/MainMenu";
import TeamSelection from "./components/TeamSelection";
import About from "./pages/About";
import Feedback from "./pages/Feedback";
import PageviewTracker from "./components/PageviewTracker";
import ErrorBoundary from "./components/ErrorBoundary";
import CourtBackdrop from "./components/CourtBackdrop";
import { useTimeOfDay } from "./hooks/useTimeOfDay";
import { preloadPlayers } from "./lib/nba2kapi";
import { attachAutoplayGesture } from "./lib/chiptune";

function App() {
  // Panel skin (light/dark) follows time of day; every skin-aware CSS rule
  // keys off this data-skin attribute.
  const { skin } = useTimeOfDay();

  // Kick off the players.json fetch as soon as the app mounts so it lands in
  // cache while the user reads the landing page and fills out the draft form.
  // Music (packet 003) arms on the first user gesture — autoplay policy
  // forbids starting the AudioContext before one. Idempotent, so StrictMode's
  // double-mount is harmless.
  useEffect(() => {
    preloadPlayers();
    attachAutoplayGesture();
  }, []);

  return (
    <Router>
      <div
        data-skin={skin}
        className="App relative h-screen overflow-auto font-pixel"
      >
        {/* The one and only backdrop mount — screens never mount their own. */}
        <CourtBackdrop />
        <PageviewTracker />
        <div className="relative z-10 flex h-full flex-col">
          <ErrorBoundary>
            <Routes>
              <>
                <Route exact path="/" element={<MainMenu />} />
                <Route path="/qplay" element={<TeamSelection />} />
                <Route path="/about" element={<About />} />
                <Route path="/feedback" element={<Feedback />} />
              </>
            </Routes>
          </ErrorBoundary>
        </div>
      </div>
    </Router>
  );
}

export default App;
