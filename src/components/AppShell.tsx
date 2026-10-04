import React from 'react';
import {
  HeartPulse,
  Search,
  Calendar,
  Clock,
  MapPin,
  HelpCircle,
  Mic,
  Globe,
  Accessibility,
  Home,
  Building2,
  UserCheck,
  LogOut,
  Sparkles,
  FileCheck
} from 'lucide-react';
import { SupportedLanguage, User } from '../types/index.js';
import { LANGUAGES, t } from '../services/i18n.js';
import { useViewport } from '../hooks/useViewport.js';

export interface NavItem {
  id: string;
  label: string;
  icon: any;
}

interface AppShellProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  seniorMode: boolean;
  onToggleSeniorMode: () => void;
  currentLang: SupportedLanguage;
  onLangChange: (lang: SupportedLanguage) => void;
  onOpenVoice: () => void;
  currentUser?: User | null;
  onLogout?: () => void;
  onSwitchRole?: () => void;
  navItems?: NavItem[];
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentTab,
  onTabChange,
  seniorMode,
  onToggleSeniorMode,
  currentLang,
  onLangChange,
  onOpenVoice,
  currentUser,
  onLogout,
  onSwitchRole,
  navItems: propNavItems,
  children
}) => {
  const { width, isMobile, isTablet, isDesktop, isUltrawide, isShortViewport } = useViewport();

  const getRoleNavItems = (): NavItem[] => {
    if (!currentUser) return [];

    if (currentUser.role === 'patient') {
      return [
        { id: 'home', label: t('home', currentLang), icon: Home },
        { id: 'appointments', label: t('appointments', currentLang), icon: Calendar },
        { id: 'prescriptions', label: 'Prescriptions', icon: FileCheck },
        { id: 'queue', label: t('queue', currentLang), icon: Clock },
        { id: 'doctors', label: t('doctors', currentLang), icon: Search },
        { id: 'map', label: t('map', currentLang), icon: MapPin },
        { id: 'help', label: t('help', currentLang), icon: HelpCircle }
      ];
    }

    // For all other roles (Doctor, Staff, Admin) as per Feature 3
    return [
      { id: 'home', label: 'Dashboard', icon: Home }
    ];
  };

  const activeNavItems = propNavItems || getRoleNavItems();

  const initials = currentUser?.name
    ? currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'RC';

  return (
    <div className={`min-h-screen flex flex-col bg-slate-50 text-slate-900 ${seniorMode ? 'senior-mode' : ''}`}>
      {/* Top Header Navigation */}
      <header className={`sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs ${isShortViewport ? 'py-1' : 'py-2'}`}>
        <div className="fluid-container h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Zone 1: Wordmark Logo */}
          <button
            onClick={() => onTabChange('home')}
            className="flex items-center gap-2 group text-left focus:outline-hidden focus-visible:ring-2 focus-visible:ring-teal-600 rounded-lg p-1 cursor-pointer shrink-0"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20 group-hover:bg-teal-700 transition-colors shrink-0">
              <HeartPulse className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 font-outfit">
                CareFlow
              </span>
              <span className="hidden xl:inline-block ml-2 text-xs font-medium text-slate-500 border-l border-slate-300 pl-2">
                CareFlow Multispeciality Hospital
              </span>
            </div>
          </button>

          {/* Zone 2: Navigation Links (Desktop & Tablet Landscape) */}
          <nav className="hidden md:flex items-center gap-0.5 lg:gap-1.5 overflow-x-auto">
            {activeNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 text-xs lg:text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-teal-50 text-teal-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Actions (Senior Mode, Language, Voice, Patient Badge / Auth) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Language Selector */}
            <div className="relative flex items-center">
              <Globe className="w-3.5 h-3.5 text-slate-500 absolute left-2 pointer-events-none" />
              <select
                value={currentLang}
                onChange={(e) => onLangChange(e.target.value as SupportedLanguage)}
                className="pl-7 pr-2 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500 transition-colors cursor-pointer"
                aria-label="Select Language"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.nativeName}
                  </option>
                ))}
              </select>
            </div>

            {/* Senior Mode Toggle */}
            <button
              onClick={onToggleSeniorMode}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                seniorMode
                  ? 'bg-amber-500 text-white border-amber-600 font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/80'
              }`}
              title="Toggle Senior Citizen Accessibility Mode"
            >
              <Accessibility className="w-4 h-4" />
              <span className="hidden lg:inline">
                {seniorMode ? t('seniorMode', currentLang) : t('seniorMode', currentLang)}
              </span>
            </button>

            {/* Voice Assistant Button */}
            <button
              onClick={onOpenVoice}
              className="uiverse-btn-primary flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg shrink-0 cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5 animate-pulse" />
              <span className="hidden xs:inline">{t('speak', currentLang)}</span>
            </button>

            {/* User Profile / Logout / Switch Role Chip */}
            {currentUser && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="flex items-center gap-1.5">
                  <div className="w-8 h-8 rounded-full bg-teal-700 text-white font-bold text-xs flex items-center justify-center font-outfit shadow-xs" title={currentUser.name}>
                    {initials}
                  </div>
                  <div className="hidden xl:block text-left text-xs">
                    <div className="font-bold text-slate-800 truncate max-w-[100px]">{currentUser.name}</div>
                    <div className="text-[10px] text-teal-700 font-semibold uppercase">{currentUser.role}</div>
                  </div>
                </div>

                {onSwitchRole && (
                  <button
                    onClick={onSwitchRole}
                    className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Switch Demo Role"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                )}

                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className={`flex-1 w-full fluid-container py-4 sm:py-6 ${isMobile ? 'pb-24' : 'pb-10'}`}>
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar with Safe Area Support */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-2 pt-1.5 safe-area-bottom-padding flex items-center justify-around">
        {activeNavItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                isActive ? 'text-teal-700 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
              <span className="truncate max-w-[64px] text-[10px]">{item.label}</span>
            </button>
          );
        })}

        {/* Floating Mobile Voice Assistant Button */}
        <button
          onClick={onOpenVoice}
          className="voice-pulse w-11 h-11 bg-teal-600 text-white rounded-full flex items-center justify-center shadow-lg -mt-6 border-2 border-white focus:outline-hidden cursor-pointer shrink-0"
          aria-label="Activate Sarvam Voice Assistant"
        >
          <Mic className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
