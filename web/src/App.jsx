import { useDeferredValue, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import {
  DASHBOARD_SECTIONS,
  FREE_GAME_WINDOW_FEATURES,
  NOTIFICATION_ITEMS,
  normalizeUsername,
  usernameError
} from "@shared/index.js";
import { apiRequest, getDashboardBootstrap } from "./lib/api.js";
import { isSupabaseConfigured, supabase } from "./lib/supabase.js";
import { placeholderRail } from "./components/constants.jsx";
import { defaultDashboardState } from "./components/dashboard-defaults.jsx";
import { AuthModal, LoadingScreen, NotificationDrawer, UsernameModal } from "./components/Overlays.jsx";
import { GuardCard, LoadingCard, SectionContent } from "./components/SectionContent.jsx";
import { getSectionPresentation } from "./components/dashboard-presentation.jsx";
import { HeroSection } from "./components/HeroSection.jsx";
import { OverviewHome } from "./components/OverviewHome.jsx";
import { Sidebar, Topbar, RightRail } from "./components/ShellParts.jsx";

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
  const sectionBlocked = currentSection.protected && !isAuthenticated;
  const overviewReady = activeSection === "overview" && !dashboardLoading && !sectionBlocked;

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
  const sectionPresentation = getSectionPresentation({
    activeSection,
    dashboardState,
    isAuthenticated,
    currentUser,
    acceptedFriends: filteredAcceptedFriends,
    incomingFriends: filteredIncomingFriends,
    blockedFriends: filteredBlockedFriends
  });
  const handleMiniCardAction = (card) => {
    if (card.action === "launch-free") {
      openFreeGame(setToastMessage);
      return;
    }
    if (card.action === "protected" && !isAuthenticated) {
      setAuthModalMode("login");
      return;
    }
    if (card.action !== "noop") {
      setToastMessage(`${card.title} bleibt in V1 vorbereitet.`);
    }
  };

  if (booting || (location.pathname === "/auth/callback" && !session)) {
    return <LoadingScreen title="Dashboard wird geladen" copy="Session und Dashboard-Daten werden gerade vorbereitet." />;
  }

  const greetingName = dashboardState.profile?.username || currentUser?.username || "USERNAME";

  return (
    <div className="app-root">
      <div className="viewport-fit">
        <main className={`shell shell-${activeSection}`}>
          <div className={`layout layout-${activeSection}`}>
            <Sidebar
              activeSection={activeSection}
              isAuthenticated={isAuthenticated}
              onOpenAuth={() => setAuthModalMode("login")}
              onSectionChange={setActiveSection}
              onFreeGame={() => openFreeGame(setToastMessage)}
            />

            <section className={`main-panel main-panel-${activeSection}`}>
              <Topbar
                greetingName={greetingName}
                isAuthenticated={isAuthenticated}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onFreeGame={() => openFreeGame(setToastMessage)}
                onNotifications={() => setNotificationsOpen(true)}
                onProfile={() => (isAuthenticated ? setActiveSection("profile") : setAuthModalMode("login"))}
              />

              {activeSection === "overview" && dashboardLoading ? (
                <LoadingScreen title="Overview wird geladen" copy="Free Game, Stats und Account-Daten werden gerade sauber vorbereitet." />
              ) : overviewReady ? (
                <OverviewHome
                  presentation={sectionPresentation}
                  dashboardState={dashboardState}
                  onQuickAction={() => openFreeGame(setToastMessage)}
                  onMiniCardAction={handleMiniCardAction}
                />
              ) : activeSection === "marketplace" ? (
                <section className="section-canvas section-canvas-marketplace-full">
                  <HeroSection
                    hero={sectionPresentation.hero}
                    miniCards={sectionPresentation.miniCards}
                    onMiniCardAction={handleMiniCardAction}
                  />
                  {dashboardLoading ? (
                    <LoadingCard />
                  ) : sectionBlocked ? (
                    <GuardCard onLogin={() => setAuthModalMode("login")} />
                  ) : (
                    <SectionContent
                      activeSection={activeSection}
                      dashboardState={dashboardState}
                      currentUser={currentUser}
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
                      onLogout={handleLogout}
                    />
                  )}
                </section>
              ) : activeSection === "play" ? (
                <section className="section-canvas section-canvas-play-full">
                  <HeroSection
                    hero={sectionPresentation.hero}
                    miniCards={sectionPresentation.miniCards}
                    onMiniCardAction={handleMiniCardAction}
                  />
                  {dashboardLoading ? (
                    <LoadingCard />
                  ) : sectionBlocked ? (
                    <GuardCard onLogin={() => setAuthModalMode("login")} />
                  ) : (
                    <SectionContent
                      activeSection={activeSection}
                      dashboardState={dashboardState}
                      currentUser={currentUser}
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
                      onLogout={handleLogout}
                    />
                  )}
                </section>
              ) : activeSection === "profile" ? (
                <section className="section-canvas section-canvas-profile-full">
                  {dashboardLoading ? (
                    <LoadingCard />
                  ) : sectionBlocked ? (
                    <GuardCard onLogin={() => setAuthModalMode("login")} />
                  ) : (
                    <SectionContent
                      activeSection={activeSection}
                      dashboardState={dashboardState}
                      currentUser={currentUser}
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
                      onLogout={handleLogout}
                    />
                  )}
                </section>
              ) : (
                <>
                  <HeroSection
                    hero={sectionPresentation.hero}
                    miniCards={sectionPresentation.miniCards}
                    onMiniCardAction={handleMiniCardAction}
                  />
                  <section className={`section-canvas section-canvas-${activeSection}`}>
                    {dashboardLoading ? (
                      <LoadingCard />
                    ) : sectionBlocked ? (
                      <GuardCard onLogin={() => setAuthModalMode("login")} />
                    ) : (
                      <SectionContent
                      activeSection={activeSection}
                      dashboardState={dashboardState}
                      currentUser={currentUser}
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
                      onLogout={handleLogout}
                    />
                  )}
                </section>
                </>
              )}
            </section>

            <RightRail
              entries={railEntries}
              onFriends={() => setActiveSection("friends")}
              onOverview={() => setActiveSection("overview")}
              onVoice={() => setToastMessage("Voice / Party kommt spaeter.")}
            />
          </div>
        </main>
      </div>

      {toastMessage ? <div className="toast">{toastMessage}</div> : null}
      {authModalMode ? <AuthModal mode={authModalMode} onSwitchMode={setAuthModalMode} authForm={authForm} setAuthForm={setAuthForm} onClose={() => !authBusy && (setAuthModalMode(null), setAuthError(""))} authBusy={authBusy} authError={authError} onSubmit={handleEmailAuth} onGoogle={handleGoogleAuth} /> : null}
      {notificationsOpen ? <NotificationDrawer onClose={() => setNotificationsOpen(false)} items={NOTIFICATION_ITEMS} /> : null}
      {needsUsernameCompletion ? <UsernameModal usernameDraft={usernameDraft} setUsernameDraft={setUsernameDraft} usernameBusy={usernameBusy} usernameSubmitError={usernameSubmitError} onSubmit={handleUsernameSubmit} /> : null}
    </div>
  );
}
