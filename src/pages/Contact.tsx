import { Link } from "react-router-dom";
import { ArrowLeft, Mail, MessageSquare, Github, Twitter, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useState } from "react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // IMPORTANT: Formulaire non connecté à un backend
    // Pour implémenter l'envoi: utiliser un service comme EmailJS, SendGrid, ou créer une API
    toast.info("🚧 Formulaire de contact en cours d'implémentation", {
      description: "Pour nous contacter, utilisez les réseaux sociaux ci-dessous",
      duration: 6000
    });
    // Ne pas réinitialiser le formulaire pour que l'utilisateur puisse copier son message
  };

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
          <h1 className="text-xl font-bold">Contact</h1>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-12 animate-fade-in">
          {/* Hero */}
          <section className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <Mail className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl font-bold">Contactez-nous</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Une question, une suggestion ou un problème ? Nous sommes là pour vous aider !
            </p>
          </section>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Form */}
            <section className="bg-card rounded-2xl border border-border p-8">
              <div className="flex items-center gap-3 mb-6">
                <MessageSquare className="w-6 h-6 text-primary" />
                <h3 className="text-2xl font-bold">Envoyer un message</h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Nom
                  </label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Votre nom"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium mb-2">
                    Sujet
                  </label>
                  <Input
                    id="subject"
                    type="text"
                    placeholder="De quoi s'agit-il ?"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    placeholder="Décrivez votre demande..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    rows={6}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <Button type="submit" className="w-full rounded-xl" size="lg">
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer le message
                </Button>
              </form>
            </section>

            {/* Quick Links & Info */}
            <section className="space-y-6">
              {/* FAQ Card */}
              <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                <h3 className="text-xl font-bold">Questions fréquentes</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium mb-1">Comment supprimer mon compte ?</p>
                    <p className="text-muted-foreground">
                      Rendez-vous dans Profil → Paramètres → Supprimer le compte
                    </p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Mes données GPS sont-elles privées ?</p>
                    <p className="text-muted-foreground">
                      Oui, vos données sont totalement privées et sécurisées. Consultez notre{" "}
                      <Link to="/privacy" className="text-primary underline">
                        politique de confidentialité
                      </Link>
                      .
                    </p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">L'app fonctionne-t-elle hors ligne ?</p>
                    <p className="text-muted-foreground">
                      Partiellement. Le tracking GPS fonctionne hors ligne, mais la synchronisation nécessite une connexion.
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                <h3 className="text-xl font-bold">Suivez-nous</h3>
                <div className="space-y-3">
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors"
                  >
                    <Github className="w-5 h-5" />
                    <div>
                      <p className="font-medium">GitHub</p>
                      <p className="text-xs text-muted-foreground">Code source & contributions</p>
                    </div>
                  </a>

                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors"
                  >
                    <Twitter className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Twitter</p>
                      <p className="text-xs text-muted-foreground">Actualités & mises à jour</p>
                    </div>
                  </a>
                </div>
              </div>

              {/* Support Info */}
              <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6">
                <h3 className="font-semibold mb-2">💡 Astuce</h3>
                <p className="text-sm text-muted-foreground">
                  Pour un support technique rapide, incluez votre version de l'app et une capture d'écran si possible.
                </p>
              </div>
            </section>
          </div>
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
            <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
              Confidentialité
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
