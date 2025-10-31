import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [location.pathname, i18n.language]);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <Button
        variant="outline"
        size="sm"
        onClick={toggleLanguage}
        className="absolute top-4 right-4 gap-2"
      >
        <Languages className="h-4 w-4" />
        {i18n.language === 'en' ? 'العربية' : 'English'}
      </Button>
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-gray-600">{t('oops')}</p>
        <Link to="/" className="text-blue-500 underline hover:text-blue-700">
          {t('returnToHome')}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
