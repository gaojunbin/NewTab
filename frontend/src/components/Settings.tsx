import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Palette,
  Settings as SettingsIcon,
  CloudSun,
  Search,
  Download,
  Upload,
  RotateCcw,
  Sun,
  Moon,
  Monitor,
  User,
  Clock,
  Link,
  Lock,
  LayoutGrid,
  Sparkles,
  Calendar,
  Plus,
  Trash2,
  Check,
} from 'lucide-react';
import { useSettingsStore, themePresets, rgba, isColorDark } from '../stores/useSettingsStore';
import { useAppStore } from '../stores/useAppStore';
import { authApi, getAuthHeaders } from '../services/api';
import { searchEngines } from './SearchBar';
import type { Settings as SettingsType, ThemePreset } from '../types';

type TabType = 'appearance' | 'features' | 'backup';

function Settings() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('appearance');
  const { settings, setSettings, setThemePreset, resetSettings } = useSettingsStore();

  const dark = isColorDark(settings.backgroundColor);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('openSettings', handleOpen);
    return () => window.removeEventListener('openSettings', handleOpen);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const tabs = [
    { id: 'appearance' as TabType, label: '外观与布局', icon: Palette },
    { id: 'features' as TabType, label: '组件与搜索', icon: SettingsIcon },
    { id: 'backup' as TabType, label: '数据与备份', icon: Download },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 bg-black/45 backdrop-blur-md z-50 flex items-end sm:items-center justify-center sm:p-4"
          onClick={() => setIsOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.96, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 24, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            className="rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[86vh] sm:max-h-[82vh] flex flex-col overflow-hidden backdrop-blur-2xl"
            style={{
              background: dark ? rgba('#161618', 0.95) : rgba('#ffffff', 0.96),
              border: `1px solid ${rgba(settings.textColor, 0.12)}`,
              boxShadow: `0 24px 64px -12px ${rgba('#000000', dark ? 0.7 : 0.22)}`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 sm:px-6 py-4"
              style={{ borderBottom: `1px solid ${rgba(settings.textColor, 0.08)}` }}
            >
              <div>
                <h2 className="text-base sm:text-lg font-semibold tracking-tight" style={{ color: settings.textColor }}>
                  偏好设置
                </h2>
                <p className="text-xs opacity-50" style={{ color: settings.textColor }}>
                  自定义您的新标签页视觉风格与工作流
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl opacity-65 hover:opacity-100 transition-opacity"
                style={{ background: rgba(settings.textColor, 0.05), color: settings.textColor }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Segmented Tab Bar */}
            <div
              className="px-5 sm:px-6 pt-3 pb-2"
              style={{ borderBottom: `1px solid ${rgba(settings.textColor, 0.07)}` }}
            >
              <div
                className="flex p-1 rounded-2xl"
                style={{ background: rgba(settings.textColor, 0.045) }}
              >
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className="relative flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-medium transition-colors z-10"
                      style={{
                        color: settings.textColor,
                        opacity: isActive ? 1 : 0.6,
                      }}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="settingsTabPill"
                          transition={{ type: 'spring', stiffness: 450, damping: 34 }}
                          className="absolute inset-0 rounded-xl"
                          style={{
                            background: dark ? rgba('#ffffff', 0.1) : '#ffffff',
                            boxShadow: `0 2px 8px -2px ${rgba('#000000', dark ? 0.4 : 0.08)}`,
                          }}
                        />
                      )}
                      <tab.icon className="w-4 h-4 relative z-10" />
                      <span className="relative z-10">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
              {activeTab === 'appearance' && (
                <AppearanceSettings
                  settings={settings}
                  setSettings={setSettings}
                  setThemePreset={setThemePreset}
                />
              )}
              {activeTab === 'features' && (
                <FeaturesSettings settings={settings} setSettings={setSettings} />
              )}
              {activeTab === 'backup' && (
                <BackupSettings settings={settings} resetSettings={resetSettings} />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function AppearanceSettings({
  settings,
  setSettings,
  setThemePreset,
}: {
  settings: SettingsType;
  setSettings: (s: Partial<SettingsType>) => void;
  setThemePreset: (p: ThemePreset) => void;
}) {
  return (
    <div className="space-y-6">
      {/* 1. Theme Mode */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-2.5 opacity-55" style={{ color: settings.textColor }}>
          色彩模式
        </label>
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { id: 'light' as const, label: '浅色模式', icon: Sun },
            { id: 'dark' as const, label: '深色模式', icon: Moon },
            { id: 'auto' as const, label: '跟随系统', icon: Monitor },
          ].map((mode) => {
            const active = settings.theme === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setSettings({ theme: mode.id })}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all"
                style={{
                  background: active ? settings.textColor : rgba(settings.textColor, 0.05),
                  color: active ? settings.backgroundColor : settings.textColor,
                  border: `1px solid ${active ? settings.textColor : rgba(settings.textColor, 0.08)}`,
                }}
              >
                <mode.icon className="w-4 h-4" />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Layout & Card Density */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2.5 opacity-55" style={{ color: settings.textColor }}>
            页面结构
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'immersive' as const, label: '双屏沉浸', desc: '全屏时钟 + 下滑内容' },
              { id: 'dashboard' as const, label: '单屏工作台', desc: '一屏展示所有内容' },
            ].map((item) => {
              const active = (settings.layoutMode || 'immersive') === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSettings({ layoutMode: item.id })}
                  className="p-3 rounded-xl text-left transition-all"
                  style={{
                    background: active ? rgba(settings.textColor, 0.09) : rgba(settings.textColor, 0.035),
                    border: `1px solid ${rgba(settings.textColor, active ? 0.25 : 0.08)}`,
                    color: settings.textColor,
                  }}
                >
                  <div className="text-xs font-semibold flex items-center justify-between">
                    <span>{item.label}</span>
                    {active && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <div className="text-[11px] opacity-55 mt-0.5">{item.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2.5 opacity-55" style={{ color: settings.textColor }}>
            应用卡片密度
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'comfortable' as const, label: '舒适网格', desc: '经典大图标矩阵' },
              { id: 'compact' as const, label: '紧凑胶囊', desc: '高密度横向卡片' },
            ].map((item) => {
              const active = (settings.cardDensity || 'comfortable') === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSettings({ cardDensity: item.id })}
                  className="p-3 rounded-xl text-left transition-all"
                  style={{
                    background: active ? rgba(settings.textColor, 0.09) : rgba(settings.textColor, 0.035),
                    border: `1px solid ${rgba(settings.textColor, active ? 0.25 : 0.08)}`,
                    color: settings.textColor,
                  }}
                >
                  <div className="text-xs font-semibold flex items-center justify-between">
                    <span>{item.label}</span>
                    {active && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <div className="text-[11px] opacity-55 mt-0.5">{item.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Theme Presets */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-2.5 opacity-55" style={{ color: settings.textColor }}>
          精选主题预设
        </label>
        <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 gap-2.5">
          {themePresets.map((preset) => {
            const isSelected =
              settings.presetName === preset.name ||
              (settings.backgroundColor.toLowerCase() === preset.primary.toLowerCase() &&
                settings.textColor.toLowerCase() === preset.text.toLowerCase());
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => setThemePreset(preset)}
                className="relative flex flex-col items-center gap-2 p-2.5 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: isSelected ? rgba(settings.textColor, 0.09) : rgba(settings.textColor, 0.035),
                  border: `1px solid ${rgba(settings.textColor, isSelected ? 0.28 : 0.08)}`,
                }}
              >
                {preset.badge && (
                  <span
                    className="absolute top-1.5 right-1.5 text-[9px] font-semibold px-1.5 py-0.2 rounded-full"
                    style={{
                      background: rgba(settings.textColor, 0.1),
                      color: settings.textColor,
                    }}
                  >
                    {preset.badge}
                  </span>
                )}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                  style={{
                    background: preset.primary,
                    border: `1.5px solid ${preset.accent}`,
                  }}
                >
                  <span style={{ color: preset.text, fontSize: '11px', fontWeight: 600 }}>Aa</span>
                </div>
                <span className="text-[11px] font-medium truncate w-full text-center" style={{ color: settings.textColor }}>
                  {preset.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Custom Colors */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-2.5 opacity-55" style={{ color: settings.textColor }}>
          自定义色彩微调
        </label>
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { key: 'backgroundColor' as const, label: '背景色', val: settings.backgroundColor },
            { key: 'textColor' as const, label: '主文字', val: settings.textColor },
            { key: 'accentColor' as const, label: '强调色', val: settings.accentColor },
          ].map((item) => (
            <label
              key={item.key}
              className="flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-colors"
              style={{
                background: rgba(settings.textColor, 0.035),
                border: `1px solid ${rgba(settings.textColor, 0.08)}`,
              }}
            >
              <input
                type="color"
                value={item.val}
                onChange={(e) =>
                  setSettings({
                    [item.key]: e.target.value,
                    ...(item.key === 'backgroundColor' ? { primaryColor: e.target.value, presetName: 'Custom' } : {}),
                  })
                }
                className="w-6 h-6 rounded-lg border-0 cursor-pointer bg-transparent"
              />
              <div className="min-w-0">
                <div className="text-xs font-medium" style={{ color: settings.textColor }}>
                  {item.label}
                </div>
                <div className="text-[10px] font-mono opacity-55 uppercase" style={{ color: settings.textColor }}>
                  {item.val}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeaturesSettings({
  settings,
  setSettings,
}: {
  settings: SettingsType;
  setSettings: (s: Partial<SettingsType>) => void;
}) {
  const { addCountdown, removeCountdown } = useSettingsStore();
  const [countdownName, setCountdownName] = useState('');
  const [countdownDate, setCountdownDate] = useState('');

  const handleAddCountdown = () => {
    if (!countdownName.trim() || !countdownDate) return;
    addCountdown({ name: countdownName.trim(), date: countdownDate });
    setCountdownName('');
    setCountdownDate('');
  };

  return (
    <div className="space-y-6">
      {/* Toggles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {[
          { key: 'showGreeting' as const, label: '显示问候语', icon: User },
          { key: 'showClock' as const, label: '显示时钟与日期', icon: Clock },
          { key: 'showWeather' as const, label: '显示实时天气', icon: CloudSun },
          { key: 'showSearch' as const, label: '显示搜索框', icon: Search },
          { key: 'showAppUrl' as const, label: '显示应用域名副标题', icon: LayoutGrid },
          { key: 'showBookmarkFavicons' as const, label: '显示书签网站图标', icon: Sparkles },
        ].map((feature) => {
          const isOn = !!settings[feature.key];
          return (
            <div
              key={feature.key}
              className="flex items-center justify-between p-3 rounded-xl"
              style={{
                background: rgba(settings.textColor, 0.035),
                border: `1px solid ${rgba(settings.textColor, 0.07)}`,
              }}
            >
              <div className="flex items-center gap-2.5">
                <feature.icon className="w-4 h-4 opacity-70" style={{ color: settings.textColor }} />
                <span className="text-xs sm:text-sm font-medium" style={{ color: settings.textColor }}>
                  {feature.label}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSettings({ [feature.key]: !isOn })}
                className="w-11 h-6 rounded-full transition-colors p-0.5 flex items-center"
                style={{
                  background: isOn ? settings.textColor : rgba(settings.textColor, 0.16),
                }}
              >
                <motion.div
                  className="w-5 h-5 rounded-full shadow-sm"
                  style={{ background: settings.backgroundColor }}
                  animate={{ x: isOn ? 20 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                />
              </button>
            </div>
          );
        })}
      </div>

      {/* Default Search Engine */}
      {settings.showSearch && (
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2 opacity-55" style={{ color: settings.textColor }}>
            默认搜索引擎
          </label>
          <div className="flex flex-wrap gap-2">
            {searchEngines.map((engine) => {
              const active = (settings.defaultSearchEngine || 'google') === engine.id;
              return (
                <button
                  key={engine.id}
                  type="button"
                  onClick={() => setSettings({ defaultSearchEngine: engine.id })}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                  style={{
                    background: active ? settings.textColor : rgba(settings.textColor, 0.05),
                    color: active ? settings.backgroundColor : settings.textColor,
                  }}
                >
                  {engine.name} ({engine.prefix})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Greeting Name & Weather City */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {settings.showGreeting && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-55" style={{ color: settings.textColor }}>
              问候昵称
            </label>
            <input
              type="text"
              value={settings.greetingName || ''}
              onChange={(e) => setSettings({ greetingName: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl text-sm"
              style={{
                background: rgba(settings.textColor, 0.045),
                border: `1px solid ${rgba(settings.textColor, 0.1)}`,
                color: settings.textColor,
              }}
              placeholder="输入您的名字 (可选)"
            />
          </div>
        )}

        {settings.showWeather && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-55" style={{ color: settings.textColor }}>
              天气城市
            </label>
            <input
              type="text"
              value={settings.weatherCity}
              onChange={(e) => setSettings({ weatherCity: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl text-sm"
              style={{
                background: rgba(settings.textColor, 0.045),
                border: `1px solid ${rgba(settings.textColor, 0.1)}`,
                color: settings.textColor,
              }}
              placeholder="Singapore, Beijing, Tokyo..."
            />
          </div>
        )}
      </div>

      {/* Clock Options */}
      {settings.showClock && (
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2 opacity-55" style={{ color: settings.textColor }}>
            时钟选项
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              {
                label: '12 小时制',
                active: settings.clockFormat === '12h',
                onClick: () => setSettings({ clockFormat: '12h' }),
              },
              {
                label: '24 小时制',
                active: settings.clockFormat === '24h',
                onClick: () => setSettings({ clockFormat: '24h' }),
              },
              {
                label: '显示秒数',
                active: settings.clockShowSeconds,
                onClick: () => setSettings({ clockShowSeconds: !settings.clockShowSeconds }),
              },
              {
                label: '全球多时区',
                active: settings.showMultiTimezone,
                onClick: () => setSettings({ showMultiTimezone: !settings.showMultiTimezone }),
              },
            ].map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={opt.onClick}
                className="px-3.5 py-2 rounded-xl text-xs font-medium transition-colors"
                style={{
                  background: opt.active ? settings.textColor : rgba(settings.textColor, 0.05),
                  color: opt.active ? settings.backgroundColor : settings.textColor,
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Countdowns */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-2 opacity-55 flex items-center gap-1.5" style={{ color: settings.textColor }}>
          <Calendar className="w-3.5 h-3.5" />
          <span>倒数日提醒</span>
        </label>
        <div className="flex flex-col sm:flex-row gap-2 mb-2.5">
          <input
            type="text"
            value={countdownName}
            onChange={(e) => setCountdownName(e.target.value)}
            placeholder="事件名称 (如: 论文截止)"
            className="flex-1 px-3.5 py-2 rounded-xl text-xs sm:text-sm"
            style={{
              background: rgba(settings.textColor, 0.045),
              border: `1px solid ${rgba(settings.textColor, 0.1)}`,
              color: settings.textColor,
            }}
          />
          <input
            type="date"
            value={countdownDate}
            onChange={(e) => setCountdownDate(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs sm:text-sm bg-transparent"
            style={{
              background: rgba(settings.textColor, 0.045),
              border: `1px solid ${rgba(settings.textColor, 0.1)}`,
              color: settings.textColor,
            }}
          />
          <button
            type="button"
            onClick={handleAddCountdown}
            disabled={!countdownName.trim() || !countdownDate}
            className="px-4 py-2 rounded-xl text-xs font-medium inline-flex items-center justify-center gap-1 disabled:opacity-40"
            style={{
              background: settings.textColor,
              color: settings.backgroundColor,
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>添加</span>
          </button>
        </div>
        {settings.countdowns?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {settings.countdowns.map((c) => (
              <div
                key={c.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs"
                style={{
                  background: rgba(settings.textColor, 0.045),
                  border: `1px solid ${rgba(settings.textColor, 0.08)}`,
                  color: settings.textColor,
                }}
              >
                <span className="font-medium">{c.name}</span>
                <span className="opacity-55 tabular-nums">{c.date}</span>
                <button
                  type="button"
                  onClick={() => removeCountdown(c.id)}
                  className="text-red-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BackupSettings({
  settings,
  resetSettings,
}: {
  settings: SettingsType;
  resetSettings: () => void;
}) {
  const { appGroups, bookmarks, fetchApps, fetchBookmarks } = useAppStore();
  const { notify } = useSettingsStore();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const dark = isColorDark(settings.backgroundColor);

  const handleExportTheme = () => {
    const data = localStorage.getItem('newtab-settings');
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed.state?.settings) {
        delete parsed.state.settings.searchHistory;
      }
      const blob = new Blob([JSON.stringify(parsed, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'newtab-theme.json';
      a.click();
      URL.revokeObjectURL(url);
      notify('主题配置已导出', 'success');
    }
  };

  const handleImportTheme = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          const current = localStorage.getItem('newtab-settings');
          if (current) {
            const currentParsed = JSON.parse(current);
            if (currentParsed.state?.settings?.searchHistory && data.state?.settings) {
              data.state.settings.searchHistory = currentParsed.state.settings.searchHistory;
            }
          }
          localStorage.setItem('newtab-settings', JSON.stringify(data));
          window.location.reload();
        } catch {
          notify('主题文件格式无效', 'error');
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const handleExportLinks = () => {
    const data = {
      appGroups,
      bookmarks,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'newtab-links.json';
    a.click();
    URL.revokeObjectURL(url);
    notify('链接与应用数据已导出', 'success');
  };

  const handleImportLinksClick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const status = await authApi.checkStatus();
    if (status.required && !status.authenticated) {
      setPendingFile(file);
      setShowPasswordDialog(true);
    } else {
      await importLinksData(file);
    }
  };

  const importLinksData = async (file: File) => {
    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.appGroups && !data.bookmarks) {
        throw new Error('无效的链接数据格式');
      }

      const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      };

      if (data.appGroups) {
        const res = await fetch('/api/apps', {
          method: 'PUT',
          headers,
          body: JSON.stringify({ appGroups: data.appGroups }),
        });
        if (!res.ok) throw new Error('导入应用数据失败');
      }

      if (data.bookmarks) {
        const res = await fetch('/api/links', {
          method: 'PUT',
          headers,
          body: JSON.stringify({ bookmarks: data.bookmarks }),
        });
        if (!res.ok) throw new Error('导入书签数据失败');
      }

      await fetchApps();
      await fetchBookmarks();
      notify('链接数据导入成功', 'success');
    } catch (err) {
      notify('导入失败: ' + (err instanceof Error ? err.message : '未知错误'), 'error');
    } finally {
      setImporting(false);
      setShowPasswordDialog(false);
      setPendingFile(null);
      setPassword('');
    }
  };

  const handlePasswordSubmit = async () => {
    if (!pendingFile) return;

    try {
      const verified = await authApi.verifyPassword(password);
      if (verified) {
        await importLinksData(pendingFile);
      } else {
        notify('密码错误，请重试', 'error');
      }
    } catch {
      notify('验证失败', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* 主题配置 */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 opacity-55 flex items-center gap-1.5" style={{ color: settings.textColor }}>
          <Palette className="w-3.5 h-3.5" />
          <span>外观与偏好备份</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleExportTheme}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs sm:text-sm font-medium transition-opacity hover:opacity-85"
            style={{
              background: rgba(settings.textColor, 0.05),
              border: `1px solid ${rgba(settings.textColor, 0.08)}`,
              color: settings.textColor,
            }}
          >
            <Download className="w-4 h-4" />
            <span>导出主题配置</span>
          </button>
          <label
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs sm:text-sm font-medium cursor-pointer transition-opacity hover:opacity-85"
            style={{
              background: rgba(settings.textColor, 0.05),
              border: `1px solid ${rgba(settings.textColor, 0.08)}`,
              color: settings.textColor,
            }}
          >
            <Upload className="w-4 h-4" />
            <span>导入主题配置</span>
            <input type="file" accept=".json" onChange={handleImportTheme} className="hidden" />
          </label>
        </div>
      </div>

      {/* 链接数据 */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 opacity-55 flex items-center gap-1.5" style={{ color: settings.textColor }}>
          <Link className="w-3.5 h-3.5" />
          <span>应用与书签数据备份</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleExportLinks}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs sm:text-sm font-medium transition-opacity hover:opacity-85"
            style={{
              background: rgba(settings.textColor, 0.05),
              border: `1px solid ${rgba(settings.textColor, 0.08)}`,
              color: settings.textColor,
            }}
          >
            <Download className="w-4 h-4" />
            <span>导出链接数据</span>
          </button>
          <label
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs sm:text-sm font-medium cursor-pointer transition-opacity hover:opacity-85"
            style={{
              background: rgba(settings.textColor, 0.05),
              border: `1px solid ${rgba(settings.textColor, 0.08)}`,
              color: settings.textColor,
            }}
          >
            <Upload className="w-4 h-4" />
            <span>导入链接数据</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportLinksClick}
              className="hidden"
              disabled={importing}
            />
          </label>
        </div>
      </div>

      {/* 重置 */}
      <div className="pt-2 border-t" style={{ borderColor: rgba(settings.textColor, 0.07) }}>
        <button
          type="button"
          onClick={() => {
            if (confirmReset) {
              resetSettings();
              notify('已恢复默认设置', 'info');
              setConfirmReset(false);
            } else {
              setConfirmReset(true);
              setTimeout(() => setConfirmReset(false), 3000);
            }
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs sm:text-sm font-medium bg-red-500/10 hover:bg-red-500/18 text-red-500 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{confirmReset ? '再次点击以确认重置所有偏好设置' : '重置所有外观与功能设置'}</span>
        </button>
      </div>

      {/* 密码弹窗 */}
      <AnimatePresence>
        {showPasswordDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/45 backdrop-blur-md z-[60] flex items-center justify-center p-4"
            onClick={() => {
              setShowPasswordDialog(false);
              setPendingFile(null);
              setPassword('');
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="rounded-3xl p-6 w-full max-w-sm"
              style={{
                background: dark ? rgba('#18181b', 0.96) : rgba('#ffffff', 0.97),
                border: `1px solid ${rgba(settings.textColor, 0.12)}`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: settings.textColor }}>
                <Lock className="w-4 h-4" />
                <span>需要管理员密码</span>
              </h3>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm mb-4"
                style={{
                  background: rgba(settings.textColor, 0.05),
                  border: `1px solid ${rgba(settings.textColor, 0.12)}`,
                  color: settings.textColor,
                }}
                placeholder="输入编辑密码..."
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordDialog(false);
                    setPendingFile(null);
                    setPassword('');
                  }}
                  className="px-4 py-2 rounded-xl text-sm opacity-70 hover:opacity-100"
                  style={{ color: settings.textColor }}
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handlePasswordSubmit}
                  disabled={importing}
                  className="px-5 py-2 rounded-xl text-sm font-medium"
                  style={{
                    background: settings.textColor,
                    color: settings.backgroundColor,
                  }}
                >
                  {importing ? '导入中...' : '确认导入'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Settings;
