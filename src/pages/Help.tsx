import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, HelpCircle, MessageCircle, Mail, FileText, MapPin, Trophy, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqItems = [
  {
    question: "Comment fonctionne le tracking GPS ?",
    answer: "L'application utilise le GPS de votre appareil pour enregistrer votre parcours. Lorsque vous appuyez sur START, nous collectons des points GPS toutes les 5 secondes pour tracer votre itinéraire et identifier les rues que vous explorez. Les données sont comparées avec OpenStreetMap pour déterminer les rues traversées.",
    icon: MapPin,
  },
  {
    question: "Comment débloquer des badges ?",
    answer: "Les badges se débloquent automatiquement lorsque vous atteignez certains objectifs : parcourir 1km (First Steps), explorer 10 rues (Street Collector), visiter 3 villes (Globe Trotter), etc. Vérifiez votre profil après chaque exploration pour voir vos nouveaux badges !",
    icon: Trophy,
  },
  {
    question: "Pourquoi certaines rues n'apparaissent pas colorées ?",
    answer: "Les rues sont chargées depuis OpenStreetMap dans un rayon de 2km autour de votre position. Si une rue n'apparaît pas, elle peut ne pas être encore référencée dans OSM, ou être trop éloignée. Assurez-vous également d'avoir une bonne connexion Internet lors du démarrage du tracking.",
    icon: MapPin,
  },
  {
    question: "Comment économiser la batterie pendant le tracking ?",
    answer: "Après 30 minutes de tracking, l'application active automatiquement le mode économie d'énergie en réduisant la fréquence des mises à jour GPS (de 10s à 15s). Vous pouvez aussi fermer les autres applications en arrière-plan et réduire la luminosité de l'écran.",
    icon: SettingsIcon,
  },
  {
    question: "Mes données GPS sont-elles privées ?",
    answer: "Oui ! Vos parcours GPS ne sont visibles que par vous. Nous ne partageons jamais vos données de localisation avec des tiers. Consultez notre Politique de confidentialité pour plus de détails sur la protection de vos données.",
    icon: FileText,
  },
  {
    question: "Comment changer la langue de l'application ?",
    answer: "Allez dans Profil > Préférences > Langue. Vous pouvez choisir entre Français, English et Español. Le changement est immédiat et s'applique à toute l'interface.",
    icon: SettingsIcon,
  },
  {
    question: "Puis-je explorer plusieurs villes ?",
    answer: "Absolument ! Appuyez sur 'Ajouter une ville' depuis le tableau de bord, puis sélectionnez une ville dans la liste ou utilisez la détection automatique. Vos statistiques seront séparées par ville.",
    icon: MapPin,
  },
  {
    question: "Comment supprimer mon compte ?",
    answer: "Allez dans Profil > Préférences > Zone de danger > Supprimer le compte. Cette action est irréversible et supprimera toutes vos données (parcours, statistiques, badges). Un backup avant suppression est recommandé.",
    icon: SettingsIcon,
  },
];

export default function Help() {
  const navigate = useNavigate();

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
          <h1 className="text-2xl font-bold">Centre d'aide</h1>
        </header>

        {/* Hero */}
        <section className="text-center mb-12">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
            <HelpCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Comment pouvons-nous vous aider ?</h2>
          <p className="text-muted-foreground">
            Trouvez des réponses à vos questions ou contactez notre support
          </p>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h3 className="text-xl font-semibold mb-4">Questions fréquentes</h3>
          <Accordion type="single" collapsible className="space-y-3">
            {faqItems.map((item, index) => (
              <AccordionItem
                key={index}
                value={\`item-\${index}\`}
                className="bg-card border border-border rounded-xl px-4"
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3 text-left">
                    <item.icon className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="font-medium">{item.question}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4 pl-8">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Contact Support */}
        <section className="space-y-4">
          <h3 className="text-xl font-semibold">Besoin d'aide supplémentaire ?</h3>
          
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Chat en direct</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Discutez avec notre équipe support (disponible 9h-18h)
                </p>
                <Button variant="outline" size="sm" onClick={() => window.open('https://discord.gg/cityexplorer', '_blank')}>
                  Ouvrir le chat
                </Button>
              </div>
            </div>

            <div className="border-t border-border pt-4"></div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Email</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Envoyez-nous un email, nous répondons sous 24h
                </p>
                <Link to="/contact">
                  <Button variant="outline" size="sm">
                    Nous contacter
                  </Button>
                </Link>
              </div>
            </div>

            <div className="border-t border-border pt-4"></div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Documentation</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Guides détaillés et tutoriels
                </p>
                <Button variant="outline" size="sm" onClick={() => window.open('https://docs.cityexplorer.app', '_blank')}>
                  Voir la documentation
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="mt-8 grid grid-cols-2 gap-3">
          <Link to="/about">
            <Button variant="outline" className="w-full rounded-xl">
              À propos
            </Button>
          </Link>
          <Link to="/privacy">
            <Button variant="outline" className="w-full rounded-xl">
              Confidentialité
            </Button>
          </Link>
        </section>
      </div>
    </AppLayout>
  );
}
