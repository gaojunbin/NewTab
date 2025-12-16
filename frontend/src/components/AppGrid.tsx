import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import type { App, AppGroup } from '../types';
import AppEditor from './AppEditor';

interface AppGridProps {
  appGroups: AppGroup[];
}

function AppGrid({ appGroups }: AppGridProps) {
  const { deleteApp, deleteAppGroup } = useAppStore();
  const { isEditMode, settings } = useSettingsStore();
  const [editingApp, setEditingApp] = useState<{ groupId: string; app?: App } | null>(null);
  const [editingGroup, setEditingGroup] = useState<AppGroup | null>(null);
  const [hoveredApp, setHoveredApp] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      {appGroups.map((group, groupIndex) => (
        <motion.div
          key={group.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: groupIndex * 0.1 }}
        >
          {/* Group Header */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${settings.accentColor}25 0%, ${settings.accentColor}10 100%)`,
              }}
            >
              <Icon
                icon={`mdi:${group.icon}`}
                className="w-5 h-5"
                style={{ color: settings.accentColor }}
              />
            </div>
            <h4
              className="text-base font-medium"
              style={{ color: settings.textColor }}
            >
              {group.category}
            </h4>
            {isEditMode && (
              <div className="flex gap-1 ml-auto">
                <button
                  onClick={() => setEditingGroup(group)}
                  className="p-2 rounded-lg transition-colors hover:opacity-70"
                  style={{ background: `${settings.accentColor}15` }}
                >
                  <Pencil className="w-4 h-4" style={{ color: settings.accentColor }} />
                </button>
                <button
                  onClick={() => { if (confirm('Delete group?')) deleteAppGroup(group.id); }}
                  className="p-2 rounded-lg transition-colors hover:opacity-70 bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            )}
          </div>

          {/* Apps Grid */}
          <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4">
            {group.apps.map((app, index) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: groupIndex * 0.1 + index * 0.02, type: 'spring', stiffness: 200 }}
                onMouseEnter={() => setHoveredApp(app.id)}
                onMouseLeave={() => setHoveredApp(null)}
                className="relative"
              >
                {isEditMode ? (
                  <div className="relative">
                    <div
                      className="flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl transition-all duration-300"
                      style={{
                        background: `linear-gradient(135deg, ${settings.accentColor}15 0%, ${settings.accentColor}05 100%)`,
                        border: `1px solid ${settings.accentColor}30`,
                      }}
                    >
                      <div
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, ${settings.accentColor}30 0%, ${settings.accentColor}10 100%)`,
                        }}
                      >
                        <Icon
                          icon={app.icon.startsWith('mdi:') ? app.icon : `mdi:${app.icon}`}
                          className="w-5 h-5 sm:w-7 sm:h-7"
                          style={{ color: settings.textColor }}
                        />
                      </div>
                      <span className="text-[10px] sm:text-xs text-center line-clamp-2 w-full leading-tight" style={{ color: settings.textColor }}>
                        {app.name}
                      </span>
                    </div>
                    <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 flex gap-1">
                      <button
                        onClick={() => setEditingApp({ groupId: group.id, app })}
                        className="w-6 h-6 rounded-full flex items-center justify-center shadow-lg"
                        style={{ background: settings.accentColor }}
                      >
                        <Pencil className="w-3 h-3" style={{ color: settings.backgroundColor }} />
                      </button>
                      <button
                        onClick={() => { if (confirm('Delete?')) deleteApp(group.id, app.id); }}
                        className="w-6 h-6 rounded-full flex items-center justify-center shadow-lg bg-red-500"
                      >
                        <Trash2 className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <a
                    href={app.url.startsWith('http') ? app.url : `https://${app.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl transition-all duration-300"
                    style={{
                      background: hoveredApp === app.id
                        ? `linear-gradient(135deg, ${settings.accentColor}25 0%, ${settings.accentColor}10 100%)`
                        : `linear-gradient(135deg, ${settings.accentColor}08 0%, transparent 100%)`,
                      border: `1px solid ${hoveredApp === app.id ? settings.accentColor + '50' : 'transparent'}`,
                      transform: hoveredApp === app.id ? 'translateY(-4px)' : 'translateY(0)',
                      boxShadow: hoveredApp === app.id
                        ? `0 20px 40px -10px ${settings.accentColor}30`
                        : 'none',
                    }}
                  >
                    <motion.div
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${settings.accentColor}20 0%, ${settings.accentColor}08 100%)`,
                        boxShadow: hoveredApp === app.id
                          ? `0 8px 20px -4px ${settings.accentColor}40`
                          : 'none',
                      }}
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      <Icon
                        icon={app.icon.startsWith('mdi:') ? app.icon : `mdi:${app.icon}`}
                        className="w-5 h-5 sm:w-7 sm:h-7"
                        style={{ color: settings.textColor }}
                      />
                    </motion.div>
                    <span
                      className="text-[10px] sm:text-xs text-center line-clamp-2 w-full leading-tight"
                      style={{
                        color: hoveredApp === app.id ? settings.textColor : settings.accentColor,
                      }}
                    >
                      {app.name}
                    </span>
                  </a>
                )}
              </motion.div>
            ))}

            {/* Add App Button in each group */}
            {isEditMode && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setEditingApp({ groupId: group.id })}
                className="flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border-2 border-dashed transition-all duration-300 hover:scale-105"
                style={{
                  borderColor: settings.accentColor + '40',
                  color: settings.accentColor,
                }}
              >
                <Plus className="w-7 h-7" />
                <span className="text-xs">Add</span>
              </motion.button>
            )}
          </div>
        </motion.div>
      ))}

      {/* Add Group Button */}
      {isEditMode && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setEditingGroup({ id: '', category: '', icon: 'folder', apps: [] })}
          className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-2xl border-2 border-dashed transition-all duration-300 hover:scale-[1.01]"
          style={{
            borderColor: settings.accentColor + '40',
            color: settings.accentColor,
          }}
        >
          <Plus className="w-5 h-5" />
          <span>New Group</span>
        </motion.button>
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="rounded-3xl p-6 w-full max-w-md backdrop-blur-xl"
        style={{
          background: `linear-gradient(135deg, ${settings.backgroundColor}f0 0%, ${settings.backgroundColor}e0 100%)`,
          border: `1px solid ${settings.accentColor}30`,
          boxShadow: `0 25px 50px -12px ${settings.accentColor}20`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold mb-6" style={{ color: settings.textColor }}>
          {isNew ? 'New Group' : 'Edit Group'}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-2" style={{ color: settings.accentColor }}>Name</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-transparent border focus:outline-none transition-colors"
              style={{
                borderColor: settings.accentColor + '40',
                color: settings.textColor,
              }}
              placeholder="Group name"
            />
          </div>
          <div>
            <label className="block text-sm mb-2" style={{ color: settings.accentColor }}>Icon</label>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: `${settings.accentColor}20` }}
              >
                <Icon icon={`mdi:${icon}`} className="w-6 h-6" style={{ color: settings.textColor }} />
              </div>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl bg-transparent border focus:outline-none"
                style={{
                  borderColor: settings.accentColor + '40',
                  color: settings.textColor,
                }}
                placeholder="MDI icon name (e.g., folder)"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl transition-colors hover:opacity-70"
            style={{ color: settings.accentColor }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl font-medium transition-all hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${settings.accentColor} 0%, ${settings.accentColor}cc 100%)`,
              color: settings.backgroundColor,
            }}
          >
            Save
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default AppGrid;
