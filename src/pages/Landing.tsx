import { ArrowRight, MapPin, Map, Trophy, Twitter, Github, Instagram } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const features = [
  {
    icon: MapPin,
    title: "Track your walks",
    description: "GPS tracking automatique pendant vos explorations urbaines",
  },
  {
    icon: Map,
    title: "Collect streets",
    description: "Visualisez en temps réel les rues que vous découvrez",
  },
  {
    icon: Trophy,
    title: "Unlock badges",
    description: "Gagnez des achievements en explorant de nouveaux quartiers",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative px-6 py-16 md:py-24 lg:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="gradient-text text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in">
            Turn Every City Into Your Personal Map
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in">
            Walk, explore, collect streets. Transform your travels into a beautiful visual journey.
          </p>
          
          {/* Map Illustration Placeholder */}
          <div className="relative w-full max-w-md mx-auto mb-10 animate-scale-in">
            <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 border border-border overflow-hidden">
              <div className="w-full h-full flex items-center justify-center">
                <div className="relative">
                  {/* Animated map grid */}
                  <div className="grid grid-cols-6 gap-1 p-8">
                    {Array.from({ length: 36 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-4 h-4 rounded-sm transition-all duration-500 ${
                          [2, 3, 8, 9, 14, 15, 20, 21, 26, 27].includes(i)
                            ? "bg-primary"
                            : [4, 10, 16, 22, 28].includes(i)
                            ? "bg-secondary"
                            : "bg-muted"
                        }`}
                        style={{
                          animationDelay: `${i * 50}ms`,
                        }}
                      />
                    ))}
                  </div>
                  <MapPin className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-primary animate-bounce" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
            <Link to="/signup">
              <Button className="btn-primary text-lg px-8 py-6 gap-2 group">
                Start Exploring
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <button 
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-primary font-medium underline underline-offset-4 hover:text-primary/80 transition-colors"
            >
              See how it works
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 py-16 md:py-24 bg-card">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center text-3xl md:text-4xl font-bold mb-12">
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="gradient-border rounded-2xl p-6 bg-card card-hover animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Map className="w-6 h-6 text-primary" />
              <span className="font-semibold text-lg">StreetExplorer</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <button onClick={() => toast.info("Page About bientôt disponible")} className="hover:text-foreground transition-colors">About</button>
              <button onClick={() => toast.info("Page Privacy bientôt disponible")} className="hover:text-foreground transition-colors">Privacy</button>
              <button onClick={() => toast.info("Page Contact bientôt disponible")} className="hover:text-foreground transition-colors">Contact</button>
            </div>
            <div className="flex items-center gap-4">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Twitter">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="GitHub">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Instagram">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-8">
            © 2024 StreetExplorer. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
