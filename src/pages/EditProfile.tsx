import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, User, Mail, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { supabaseGeo } from "@/lib/supabaseGeo";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { toast } from "sonner";

export default function EditProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/login");
        return;
      }
      
      setUser(session.user);
      setUsername(session.user.user_metadata?.username || session.user.email?.split("@")[0] || "");
      
      // Load profile from external DB
      const { data: profile } = await supabaseGeo
        .from('user_profiles')
        .select('bio, avatar_url')
        .eq('id', session.user.id)
        .single();
      
      if (profile) {
        setBio(profile.bio || "");
        setAvatarUrl(profile.avatar_url);
      }
      
      setLoading(false);
    };

    loadUser();
  }, [navigate]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 2MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Veuillez sélectionner une image");
      return;
    }

    toast.info("Upload d'avatar en cours de développement");
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Update username in auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { username }
      });

      if (authError) {
        throw authError;
      }

      // Update profile in external DB
      const { error: profileError } = await supabaseGeo
        .from('user_profiles')
        .upsert({
          id: user.id,
          bio,
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error('Profile update error:', profileError);
      }

      toast.success("Profil mis à jour");
      navigate("/profile");
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

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
          <h1 className="text-2xl font-bold">Modifier le profil</h1>
        </header>

        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-4xl shadow-lg overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                username.charAt(0).toUpperCase()
              )}
            </div>
            <label
              htmlFor="avatar-upload"
              className="absolute bottom-0 right-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center cursor-pointer shadow-md hover:bg-primary/90 transition-colors"
            >
              <Camera className="w-5 h-5 text-white" />
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </label>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Appuyez pour changer la photo
          </p>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Nom d'utilisateur
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Votre nom d'utilisateur"
              className="rounded-xl"
            />
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </Label>
            <Input
              id="email"
              value={user?.email || ""}
              disabled
              className="rounded-xl bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              L'email ne peut pas être modifié
            </p>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Bio
            </Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Parlez-nous de vous..."
              className="rounded-xl min-h-[100px]"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground text-right">
              {bio.length}/200
            </p>
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-xl mt-8"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sauvegarde...
            </>
          ) : (
            "Sauvegarder"
          )}
        </Button>
      </div>
    </AppLayout>
  );
}
