import { useState } from "react";
import PhoneFrame from "./components/PhoneFrame.jsx";
import TopBar from "./components/TopBar.jsx";
import BottomNav from "./components/BottomNav.jsx";
import TodayPlan from "./screens/TodayPlan.jsx";
import MapView from "./screens/MapView.jsx";
import History from "./screens/History.jsx";
import Profile from "./screens/Profile.jsx";
import Auth from "./screens/Auth.jsx";
import OutletVisit from "./screens/OutletVisit.jsx";
import { OUTLETS, SEED_VISITS } from "./data/outlets.js";
import { INK, MUTE, PAGE } from "./theme.js";

const META = {
  today: { kicker: "Mon 17 Aug · Beat DAD-04", title: "Today's plan" },
  map: { kicker: "Route · 10 stops", title: "Map view" },
  history: { kicker: "Visit records", title: "History" },
  profile: { kicker: "Account", title: "Profile" },
};

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState("today");
  const [offline, setOffline] = useState(false);
  // Rep identity carried over from onboarding (name + chosen industry).
  const [profile, setProfile] = useState({ name: "Nikhil Deshmukh", industry: "FMCG · Food & staples" });
  // Visit statuses drive both the plan list and the map markers.
  const [visits, setVisits] = useState(SEED_VISITS);
  // Which outlet's visit sheet is open (null = none).
  const [openId, setOpenId] = useState(null);

  const openOutlet = (id) => setOpenId(id);
  const closeVisit = () => setOpenId(null);
  const saveVisit = (id, record) => {
    setVisits((v) => ({ ...v, [id]: record }));
    setOpenId(null);
  };

  const openOutletObj = OUTLETS.find((o) => o.id === openId) || null;
  const openIdx = OUTLETS.findIndex((o) => o.id === openId);

  const enterApp = (p) => {
    setProfile({
      name: (p && p.name) || "Nikhil Deshmukh",
      industry: (p && p.industry) || "FMCG · Food & staples",
    });
    setAuthed(true);
  };

  const logout = () => {
    setAuthed(false);
    setTab("today");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: PAGE,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
        padding: "40px 16px 64px",
        boxSizing: "border-box",
      }}
    >
      <Header />

      <PhoneFrame>
        <div
          style={{
            position: "relative",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            background: "#f3f2f2",
            fontFamily: "'Archivo', sans-serif",
            overflow: "hidden",
          }}
        >
          {!authed ? (
            <Auth onDone={enterApp} />
          ) : (
            <>
              <TopBar
                kicker={META[tab].kicker}
                title={META[tab].title}
                offline={offline}
                onToggleSync={() => setOffline((o) => !o)}
              />

              <div
                className="phone-scroll"
                style={{ flex: 1, overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch" }}
              >
                {tab === "today" && (
                  <TodayPlan visits={visits} onOpenOutlet={openOutlet} onEndDay={() => {}} />
                )}
                {tab === "map" && <MapView visits={visits} onOpenOutlet={openOutlet} />}
                {tab === "history" && <History />}
                {tab === "profile" && (
                  <Profile
                    repName={profile.name}
                    industry={profile.industry}
                    offline={offline}
                    onSyncNow={() => setOffline(false)}
                    onLogout={logout}
                  />
                )}
              </div>

              <BottomNav tab={tab} onChange={setTab} />

              {openOutletObj && (
                <OutletVisit
                  key={openId}
                  outlet={openOutletObj}
                  visit={visits[openId]}
                  visitNum={openIdx + 1}
                  totalStops={OUTLETS.length}
                  onClose={closeVisit}
                  onCheckOut={saveVisit}
                  onConfirmSkip={saveVisit}
                />
              )}
            </>
          )}
        </div>
      </PhoneFrame>
    </div>
  );
}

function Header() {
  return (
    <div style={{ maxWidth: 393, width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <span
          style={{
            font: "600 10px/1 'Archivo', monospace",
            letterSpacing: ".14em",
            textTransform: "uppercase",
            background: INK,
            color: "#f3f2f2",
            padding: "5px 8px",
          }}
        >
          Phase 1
        </span>
        <span
          style={{
            font: "600 10px/1 'Archivo', monospace",
            letterSpacing: ".14em",
            textTransform: "uppercase",
            color: "#ec3013",
          }}
        >
          Rep App · Dadar beat
        </span>
      </div>
      <div style={{ font: "400 12px/1.5 'Archivo', sans-serif", color: MUTE }}>
        Opens on the welcome screen — log in (mobile + OTP) or sign up, both
        prefilled from test-credentials.txt. Then Today's Plan lists the day's
        outlets and the Map tab plots each on a free OpenFreeMap basemap.
      </div>
    </div>
  );
}
