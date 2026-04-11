import { Bell, Headphones, Plus, Search, Users } from "lucide-react";
import { DASHBOARD_SECTIONS } from "@shared/index.js";
import { iconMap } from "./constants.jsx";

export function Sidebar({ activeSection, isAuthenticated, onOpenAuth, onSectionChange, onFreeGame }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo-header">
        <img src="/playsol-logo.png" alt="PlaySol" className="sidebar-logo-large" />
      </div>

      <div className="nav-stack">
        {DASHBOARD_SECTIONS.filter((section) => section.id !== "friends" && section.id !== "profile").map((section) => {
          const Icon = iconMap[section.icon];
          const locked = section.protected && !isAuthenticated;
          return (
            <button
              key={section.id}
              type="button"
              className={`nav-btn ${activeSection === section.id ? "active" : ""}`}
              onClick={() => (locked ? onOpenAuth() : onSectionChange(section.id))}
              title={locked ? `${section.label} (Login erforderlich)` : section.label}
            >
              <Icon size={20} />
            </button>
          );
        })}
      </div>

      <button type="button" className="plus-wrap" onClick={onFreeGame} title="Free Game in neuem Tab starten">
        <span className="plus-btn">
          <Plus size={22} />
        </span>
      </button>
    </aside>
  );
}

export function Topbar({ greetingName, isAuthenticated, searchQuery, onSearchChange, onFreeGame, onNotifications, onProfile }) {
  return (
    <header className="topbar">
      <div className="greeting">
        Good evening, <b>{greetingName}</b>
      </div>

      <label className="search">
        <Search size={18} />
        <input value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search dashboard" />
      </label>

      <button type="button" className="top-icon notify" onClick={onNotifications} title="Notifications">
        <Bell size={18} />
      </button>

      <button type="button" className="profile-pill" onClick={onProfile}>
        <span className="profile-face profile-face-gold" />
        <span>{isAuthenticated ? "Profile" : "Login"}</span>
      </button>
    </header>
  );
}

export function RightRail({ entries, onFriends, onOverview, onVoice }) {
  return (
    <aside className="rail">
      <div className="rail-list rail-list-top">
        <div className="avatar avatar-primary">
          <span className="profile-face profile-face-gold" />
        </div>
      </div>

      <div className="rail-list">
        {entries.map((entry) => (
          <div key={entry.id} className={`avatar ${entry.online ? "online" : ""}`} title={entry.label}>
            <span className={`avatar-face avatar-face-${entry.accent}`} />
          </div>
        ))}
      </div>

      <div className="rail-bottom">
        <button type="button" className="round-btn dark" onClick={onVoice}>
          <Headphones size={17} />
        </button>
        <button type="button" className="round-btn alert" onClick={onFriends}>
          <Users size={17} />
        </button>
        <button type="button" className="ps-badge" onClick={onOverview}>
          PS
        </button>
      </div>
    </aside>
  );
}
