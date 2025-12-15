import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { ChevronDown, Plus, Pencil, Trash2 } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import type { App, AppGroup } from '../types';
import AppEditor from './AppEditor';

interface AppGridProps {
  appGroups: AppGroup[];
}

function AppGrid({ appGroups }: AppGridProps) {
  const { toggleGroupCollapse, deleteApp, deleteAppGroup } = useAppStore();
  const { isEditMode, settings } = useSettingsStore();
  const [editingApp, setEditingApp] = useState<{ groupId: string; app?: App } | null>(null);
  const [editingGroup, setEditingGroup] = useState<AppGroup | null>(null);

  return (
    <div className="space-y-6">
      {appGroups.map((group, groupIndex) => (
        <motion.div
          key={group.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: groupIndex * 0.05 }}
          className="rounded-2xl overflow-hidden backdrop-blur-[12px]"
          style={{
            background: settings.theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
            border: `1px solid ${settings.theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)'}`,
          }}
        >
          {/* Group Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-200"
            style={{ borderBottom: `1px solid ${settings.accentColor}20` }}
            onClick={() => !isEditMode && toggleGroupCollapse(group.id)}
          >
            <Icon icon={`mdi:${group.icon}`} className="w-5 h-5" style={{ color: settings.accentColor }} />
            <span className="font-medium flex-1" style={{ color: settings.textColor }}>{group.category}</span>

            {isEditMode ? (
              <div className="flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); setEditingGroup(group); }} className="p-1.5 rounded-lg hover:opacity-70">
                  <Pencil className="w-4 h-4" style={{ color: settings.accentColor }} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); if (confirm('Delete this group?')) deleteAppGroup(group.id); }} className="p-1.5 rounded-lg hover:opacity-70">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            ) : (
              <motion.div animate={{ rotate: group.collapsed ? 0 : 180 }}>
                <ChevronDown className="w-5 h-5" style={{ color: settings.accentColor }} />
              </motion.div>
            )}
          </div>

          {/* Apps */}
          <AnimatePresence>
            {!group.collapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {group.apps.map((app) => (
                    <AppItem
                      key={app.id}
                      app={app}
                      isEditMode={isEditMode}
                      onEdit={() => setEditingApp({ groupId: group.id, app })}
                      onDelete={() => deleteApp(group.id, app.id)}
                    />
                  ))}
                  {isEditMode && (
                    <button
                      onClick={() => setEditingApp({ groupId: group.id })}
                      className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed transition-all hover:opacity-70"
                      style={{ borderColor: settings.accentColor, color: settings.accentColor }}
                    >
                      <Plus className="w-5 h-5" />
                      <span className="text-sm">Add App</span>
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}

      {isEditMode && (
        <button
          onClick={() => setEditingGroup({ id: '', category: '', icon: 'folder', apps: [] })}
          className="w-full rounded-2xl p-4 flex items-center justify-center gap-2 border-2 border-dashed transition-all hover:opacity-70"
          style={{ borderColor: settings.accentColor, color: settings.accentColor }}
        >
          <Plus className="w-5 h-5" />
          <span>Add Group</span>
        </button>
      )}

      <AnimatePresence>
        {editingApp && <AppEditor groupId={editingApp.groupId} app={editingApp.app} onClose={() => setEditingApp(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {editingGroup && <GroupEditor group={editingGroup} onClose={() => setEditingGroup(null)} />}
      </AnimatePresence>
    </div>
  );
}

function AppItem({ app, isEditMode, onEdit, onDelete }: { app: App; isEditMode: boolean; onEdit: () => void; onDelete: () => void }) {
  const { settings } = useSettingsStore();
  const iconName = app.icon.startsWith('mdi:') ? app.icon : `mdi:${app.icon}`;

  if (isEditMode) {
    return (
      <div
        className="flex items-center gap-3 p-3 rounded-xl"
        style={{ background: `${settings.accentColor}10` }}
      >
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${settings.accentColor}20` }}>
          <Icon icon={iconName} className="w-6 h-6" style={{ color: settings.textColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm truncate" style={{ color: settings.textColor }}>{app.name}</div>
          <div className="text-xs truncate" style={{ color: settings.accentColor }}>{app.url}</div>
        </div>
        <div className="flex gap-1">
          <button onClick={onEdit} className="p-1 rounded hover:opacity-70"><Pencil className="w-3 h-3" style={{ color: settings.accentColor }} /></button>
          <button onClick={() => { if (confirm('Delete?')) onDelete(); }} className="p-1 rounded hover:opacity-70"><Trash2 className="w-3 h-3 text-red-400" /></button>
        </div>
      </div>
    );
  }

  return (
    <a
      href={app.url.startsWith('http') ? app.url : `https://${app.url}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:scale-[1.02]"
      style={{ background: `${settings.accentColor}10` }}
    >
      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${settings.accentColor}20` }}>
        <Icon icon={iconName} className="w-6 h-6" style={{ color: settings.textColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate" style={{ color: settings.textColor }}>{app.name}</div>
        <div className="text-xs truncate" style={{ color: settings.accentColor }}>{app.url}</div>
      </div>
    </a>
  );
}

function GroupEditor({ group, onClose }: { group: AppGroup; onClose: () => void }) {
  const { addAppGroup, updateAppGroup } = useAppStore();
  const { settings } = useSettingsStore();
  const [category, setCategory] = useState(group.category);
  const [icon, setIcon] = useState(group.icon);
  const isNew = !group.id;

  const handleSave = async () => {
    if (!category.trim()) return;
    if (isNew) await addAppGroup({ category, icon });
    else await updateAppGroup(group.id, { category, icon });
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
        className="rounded-2xl p-6 w-full max-w-md"
        style={{ background: settings.backgroundColor, border: `1px solid ${settings.accentColor}40` }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold mb-4" style={{ color: settings.textColor }}>{isNew ? 'Add Group' : 'Edit Group'}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1" style={{ color: settings.accentColor }}>Name</label>
            <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-transparent border focus:outline-none" style={{ borderColor: settings.accentColor, color: settings.textColor }} />
          </div>
          <div>
            <label className="block text-sm mb-1" style={{ color: settings.accentColor }}>Icon (MDI name)</label>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${settings.accentColor}20` }}>
                <Icon icon={`mdi:${icon}`} className="w-6 h-6" style={{ color: settings.textColor }} />
              </div>
              <input type="text" value={icon} onChange={(e) => setIcon(e.target.value)} className="flex-1 px-4 py-2 rounded-lg bg-transparent border focus:outline-none" style={{ borderColor: settings.accentColor, color: settings.textColor }} />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-lg" style={{ color: settings.accentColor }}>Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 rounded-lg" style={{ background: settings.accentColor, color: settings.backgroundColor }}>Save</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default AppGrid;
