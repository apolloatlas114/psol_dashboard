import { useDeferredValue, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronRight,
  Headphones,
  LoaderCircle,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Swords,
  Trophy,
  Users,
  Wallet
} from "lucide-react";
import {
  DASHBOARD_SECTIONS,
  FREE_GAME_WINDOW_FEATURES,
  GAME_MODE_CARDS,
  NOTIFICATION_ITEMS,
  normalizeUsername,
  usernameError
} from "@shared/index.js";
import { apiRequest, getDashboardBootstrap } from "./lib/api.js";
import { isSupabaseConfigured, supabase } from "./lib/supabase.js";
import { iconMap, placeholderRail, sectionTitles } from "./components/constants.jsx";
import { defaultDashboardState } from "./components/dashboard-defaults.jsx";
import { AuthModal, LoadingScreen, NotificationDrawer, ProfileModal, UsernameModal } from "./components/Overlays.jsx";
import { GuardCard, LoadingCard, SectionContent } from "./components/SectionContent.jsx";
import { formatCurrency, formatNumber } from "./lib/formatters.js";

const FREE_GAME_URL = import.meta.env.VITE_FREE_GAME_URL || "";

function openFreeGame(notify) {
  if (!FREE_GAME_URL) {
    notify("VITE_FREE_GAME_URL fehlt noch in deiner Web-Config.");
    return;
  }

  window.open(FREE_GAME_URL, "_blank", FREE_GAME_WINDOW_FEATURES);
}

function AuthCallback() {
  return <LoadingScreen title="Google Login wird abgeschlossen" copy="Die Session wird gerade geladen und danach direkt ins Dashboard uebernommen." />;
}

function useDashboardSession() {
  const [session, setSession] = useState(null);
  const [booting, setBooting] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let ignore = false;

    if (!isSupabaseConfigured || !supabase) {
      setSession(null);
      setBooting(false);
      return () => {
        ignore = true;
      };
    }

    async function loadInitialSession() {
      const {
        data: { session: initialSession }
      } = await supabase.auth.getSession();

      if (!ignore) {
        setSession(initialSession);
        setBooting(false);
      }
    }

    loadInitialSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setBooting(false);
      if (window.location.pathname === "/auth/callback") {
        navigate("/", { replace: true });
      }
    });

    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, [navigate]);

  return { session, booting };
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardApp />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function DashboardApp() {
  const { session, booting } = useDashboardSession();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState("overview");
  const [dashboardState, setDashboardState] = useState(defaultDashboardState);
  const [currentUser, setCurrentUser] = useState(null);
  const [needsUsernameCompletion, setNeedsUsernameCompletion] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [authModalMode, setAuthModalMode] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [authForm, setAuthForm] = useState({ email: "", password: "" });
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [usernameDraft, setUsernameDraft] = useState("");
  const [usernameBusy, setUsernameBusy] = useState(false);
  const [usernameSubmitError, setUsernameSubmitError] = useState("");
  const [friendRequestName, setFriendRequestName] = useState("");
  const [friendBusy, setFriendBusy] = useState(false);

  const deferredSearch = useDeferredValue(searchQuery.trim().toLowerCase());
  const isAuthenticated = Boolean(currentUser);
  const currentSection = DASHBOARD_SECTIONS.find((item) => item.id === activeSection) || DASHBOARD_SECTIONS[0];

  useEffect(() => {
    if (!toastMessage) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setToastMessage(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  useEffect(() => {
    let ignore = false;

    async function hydrateDashboard() {
      if (!session?.access_token) {
        if (!ignore) {
          setDashboardState(defaultDashboardState);
          setCurrentUser(null);
          setNeedsUsernameCompletion(false);
          setDashboardLoading(false);
        }
        return;
      }

      setDashboardLoading(true);

      try {
        const authState = await apiRequest("/api/auth/me", {
          token: session.access_token
        });

        if (ignore) {
          return;
        }

        setCurrentUser(authState.data.user);
        setNeedsUsernameCompletion(authState.data.needs_username_completion);
        setUsernameDraft(authState.data.user?.username || "");

        const bootstrap = await getDashboardBootstrap(session.access_token);
        if (!ignore) {
          setDashboardState(bootstrap);
        }
      } catch (error) {
        if (ignore) {
          return;
        }

        if (error.status === 401) {
          await supabase.auth.signOut();
        } else {
          setToastMessage(error.message || "Dashboard-Daten konnten nicht geladen werden.");
        }
      } finally {
        if (!ignore) {
          setDashboardLoading(false);
        }
      }
    }

    hydrateDashboard();

    return () => {
      ignore = true;
    };
  }, [session]);

  useEffect(() => {
    if (!isAuthenticated && currentSection.protected) {
      setActiveSection("overview");
    }
  }, [currentSection.protected, isAuthenticated]);

  async function refreshFriends() {
    if (!session?.access_token) {
      return;
    }

    const response = await apiRequest("/api/friends", {
      token: session.access_token
    });

    setDashboardState((currentState) => ({
      ...currentState,
      friends: response.data
    }));
  }

  async function handleEmailAuth(mode) {
    if (!isSupabaseConfigured || !supabase) {
      setAuthError("Supabase ist noch nicht konfiguriert. Bitte zuerst die Web-Env setzen.");
      return;
    }

    setAuthBusy(true);
    setAuthError("");

    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email: authForm.email.trim(),
          password: authForm.password
        });
        if (error) throw error;
        setToastMessage("Account erstellt. Wenn Email-Bestaetigung aktiv ist, bestaetige bitte zuerst deine Mail.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: authForm.email.trim(),
          password: authForm.password
        });
        if (error) throw error;
      }

      setAuthModalMode(null);
      setAuthForm({ email: "", password: "" });
    } catch (error) {
      setAuthError(error.message || "Auth fehlgeschlagen.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleGoogleAuth() {
    if (!isSupabaseConfigured || !supabase) {
      setAuthError("Supabase ist noch nicht konfiguriert. Bitte zuerst die Web-Env setzen.");
      return;
    }

    setAuthBusy(true);
    setAuthError("");

    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo }
      });
      if (error) throw error;
    } catch (error) {
      setAuthBusy(false);
      setAuthError(error.message || "Google Login konnte nicht gestartet werden.");
    }
  }

  async function handleLogout() {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    setProfileOpen(false);
    setToastMessage("Du bist jetzt ausgeloggt.");
  }

  async function handleUsernameSubmit(event) {
    event.preventDefault();
    const validationMessage = usernameError(usernameDraft);
    if (validationMessage) {
      setUsernameSubmitError(validationMessage);
      return;
    }

    if (!session?.access_token) {
      setUsernameSubmitError("Keine aktive Session gefunden.");
      return;
    }

    setUsernameBusy(true);
    setUsernameSubmitError("");

    try {
      const response = await apiRequest("/api/profile/username", {
        method: "PATCH",
        token: session.access_token,
        body: { username: normalizeUsername(usernameDraft) }
      });

      setCurrentUser(response.data.user);
      setDashboardState((currentState) => ({
        ...currentState,
        profile: {
          ...currentState.profile,
          ...response.data.user
        }
      }));
      setNeedsUsernameCompletion(false);
      setToastMessage("Username gespeichert.");
    } catch (error) {
      setUsernameSubmitError(error.message || "Username konnte nicht gespeichert werden.");
    } finally {
      setUsernameBusy(false);
    }
  }

  async function handleFriendRequest(event) {
    event.preventDefault();
    if (!session?.access_token) {
      setToastMessage("Bitte zuerst einloggen.");
      return;
    }
    if (!friendRequestName.trim()) {
      setToastMessage("Bitte Username eingeben.");
      return;
    }

    setFriendBusy(true);
    try {
      await apiRequest("/api/friends/request", {
        method: "POST",
        token: session.access_token,
        body: { username: normalizeUsername(friendRequestName) }
      });
      setFriendRequestName("");
      await refreshFriends();
      setToastMessage("Friend Request gesendet.");
    } catch (error) {
      setToastMessage(error.message || "Friend Request fehlgeschlagen.");
    } finally {
      setFriendBusy(false);
    }
  }

  async function handleFriendAction(relationId, action) {
    if (!session?.access_token) {
      setToastMessage("Bitte zuerst einloggen.");
      return;
    }

    try {
      await apiRequest(`/api/friends/${relationId}/${action}`, {
        method: "POST",
        token: session.access_token
      });
      await refreshFriends();
      setToastMessage(`Friend-State aktualisiert: ${action}.`);
    } catch (error) {
      setToastMessage(error.message || "Aktion fehlgeschlagen.");
    }
  }

  const filteredAcceptedFriends = dashboardState.friends.accepted.filter((entry) =>
    `${entry.username || ""} ${entry.email || ""}`.toLowerCase().includes(deferredSearch)
  );
  const filteredIncomingFriends = dashboardState.friends.incoming.filter((entry) =>
    `${entry.username || ""} ${entry.email || ""}`.toLowerCase().includes(deferredSearch)
  );
  const filteredOutgoingFriends = dashboardState.friends.outgoing.filter((entry) =>
    `${entry.username || ""} ${entry.email || ""}`.toLowerCase().includes(deferredSearch)
  );
  const filteredBlockedFriends = dashboardState.friends.blocked.filter((entry) =>
    `${entry.username || ""} ${entry.email || ""}`.toLowerCase().includes(deferredSearch)
  );
  const filteredHistoryItems = dashboardState.history.items.filter((entry) =>
    `${entry.mode || ""} ${entry.reward_label || ""}`.toLowerCase().includes(deferredSearch)
  );
  const railEntries = filteredAcceptedFriends.length
    ? filteredAcceptedFriends.slice(0, 6).map((friend, index) => ({
        id: friend.id,
        label: friend.username || friend.email || `Friend ${index + 1}`,
        accent: ["green", "red", "gold", "pink", "blue", "orange"][index % 6],
        online: false
      }))
    : placeholderRail;

  if (booting || (location.pathname === "/auth/callback" && !session)) {
    return <LoadingScreen title="Dashboard wird geladen" copy="Session und Dashboard-Daten werden gerade vorbereitet." />;
  }

  const greetingName = dashboardState.profile?.username || currentUser?.username || "USERNAME";

  return (
    <div className="app-root">
      <div className="viewport-fit">
        <main className="shell">
          <div className="layout">
            <aside className="sidebar">
              <div className="brand">PS</div>
              <div className="nav-stack">
                {DASHBOARD_SECTIONS.map((section) => {
                  const Icon = iconMap[section.icon];
                  const locked = section.protected && !isAuthenticated;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      className={`nav-btn ${activeSection === section.id ? "active" : ""}`}
                      onClick={() => (locked ? setAuthModalMode("login") : setActiveSection(section.id))}
                      title={locked ? `${section.label} (Login erforderlich)` : section.label}
                    >
                      <Icon size={20} />
                    </button>
                  );
                })}
              </div>
              <button type="button" className="plus-wrap" onClick={() => openFreeGame(setToastMessage)} title="Free Game in neuem Tab starten">
                <span className="plus-btn">
                  <Plus size={22} />
                </span>
              </button>
            </aside>

            <section className="main-panel">
              <header className="topbar">
                <div className="greeting">
                  Good evening, <b>{greetingName}</b>
                </div>
                <label className="search">
                  <Search size={18} />
                  <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search dashboard" />
                </label>
                <button type="button" className="top-icon" onClick={() => openFreeGame(setToastMessage)} title="Free Game">
                  <Swords size={18} />
                </button>
                <button type="button" className="top-icon notify" onClick={() => setNotificationsOpen(true)} title="Notifications">
                  <Bell size={18} />
                </button>
                <button type="button" className="profile-pill" onClick={() => (isAuthenticated ? setProfileOpen(true) : setAuthModalMode("login"))}>
                  <span className="profile-face profile-face-gold" />
                  <span>{isAuthenticated ? "Profile" : "Login"}</span>
                </button>
              </header>

              <section className="hero-grid">
                <article className="hero-card">
                  <div className="hero-content">
                    <div className="chips">
                      <span className="chip popular"><span className="chip-ring" />Popular</span>
                      <span className="chip small">V1</span>
                      <span className="chip small">{isAuthenticated ? "LIVE" : "GUEST"}</span>
                    </div>
                    <div className="hero-logo"><span>PlaySol</span><span className="hero-logo-sub">Dashboard</span></div>
                    <div className="hero-text">
                      {isAuthenticated
                        ? "Profile, Progress, Match-History, Inventory und Friends laufen jetzt ueber einen eigenstaendigen Dashboard-Stack mit Supabase Auth."
                        : "Free Game bleibt sofort verfuegbar. Mit Account kommen spaeter Progress, Match-History, Friends, Wallet und Inventory direkt dazu."}
                    </div>
                    <div className="hero-footer">
                      <div className="bubbles"><span className="bubble bubble-blue" /><span className="bubble bubble-pink" /><span className="bubble bubble-green" /></div>
                      <div className="reviews">
                        <ShieldCheck size={16} />
                        <div>
                          <strong>{isAuthenticated ? `Lvl ${dashboardState.stats.progress.level}` : "Guest"}</strong>
                          <span>{isAuthenticated ? `${dashboardState.stats.progress.rank} rank` : "Account fuer Progress verbinden"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>

                <aside className="hero-side">
                  <div className="dots"><span /><span /><span /></div>
                  {GAME_MODE_CARDS.map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      className={`side-card ${mode.locked && !isAuthenticated ? "locked" : ""}`}
                      onClick={() => {
                        if (mode.id === "free") return openFreeGame(setToastMessage);
                        if (!isAuthenticated) return setAuthModalMode("login");
                        setToastMessage(`${mode.title} bleibt in V1 vorbereitet.`);
                      }}
                    >
                      <div className={`cover ${mode.accent}`} />
                      <div className="side-copy">
                        <div className="side-title">{mode.title}</div>
                        <div className="side-sub">{mode.subtitle}</div>
                      </div>
                      <ChevronRight size={18} />
                    </button>
                  ))}
                </aside>
              </section>

              <div className="section-row">
                <div className="section-title">{sectionTitles[activeSection]}</div>
                <button type="button" className="see-more" onClick={() => (activeSection === "play" ? openFreeGame(setToastMessage) : setToastMessage("Dieser Bereich ist in V1 als kompaktes Dashboard-Panel angelegt."))}>
                  Quick Action
                </button>
                <div className="section-title-right">{isAuthenticated ? "Your Statistic" : "Member Dashboard"}</div>
                <div className="arrow-wrap"><ChevronRight size={18} /></div>
              </div>

              <section className="content-grid">
                <div className="content-stack">
                  {dashboardLoading ? (
                    <LoadingCard />
                  ) : currentSection.protected && !isAuthenticated ? (
                    <GuardCard onLogin={() => setAuthModalMode("login")} />
                  ) : (
                    <SectionContent
                      activeSection={activeSection}
                      dashboardState={dashboardState}
                      filteredHistoryItems={filteredHistoryItems}
                      filteredAcceptedFriends={filteredAcceptedFriends}
                      filteredIncomingFriends={filteredIncomingFriends}
                      filteredOutgoingFriends={filteredOutgoingFriends}
                      filteredBlockedFriends={filteredBlockedFriends}
                      friendRequestName={friendRequestName}
                      setFriendRequestName={setFriendRequestName}
                      onFriendRequest={handleFriendRequest}
                      onFriendAction={handleFriendAction}
                      friendBusy={friendBusy}
                      onOpenAuth={() => setAuthModalMode("login")}
                      onOpenFreeGame={() => openFreeGame(setToastMessage)}
                    />
                  )}
                </div>

                <aside className="stats-panel">
                  <div className="ring">
                    <div className="ring-center">
                      <div className="ring-label">{isAuthenticated ? "XP to next level" : "Players online"}</div>
                      <div className="ring-value">{isAuthenticated ? formatNumber(dashboardState.stats.progress.xp) : "230,486"}</div>
                      <div className="ring-meta">{isAuthenticated ? `Level ${dashboardState.stats.progress.level}` : "Live population preview"}</div>
                    </div>
                  </div>

                  <div className="stats-row">
                    <div className="stat-mini">
                      <div className="stat-icon red"><Wallet size={16} /></div>
                      <div className="stat-value">{formatCurrency(dashboardState.wallet.cash_balance)} $</div>
                      <div className="stat-label">Cash</div>
                    </div>
                    <div className="stat-mini">
                      <div className="stat-icon yellow"><Users size={16} /></div>
                      <div className="stat-value">{dashboardState.friends.accepted.length}</div>
                      <div className="stat-label">Friends</div>
                    </div>
                    <div className="stat-mini">
                      <div className="stat-icon blue"><Trophy size={16} /></div>
                      <div className="stat-value">{formatNumber(dashboardState.stats.stats.highest_score)}</div>
                      <div className="stat-label">Highscore</div>
                    </div>
                  </div>

                  <div className="panel-note">
                    <Sparkles size={16} />
                    <span>{isAuthenticated ? "Stats und Progress kommen bereits aus der Dashboard-API. Realtime folgt spaeter." : "Free Game funktioniert schon fuer Guests. Fuer gespeicherten Progress bitte einloggen."}</span>
                  </div>
                </aside>
              </section>
            </section>

            <aside className="rail">
              <div className="rail-list rail-list-top">
                <div className="avatar avatar-primary"><span className="profile-face profile-face-gold" /></div>
              </div>
              <div className="rail-list">
                {railEntries.map((entry) => (
                  <div key={entry.id} className={`avatar ${entry.online ? "online" : ""}`} title={entry.label}>
                    <span className={`avatar-face avatar-face-${entry.accent}`} />
                  </div>
                ))}
              </div>
              <div className="rail-bottom">
                <button type="button" className="round-btn dark" onClick={() => setToastMessage("Voice / Party kommt spaeter.")}><Headphones size={17} /></button>
                <button type="button" className="round-btn alert" onClick={() => setActiveSection("friends")}><Users size={17} /></button>
                <button type="button" className="ps-badge" onClick={() => setActiveSection("overview")}>PS</button>
              </div>
            </aside>
          </div>
        </main>
      </div>

      {toastMessage ? <div className="toast">{toastMessage}</div> : null}
      {authModalMode ? <AuthModal mode={authModalMode} onSwitchMode={setAuthModalMode} authForm={authForm} setAuthForm={setAuthForm} onClose={() => !authBusy && (setAuthModalMode(null), setAuthError(""))} authBusy={authBusy} authError={authError} onSubmit={handleEmailAuth} onGoogle={handleGoogleAuth} /> : null}
      {profileOpen ? <ProfileModal user={currentUser} profile={dashboardState.profile} wallet={dashboardState.wallet} onClose={() => setProfileOpen(false)} onLogout={handleLogout} /> : null}
      {notificationsOpen ? <NotificationDrawer onClose={() => setNotificationsOpen(false)} items={NOTIFICATION_ITEMS} /> : null}
      {needsUsernameCompletion ? <UsernameModal usernameDraft={usernameDraft} setUsernameDraft={setUsernameDraft} usernameBusy={usernameBusy} usernameSubmitError={usernameSubmitError} onSubmit={handleUsernameSubmit} /> : null}
    </div>
  );
}
