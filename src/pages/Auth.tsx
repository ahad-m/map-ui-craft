import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import riyalEstateLogo from '@/assets/riyal-estate-logo.jpg';
import { Loader2, ArrowLeft, Languages } from 'lucide-react';
import { z } from 'zod';

const Auth = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/search');
      }
    };
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && event === 'SIGNED_IN') {
        navigate('/search');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Update document direction based on language
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate and trim inputs
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedPassword = password.trim();

      // Basic validation
      if (!trimmedEmail || !trimmedEmail.includes('@')) {
        toast.error(t('validEmailRequired'));
        setLoading(false);
        return;
      }

      if (trimmedPassword.length < 6) {
        toast.error(t('passwordTooShort'));
        setLoading(false);
        return;
      }

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: trimmedPassword,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error(t('invalidCredentials'));
          } else {
            toast.error(error.message);
          }
          setLoading(false);
          return;
        }

        toast.success(t('loggedIn'));
      } else {
        if (!fullName.trim()) {
          toast.error(t('fullNameRequired'));
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: trimmedPassword,
          options: {
            emailRedirectTo: `${window.location.origin}/search`,
            data: {
              full_name: fullName.trim(),
            }
          }
        });

        if (error) {
          if (error.message.includes('User already registered')) {
            toast.error(t('emailAlreadyRegistered'));
          } else {
            toast.error(error.message);
          }
          setLoading(false);
          return;
        }

        toast.success(t('accountCreated'));
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error(t('authError'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/10 p-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate('/')}
        className="absolute top-4 left-4"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          const newLang = i18n.language === 'en' ? 'ar' : 'en';
          i18n.changeLanguage(newLang);
        }}
        className="absolute top-4 right-4 gap-2"
      >
        <Languages className="h-4 w-4" />
        {i18n.language === 'en' ? 'ع' : 'EN'}
      </Button>
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <img 
              src={riyalEstateLogo} 
              alt="Riyal Estate" 
              className="h-20 w-20 rounded-full object-cover shadow-lg"
            />
          </div>
          <CardTitle className="text-2xl font-bold">
            {isLogin ? t('welcomeBack') : t('createAccount')}
          </CardTitle>
          <CardDescription>
            {isLogin 
              ? t('signInDescription')
              : t('signUpDescription')
            }
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleAuth}>
          <CardContent className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">{t('fullName')}</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder={t('enterFullName')}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isLogin}
                  disabled={loading}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('enterEmail')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('password')}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t('enterPassword')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              {!isLogin && (
                <p className="text-xs text-muted-foreground">
                  {t('passwordMinLength')}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isLogin ? t('signingIn') : t('creatingAccount')}
                </>
              ) : (
                isLogin ? t('signIn') : t('signUp')
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setIsLogin(!isLogin);
                setEmail('');
                setPassword('');
                setFullName('');
              }}
              disabled={loading}
            >
              {isLogin 
                ? t('noAccount')
                : t('haveAccount')
              }
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Auth;
