import { ArrowRight, Play, MapPin, Trophy, Route } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function HeroSection() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 dark:from-indigo-900 dark:via-purple-900 dark:to-violet-950" />
      
      {/* Animated Grid Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
      </div>
      
      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse" />
        <div className="absolute bottom-40 right-20 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-yellow-400/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative container mx-auto px-6 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8 animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-medium text-white/90">Nouveau: Mode hors-ligne disponible</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 leading-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Turn Every Walk Into An{' '}
              <span className="relative">
                <span className="relative z-10 bg-gradient-to-r from-emerald-300 to-emerald-400 bg-clip-text text-transparent">
                  Adventure
                </span>
                <span className="absolute bottom-2 left-0 w-full h-3 bg-emerald-400/30 -z-0 rounded" />
              </span>
            </h1>

            {/* Subheading with Stats */}
            <p className="text-lg md:text-xl text-white/80 mb-8 max-w-lg mx-auto lg:mx-0 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Explore <span className="font-bold text-white">10,000+</span> streets. 
              Unlock <span className="font-bold text-white">50+</span> badges. 
              Transform your daily walks into an epic journey.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <Link to="/signup">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-white text-indigo-600 hover:bg-white/90 font-bold text-lg px-8 py-6 rounded-2xl shadow-xl shadow-black/20 transition-all hover:scale-105 hover:shadow-2xl group"
                >
                  Start Free
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="lg"
                className="w-full sm:w-auto text-white border-2 border-white/30 hover:bg-white/10 font-semibold text-lg px-8 py-6 rounded-2xl group"
                onClick={() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Watch Demo
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="mt-12 flex items-center gap-6 justify-center lg:justify-start animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="flex -space-x-3">
                {['🇫🇷', '🇬🇧', '🇺🇸', '🇩🇪', '🇪🇸'].map((flag, i) => (
                  <div 
                    key={i} 
                    className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center text-lg"
                    style={{ zIndex: 5 - i }}
                  >
                    {flag}
                  </div>
                ))}
              </div>
              <div className="text-left">
                <p className="text-white font-bold">5,000+</p>
                <p className="text-white/60 text-sm">explorateurs actifs</p>
              </div>
            </div>
          </div>

          {/* Right: Phone Mockup */}
          <div 
            className="relative flex justify-center lg:justify-end animate-fade-in"
            style={{ animationDelay: '0.2s' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Glow Effect */}
            <div className={`absolute inset-0 bg-gradient-to-r from-emerald-400/30 to-cyan-400/30 rounded-[3rem] blur-3xl transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-50'}`} />
            
            {/* Phone Frame */}
            <div className={`relative w-72 md:w-80 transition-transform duration-500 ${isHovered ? 'scale-105' : 'scale-100'}`}>
              <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-[3rem] p-3 shadow-2xl shadow-black/40">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-gray-900 rounded-b-2xl z-10" />
                
                {/* Screen */}
                <div className="relative bg-gray-900 rounded-[2.5rem] overflow-hidden aspect-[9/19]">
                  {/* Status Bar */}
                  <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-black/50 to-transparent z-20 flex items-center justify-between px-8 pt-2">
                    <span className="text-white text-xs font-medium">9:41</span>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-2 flex gap-0.5">
                        <div className="w-1 h-full bg-white rounded-full" />
                        <div className="w-1 h-full bg-white rounded-full" />
                        <div className="w-1 h-full bg-white/60 rounded-full" />
                        <div className="w-1 h-full bg-white/30 rounded-full" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Map Content */}
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-purple-100">
                    {/* Grid streets */}
                    <div className="absolute inset-0 p-6">
                      <div className="w-full h-full grid grid-cols-8 gap-1">
                        {Array.from({ length: 64 }).map((_, i) => {
                          const isExplored = [2, 3, 4, 10, 11, 12, 18, 19, 20, 26, 27, 28, 34, 35, 36, 42, 43, 44, 50, 51, 52].includes(i);
                          const isRoute = [11, 19, 27, 35, 43].includes(i);
                          return (
                            <div
                              key={i}
                              className={`rounded-sm transition-all duration-300 ${
                                isRoute 
                                  ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' 
                                  : isExplored 
                                    ? 'bg-indigo-500/80' 
                                    : 'bg-gray-300/50'
                              }`}
                              style={{
                                animationDelay: `${i * 30}ms`,
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Location Pin */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full">
                      <div className="relative">
                        <MapPin className={`w-10 h-10 text-emerald-500 drop-shadow-lg transition-transform duration-500 ${isHovered ? 'animate-bounce' : ''}`} />
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-1 bg-black/20 rounded-full blur-sm" />
                      </div>
                    </div>
                    
                    {/* Bottom Card */}
                    <div className="absolute bottom-4 left-4 right-4 bg-white rounded-2xl p-4 shadow-xl">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                          <Route className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">Session active</p>
                          <p className="text-xs text-gray-500">2.4 km • 32 min</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1 bg-indigo-50 rounded-lg p-2 text-center">
                          <p className="text-xs text-gray-500">Rues</p>
                          <p className="font-bold text-indigo-600">+12</p>
                        </div>
                        <div className="flex-1 bg-emerald-50 rounded-lg p-2 text-center">
                          <p className="text-xs text-gray-500">Points</p>
                          <p className="font-bold text-emerald-600">+240</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Achievement Popup */}
                    <div className={`absolute top-16 left-4 right-4 bg-white rounded-xl p-3 shadow-xl transition-all duration-500 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center text-lg">
                          🏆
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-xs">Badge débloqué !</p>
                          <p className="text-[10px] text-gray-500">Explorateur de quartier</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
