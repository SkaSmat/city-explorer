import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Moon, Globe, MapPin, Shield, Trash2, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AppLayout } from "@/components/layout/AppLayout";
import { toast } from "sonner";
import { usePreferences } from "@/hooks/usePreferences";
import { useTranslation } from "@/lib/i18n";
import { stravaService } from "@/services/StravaService";
import { supabaseAuth as supabase } from "@/lib/supabaseClient";
import { supabaseGeo } from "@/lib/supabaseGeo";
import { useEffect, useState } from "react";
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
  const { preferences, updatePreference } = usePreferences();
  const { t } = useTranslation();
  const [stravaConnected, setStravaConnected] = useState(false);
  const [checkingStrava, setCheckingStrava] = useState(true);

  useEffect(() => {
    checkStravaConnection();
  }, []);

  const checkStravaConnection = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setCheckingStrava(false);
        return;
      }

      const { data } = await supabaseGeo
        .from('strava_connections')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      setStravaConnected(!!data);
    } catch (error) {
      console.error('Error checking Strava connection:', error);
    } finally {
      setCheckingStrava(false);
    }
  };

  const handleStravaConnect = () => {
    window.location.href = stravaService.getAuthUrl();
  };

  const handleStravaDisconnect = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      await stravaService.disconnect(session.user.id);
      setStravaConnected(false);
      toast.success('Compte Strava déconnecté');
    } catch (error) {
      console.error('Error disconnecting Strava:', error);
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const handleSave = () => {
    toast.success(t('settings.savedAuto'));
  };

  const handleDeleteAccount = () => {
    toast.info(t('common.comingSoon'));
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
          <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
        </header>

        {/* Notifications Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            {t('settings.notifications')}
          </h2>
          <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifications" className="font-medium">{t('settings.pushNotifications')}</Label>
                <p className="text-sm text-muted-foreground">{t('settings.receiveNotifications')}</p>
              </div>
              <Switch
                id="notifications"
                checked={preferences.notifications}
                onCheckedChange={(checked) => updatePreference('notifications', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="badges" className="font-medium">{t('settings.badgesUnlocked')}</Label>
                <p className="text-sm text-muted-foreground">{t('settings.badgeNotification')}</p>
              </div>
              <Switch
                id="badges"
                checked={preferences.badgeNotifications}
                onCheckedChange={(checked) => updatePreference('badgeNotifications', checked)}
                disabled={!preferences.notifications}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="streak" className="font-medium">{t('settings.streakReminders')}</Label>
                <p className="text-sm text-muted-foreground">{t('settings.streakReminderDesc')}</p>
              </div>
              <Switch
                id="streak"
                checked={preferences.streakReminders}
                onCheckedChange={(checked) => updatePreference('streakReminders', checked)}
                disabled={!preferences.notifications}
              />
            </div>
          </div>
        </section>

        {/* Appearance Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Moon className="w-5 h-5 text-primary" />
            {t('settings.appearance')}
          </h2>
          <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="darkMode" className="font-medium">{t('settings.darkMode')}</Label>
                <p className="text-sm text-muted-foreground">{t('settings.useDarkTheme')}</p>
              </div>
              <Switch
                id="darkMode"
                checked={preferences.darkMode}
                onCheckedChange={(checked) => updatePreference('darkMode', checked)}
              />
            </div>
          </div>
        </section>

        {/* Regional Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            {t('settings.region')}
          </h2>
          <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">{t('settings.language')}</Label>
                <p className="text-sm text-muted-foreground">{t('settings.languageDesc')}</p>
              </div>
              <Select 
                value={preferences.language} 
                onValueChange={(value: 'fr' | 'en' | 'es') => {
                  updatePreference('language', value);
                  toast.success(t('settings.savedAuto'));
                }}
              >
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
                <Label className="font-medium">{t('settings.units')}</Label>
                <p className="text-sm text-muted-foreground">{t('settings.unitsDesc')}</p>
              </div>
              <Select 
                value={preferences.units} 
                onValueChange={(value: 'metric' | 'imperial') => {
                  updatePreference('units', value);
                  toast.success(t('settings.savedAuto'));
                }}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="metric">{t('settings.metric')}</SelectItem>
                  <SelectItem value="imperial">{t('settings.imperial')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Map Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            {t('settings.map')}
          </h2>
          <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('settings.mapSettingsSoon')}
            </p>
          </div>
        </section>

        {/* Strava Integration Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Strava
          </h2>
          <div className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {stravaConnected ? 'Compte Strava connecté' : 'Connecter Strava'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {stravaConnected
                    ? 'Importez vos activités Strava automatiquement'
                    : 'Connectez votre compte pour importer vos activités'
                  }
                </p>
              </div>
              {!checkingStrava && (
                stravaConnected ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleStravaDisconnect}
                  >
                    Déconnecter
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="bg-[#FC4C02] hover:bg-[#E34402] text-white"
                    onClick={handleStravaConnect}
                  >
                    Connecter
                  </Button>
                )
              )}
            </div>
          </div>
        </section>

        {/* Privacy Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            {t('settings.privacy')}
          </h2>
          <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="publicProfile" className="font-medium">{t('settings.publicProfile')}</Label>
                <p className="text-sm text-muted-foreground">{t('settings.publicProfileDesc')}</p>
              </div>
              <Switch
                id="publicProfile"
                checked={preferences.publicProfile}
                onCheckedChange={(checked) => {
                  updatePreference('publicProfile', checked);
                  toast.success(t('settings.savedAuto'));
                }}
              />
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" />
            {t('settings.dangerZone')}
          </h2>
          <div className="bg-card rounded-2xl border border-destructive/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t('settings.deleteAccount')}</p>
                <p className="text-sm text-muted-foreground">{t('settings.deleteAccountDesc')}</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    {t('common.delete')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('settings.confirmDelete')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('settings.confirmDeleteDesc')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount}>
                      {t('settings.deleteAccount')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </section>

        {/* Save Button */}
        <Button onClick={handleSave} className="w-full rounded-xl">
          {t('common.save')}
        </Button>
      </div>
    </AppLayout>
  );
}
