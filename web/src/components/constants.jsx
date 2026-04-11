import {
  BriefcaseBusiness,
  CircleUserRound,
  Gamepad2,
  Gift,
  Home,
  MessageCircle,
  MonitorPlay,
  Store
} from "lucide-react";

export const iconMap = {
  home: Home,
  gamepad: Gamepad2,
  user: CircleUserRound,
  gift: Gift,
  store: Store,
  tv: MonitorPlay,
  briefcase: BriefcaseBusiness,
  chat: MessageCircle
};

export const sectionTitles = {
  overview: "Overview",
  play: "Play",
  profile: "Profile",
  inventory: "Inventory / Rewards",
  marketplace: "Marketplace",
  history: "Match-History",
  wallet: "Wallet",
  friends: "Friends"
};

export const placeholderRail = [
  { id: "one", label: "Kai", accent: "green", online: true },
  { id: "two", label: "Nia", accent: "red", online: true },
  { id: "three", label: "Jax", accent: "gold", online: true },
  { id: "four", label: "Mia", accent: "pink", online: false },
  { id: "five", label: "Lex", accent: "blue", online: true },
  { id: "six", label: "Zen", accent: "orange", online: false }
];
