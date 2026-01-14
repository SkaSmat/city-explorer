import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabaseAuth as supabase } from '@/lib/supabaseClient';
import { stravaService } from '@/services/StravaService';
import { toast } from 'sonner';

export default function StravaCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('Connexion à Strava...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get authorization code from URL
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
          throw new Error('Connexion Strava refusée');
        }

        if (!code) {
          throw new Error('Code d\'autorisation manquant');
        }

        setStatus('Échange du code d\'autorisation...');

        // Exchange code for tokens
        const { access_token, refresh_token, athlete } = await stravaService.exchangeToken(code);

        setStatus('Authentification...');

        // Get current user
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          // No existing session - create account with Strava
          const { data, error: signUpError } = await supabase.auth.signUp({
            email: `strava_${athlete.id}@cityexplorer.app`,
            password: crypto.randomUUID(),
            options: {
              data: {
                username: athlete.username || `${athlete.firstname} ${athlete.lastname}`,
                strava_id: athlete.id,
              },
            },
          });

          if (signUpError) throw signUpError;

          if (!data.user) {
            throw new Error('Erreur lors de la création du compte');
          }

          // Save Strava connection
          await stravaService.saveConnection(data.user.id, access_token, refresh_token, athlete);

          toast.success('Compte créé avec Strava!');
          navigate('/strava-import', { state: { accessToken: access_token, isNewUser: true } });
        } else {
          // Existing session - link Strava account
          setStatus('Liaison du compte Strava...');
          await stravaService.saveConnection(session.user.id, access_token, refresh_token, athlete);

          toast.success('Compte Strava connecté!');
          navigate('/strava-import', { state: { accessToken: access_token, isNewUser: false } });
        }
      } catch (error: any) {
        console.error('Strava callback error:', error);
        toast.error(error.message || 'Erreur de connexion Strava');
        navigate('/login');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
        <h2 className="text-xl font-semibold">{status}</h2>
        <p className="text-muted-foreground">Veuillez patienter...</p>
      </div>
    </div>
  );
}
