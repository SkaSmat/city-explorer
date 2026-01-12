import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Moon, Globe, MapPin, Shield, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AppLayout } from "@/components/layout/AppLayout";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Settings() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(true);
  const [badgeNotifications, setBadgeNotifications] = useState(true);
  const [streakReminders, setStreakReminders] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("fr");
  const [units, setUnits] = useState("metric");
  const [publicProfile, setPublicProfile] = useState(false);

  const handleSave = () => {
    toast.success("Préférences sauvegardées");
  };

  const handleDeleteAccount = () => {
    toast.info("Fonctionnalité en cours de développement");
  };

  return (
    <AppLayout>
      <div className="px-6 py-8 pb-24">
        {/* Header */}
        <header className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Préférences</h1>
        </header>

        {/* Notifications Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Notifications
          </h2>
          <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifications" className="font-medium">Notifications push</Label>
                <p className="text-sm text-muted-foreground">Recevoir des notifications</p>
              </div>
              <Switch
                id="notifications"
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="badges" className="font-medium">Badges débloqués</Label>
                <p className="text-sm text-muted-foreground">Notification lors d'un nouveau badge</p>
              </div>
              <Switch
                id="badges"
                checked={badgeNotifications}
                onCheckedChange={setBadgeNotifications}
                disabled={!notifications}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="streak" className="font-medium">Rappels de streak</Label>
                <p className="text-sm text-muted-foreground">Rappel quotidien pour maintenir votre streak</p>
              </div>
              <Switch
                id="streak"
                checked={streakReminders}
                onCheckedChange={setStreakReminders}
                disabled={!notifications}
              />
            </div>
          </div>
        </section>

        {/* Appearance Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Moon className="w-5 h-5 text-primary" />
            Apparence
          </h2>
          <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="darkMode" className="font-medium">Mode sombre</Label>
                <p className="text-sm text-muted-foreground">Utiliser le thème sombre</p>
              </div>
              <Switch
                id="darkMode"
                checked={darkMode}
                onCheckedChange={setDarkMode}
              />
            </div>
          </div>
        </section>

        {/* Regional Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Région
          </h2>
          <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Langue</Label>
                <p className="text-sm text-muted-foreground">Langue de l'application</p>
              </div>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Unités</Label>
                <p className="text-sm text-muted-foreground">Système de mesure</p>
              </div>
              <Select value={units} onValueChange={setUnits}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="metric">Métrique (km)</SelectItem>
                  <SelectItem value="imperial">Impérial (mi)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Map Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Carte
          </h2>
          <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Les paramètres de carte seront bientôt disponibles.
            </p>
          </div>
        </section>

        {/* Privacy Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Confidentialité
          </h2>
          <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="publicProfile" className="font-medium">Profil public</Label>
                <p className="text-sm text-muted-foreground">Permettre aux autres de voir votre profil</p>
              </div>
              <Switch
                id="publicProfile"
                checked={publicProfile}
                onCheckedChange={setPublicProfile}
              />
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" />
            Zone de danger
          </h2>
          <div className="bg-card rounded-2xl border border-destructive/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Supprimer mon compte</p>
                <p className="text-sm text-muted-foreground">Cette action est irréversible</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    Supprimer
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est irréversible. Toutes vos données seront définitivement supprimées.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount}>
                      Supprimer mon compte
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </section>

        {/* Save Button */}
        <Button onClick={handleSave} className="w-full rounded-xl">
          Sauvegarder les préférences
        </Button>
      </div>
    </AppLayout>
  );
}
