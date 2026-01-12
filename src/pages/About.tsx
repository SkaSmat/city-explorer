import { Link } from "react-router-dom";
import { ArrowLeft, MapPin, Heart, Users, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function About() {
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
          <h1 className="text-xl font-bold">À propos</h1>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-12 animate-fade-in">
          {/* Hero Section */}
          <section className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-gradient shadow-lg">
              <MapPin className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl font-bold">City Explorer</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Explorez votre ville comme jamais auparavant. Découvrez chaque rue, débloquez des badges et devenez un véritable explorateur urbain.
            </p>
          </section>

          {/* Mission Section */}
          <section className="bg-card rounded-2xl border border-border p-8 space-y-4">
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6 text-primary" />
              <h3 className="text-2xl font-bold">Notre Mission</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              City Explorer est né d'une passion pour l'exploration urbaine. Notre mission est de transformer chaque promenade en une aventure enrichissante, en vous encourageant à découvrir les coins cachés de votre ville et à créer des souvenirs inoubliables.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Inspiré par des applications comme CityStrides et Wandrer, nous voulons gamifier l'exploration urbaine et créer une communauté de passionnés qui redécouvrent leur environnement à pied.
            </p>
          </section>

          {/* Features Section */}
          <section className="grid md:grid-cols-2 gap-6">
            <div className="bg-card rounded-2xl border border-border p-6 space-y-3 card-hover">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <h4 className="text-lg font-semibold">Suivi GPS en temps réel</h4>
              <p className="text-muted-foreground text-sm">
                Tracez vos parcours avec précision et visualisez chaque rue explorée en temps réel sur une carte interactive.
              </p>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6 space-y-3 card-hover">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <Heart className="w-6 h-6 text-accent" />
              </div>
              <h4 className="text-lg font-semibold">Badges & Gamification</h4>
              <p className="text-muted-foreground text-sm">
                Débloquez des badges en atteignant des objectifs de distance, de rues explorées et de villes découvertes.
              </p>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6 space-y-3 card-hover">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-secondary" />
              </div>
              <h4 className="text-lg font-semibold">Communauté d'explorateurs</h4>
              <p className="text-muted-foreground text-sm">
                Rejoignez une communauté de passionnés et partagez vos découvertes avec d'autres explorateurs urbains.
              </p>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6 space-y-3 card-hover">
              <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-orange-500" />
              </div>
              <h4 className="text-lg font-semibold">Statistiques détaillées</h4>
              <p className="text-muted-foreground text-sm">
                Suivez votre progression avec des statistiques complètes : distance parcourue, rues explorées, streak quotidien.
              </p>
            </div>
          </section>

          {/* Team/Credits Section */}
          <section className="bg-card rounded-2xl border border-border p-8 space-y-4 text-center">
            <h3 className="text-2xl font-bold">Développé avec ❤️</h3>
            <p className="text-muted-foreground">
              City Explorer est un projet open source en constante évolution. Nous sommes passionnés par l'exploration urbaine et la technologie.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-4">
              <span className="px-4 py-2 bg-muted rounded-full text-sm font-medium">React</span>
              <span className="px-4 py-2 bg-muted rounded-full text-sm font-medium">TypeScript</span>
              <span className="px-4 py-2 bg-muted rounded-full text-sm font-medium">MapLibre GL</span>
              <span className="px-4 py-2 bg-muted rounded-full text-sm font-medium">Supabase</span>
              <span className="px-4 py-2 bg-muted rounded-full text-sm font-medium">OpenStreetMap</span>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center space-y-4 pt-8">
            <h3 className="text-2xl font-bold">Prêt à explorer ?</h3>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/signup">
                <Button size="lg" className="rounded-xl">
                  Créer un compte
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="rounded-xl">
                  Se connecter
                </Button>
              </Link>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-20 py-8">
        <div className="container max-w-4xl mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 City Explorer. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
