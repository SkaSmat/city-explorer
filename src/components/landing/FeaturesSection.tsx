import { MapPin, Map, Trophy, Zap, Users, Smartphone } from "lucide-react";

const features = [
  {
    icon: MapPin,
    title: "GPS Tracking",
    description: "Automatic tracking during your urban explorations with precision up to 10 meters.",
    gradient: "from-indigo-500 to-purple-500",
  },
  {
    icon: Map,
    title: "Live Street Map",
    description: "Watch your explored streets light up in real-time on an interactive city map.",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: Trophy,
    title: "Achievement System",
    description: "Unlock 50+ badges by exploring new areas, completing challenges, and hitting milestones.",
    gradient: "from-yellow-500 to-orange-500",
  },
  {
    icon: Zap,
    title: "Daily Challenges",
    description: "Complete daily missions to earn bonus points and keep your streak alive.",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: Users,
    title: "Leaderboards",
    description: "Compete with friends and explorers worldwide. Climb the ranks in your city.",
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    icon: Smartphone,
    title: "Strava Integration",
    description: "Import your existing activities from Strava and sync your exploration history.",
    gradient: "from-orange-500 to-red-500",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-32 bg-muted/30">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Everything you need to{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              explore more
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Powerful features designed to transform your daily walks into an engaging adventure.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative bg-card rounded-3xl border border-border p-8 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Hover gradient border effect */}
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className={`absolute inset-[1px] rounded-3xl bg-gradient-to-br ${feature.gradient} opacity-5`} />
              </div>

              <div className="relative">
                {/* Icon */}
                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} mb-6 shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
