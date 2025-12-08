import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { User, LogOut, Trash2, Edit2, X, Lock } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Profile() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      setEmail(user.email || "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      setUsername(profile?.full_name || user.email?.split("@")[0] || "User");
      setNewUsername(profile?.full_name || user.email?.split("@")[0] || "User");
    } catch (error) {
      console.error("Error loading user data:", error);
      toast.error(t("Error loading profile data"));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({ full_name: newUsername })
        .eq("id", user.id);

      if (error) throw error;

      setUsername(newUsername);
      setIsEditing(false);
      toast.success(t("Profile updated successfully"));
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(t("Error updating profile"));
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success(t("Logged out successfully"));
      navigate("/auth");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error(t("Error logging out"));
    }
  };

  const handleChangePassword = async () => {
    try {
      // Validate fields
      if (!currentPassword || !newPassword || !confirmPassword) {
        toast.error(t("Please fill in all password fields"));
        return;
      }

      if (newPassword !== confirmPassword) {
        toast.error(t("New passwords do not match"));
        return;
      }

      if (newPassword.length < 6) {
        toast.error(t("New password must be at least 6 characters"));
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordChange(false);
      toast.success(t("Password updated successfully"));
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error(t("Error updating password"));
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Delete user favorites
      await supabase.from("user_favorites").delete().eq("user_id", user.id);
      
      // Delete profile
      await supabase.from("profiles").delete().eq("id", user.id);

      toast.success(t("Account deleted successfully"));
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error(t("Error deleting account"));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10 flex items-center justify-center">
        <div className="animate-pulse text-xl text-muted-foreground">{t("Loading...")}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/search")}
          >
            <X className="w-4 h-4 mr-2" />
            {t("Back to Search")}
          </Button>
          <ThemeToggle />
        </div>

        {/* Profile Card */}
        <div className="bg-background/80 backdrop-blur-xl rounded-2xl shadow-xl border border-border/50 p-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">
            <Avatar className="w-32 h-32 mb-4 ring-4 ring-primary/20">
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-4xl">
                <User className="w-16 h-16" />
              </AvatarFallback>
            </Avatar>
            <h1 className="text-3xl font-bold text-foreground mb-2">{t("Profile")}</h1>
          </div>

          {/* User Information */}
          <div className="space-y-6 mb-8">
            <div>
              <Label className="text-sm text-muted-foreground">{t("Email")}</Label>
              <div className="mt-2 px-4 py-3 bg-muted/50 rounded-lg text-foreground">
                {email}
              </div>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">{t("Username")}</Label>
              {isEditing ? (
                <div className="mt-2 flex gap-2">
                  <Input
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder={t("Enter username")}
                    className="flex-1"
                  />
                  <Button onClick={handleUpdateProfile} size="sm">
                    {t("Save")}
                  </Button>
                  <Button
                    onClick={() => {
                      setIsEditing(false);
                      setNewUsername(username);
                    }}
                    variant="outline"
                    size="sm"
                  >
                    {t("Cancel")}
                  </Button>
                </div>
              ) : (
                <div className="mt-2 px-4 py-3 bg-muted/50 rounded-lg text-foreground flex items-center justify-between">
                  <span>{username}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="hover:bg-primary/10"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Change Password Section */}
          <div className="mb-8">
            <Button
              onClick={() => setShowPasswordChange(!showPasswordChange)}
              variant="outline"
              className="w-full justify-start text-lg py-6 hover:bg-primary/10 hover:border-primary transition-all"
            >
              <Lock className="w-5 h-5 mr-3" />
              {t("Change Password")}
            </Button>

            {showPasswordChange && (
              <div className="mt-4 space-y-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                <div>
                  <Label className="text-sm text-muted-foreground">{t("Current Password")}</Label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder={t("Enter current password")}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">{t("New Password")}</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t("Enter new password")}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">{t("Confirm New Password")}</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t("Confirm new password")}
                    className="mt-2"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleChangePassword} className="flex-1">
                    {t("Update Password")}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowPasswordChange(false);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    variant="outline"
                  >
                    {t("Cancel")}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full justify-start text-lg py-6 hover:bg-primary/10 hover:border-primary transition-all"
            >
              <LogOut className="w-5 h-5 mr-3" />
              {t("Log Out")}
            </Button>

            <Button
              onClick={() => setShowDeleteDialog(true)}
              variant="outline"
              className="w-full justify-start text-lg py-6 text-destructive hover:bg-destructive/10 hover:border-destructive transition-all"
            >
              <Trash2 className="w-5 h-5 mr-3" />
              {t("Delete Account")}
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete Account?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("Are you sure you want to delete your account?")}
              <br />
              <br />
              {t("This action cannot be undone. Your account data and favorites will be permanently deleted.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-destructive hover:bg-destructive/90"
            >
              {t("Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
