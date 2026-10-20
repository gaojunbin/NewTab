import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { X, Globe, Sparkles } from 'lucide-react';
import type { App } from '../types';
import { useAppStore } from '../stores/useAppStore';
import { useSettingsStore, rgba, isColorDark } from '../stores/useSettingsStore';
import { getFaviconUrl, extractDomain } from '../services/api';

const popularIcons = [
  'web', 'github', 'docker', 'server', 'database', 'cloud', 'api', 'email',
  'folder', 'file-pdf-box', 'image-area', 'television', 'bitcoin', 'chart-line',
  'home-circle-outline', 'cog', 'shield-check', 'lock', 'key', 'terminal',
  'code-braces', 'remote-desktop', 'nas', 'clipboard', 'newspaper', 'toolbox',
  'swap-horizontal', 'map-marker', 'eye-check-outline', 'backup-restore',
];

function resolveIconName(icon: string): string {
  if (!icon) return 'mdi:web';
  return icon.includes(':') ? icon : `mdi:${icon}`;
}

function guessIconFromInput(name: string, url: string): string | null {
  const text = `${name} ${url}`.toLowerCase();
  if (text.includes('github')) return 'github';
  if (text.includes('docker')) return 'docker';
  if (text.includes('mail') || text.includes('email')) return 'email';
  if (text.includes('drive') || text.includes('cloud')) return 'google-drive';
  if (text.includes('nas')) return 'nas';
  if (text.includes('ssh') || text.includes('term')) return 'ssh';
  if (text.includes('pdf')) return 'file-pdf-box';
  if (text.includes('img') || text.includes('png') || text.includes('image')) return 'image-area';
  if (text.includes('tv') || text.includes('video') || text.includes('media')) return 'television';
  if (text.includes('pass') || text.includes('vault')) return 'onepassword';
  if (text.includes('monitor') || text.includes('status')) return 'eye-check-outline';
  if (text.includes('rustdesk') || text.includes('remote')) return 'remote-desktop';
  if (text.includes('api') || text.includes('claude') || text.includes('gpt')) return 'api';
  if (text.includes('proxy') || text.includes('frp') || text.includes('clash')) return 'swap-horizontal';
  if (text.includes('server') || text.includes('vps')) return 'server';
  return null;
}

interface AppEditorProps {
  groupId: string;
  app?: App;
  onClose: () => void;
}

function AppEditor({ groupId, app, onClose }: AppEditorProps) {
  const { addApp, updateApp } = useAppStore();
  const { settings } = useSettingsStore();
  const [name, setName] = useState(app?.name || '');
  const [url, setUrl] = useState(app?.url || '');
  const [icon, setIcon] = useState(app?.icon || 'web');
  const [iconManuallyEdited, setIconManuallyEdited] = useState(!!app);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const isNew = !app;
  const dark = isColorDark(settings.backgroundColor);

  // Auto-suggest icon for new apps as user types name/url
  useEffect(() => {
    if (iconManuallyEdited) return;
    const guessed = guessIconFromInput(name, url);
    if (guessed) {
      setIcon(guessed);
    }
  }, [name, url, iconManuallyEdited]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSave = async () => {
    if (!name.trim() || !url.trim()) return;
    if (isNew) {
      await addApp(groupId, { name: name.trim(), url: url.trim(), icon: icon.trim() || 'web' });
    } else {
      await updateApp(groupId, app.id, { name: name.trim(), url: url.trim(), icon: icon.trim() || 'web' });
    }
    onClose();
  };

  const faviconPreview = url.trim() ? getFaviconUrl(url.trim(), 64) : '';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 bg-black/45 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, y: 12, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.96, y: 12, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 420, damping: 34 }}
        className="rounded-3xl p-6 w-full max-w-md backdrop-blur-2xl"
        style={{
          background: dark ? rgba('#18181b', 0.95) : rgba('#ffffff', 0.96),
          border: `1px solid ${rgba(settings.textColor, 0.12)}`,
          boxShadow: `0 24px 60px -12px ${rgba('#000000', dark ? 0.65 : 0.2)}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold tracking-tight" style={{ color: settings.textColor }}>
            {isNew ? '添加应用' : '编辑应用'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl transition-opacity opacity-60 hover:opacity-100"
            style={{ background: rgba(settings.textColor, 0.05), color: settings.textColor }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5 opacity-70" style={{ color: settings.textColor }}>
              应用名称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm transition-colors"
              style={{
                background: rgba(settings.textColor, 0.04),
                border: `1px solid ${rgba(settings.textColor, 0.1)}`,
                color: settings.textColor,
              }}
              placeholder="例如: GitHub / NAS"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5 opacity-70" style={{ color: settings.textColor }}>
              访问地址 (URL)
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm transition-colors"
              style={{
                background: rgba(settings.textColor, 0.04),
                border: `1px solid ${rgba(settings.textColor, 0.1)}`,
                color: settings.textColor,
              }}
              placeholder="https://example.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium opacity-70" style={{ color: settings.textColor }}>
                图标 (MDI / Iconify 或自动网站图标)
              </label>
              <div className="flex items-center gap-2">
                {url.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      setIcon('favicon');
                      setIconManuallyEdited(true);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md transition-opacity opacity-75 hover:opacity-100"
                    style={{
                      background: icon === 'favicon' ? settings.textColor : rgba(settings.textColor, 0.06),
                      color: icon === 'favicon' ? settings.backgroundColor : settings.textColor,
                    }}
                  >
                    <Globe className="w-3 h-3" />
                    <span>网站图标</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowIconPicker(!showIconPicker)}
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md transition-opacity opacity-75 hover:opacity-100"
                  style={{
                    background: rgba(settings.textColor, 0.06),
                    color: settings.textColor,
                  }}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>图标库</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform active:scale-95"
                style={{
                  background: rgba(settings.textColor, 0.06),
                  border: `1px solid ${rgba(settings.textColor, 0.1)}`,
                }}
              >
                {icon === 'favicon' && faviconPreview ? (
                  <img src={faviconPreview} alt="" className="w-5 h-5 rounded-sm object-contain" />
                ) : (
                  <Icon icon={resolveIconName(icon)} className="w-5 h-5" style={{ color: settings.textColor }} />
                )}
              </button>
              <input
                type="text"
                value={icon}
                onChange={(e) => {
                  setIcon(e.target.value);
                  setIconManuallyEdited(true);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                className="flex-1 px-3.5 py-2.5 rounded-xl text-sm transition-colors"
                style={{
                  background: rgba(settings.textColor, 0.04),
                  border: `1px solid ${rgba(settings.textColor, 0.1)}`,
                  color: settings.textColor,
                }}
                placeholder="mdi 图标名 (如 server, github) 或 favicon"
              />
            </div>

            {showIconPicker && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2.5 p-2.5 rounded-2xl overflow-hidden"
                style={{
                  background: rgba(settings.textColor, 0.035),
                  border: `1px solid ${rgba(settings.textColor, 0.08)}`,
                }}
              >
                <div className="grid grid-cols-8 gap-1.5 max-h-36 overflow-y-auto p-0.5">
                  {popularIcons.map((iconName) => {
                    const active = icon === iconName;
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => {
                          setIcon(iconName);
                          setIconManuallyEdited(true);
                          setShowIconPicker(false);
                        }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105"
                        style={{
                          background: active ? settings.textColor : rgba(settings.textColor, 0.05),
                        }}
                        title={iconName}
                      >
                        <Icon
                          icon={`mdi:${iconName}`}
                          className="w-4 h-4"
                          style={{ color: active ? settings.backgroundColor : settings.textColor }}
                        />
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Live Card Preview */}
        <div
          className="mt-5 p-3.5 rounded-2xl flex items-center gap-3"
          style={{
            background: rgba(settings.textColor, 0.03),
            border: `1px solid ${rgba(settings.textColor, 0.07)}`,
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: rgba(settings.textColor, 0.06) }}
          >
            {icon === 'favicon' && faviconPreview ? (
              <img src={faviconPreview} alt="" className="w-5 h-5 rounded-sm object-contain" />
            ) : (
              <Icon icon={resolveIconName(icon)} className="w-5 h-5" style={{ color: settings.textColor }} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate" style={{ color: settings.textColor }}>
              {name || '应用名称预览'}
            </p>
            <p className="text-xs truncate opacity-55" style={{ color: settings.textColor }}>
              {url ? extractDomain(url) : 'example.com'}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-opacity opacity-70 hover:opacity-100"
            style={{ color: settings.textColor }}
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim() || !url.trim()}
            className="px-5 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 disabled:opacity-40"
            style={{
              background: settings.textColor,
              color: settings.backgroundColor,
            }}
          >
            保存
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default AppEditor;
