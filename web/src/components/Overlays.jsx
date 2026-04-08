import { Bell, CircleUserRound, LogOut, Wallet, X } from "lucide-react";
import { API_BASE_URL } from "../lib/api.js";
import { formatCurrency } from "../lib/formatters.js";

export function AuthModal({ mode, onSwitchMode, authForm, setAuthForm, onClose, authBusy, authError, onSubmit, onGoogle }) {
  return (
    <div className="overlay">
      <div className="modal-card">
        <button type="button" className="icon-dismiss" onClick={onClose}>
          <X size={18} />
        </button>
        <div className="modal-copy">
          <span className="eyebrow">Account</span>
          <h2>{mode === "register" ? "Register mit Email" : "Login mit Email"}</h2>
          <p>Supabase bleibt die einzige Auth-Authority. Das Dashboard-Backend validiert spaeter nur deinen Bearer Token.</p>
        </div>

        <div className="auth-tabs">
          <button type="button" className={mode === "login" ? "active" : ""} onClick={() => onSwitchMode("login")}>
            Login
          </button>
          <button type="button" className={mode === "register" ? "active" : ""} onClick={() => onSwitchMode("register")}>
            Register
          </button>
        </div>

        <form
          className="auth-form"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(mode);
          }}
        >
          <label>
            Email
            <input
              type="email"
              value={authForm.email}
              onChange={(event) => setAuthForm((currentState) => ({ ...currentState, email: event.target.value }))}
              required
            />
          </label>

          <label>
            Passwort
            <input
              type="password"
              value={authForm.password}
              onChange={(event) => setAuthForm((currentState) => ({ ...currentState, password: event.target.value }))}
              minLength={8}
              required
            />
          </label>

          {authError ? <div className="inline-error">{authError}</div> : null}

          <button type="submit" className="primary-button" disabled={authBusy}>
            {authBusy ? "Bitte warten..." : mode === "register" ? "Account erstellen" : "Einloggen"}
          </button>
        </form>

        <button type="button" className="secondary-button" onClick={onGoogle} disabled={authBusy}>
          <CircleUserRound size={18} />
          Mit Google fortfahren
        </button>

        <div className="modal-hint">Free Game bleibt auch ohne Login direkt verfuegbar.</div>
      </div>
    </div>
  );
}

export function ProfileModal({ user, profile, wallet, onClose, onLogout }) {
  return (
    <div className="overlay overlay-end">
      <div className="drawer-card">
        <div className="drawer-header">
          <div>
            <span className="eyebrow">Profile / Settings</span>
            <h2>{profile?.username || user?.username || "No username yet"}</h2>
          </div>
          <button type="button" className="icon-dismiss" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="profile-block">
          <div className="profile-avatar-large">
            <span className="profile-face profile-face-gold" />
          </div>
          <div className="profile-data">
            <strong>{user?.email || "Keine Email"}</strong>
            <span>API base: {API_BASE_URL}</span>
          </div>
        </div>

        <div className="profile-grid">
          <div className="profile-tile">
            <span>Cash</span>
            <strong>{formatCurrency(wallet.cash_balance)} $</strong>
          </div>
          <div className="profile-tile">
            <span>SOL</span>
            <strong>{formatCurrency(wallet.sol_balance)} SOL</strong>
          </div>
          <div className="profile-tile">
            <span>Security</span>
            <strong>Supabase Auth</strong>
          </div>
          <div className="profile-tile">
            <span>Username</span>
            <strong>{profile?.username || "Noch offen"}</strong>
          </div>
        </div>

        <button type="button" className="secondary-button danger" onClick={onLogout}>
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );
}

export function NotificationDrawer({ onClose, items }) {
  return (
    <div className="overlay overlay-end">
      <div className="drawer-card">
        <div className="drawer-header">
          <div>
            <span className="eyebrow">Notifications</span>
            <h2>Dashboard V1 Status</h2>
          </div>
          <button type="button" className="icon-dismiss" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="notification-list">
          {items.map((item) => (
            <div key={item.id} className="notification-card">
              <div className="notification-icon">
                <Bell size={16} />
              </div>
              <div>
                <strong>{item.title}</strong>
                <span>{item.copy}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function UsernameModal({ usernameDraft, setUsernameDraft, usernameBusy, usernameSubmitError, onSubmit }) {
  return (
    <div className="overlay blocking-overlay">
      <div className="modal-card compact">
        <div className="modal-copy">
          <span className="eyebrow">Username required</span>
          <h2>Bitte zuerst deinen Username setzen</h2>
          <p>Ohne gueltigen Username bleibt das Dashboard bewusst blockiert. V1 erlaubt den Username nur beim ersten Setzen.</p>
        </div>

        <form className="auth-form" onSubmit={onSubmit}>
          <label>
            Username
            <input value={usernameDraft} onChange={(event) => setUsernameDraft(event.target.value)} placeholder="playsol_user" />
          </label>
          <div className="modal-hint">Erlaubt: 3-20 Zeichen, nur a-z, 0-9 und _</div>
          {usernameSubmitError ? <div className="inline-error">{usernameSubmitError}</div> : null}
          <button type="submit" className="primary-button" disabled={usernameBusy}>
            {usernameBusy ? "Speichern..." : "Username speichern"}
          </button>
        </form>
      </div>
    </div>
  );
}

export function LoadingScreen({ title, copy }) {
  return (
    <div className="route-screen">
      <div className="route-card">
        <Wallet className="spin" size={28} />
        <div>
          <h1>{title}</h1>
          <p>{copy}</p>
        </div>
      </div>
    </div>
  );
}
