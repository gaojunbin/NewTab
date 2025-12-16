import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Palette, Settings as SettingsIcon, CloudSun, Search, Download, Upload, RotateCcw, Sun, Moon, Monitor, User, Clock } from 'lucide-react';
import { useSettingsStore, themePresets } from '../stores/useSettingsStore';

type TabType = 'appearance' | 'features' | 'backup';

function Settings() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('appearance');
  const { settings, setSettings, setThemePreset, resetSettings } = useSettingsStore();

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('openSettings', handleOpen);
    return () => window.removeEventListener('openSettings', handleOpen);
  }, []);

  const tabs = [
    { id: 'appearance' as TabType, label: '外观', icon: Palette },
    { id: 'features' as TabType, label: '功能', icon: SettingsIcon },
    { id: 'backup' as TabType, label: '备份', icon: Download },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4" onClick={() => setIsOpen(false)}>
          <motion.div
            initial={{ scale: 0.9, y: 100 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 100 }}
            className="rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[85vh] sm:max-h-[80vh] overflow-hidden backdrop-blur-[12px]"
            style={{
              background: settings.backgroundColor,
              border: `1px solid ${settings.accentColor}40`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4" style={{ borderBottom: `1px solid ${settings.accentColor}20` }}>
              <h2 className="text-lg sm:text-xl font-semibold" style={{ color: settings.textColor }}>设置</h2>
              <button onClick={() => setIsOpen(false)} className="p-2 rounded-lg hover:opacity-70" style={{ color: settings.accentColor }}><X className="w-5 h-5" /></button>
            </div>
            <div className="flex" style={{ borderBottom: `1px solid ${settings.accentColor}20` }}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex-1 sm:flex-none flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm transition-colors"
                  style={{
                    color: activeTab === tab.id ? settings.textColor : settings.accentColor,
                    borderBottom: activeTab === tab.id ? `2px solid ${settings.accentColor}` : '2px solid transparent',
                  }}
                >
                  <tab.icon className="w-4 h-4" /><span className="hidden xs:inline sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[65vh] sm:max-h-[60vh]">
              {activeTab === 'appearance' && <AppearanceSettings settings={settings} setSettings={setSettings} setThemePreset={setThemePreset} />}
              {activeTab === 'features' && <FeaturesSettings settings={settings} setSettings={setSettings} />}
              {activeTab === 'backup' && <BackupSettings settings={settings} resetSettings={resetSettings} />}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function AppearanceSettings({ settings, setSettings, setThemePreset }: { settings: any; setSettings: any; setThemePreset: any }) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm mb-3" style={{ color: settings.accentColor }}>主题模式</label>
        <div className="flex gap-2">
          {[{ id: 'light', label: '浅色', icon: Sun }, { id: 'dark', label: '深色', icon: Moon }, { id: 'auto', label: '自动', icon: Monitor }].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setSettings({ theme: mode.id })}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
              style={{
                background: settings.theme === mode.id ? settings.accentColor : `${settings.accentColor}20`,
                color: settings.theme === mode.id ? settings.backgroundColor : settings.textColor,
              }}
            >
              <mode.icon className="w-4 h-4" />{mode.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm mb-3" style={{ color: settings.accentColor }}>主题预设</label>
        <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-6 gap-2 sm:gap-3">
          {themePresets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => setThemePreset(preset)}
              className="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-xl transition-all hover:scale-105"
              style={{
                background: settings.backgroundColor === preset.primary ? `${settings.accentColor}30` : `${settings.accentColor}10`,
                border: settings.backgroundColor === preset.primary ? `2px solid ${settings.accentColor}` : '2px solid transparent',
              }}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: preset.primary, border: `2px solid ${preset.accent}` }}>
                <span style={{ color: preset.text, fontSize: '10px', fontWeight: 'bold' }}>Aa</span>
              </div>
              <span className="text-xs" style={{ color: settings.textColor }}>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeaturesSettings({ settings, setSettings }: { settings: any; setSettings: any }) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {[
          { key: 'showGreeting', label: '显示问候语', icon: User },
          { key: 'showClock', label: '显示时钟', icon: Clock },
          { key: 'showWeather', label: '显示天气', icon: CloudSun },
          { key: 'showSearch', label: '显示搜索框', icon: Search },
        ].map((feature) => (
          <div key={feature.key} className="flex items-center justify-between p-3 rounded-lg" style={{ background: `${settings.accentColor}10` }}>
            <div className="flex items-center gap-3">
              <feature.icon className="w-5 h-5" style={{ color: settings.accentColor }} />
              <span style={{ color: settings.textColor }}>{feature.label}</span>
            </div>
            <button
              onClick={() => setSettings({ [feature.key]: !settings[feature.key] })}
              className="w-12 h-6 rounded-full transition-colors"
              style={{ background: settings[feature.key] ? settings.accentColor : `${settings.accentColor}30` }}
            >
              <motion.div
                className="w-5 h-5 rounded-full shadow"
                style={{ background: settings.backgroundColor }}
                animate={{ x: settings[feature.key] ? 26 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
        ))}
      </div>
      {settings.showGreeting && (
        <div>
          <label className="block text-sm mb-2" style={{ color: settings.accentColor }}>问候名称</label>
          <input
            type="text"
            value={settings.greetingName || ''}
            onChange={(e) => setSettings({ greetingName: e.target.value })}
            className="w-full px-4 py-2 rounded-lg"
            style={{ background: `${settings.accentColor}20`, border: `1px solid ${settings.accentColor}40`, color: settings.textColor }}
            placeholder="输入你的名字"
          />
        </div>
      )}
      {settings.showClock && (
        <div>
          <label className="block text-sm mb-3" style={{ color: settings.accentColor }}>时钟设置</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSettings({ clockFormat: '12h' })}
              className="px-4 py-2 rounded-lg transition-colors"
              style={{
                background: settings.clockFormat === '12h' ? settings.accentColor : `${settings.accentColor}20`,
                color: settings.clockFormat === '12h' ? settings.backgroundColor : settings.textColor,
              }}
            >
              12小时制
            </button>
            <button
              onClick={() => setSettings({ clockFormat: '24h' })}
              className="px-4 py-2 rounded-lg transition-colors"
              style={{
                background: settings.clockFormat === '24h' ? settings.accentColor : `${settings.accentColor}20`,
                color: settings.clockFormat === '24h' ? settings.backgroundColor : settings.textColor,
              }}
            >
              24小时制
            </button>
            <button
              onClick={() => setSettings({ clockShowSeconds: !settings.clockShowSeconds })}
              className="px-4 py-2 rounded-lg transition-colors"
              style={{
                background: settings.clockShowSeconds ? settings.accentColor : `${settings.accentColor}20`,
                color: settings.clockShowSeconds ? settings.backgroundColor : settings.textColor,
              }}
            >
              显示秒
            </button>
            <button
              onClick={() => setSettings({ showMultiTimezone: !settings.showMultiTimezone })}
              className="px-4 py-2 rounded-lg transition-colors"
              style={{
                background: settings.showMultiTimezone ? settings.accentColor : `${settings.accentColor}20`,
                color: settings.showMultiTimezone ? settings.backgroundColor : settings.textColor,
              }}
            >
              多时区
            </button>
          </div>
        </div>
      )}
      {settings.showWeather && (
        <div>
          <label className="block text-sm mb-2" style={{ color: settings.accentColor }}>天气城市</label>
          <input
            type="text"
            value={settings.weatherCity}
            onChange={(e) => setSettings({ weatherCity: e.target.value })}
            className="w-full px-4 py-2 rounded-lg"
            style={{ background: `${settings.accentColor}20`, border: `1px solid ${settings.accentColor}40`, color: settings.textColor }}
            placeholder="输入城市"
          />
        </div>
      )}
    </div>
  );
}

function BackupSettings({ settings, resetSettings }: { settings: any; resetSettings: () => void }) {
  const handleExport = () => {
    const data = localStorage.getItem('newtab-settings');
    if (data) {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'newtab-settings.json';
      a.click();
    }
  };
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          localStorage.setItem('newtab-settings', JSON.stringify(data));
          window.location.reload();
        } catch { alert('导入失败'); }
      };
      reader.readAsText(file);
    }
  };
  return (
    <div className="space-y-6">
      <h3 className="font-medium mb-3" style={{ color: settings.textColor }}>数据管理</h3>
      <div className="space-y-3">
        <button
          onClick={handleExport}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors hover:opacity-80"
          style={{ background: `${settings.accentColor}20`, color: settings.textColor }}
        >
          <Download className="w-5 h-5" />导出配置
        </button>
        <label
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg cursor-pointer transition-colors hover:opacity-80"
          style={{ background: `${settings.accentColor}20`, color: settings.textColor }}
        >
          <Upload className="w-5 h-5" />导入配置
          <input type="file" accept=".json" onChange={handleImport} className="hidden" />
        </label>
        <button
          onClick={() => { if (confirm('确定重置?')) { resetSettings(); window.location.reload(); }}}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400"
        >
          <RotateCcw className="w-5 h-5" />重置设置
        </button>
      </div>
    </div>
  );
}

export default Settings;
