import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DiagnosticResult {
  test: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

export default function GPSDiagnostic() {
  const navigate = useNavigate();
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<{lat: number; lng: number} | null>(null);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const results: DiagnosticResult[] = [];

    // Test 1: Check if Geolocation API is available
    results.push({
      test: "API Géolocalisation",
      status: 'pending',
      message: "Vérification...",
    });
    setDiagnostics([...results]);

    await new Promise(resolve => setTimeout(resolve, 500));

    if (!navigator.geolocation) {
      results[0] = {
        test: "API Géolocalisation",
        status: 'error',
        message: "Non supportée",
        details: "Votre navigateur ne supporte pas la géolocalisation"
      };
      setDiagnostics([...results]);
      setIsRunning(false);
      return;
    }

    results[0] = {
      test: "API Géolocalisation",
      status: 'success',
      message: "Disponible",
    };
    setDiagnostics([...results]);

    // Test 2: Check permissions
    results.push({
      test: "Permissions GPS",
      status: 'pending',
      message: "Vérification...",
    });
    setDiagnostics([...results]);

    await new Promise(resolve => setTimeout(resolve, 500));

    if ('permissions' in navigator) {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName });

        if (permissionStatus.state === 'granted') {
          results[1] = {
            test: "Permissions GPS",
            status: 'success',
            message: "Accordées",
          };
        } else if (permissionStatus.state === 'denied') {
          results[1] = {
            test: "Permissions GPS",
            status: 'error',
            message: "Refusées",
            details: "Activez la localisation dans les paramètres de votre navigateur"
          };
        } else {
          results[1] = {
            test: "Permissions GPS",
            status: 'warning',
            message: "Non demandées",
            details: "Les permissions seront demandées lors du premier accès"
          };
        }
      } catch (err) {
        results[1] = {
          test: "Permissions GPS",
          status: 'warning',
          message: "Non vérifiable",
          details: "L'API Permissions n'est pas disponible, mais le GPS peut fonctionner"
        };
      }
    } else {
      results[1] = {
        test: "Permissions GPS",
        status: 'warning',
        message: "Non vérifiable",
        details: "L'API Permissions n'est pas disponible dans ce navigateur"
      };
    }
    setDiagnostics([...results]);

    // Test 3: Try to get current position
    results.push({
      test: "Obtention position",
      status: 'pending',
      message: "Recherche GPS...",
    });
    setDiagnostics([...results]);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
          }
        );
      });

      results[2] = {
        test: "Obtention position",
        status: 'success',
        message: "Position trouvée",
        details: `Lat: ${position.coords.latitude.toFixed(6)}, Lng: ${position.coords.longitude.toFixed(6)}, Précision: ${position.coords.accuracy.toFixed(0)}m`
      };
      setCurrentPosition({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
    } catch (err: any) {
      let message = "Échec";
      let details = err.message;

      if (err.code === 1) {
        message = "Permission refusée";
        details = "L'utilisateur a refusé la permission de localisation";
      } else if (err.code === 2) {
        message = "Position indisponible";
        details = "Le GPS ne peut pas obtenir votre position (signal GPS faible?)";
      } else if (err.code === 3) {
        message = "Timeout dépassé";
        details = "Le GPS prend trop de temps à répondre";
      }

      results[2] = {
        test: "Obtention position",
        status: 'error',
        message,
        details
      };
    }
    setDiagnostics([...results]);

    // Test 4: Check HTTPS
    results.push({
      test: "Connexion sécurisée",
      status: window.location.protocol === 'https:' ? 'success' : 'error',
      message: window.location.protocol === 'https:' ? "HTTPS activé" : "HTTP non sécurisé",
      details: window.location.protocol === 'https:'
        ? "La connexion est sécurisée"
        : "Le GPS peut ne pas fonctionner sur HTTP. Utilisez HTTPS."
    });
    setDiagnostics([...results]);

    // Test 5: Test Overpass API (if position found)
    if (currentPosition) {
      results.push({
        test: "Chargement des rues",
        status: 'pending',
        message: "Test de l'API Overpass...",
      });
      setDiagnostics([...results]);

      try {
        const query = `
          [out:json][timeout:15];
          way["highway"]["name"](around:500,${currentPosition.lat},${currentPosition.lng});
          out geom;
        `;

        const response = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: `data=${encodeURIComponent(query)}`,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const streetCount = data.elements?.length || 0;

        results[4] = {
          test: "Chargement des rues",
          status: streetCount > 0 ? 'success' : 'warning',
          message: streetCount > 0 ? `${streetCount} rues trouvées` : "Aucune rue trouvée",
          details: streetCount > 0
            ? "L'API Overpass fonctionne correctement"
            : "Vous êtes peut-être dans une zone sans rues nommées"
        };
      } catch (err: any) {
        results[4] = {
          test: "Chargement des rues",
          status: 'error',
          message: "Erreur Overpass",
          details: err.message || "Impossible de charger les données de rue"
        };
      }
      setDiagnostics([...results]);
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'pending':
        return <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />;
    }
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-emerald-50 border-emerald-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-amber-50 border-amber-200';
      case 'pending':
        return 'bg-indigo-50 border-indigo-200';
    }
  };

  const hasErrors = diagnostics.some(d => d.status === 'error');
  const allSuccess = diagnostics.length > 0 && diagnostics.every(d => d.status === 'success');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/map")}
          className="rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Diagnostic GPS</h1>
          <p className="text-muted-foreground">Vérification de la configuration</p>
        </div>
      </div>

      {/* Diagnostics */}
      <div className="space-y-4 max-w-2xl">
        {diagnostics.map((diagnostic, index) => (
          <div
            key={index}
            className={`rounded-xl border-2 p-4 transition-all ${getStatusColor(diagnostic.status)}`}
          >
            <div className="flex items-start gap-3">
              {getStatusIcon(diagnostic.status)}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold">{diagnostic.test}</h3>
                  <span className={`text-sm font-medium ${
                    diagnostic.status === 'success' ? 'text-emerald-600' :
                    diagnostic.status === 'error' ? 'text-red-600' :
                    diagnostic.status === 'warning' ? 'text-amber-600' :
                    'text-indigo-600'
                  }`}>
                    {diagnostic.message}
                  </span>
                </div>
                {diagnostic.details && (
                  <p className="text-sm text-muted-foreground">{diagnostic.details}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      {!isRunning && diagnostics.length > 0 && (
        <div className="mt-8 max-w-2xl">
          {allSuccess && (
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                <h3 className="text-lg font-bold text-emerald-900">Tout fonctionne!</h3>
              </div>
              <p className="text-emerald-700 mb-4">
                Votre GPS est correctement configuré. Vous pouvez commencer à tracker vos explorations.
              </p>
              <Button
                onClick={() => navigate("/map")}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Commencer le tracking
              </Button>
            </div>
          )}

          {hasErrors && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <XCircle className="w-6 h-6 text-red-500" />
                <h3 className="text-lg font-bold text-red-900">Problèmes détectés</h3>
              </div>
              <p className="text-red-700 mb-4">
                Des problèmes empêchent le GPS de fonctionner correctement. Vérifiez les erreurs ci-dessus.
              </p>
              <div className="space-y-2">
                <h4 className="font-semibold text-red-900">Solutions possibles:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                  <li>Activez la localisation dans les paramètres de votre navigateur</li>
                  <li>Vérifiez que le GPS de votre appareil est activé</li>
                  <li>Assurez-vous d'avoir une connexion Internet</li>
                  <li>Essayez de redémarrer votre navigateur</li>
                  <li>Utilisez HTTPS au lieu de HTTP</li>
                </ul>
              </div>
              <Button
                onClick={runDiagnostics}
                variant="outline"
                className="mt-4 border-red-300 text-red-700 hover:bg-red-100"
              >
                Relancer le diagnostic
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-8 flex gap-3 max-w-2xl">
        <Button
          onClick={runDiagnostics}
          disabled={isRunning}
          variant="outline"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Diagnostic en cours...
            </>
          ) : (
            'Relancer le diagnostic'
          )}
        </Button>
        <Button
          onClick={() => navigate("/map")}
          variant="ghost"
        >
          Retour à la carte
        </Button>
      </div>
    </div>
  );
}
