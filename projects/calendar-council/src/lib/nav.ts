import {
  LayoutDashboard,
  FilePlus2,
  MessagesSquare,
  CalendarDays,
  History,
  BarChart3,
  Gavel,
  Cable,
  Settings,
  CreditCard,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

export const APP_NAV: NavItem[] = [
  { href: "/app", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/app/new", label: "New Request", icon: FilePlus2 },
  { href: "/app/negotiations", label: "Active Negotiations", icon: MessagesSquare },
  { href: "/app/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/app/history", label: "History", icon: History },
  { href: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/app/council", label: "My Council", icon: Gavel },
  { href: "/app/integrations", label: "Integrations", icon: Cable },
  { href: "/app/settings", label: "Settings", icon: Settings },
  { href: "/app/billing", label: "Billing", icon: CreditCard },
];

export const PLAN_LABELS: Record<string, string> = {
  observer: "Observer",
  governed: "Governed",
  institutional: "Institutional",
};
