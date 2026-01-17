import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Marie L.",
    location: "Paris, France",
    avatar: "🇫🇷",
    quote: "J'ai redécouvert mon quartier ! En 2 mois, j'ai exploré 40% des rues autour de chez moi.",
    rating: 5,
  },
  {
    name: "James K.",
    location: "London, UK",
    avatar: "🇬🇧",
    quote: "The gamification aspect keeps me walking every day. Lost 5kg without even noticing!",
    rating: 5,
  },
  {
    name: "Anna M.",
    location: "Berlin, Germany",
    avatar: "🇩🇪",
    quote: "Perfect for exploring a new city. Makes every walk feel like a treasure hunt.",
    rating: 5,
  },
];

const stats = [
  { value: "10,000+", label: "Streets explored" },
  { value: "5,000+", label: "Active explorers" },
  { value: "50+", label: "Cities covered" },
  { value: "1M+", label: "Kilometers walked" },
];

export function SocialProofSection() {
  return (
    <section className="py-20 md:py-32 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {stats.map((stat, index) => (
            <div 
              key={stat.label} 
              className="text-center animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <p className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                {stat.value}
              </p>
              <p className="text-muted-foreground font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Loved by explorers worldwide
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join thousands of people who have transformed their daily walks into adventures.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.name}
              className="relative bg-card rounded-3xl border border-border p-8 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fade-in"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <Quote className="absolute top-6 right-6 w-8 h-8 text-primary/20" />
              
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-foreground mb-6 leading-relaxed">
                "{testimonial.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-2xl">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
