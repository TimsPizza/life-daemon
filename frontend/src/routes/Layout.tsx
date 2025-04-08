import { useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { Link, Outlet, useNavigate } from "react-router-dom";

const Layout = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/subscribe');
  } ,[])

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div id="layout" className="flex flex-col min-h-screen w-full bg-gray-100">
      <header className="bg-white shadow-md p-4">
        <nav className="container mx-auto flex justify-between items-center">
          <Link to="/subscribe" className="text-xl font-bold text-indigo-600">
            {t('appTitle')}
          </Link>
          <div className="flex items-center">
            {/* Language Switcher */}
            <div className="mr-4">
              <select 
                onChange={(e) => changeLanguage(e.target.value)} 
                value={i18n.language.split('-')[0]} // Use base language code (e.g., 'en' instead of 'en-US')
                className="p-1 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="en">{t('lang_en')}</option>
                <option value="fr">{t('lang_fr')}</option>
                <option value="cn">{t('lang_cn')}</option>
                <option value="jp">{t('lang_jp')}</option>
              </select>
            </div>
            {/* Navigation Links */}
            <Link 
              to="/subscribe" 
              className="ml-4 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              {t('subscribeButton')}
            </Link>
          </div>
        </nav>
      </header>
      <main className="flex-grow container mx-auto py-8">
        <Outlet /> {/* Render child routes here */}
      </main>
      <footer className="bg-gray-800 text-white text-center p-4 mt-auto">
        © {new Date().getFullYear()} {t('appTitle')}. All rights reserved.
      </footer>
    </div>
  );
};

export default Layout;
