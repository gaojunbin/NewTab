import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Plus, Pencil, Trash2, GripVertical, ChevronRight, ArrowUpRight, ArrowUp, ArrowDown } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAppStore } from '../stores/useAppStore';
import { useSettingsStore, rgba, isColorDark } from '../stores/useSettingsStore';
import { normalizeUrl, extractDomain, getFaviconUrl } from '../services/api';
import type { App, AppGroup, Settings } from '../types';
import AppEditor from './AppEditor';

interface AppGridProps {
  appGroups: AppGroup[];
}

function resolveIcon(icon: string): string {
  if (!icon) return 'mdi:web';
  return icon.includes(':') ? icon : `mdi:${icon}`;
}

function AppIconView({ app, className, color }: { app: App; className?: string; color: string }) {
  const [imgError, setImgError] = useState(false);

  if (app.icon === 'favicon' && !imgError) {
    const src = getFaviconUrl(app.url, 64);
    if (src) {
      return (
        <img
          src={src}
          alt={app.name}
          onError={() => setImgError(true)}
          className="w-5 h-5 sm:w-6 sm:h-6 rounded-sm object-contain"
        />
      );
    }
  }

  return (
    <Icon
      icon={resolveIcon(app.icon)}
      className={className || 'w-5 h-5 sm:w-6 sm:h-6'}
      style={{ color }}
    />
  );
}

interface SortableAppProps {
  app: App;
  settings: Settings;
  onEdit: () => void;
  onDelete: () => void;
}

function SortableApp({ app, settings, onEdit, onDelete }: SortableAppProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: app.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div
        className="flex flex-col items-center gap-2.5 p-3.5 sm:p-4 rounded-2xl transition-all duration-200"
        style={{
          background: rgba(settings.textColor, 0.035),
          border: `1px solid ${rgba(settings.textColor, 0.1)}`,
        }}
      >
        <div
          {...attributes}
          {...listeners}
          className="absolute top-1.5 left-1.5 p-1 cursor-grab active:cursor-grabbing rounded-lg opacity-45 hover:opacity-100 transition-opacity"
          style={{ color: settings.textColor }}
          title="拖拽排序"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>
        <div
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center"
          style={{
            background: rgba(settings.textColor, 0.06),
          }}
        >
          <AppIconView app={app} color={settings.textColor} />
        </div>
        <span
          className="text-xs font-medium text-center truncate w-full"
          style={{ color: settings.textColor }}
        >
          {app.name}
        </span>
      </div>

      {/* Edit / Delete Controls */}
      <div className="absolute -top-1.5 -right-1.5 flex gap-1">
        <button
          type="button"
          onClick={onEdit}
          className="w-6 h-6 rounded-full flex items-center justify-center shadow-sm transition-transform hover:scale-105"
          style={{
            background: settings.textColor,
            color: settings.backgroundColor,
          }}
          title="编辑"
        >
          <Pencil className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirmDelete) {
              onDelete();
            } else {
              setConfirmDelete(true);
              setTimeout(() => setConfirmDelete(false), 2500);
            }
          }}
          className="h-6 px-1.5 rounded-full flex items-center justify-center shadow-sm bg-red-500 text-white text-[10px] font-medium transition-all hover:bg-red-600"
          title="删除"
        >
          {confirmDelete ? '确认?' : <Trash2 className="w-3 h-3" />}
        </button>
      </div>
    </div>
  );
}

function AppGrid({ appGroups }: AppGridProps) {
  const { deleteApp, deleteAppGroup, reorderApps, reorderGroups, toggleGroupCollapse } = useAppStore();
  const { isEditMode, settings } = useSettingsStore();
  const [editingApp, setEditingApp] = useState<{ groupId: string; app?: App } | null>(null);
  const [editingGroup, setEditingGroup] = useState<AppGroup | null>(null);
  const [hoveredApp, setHoveredApp] = useState<string | null>(null);
  const [confirmGroupDelete, setConfirmGroupDelete] = useState<string | null>(null);

  const dark = isColorDark(settings.backgroundColor);
  const isCompact = settings.cardDensity === 'compact';

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent, groupId: string, apps: App[]) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = apps.findIndex((app) => app.id === active.id);
      const newIndex = apps.findIndex((app) => app.id === over.id);
      reorderApps(groupId, oldIndex, newIndex);
    }
  };

  return (
    <div className="space-y-8">
      {appGroups.map((group, groupIndex) => {
        const isCollapsed = !!group.collapsed;

        return (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: groupIndex * 0.05, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Group Header */}
            <div className="flex items-center gap-2.5 mb-3.5">
              <button
                type="button"
                onClick={() => toggleGroupCollapse(group.id)}
                className="flex items-center gap-2.5 group text-left py-1 rounded-xl transition-opacity hover:opacity-85"
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                  style={{
                    background: rgba(settings.textColor, 0.055),
                    border: `1px solid ${rgba(settings.textColor, 0.07)}`,
                  }}
                >
                  <Icon
                    icon={resolveIcon(group.icon)}
                    className="w-4 h-4"
                    style={{ color: settings.textColor, opacity: 0.85 }}
                  />
                </div>
                <h4
                  className="text-sm sm:text-base font-semibold tracking-tight"
                  style={{ color: settings.textColor }}
                >
                  {group.category}
                </h4>
                <span
                  className="text-[11px] font-medium tabular-nums px-2 py-0.5 rounded-full opacity-55"
                  style={{
                    background: rgba(settings.textColor, 0.05),
                    color: settings.textColor,
                  }}
                >
                  {group.apps.length}
                </span>
                <ChevronRight
                  className={`w-4 h-4 opacity-40 transition-transform duration-200 ${
                    isCollapsed ? '' : 'rotate-90'
                  }`}
                  style={{ color: settings.textColor }}
                />
              </button>

              {isEditMode && (
                <div className="flex items-center gap-1 ml-auto">
                  {groupIndex > 0 && (
                    <button
                      type="button"
                      onClick={() => reorderGroups(groupIndex, groupIndex - 1)}
                      className="p-1.5 rounded-lg transition-opacity opacity-60 hover:opacity-100"
                      style={{ background: rgba(settings.textColor, 0.05), color: settings.textColor }}
                      title="上移分组"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {groupIndex < appGroups.length - 1 && (
                    <button
                      type="button"
                      onClick={() => reorderGroups(groupIndex, groupIndex + 1)}
                      className="p-1.5 rounded-lg transition-opacity opacity-60 hover:opacity-100"
                      style={{ background: rgba(settings.textColor, 0.05), color: settings.textColor }}
                      title="下移分组"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditingGroup(group)}
                    className="p-1.5 rounded-lg transition-opacity opacity-70 hover:opacity-100"
                    style={{ background: rgba(settings.textColor, 0.06), color: settings.textColor }}
                    title="编辑分组"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirmGroupDelete === group.id) {
                        deleteAppGroup(group.id);
                        setConfirmGroupDelete(null);
                      } else {
                        setConfirmGroupDelete(group.id);
                        setTimeout(() => setConfirmGroupDelete(null), 2500);
                      }
                    }}
                    className="px-2 py-1.5 rounded-lg transition-colors bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-medium flex items-center gap-1"
                    title="删除分组"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {confirmGroupDelete === group.id && <span>确认删除?</span>}
                  </button>
                </div>
              )}
            </div>

            {/* Apps Grid */}
            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden pt-1 pb-1"
                >
                  {isEditMode ? (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(event) => handleDragEnd(event, group.id, group.apps)}
                    >
                      <SortableContext items={group.apps.map((app) => app.id)} strategy={rectSortingStrategy}>
                        <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2.5 sm:gap-3">
                          {group.apps.map((app) => (
                            <SortableApp
                              key={app.id}
                              app={app}
                              settings={settings}
                              onEdit={() => setEditingApp({ groupId: group.id, app })}
                              onDelete={() => deleteApp(group.id, app.id)}
                            />
                          ))}
                          <button
                            type="button"
                            onClick={() => setEditingApp({ groupId: group.id })}
                            className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-dashed transition-all duration-200 hover:opacity-100 opacity-65"
                            style={{
                              borderColor: rgba(settings.textColor, 0.2),
                              color: settings.textColor,
                            }}
                          >
                            <Plus className="w-5 h-5" />
                            <span className="text-xs font-medium">添加应用</span>
                          </button>
                        </div>
                      </SortableContext>
                    </DndContext>
                  ) : isCompact ? (
                    /* Compact Pill Grid Mode */
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-2.5">
                      {group.apps.map((app) => {
                        const isHovered = hoveredApp === app.id;
                        return (
                          <motion.a
                            key={app.id}
                            href={normalizeUrl(app.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onMouseEnter={() => setHoveredApp(app.id)}
                            onMouseLeave={() => setHoveredApp(null)}
                            whileHover={{ y: -1.5 }}
                            whileTap={{ scale: 0.985 }}
                            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                            className="group flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors duration-200"
                            style={{
                              background: dark
                                ? rgba('#ffffff', isHovered ? 0.075 : 0.035)
                                : rgba('#ffffff', isHovered ? 0.92 : 0.62),
                              border: `1px solid ${rgba(settings.textColor, isHovered ? 0.14 : 0.065)}`,
                              boxShadow: isHovered
                                ? `0 8px 20px -6px ${rgba('#000000', dark ? 0.35 : 0.06)}`
                                : 'none',
                            }}
                          >
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                              style={{
                                background: rgba(settings.textColor, isHovered ? 0.08 : 0.05),
                              }}
                            >
                              <AppIconView app={app} className="w-4 h-4" color={settings.textColor} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div
                                className="text-xs sm:text-[13px] font-medium truncate"
                                style={{ color: settings.textColor }}
                              >
                                {app.name}
                              </div>
                              {settings.showAppUrl && (
                                <div
                                  className="text-[10px] truncate opacity-45"
                                  style={{ color: settings.textColor }}
                                >
                                  {extractDomain(app.url)}
                                </div>
                              )}
                            </div>
                            <ArrowUpRight
                              className="w-3.5 h-3.5 flex-shrink-0 transition-all duration-200 opacity-0 -translate-x-0.5 translate-y-0.5 group-hover:opacity-50 group-hover:translate-x-0 group-hover:translate-y-0"
                              style={{ color: settings.textColor }}
                            />
                          </motion.a>
                        );
                      })}
                    </div>
                  ) : (
                    /* Comfortable Tile Grid Mode (Default) */
                    <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2.5 sm:gap-3">
                      {group.apps.map((app) => {
                        const isHovered = hoveredApp === app.id;
                        return (
                          <motion.a
                            key={app.id}
                            href={normalizeUrl(app.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onMouseEnter={() => setHoveredApp(app.id)}
                            onMouseLeave={() => setHoveredApp(null)}
                            whileHover={{ y: -2.5 }}
                            whileTap={{ scale: 0.97 }}
                            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                            className="group flex flex-col items-center justify-center gap-2 p-3 sm:p-3.5 rounded-2xl transition-colors duration-200"
                            style={{
                              background: dark
                                ? rgba('#ffffff', isHovered ? 0.08 : 0.035)
                                : rgba('#ffffff', isHovered ? 0.94 : 0.62),
                              border: `1px solid ${rgba(settings.textColor, isHovered ? 0.15 : 0.065)}`,
                              boxShadow: isHovered
                                ? `0 10px 26px -8px ${rgba('#000000', dark ? 0.45 : 0.08)}`
                                : `0 2px 6px -2px ${rgba('#000000', dark ? 0.15 : 0.02)}`,
                            }}
                          >
                            <div
                              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
                              style={{
                                background: rgba(settings.textColor, isHovered ? 0.09 : 0.055),
                              }}
                            >
                              <AppIconView app={app} color={settings.textColor} />
                            </div>
                            <div className="w-full text-center min-w-0">
                              <div
                                className="text-[11px] sm:text-xs font-medium truncate w-full leading-snug"
                                style={{
                                  color: settings.textColor,
                                  opacity: isHovered ? 1 : 0.88,
                                }}
                              >
                                {app.name}
                              </div>
                              {settings.showAppUrl && (
                                <div
                                  className="text-[10px] truncate w-full opacity-40 mt-0.5 hidden sm:block"
                                  style={{ color: settings.textColor }}
                                >
                                  {extractDomain(app.url)}
                                </div>
                              )}
                            </div>
                          </motion.a>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      {/* Add Group Button */}
      {isEditMode && (
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setEditingGroup({ id: '', category: '', icon: 'folder', apps: [] })}
          className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl border border-dashed transition-opacity opacity-70 hover:opacity-100"
          style={{
            borderColor: rgba(settings.textColor, 0.2),
            color: settings.textColor,
          }}
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">新建应用分组</span>
        </motion.button>
      )}

      <AnimatePresence>
        {editingApp && (
          <AppEditor
            groupId={editingApp.groupId}
            app={editingApp.app}
            onClose={() => setEditingApp(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {editingGroup && (
          <GroupEditor group={editingGroup} onClose={() => setEditingGroup(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function GroupEditor({ group, onClose }: { group: AppGroup; onClose: () => void }) {
  const { addAppGroup, updateAppGroup } = useAppStore();
  const { settings } = useSettingsStore();
  const [category, setCategory] = useState(group.category);
  const [icon, setIcon] = useState(group.icon || 'folder');
  const isNew = !group.id;
  const dark = isColorDark(settings.backgroundColor);

  const handleSave = async () => {
    if (!category.trim()) return;
    if (isNew) await addAppGroup({ category: category.trim(), icon: icon.trim() || 'folder' });
    else await updateAppGroup(group.id, { category: category.trim(), icon: icon.trim() || 'folder' });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
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
        <h3 className="text-lg font-semibold mb-5" style={{ color: settings.textColor }}>
          {isNew ? '新建应用分组' : '编辑应用分组'}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5 opacity-70" style={{ color: settings.textColor }}>
              分组名称
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') onClose();
              }}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm transition-colors"
              style={{
                background: rgba(settings.textColor, 0.04),
                border: `1px solid ${rgba(settings.textColor, 0.1)}`,
                color: settings.textColor,
              }}
              placeholder="例如: 公共服务 / 个人服务"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 opacity-70" style={{ color: settings.textColor }}>
              图标 (MDI 名称)
            </label>
            <div className="flex items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: rgba(settings.textColor, 0.06) }}
              >
                <Icon icon={resolveIcon(icon)} className="w-5 h-5" style={{ color: settings.textColor }} />
              </div>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') onClose();
                }}
                className="flex-1 px-3.5 py-2.5 rounded-xl text-sm"
                style={{
                  background: rgba(settings.textColor, 0.04),
                  border: `1px solid ${rgba(settings.textColor, 0.1)}`,
                  color: settings.textColor,
                }}
                placeholder="folder, web, server..."
              />
            </div>
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
            disabled={!category.trim()}
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

export default AppGrid;
