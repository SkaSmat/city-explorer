import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabaseAuth as supabase } from '@/lib/supabaseClient';
import { stravaService } from '@/services/StravaService';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export default function StravaImport() {
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken, isNewUser } = location.state || {};

  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importRange, setImportRange] = useState('50');
  const [importWalks, setImportWalks] = useState(true);
  const [importRuns, setImportRuns] = useState(true);
  const [importBikes, setImportBikes] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: number } | null>(null);

  useEffect(() => {
    if (!accessToken) {
      navigate('/home');
      return;
    }

    loadActivities();
  }, [accessToken, navigate]);

  const loadActivities = async () => {
    try {
      const allActivities = await stravaService.getActivities(accessToken);
      setActivities(allActivities);
    } catch (error) {
      console.error('Error loading activities:', error);
      toast.error('Erreur de chargement des activités');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredActivities = () => {
    let filtered = activities;

    // Filter by type
    const allowedTypes: string[] = [];
    if (importWalks) allowedTypes.push('Walk', 'Hike');
    if (importRuns) allowedTypes.push('Run');
    if (importBikes) allowedTypes.push('Ride', 'VirtualRide');

    filtered = filtered.filter(a => allowedTypes.includes(a.type));

    // Filter by range
    const limit = parseInt(importRange);
    if (limit > 0) {
      filtered = filtered.slice(0, limit);
    }

    return filtered;
  };

  const startImport = async () => {
    try {
      setImporting(true);
      setImportProgress(0);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('Non authentifié');
      }

      const filteredActivities = getFilteredActivities();

      const importResult = await stravaService.importActivities(
        session.user.id,
        accessToken,
        filteredActivities,
        (current, total) => {
          setImportProgress((current / total) * 100);
        }
      );

      setResult(importResult);
      toast.success(`Import terminé! ${importResult.imported} activités importées`);
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error('Erreur lors de l\'import');
    } finally {
      setImporting(false);
    }
  };

  const filteredActivities = getFilteredActivities();

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (result) {
    return (
      <AppLayout>
        <div className="px-6 py-8 pb-24 max-w-2xl mx-auto">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>

            <div>
              <h1 className="text-3xl font-bold mb-2">Import terminé!</h1>
              <p className="text-muted-foreground">
                Vos activités Strava ont été importées avec succès
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 py-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600">{result.imported}</div>
                <div className="text-sm text-muted-foreground">Importées</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">{result.skipped}</div>
                <div className="text-sm text-muted-foreground">Ignorées</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{result.errors}</div>
                <div className="text-sm text-muted-foreground">Erreurs</div>
              </div>
            </div>

            <Button onClick={() => navigate('/home')} className="w-full rounded-xl">
              Voir mes explorations
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-6 py-8 pb-24 max-w-2xl mx-auto">
        <header className="mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold mb-2">Import Strava</h1>
          <p className="text-muted-foreground">
            Nous avons trouvé {activities.length} activités dans votre historique
          </p>
        </header>

        <div className="space-y-6">
          {/* Import Range */}
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Label>Nombre d'activités</Label>
              <Select value={importRange} onValueChange={setImportRange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes ({activities.length})</SelectItem>
                  <SelectItem value="200">200 dernières</SelectItem>
                  <SelectItem value="100">100 dernières</SelectItem>
                  <SelectItem value="50">50 dernières</SelectItem>
                  <SelectItem value="20">20 dernières</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Activity Types */}
            <div className="space-y-3">
              <Label>Types d'activités</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="walks"
                    checked={importWalks}
                    onCheckedChange={(checked) => setImportWalks(checked as boolean)}
                  />
                  <label htmlFor="walks" className="text-sm cursor-pointer">
                    Marche & Randonnée
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="runs"
                    checked={importRuns}
                    onCheckedChange={(checked) => setImportRuns(checked as boolean)}
                  />
                  <label htmlFor="runs" className="text-sm cursor-pointer">
                    Course à pied
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="bikes"
                    checked={importBikes}
                    onCheckedChange={(checked) => setImportBikes(checked as boolean)}
                  />
                  <label htmlFor="bikes" className="text-sm cursor-pointer">
                    Vélo
                  </label>
                </div>
              </div>
            </div>

            {/* Filtered Count */}
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                <strong>{filteredActivities.length}</strong> activités seront importées
              </p>
            </div>
          </div>

          {/* Import Progress */}
          {importing && (
            <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Import en cours...</span>
                <span className="text-sm text-muted-foreground">{Math.round(importProgress)}%</span>
              </div>
              <Progress value={importProgress} />
              <p className="text-xs text-muted-foreground text-center">
                Cela peut prendre plusieurs minutes. Ne fermez pas cette page.
              </p>
            </div>
          )}

          {/* Import Button */}
          <Button
            onClick={startImport}
            disabled={importing || filteredActivities.length === 0}
            className="w-full rounded-xl h-14 text-base"
          >
            {importing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Import en cours...
              </>
            ) : (
              <>
                Importer {filteredActivities.length} activités
              </>
            )}
          </Button>

          {/* Skip Import */}
          <Button
            variant="ghost"
            onClick={() => navigate('/home')}
            disabled={importing}
            className="w-full"
          >
            {isNewUser ? 'Passer pour le moment' : 'Annuler'}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
