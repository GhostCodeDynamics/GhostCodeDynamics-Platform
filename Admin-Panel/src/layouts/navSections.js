import {
  FileText,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Settings,
} from "lucide-react";

/** Sidebar navigation model — sections mirror the admin modules. */
export const NAV_SECTIONS = [
  {
    label: "Content",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/posts", label: "Blog", icon: FileText },
      { to: "/projects", label: "Portfolio", icon: FolderKanban },
    ],
  },
  {
    label: "Engagement",
    items: [
      { to: "/comments", label: "Comments", icon: MessageSquare },
      { to: "/contacts", label: "Contacts", icon: Mail },
      { to: "/newsletter", label: "Newsletter", icon: Inbox },
    ],
  },
  {
    label: "System",
    items: [{ to: "/settings", label: "Settings", icon: Settings }],
  },
];
