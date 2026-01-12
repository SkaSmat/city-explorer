import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Eye, Lock, Database, UserCheck, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        <div className="container max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Politique de confidentialité</h1>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-12 animate-fade-in">
          {/* Hero */}
          <section className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl font-bold">Votre vie privée nous tient à cœur</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Nous nous engageons à protéger vos données personnelles et à être transparents sur leur utilisation.
            </p>
            <p className="text-sm text-muted-foreground">
              Dernière mise à jour : 12 janvier 2024
            </p>
          </section>

          {/* Data Collection */}
          <section className="bg-card rounded-2xl border border-border p-8 space-y-6">
            <div className="flex items-center gap-3">
              <Database className="w-6 h-6 text-primary" />
              <h3 className="text-2xl font-bold">Données collectées</h3>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-primary" />
                  Informations de compte
                </h4>
                <p className="text-muted-foreground text-sm pl-6">
                  Nom d'utilisateur, adresse email, mot de passe (hashé), date de création du compte.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary" />
                  Données de localisation
                </h4>
                <p className="text-muted-foreground text-sm pl-6">
                  Coordonnées GPS lors de vos explorations (latitude, longitude, timestamp). Ces données sont nécessaires pour tracer vos parcours et identifier les rues explorées.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Database className="w-4 h-4 text-primary" />
                  Statistiques d'utilisation
                </h4>
                <p className="text-muted-foreground text-sm pl-6">
                  Distance parcourue, rues explorées, villes visitées, badges débloqués, streak quotidien.
                </p>
              </div>
            </div>
          </section>

          {/* Data Usage */}
          <section className="bg-card rounded-2xl border border-border p-8 space-y-6">
            <div className="flex items-center gap-3">
              <Lock className="w-6 h-6 text-primary" />
              <h3 className="text-2xl font-bold">Utilisation des données</h3>
            </div>

            <div className="space-y-3">
              <p className="text-muted-foreground text-sm">
                Vos données sont utilisées uniquement pour :
              </p>
              <ul className="space-y-2 text-muted-foreground text-sm pl-6">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Afficher vos parcours et statistiques personnelles</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Calculer les rues explorées et débloquer des badges</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Améliorer l'expérience utilisateur de l'application</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Vous envoyer des notifications importantes (si activées)</span>
                </li>
              </ul>
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
              <p className="text-sm font-medium">
                🔒 Nous ne vendons jamais vos données à des tiers. Vos informations restent privées et sécurisées.
              </p>
            </div>
          </section>

          {/* Data Security */}
          <section className="bg-card rounded-2xl border border-border p-8 space-y-6">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-primary" />
              <h3 className="text-2xl font-bold">Sécurité des données</h3>
            </div>

            <div className="space-y-3 text-muted-foreground text-sm">
              <p>
                Nous prenons la sécurité de vos données très au sérieux :
              </p>
              <ul className="space-y-2 pl-6">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Chiffrement HTTPS pour toutes les communications</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Mots de passe hashés avec des algorithmes modernes (bcrypt)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Infrastructure hébergée sur Supabase (certifié SOC 2 Type II)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Sauvegardes régulières et redondance des données</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Your Rights */}
          <section className="bg-card rounded-2xl border border-border p-8 space-y-6">
            <div className="flex items-center gap-3">
              <UserCheck className="w-6 h-6 text-primary" />
              <h3 className="text-2xl font-bold">Vos droits</h3>
            </div>

            <div className="space-y-3 text-muted-foreground text-sm">
              <p>Conformément au RGPD, vous avez le droit de :</p>
              <ul className="space-y-2 pl-6">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>Accéder</strong> à vos données personnelles</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>Rectifier</strong> vos informations inexactes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>Supprimer</strong> votre compte et toutes vos données</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>Exporter</strong> vos données (format GPX/CSV)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><strong>Vous opposer</strong> au traitement de vos données</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-card rounded-2xl border border-border p-8 space-y-4 text-center">
            <Mail className="w-12 h-12 text-primary mx-auto" />
            <h3 className="text-2xl font-bold">Des questions ?</h3>
            <p className="text-muted-foreground">
              Pour toute question concernant vos données personnelles ou cette politique de confidentialité, contactez-nous :
            </p>
            <Link to="/contact">
              <Button className="rounded-xl">
                Nous contacter
              </Button>
            </Link>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-20 py-8">
        <div className="container max-w-4xl mx-auto px-6 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            © 2024 City Explorer. Tous droits réservés.
          </p>
          <div className="flex justify-center gap-4 text-sm">
            <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
              À propos
            </Link>
            <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
