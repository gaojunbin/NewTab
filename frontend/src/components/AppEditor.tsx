import { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { App } from '../types';
import { useAppStore } from '../stores/useAppStore';
import { useSettingsStore } from '../stores/useSettingsStore';

const popularIcons = ['web', 'github', 'google', 'youtube', 'twitter', 'docker', 'server', 'database', 'cloud', 'api', 'email', 'folder', 'file-document', 'image', 'video', 'bitcoin', 'chart-line', 'home', 'cog', 'shield', 'lock', 'key', 'terminal', 'code-braces'];

interface AppEditorProps { groupId: string; app?: App; onClose: () => void; }

function AppEditor({ groupId, app, onClose }: AppEditorProps) {
  const { addApp, updateApp } = useAppStore();
  const { settings } = useSettingsStore();
  const [name, setName] = useState(app?.name || '');
  const [url, setUrl] = useState(app?.url || '');
  const [icon, setIcon] = useState(app?.icon || 'web');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const isNew = !app;

  const handleSave = async () => {
    if (!name.trim() || !url.trim()) return;
    if (isNew) await addApp(groupId, { name, url, icon });
    else await updateApp(groupId, app.id, { name, url, icon });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="rounded-2xl p-6 w-full max-w-md"
        style={{ background: settings.backgroundColor, border: `1px solid ${settings.accentColor}40` }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold mb-4" style={{ color: settings.textColor }}>{isNew ? '添加应用' : '编辑应用'}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1" style={{ color: settings.accentColor }}>名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-transparent border focus:outline-none"
              style={{ borderColor: settings.accentColor, color: settings.textColor }}
              placeholder="应用名称"
            />
          </div>
          <div>
            <label className="block text-sm mb-1" style={{ color: settings.accentColor }}>网址</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-transparent border focus:outline-none"
              style={{ borderColor: settings.accentColor, color: settings.textColor }}
              placeholder="example.com"
            />
          </div>
          <div>
            <label className="block text-sm mb-1" style={{ color: settings.accentColor }}>图标</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="w-12 h-12 rounded-lg flex items-center justify-center transition-colors hover:opacity-80"
                style={{ background: `${settings.accentColor}20`, border: `1px solid ${settings.accentColor}40` }}
              >
                <Icon icon={`mdi:${icon}`} className="w-7 h-7" style={{ color: settings.textColor }} />
              </button>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="flex-1 px-4 py-2 rounded-lg bg-transparent border focus:outline-none"
                style={{ borderColor: settings.accentColor, color: settings.textColor }}
                placeholder="MDI图标名称"
              />
            </div>
            {showIconPicker && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 p-3 rounded-lg"
                style={{ background: `${settings.accentColor}10`, border: `1px solid ${settings.accentColor}20` }}
              >
                <div className="grid grid-cols-8 gap-2">
                  {popularIcons.map((iconName) => (
                    <button
                      key={iconName}
                      onClick={() => { setIcon(iconName); setShowIconPicker(false); }}
                      className="w-8 h-8 rounded flex items-center justify-center transition-colors"
                      style={{
                        background: icon === iconName ? settings.accentColor : `${settings.accentColor}20`,
                        color: icon === iconName ? settings.backgroundColor : settings.textColor,
                      }}
                    >
                      <Icon icon={`mdi:${iconName}`} className="w-5 h-5" style={{ color: icon === iconName ? settings.backgroundColor : settings.textColor }} />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
        <div className="mt-4 p-4 rounded-lg" style={{ background: `${settings.accentColor}10`, border: `1px solid ${settings.accentColor}20` }}>
          <p className="text-xs mb-2" style={{ color: settings.accentColor }}>预览</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${settings.accentColor}20` }}>
              <Icon icon={`mdi:${icon}`} className="w-6 h-6" style={{ color: settings.textColor }} />
            </div>
            <div>
              <p className="font-medium" style={{ color: settings.textColor }}>{name || '应用名称'}</p>
              <p className="text-xs" style={{ color: settings.accentColor }}>{url || 'example.com'}</p>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-lg" style={{ color: settings.accentColor }}>取消</button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || !url.trim()}
            className="px-4 py-2 rounded-lg disabled:opacity-50"
            style={{ background: settings.accentColor, color: settings.backgroundColor }}
          >
            保存
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default AppEditor;
