// Internationalization system
export type Language = 'fr' | 'en' | 'es';

interface Translations {
  [key: string]: {
    [lang in Language]: string;
  };
}

const translations: Translations = {
  // Common
  'common.loading': { fr: 'Chargement...', en: 'Loading...', es: 'Cargando...' },
  'common.save': { fr: 'Sauvegarder', en: 'Save', es: 'Guardar' },
  'common.cancel': { fr: 'Annuler', en: 'Cancel', es: 'Cancelar' },
  'common.delete': { fr: 'Supprimer', en: 'Delete', es: 'Eliminar' },
  'common.back': { fr: 'Retour', en: 'Back', es: 'Volver' },
  'common.seeAll': { fr: 'Voir tout', en: 'See all', es: 'Ver todo' },
  'common.search': { fr: 'Rechercher', en: 'Search', es: 'Buscar' },
  'common.comingSoon': { fr: 'Bientôt disponible', en: 'Coming soon', es: 'Próximamente' },
  
  // Home
  'home.welcomeBack': { fr: 'Bienvenue 👋', en: 'Welcome back 👋', es: 'Bienvenido 👋' },
  'home.yourStats': { fr: 'Vos statistiques', en: 'Your Stats', es: 'Tus estadísticas' },
  'home.totalDistance': { fr: 'Distance totale', en: 'Total distance', es: 'Distancia total' },
  'home.streetsExplored': { fr: 'Rues explorées', en: 'Streets explored', es: 'Calles exploradas' },
  'home.citiesVisited': { fr: 'Villes visitées', en: 'Cities visited', es: 'Ciudades visitadas' },
  'home.currentStreak': { fr: 'Streak actuel', en: 'Current streak', es: 'Racha actual' },
  'home.yourCities': { fr: 'Vos villes', en: 'Your Cities', es: 'Tus ciudades' },
  'home.noCities': { fr: 'Aucune ville explorée pour le moment', en: 'No cities explored yet', es: 'No hay ciudades exploradas' },
  'home.startExploring': { fr: 'Commencez votre aventure en explorant une nouvelle ville !', en: 'Start your adventure by exploring a new city!', es: '¡Comienza tu aventura explorando una nueva ciudad!' },
  'home.addCity': { fr: 'Ajouter une nouvelle ville', en: 'Add a new city', es: 'Añadir nueva ciudad' },
  'home.streets': { fr: 'rues', en: 'streets', es: 'calles' },
  'home.lastActivity': { fr: 'Dernière activité', en: 'Last activity', es: 'Última actividad' },
  'home.progress': { fr: 'Progression', en: 'Progress', es: 'Progreso' },
  'home.day': { fr: 'jour', en: 'day', es: 'día' },
  'home.days': { fr: 'jours', en: 'days', es: 'días' },
  'home.todaysGoal': { fr: 'Objectif du jour', en: "Today's Goal", es: 'Meta de hoy' },
  'home.goalComplete': { fr: '🎉 Objectif atteint ! Bravo !', en: '🎉 Goal completed! Amazing work!', es: '🎉 ¡Meta alcanzada! ¡Increíble!' },
  'home.keepGoing': { fr: '🔥 Continuez ! Il reste', en: '🔥 Keep going!', es: '🔥 ¡Continúa!' },
  'home.toGo': { fr: 'à parcourir', en: 'to go', es: 'por recorrer' },
  
  // Settings
  'settings.title': { fr: 'Préférences', en: 'Settings', es: 'Preferencias' },
  'settings.notifications': { fr: 'Notifications', en: 'Notifications', es: 'Notificaciones' },
  'settings.pushNotifications': { fr: 'Notifications push', en: 'Push notifications', es: 'Notificaciones push' },
  'settings.receiveNotifications': { fr: 'Recevoir des notifications', en: 'Receive notifications', es: 'Recibir notificaciones' },
  'settings.badgesUnlocked': { fr: 'Badges débloqués', en: 'Badges unlocked', es: 'Insignias desbloqueadas' },
  'settings.badgeNotification': { fr: "Notification lors d'un nouveau badge", en: 'Notification when a new badge is unlocked', es: 'Notificación al desbloquear insignia' },
  'settings.streakReminders': { fr: 'Rappels de streak', en: 'Streak reminders', es: 'Recordatorios de racha' },
  'settings.streakReminderDesc': { fr: 'Rappel quotidien pour maintenir votre streak', en: 'Daily reminder to maintain your streak', es: 'Recordatorio diario para mantener tu racha' },
  'settings.appearance': { fr: 'Apparence', en: 'Appearance', es: 'Apariencia' },
  'settings.darkMode': { fr: 'Mode sombre', en: 'Dark mode', es: 'Modo oscuro' },
  'settings.useDarkTheme': { fr: 'Utiliser le thème sombre', en: 'Use dark theme', es: 'Usar tema oscuro' },
  'settings.region': { fr: 'Région', en: 'Region', es: 'Región' },
  'settings.language': { fr: 'Langue', en: 'Language', es: 'Idioma' },
  'settings.languageDesc': { fr: "Langue de l'application", en: 'App language', es: 'Idioma de la aplicación' },
  'settings.units': { fr: 'Unités', en: 'Units', es: 'Unidades' },
  'settings.unitsDesc': { fr: 'Système de mesure', en: 'Measurement system', es: 'Sistema de medidas' },
  'settings.metric': { fr: 'Métrique (km)', en: 'Metric (km)', es: 'Métrico (km)' },
  'settings.imperial': { fr: 'Impérial (mi)', en: 'Imperial (mi)', es: 'Imperial (mi)' },
  'settings.map': { fr: 'Carte', en: 'Map', es: 'Mapa' },
  'settings.mapSettingsSoon': { fr: 'Les paramètres de carte seront bientôt disponibles.', en: 'Map settings coming soon.', es: 'Configuración del mapa próximamente.' },
  'settings.privacy': { fr: 'Confidentialité', en: 'Privacy', es: 'Privacidad' },
  'settings.publicProfile': { fr: 'Profil public', en: 'Public profile', es: 'Perfil público' },
  'settings.publicProfileDesc': { fr: 'Permettre aux autres de voir votre profil', en: 'Allow others to see your profile', es: 'Permitir que otros vean tu perfil' },
  'settings.dangerZone': { fr: 'Zone de danger', en: 'Danger zone', es: 'Zona de peligro' },
  'settings.deleteAccount': { fr: 'Supprimer mon compte', en: 'Delete my account', es: 'Eliminar mi cuenta' },
  'settings.deleteAccountDesc': { fr: 'Cette action est irréversible', en: 'This action is irreversible', es: 'Esta acción es irreversible' },
  'settings.confirmDelete': { fr: 'Êtes-vous sûr ?', en: 'Are you sure?', es: '¿Estás seguro?' },
  'settings.confirmDeleteDesc': { fr: 'Toutes vos données seront définitivement supprimées.', en: 'All your data will be permanently deleted.', es: 'Todos tus datos serán eliminados permanentemente.' },
  'settings.savedAuto': { fr: 'Préférences sauvegardées automatiquement', en: 'Preferences saved automatically', es: 'Preferencias guardadas automáticamente' },
  
  // Profile
  'profile.title': { fr: 'Mon Profil', en: 'My Profile', es: 'Mi Perfil' },
  'profile.editProfile': { fr: 'Modifier le profil', en: 'Edit profile', es: 'Editar perfil' },
  'profile.settings': { fr: 'Paramètres', en: 'Settings', es: 'Configuración' },
  'profile.logout': { fr: 'Déconnexion', en: 'Logout', es: 'Cerrar sesión' },
  'profile.stats': { fr: 'Statistiques', en: 'Statistics', es: 'Estadísticas' },
  'profile.badges': { fr: 'Badges', en: 'Badges', es: 'Insignias' },
  'profile.recentActivity': { fr: 'Activité récente', en: 'Recent activity', es: 'Actividad reciente' },
  
  // Cities
  'cities.title': { fr: 'Mes Villes', en: 'My Cities', es: 'Mis Ciudades' },
  'cities.searchPlaceholder': { fr: 'Rechercher une ville...', en: 'Search for a city...', es: 'Buscar una ciudad...' },
  'cities.noResults': { fr: 'Aucune ville trouvée', en: 'No cities found', es: 'No se encontraron ciudades' },
  'cities.noCities': { fr: 'Aucune ville explorée', en: 'No cities explored', es: 'No hay ciudades exploradas' },
  'cities.startExploring': { fr: 'Commencer à explorer', en: 'Start exploring', es: 'Comenzar a explorar' },
  'cities.exploreNew': { fr: 'Explorer une nouvelle ville', en: 'Explore a new city', es: 'Explorar una nueva ciudad' },
  
  // Leaderboard
  'leaderboard.title': { fr: 'Classement', en: 'Leaderboard', es: 'Clasificación' },
  'leaderboard.rank': { fr: 'Rang', en: 'Rank', es: 'Rango' },
  'leaderboard.explorer': { fr: 'Explorateur', en: 'Explorer', es: 'Explorador' },
  'leaderboard.distance': { fr: 'Distance', en: 'Distance', es: 'Distancia' },
  'leaderboard.streets': { fr: 'Rues', en: 'Streets', es: 'Calles' },
  'leaderboard.cities': { fr: 'Villes', en: 'Cities', es: 'Ciudades' },
  'leaderboard.you': { fr: 'Vous', en: 'You', es: 'Tú' },
  'leaderboard.noData': { fr: 'Aucune donnée disponible', en: 'No data available', es: 'Sin datos disponibles' },
  
  // Map
  'map.startExploring': { fr: 'Démarrer', en: 'Start', es: 'Iniciar' },
  'map.stopExploring': { fr: 'Arrêter', en: 'Stop', es: 'Detener' },
  'map.pause': { fr: 'Pause', en: 'Pause', es: 'Pausa' },
  'map.resume': { fr: 'Reprendre', en: 'Resume', es: 'Reanudar' },
  'map.saving': { fr: 'Sauvegarde en cours...', en: 'Saving...', es: 'Guardando...' },
  'map.saved': { fr: 'Exploration sauvegardée !', en: 'Exploration saved!', es: '¡Exploración guardada!' },
  'map.gpsError': { fr: 'Erreur GPS', en: 'GPS Error', es: 'Error GPS' },
  
  // Notifications
  'notifications.title': { fr: 'Notifications', en: 'Notifications', es: 'Notificaciones' },
  'notifications.comingSoon': { fr: 'Notifications bientôt disponibles', en: 'Notifications coming soon', es: 'Notificaciones próximamente' },
  
  // Badges
  'badges.title': { fr: 'Tous les badges', en: 'All badges', es: 'Todas las insignias' },
  'badges.unlocked': { fr: 'Débloqué', en: 'Unlocked', es: 'Desbloqueado' },
  'badges.locked': { fr: 'Verrouillé', en: 'Locked', es: 'Bloqueado' },
};

export function t(key: string, lang: Language): string {
  const translation = translations[key];
  if (!translation) {
    console.warn(`Missing translation for key: ${key}`);
    return key;
  }
  return translation[lang] || translation['en'] || key;
}

// React hook for translations
import { usePreferences } from '@/hooks/usePreferences';
import { useMemo } from 'react';

export function useTranslation() {
  const { preferences } = usePreferences();
  
  const translate = useMemo(() => {
    return (key: string) => t(key, preferences.language);
  }, [preferences.language]);
  
  return { t: translate, lang: preferences.language };
}
