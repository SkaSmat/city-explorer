import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="py-20 md:py-32 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-primary opacity-90" />
      
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-white" />
            <span className="text-sm font-medium text-white">100% Free to start</span>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Ready to discover your city like never before?
          </h2>
          
          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Join thousands of explorers turning their daily walks into epic adventures. No credit card required.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Link to="/signup">
              <Button 
                size="lg" 
                className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 font-bold text-lg px-10 py-7 rounded-2xl shadow-xl transition-all hover:scale-105 group"
              >
                Start Exploring Now
                <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          {/* Features list */}
          <div className="flex flex-wrap justify-center gap-6 mt-12 text-white/80 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-xs">✓</span>
              </div>
              <span>Free forever plan</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-xs">✓</span>
              </div>
              <span>No credit card</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-xs">✓</span>
              </div>
              <span>Strava sync</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
