import { useAuth } from "../hooks/useAuth";
import { SettingsView } from "../features/settings/SettingsView";

export default function SettingsPage() {
  const { admin } = useAuth();
  return <SettingsView admin={admin} />;
}
