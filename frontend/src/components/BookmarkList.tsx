import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, ArrowUpRight, Link as LinkIcon, GripVertical, ChevronRight, Globe } from 'lucide-react';
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
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAppStore } from '../stores/useAppStore';
import { useSettingsStore, rgba, isColorDark } from '../stores/useSettingsStore';
import { normalizeUrl, getFaviconUrl, extractDomain } from '../services/api';
import type { Bookmark, Link, Settings } from '../types';

interface BookmarkListProps {
  bookmarks: Bookmark[];
}

function LinkFavicon({ url, show, color }: { url: string; show: boolean; color: string }) {
  const [failed, setFailed] = useState(false);

  if (!show || failed) {
    return <Globe className="w-3.5 h-3.5 opacity-40 flex-shrink-0" style={{ color }} />;
  }

  const src = getFaviconUrl(url, 32);
  if (!src) {
    return <Globe className="w-3.5 h-3.5 opacity-40 flex-shrink-0" style={{ color }} />;
  }

  return (
    <img
      src={src}
      alt=""
      onError={() => setFailed(true)}
      className="w-3.5 h-3.5 rounded-[3px] object-contain flex-shrink-0 opacity-85"
    />
  );
}

interface SortableLinkProps {
  link: Link;
  settings: Settings;
  onEdit: () => void;
  onDelete: () => void;
}

function SortableLink({ link, settings, onEdit, onDelete }: SortableLinkProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 px-2.5 py-2 rounded-xl"
      {...attributes}
    >
      <div
        {...listeners}
        className="cursor-grab active:cursor-grabbing opacity-45 hover:opacity-100 transition-opacity"
        style={{ color: settings.textColor }}
      >
        <GripVertical className="w-3.5 h-3.5" />
      </div>
      <span className="text-xs sm:text-sm flex-1 truncate" style={{ color: settings.textColor }}>
        {link.name}
      </span>
      <button
        type="button"
        onClick={onEdit}
        className="p-1 rounded-lg opacity-65 hover:opacity-100 transition-opacity"
        style={{ color: settings.textColor }}
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
        className="px-1.5 py-0.5 rounded-lg text-red-400 hover:bg-red-500/10 text-[11px] font-medium transition-colors"
      >
        {confirmDelete ? '确认?' : <Trash2 className="w-3 h-3" />}
      </button>
    </div>
  );
}

interface SortableCategoryProps {
  category: Bookmark;
  settings: Settings;
  isEditMode: boolean;
  sensors: ReturnType<typeof useSensors>;
  onEditCategory: () => void;
  onDeleteCategory: () => void;
  onEditLink: (link?: Link) => void;
  onDeleteLink: (linkId: string) => void;
  onReorderLinks: (categoryId: string, links: Link[], event: DragEndEvent) => void;
}

function SortableCategory({
  category,
  settings,
  isEditMode,
  sensors,
  onEditCategory,
  onDeleteCategory,
  onEditLink,
  onDeleteLink,
  onReorderLinks,
}: SortableCategoryProps) {
  const [confirmCatDelete, setConfirmCatDelete] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  const dark = isColorDark(settings.backgroundColor);

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div
        style={{
          background: dark ? rgba('#ffffff', 0.035) : rgba('#ffffff', 0.65),
          border: `1px solid ${rgba(settings.textColor, 0.08)}`,
        }}
        className="rounded-2xl p-4 sm:p-5 h-full transition-colors duration-200"
      >
        <div className="flex items-center gap-2 mb-3.5">
          {isEditMode && (
            <div
              {...listeners}
              className="cursor-grab active:cursor-grabbing opacity-45 hover:opacity-100 transition-opacity"
              style={{ color: settings.textColor }}
            >
              <GripVertical className="w-4 h-4" />
            </div>
          )}
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: rgba(settings.textColor, 0.06) }}
          >
            <LinkIcon className="w-3.5 h-3.5 opacity-80" style={{ color: settings.textColor }} />
          </div>
          <h4 className="text-sm font-semibold flex-1 truncate" style={{ color: settings.textColor }}>
            {category.category}
          </h4>
          {isEditMode && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onEditCategory}
                className="p-1.5 rounded-lg opacity-70 hover:opacity-100 transition-opacity"
                style={{ background: rgba(settings.textColor, 0.06), color: settings.textColor }}
              >
                <Pencil className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmCatDelete) {
                    onDeleteCategory();
                  } else {
                    setConfirmCatDelete(true);
                    setTimeout(() => setConfirmCatDelete(false), 2500);
                  }
                }}
                className="px-2 py-1 rounded-lg bg-red-500/10 text-red-400 text-[11px] font-medium flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                {confirmCatDelete && <span>确认?</span>}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(event) => onReorderLinks(category.id, category.links, event)}
          >
            <SortableContext items={category.links.map((link) => link.id)} strategy={verticalListSortingStrategy}>
              {category.links.map((link) => (
                <SortableLink
                  key={link.id}
                  link={link}
                  settings={settings}
                  onEdit={() => onEditLink(link)}
                  onDelete={() => onDeleteLink(link.id)}
                />
              ))}
            </SortableContext>
          </DndContext>

          <button
            type="button"
            onClick={() => onEditLink()}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 mt-2 rounded-xl border border-dashed transition-opacity opacity-65 hover:opacity-100"
            style={{
              borderColor: rgba(settings.textColor, 0.18),
              color: settings.textColor,
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">添加链接</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function BookmarkList({ bookmarks }: BookmarkListProps) {
  const {
    deleteBookmark,
    deleteBookmarkCategory,
    reorderBookmarks,
    reorderBookmarkCategories,
    toggleBookmarkCollapse,
  } = useAppStore();
  const { isEditMode, settings } = useSettingsStore();
  const [editingLink, setEditingLink] = useState<{ categoryId: string; link?: Link } | null>(null);
  const [editingCategory, setEditingCategory] = useState<Bookmark | null>(null);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  const dark = isColorDark(settings.backgroundColor);

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

  const handleLinkDragEnd = (categoryId: string, links: Link[], event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = links.findIndex((link) => link.id === active.id);
      const newIndex = links.findIndex((link) => link.id === over.id);
      reorderBookmarks(categoryId, oldIndex, newIndex);
    }
  };

  const handleCategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = bookmarks.findIndex((cat) => cat.id === active.id);
      const newIndex = bookmarks.findIndex((cat) => cat.id === over.id);
      reorderBookmarkCategories(oldIndex, newIndex);
    }
  };

  return (
    <div className="space-y-4">
      {isEditMode ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleCategoryDragEnd}
        >
          <SortableContext items={bookmarks.map((cat) => cat.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
              {bookmarks.map((category) => (
                <SortableCategory
                  key={category.id}
                  category={category}
                  settings={settings}
                  isEditMode={isEditMode}
                  sensors={sensors}
                  onEditCategory={() => setEditingCategory(category)}
                  onDeleteCategory={() => deleteBookmarkCategory(category.id)}
                  onEditLink={(link) => setEditingLink({ categoryId: category.id, link })}
                  onDeleteLink={(linkId) => deleteBookmark(category.id, linkId)}
                  onReorderLinks={handleLinkDragEnd}
                />
              ))}
              <motion.button
                key="add-category"
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setEditingCategory({ id: '', category: '', links: [] })}
                className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border border-dashed transition-opacity opacity-65 hover:opacity-100 min-h-[140px]"
                style={{
                  borderColor: rgba(settings.textColor, 0.2),
                  color: settings.textColor,
                }}
              >
                <Plus className="w-5 h-5" />
                <span className="text-sm font-medium">新建书签分类</span>
              </motion.button>
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {bookmarks.map((category, idx) => {
            const isCollapsed = !!category.collapsed;
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-2xl p-4 sm:p-5 transition-all duration-200"
                style={{
                  background: dark ? rgba('#ffffff', 0.032) : rgba('#ffffff', 0.62),
                  border: `1px solid ${rgba(settings.textColor, 0.07)}`,
                  boxShadow: `0 2px 10px -4px ${rgba('#000000', dark ? 0.22 : 0.03)}`,
                }}
              >
                {/* Category Header */}
                <button
                  type="button"
                  onClick={() => toggleBookmarkCollapse(category.id)}
                  className="w-full flex items-center gap-2.5 text-left group"
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: rgba(settings.textColor, 0.055),
                    }}
                  >
                    <LinkIcon className="w-3.5 h-3.5 opacity-75" style={{ color: settings.textColor }} />
                  </div>
                  <h4
                    className="text-sm font-semibold flex-1 truncate tracking-tight"
                    style={{ color: settings.textColor }}
                  >
                    {category.category}
                  </h4>
                  <span
                    className="text-[11px] font-medium tabular-nums px-1.5 py-0.5 rounded-md opacity-45"
                    style={{
                      background: rgba(settings.textColor, 0.05),
                      color: settings.textColor,
                    }}
                  >
                    {category.links.length}
                  </span>
                  <ChevronRight
                    className={`w-3.5 h-3.5 opacity-35 transition-transform duration-200 ${
                      isCollapsed ? '' : 'rotate-90'
                    }`}
                    style={{ color: settings.textColor }}
                  />
                </button>

                {/* Links List */}
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-0.5 mt-3 pt-2.5 border-t" style={{ borderColor: rgba(settings.textColor, 0.055) }}>
                        {category.links.map((link) => {
                          const isHovered = hoveredLink === link.id;
                          return (
                            <a
                              key={link.id}
                              href={normalizeUrl(link.url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onMouseEnter={() => setHoveredLink(link.id)}
                              onMouseLeave={() => setHoveredLink(null)}
                              className="group flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-colors duration-150"
                              style={{
                                background: isHovered ? rgba(settings.textColor, 0.065) : 'transparent',
                              }}
                            >
                              <LinkFavicon
                                url={link.url}
                                show={settings.showBookmarkFavicons ?? true}
                                color={settings.textColor}
                              />
                              <span
                                className="text-[13px] flex-1 truncate transition-opacity duration-150"
                                style={{
                                  color: settings.textColor,
                                  opacity: isHovered ? 1 : 0.8,
                                }}
                              >
                                {link.name}
                              </span>
                              <span
                                className="text-[10px] truncate max-w-[90px] hidden sm:inline transition-opacity duration-150"
                                style={{
                                  color: settings.textColor,
                                  opacity: isHovered ? 0.45 : 0,
                                }}
                              >
                                {extractDomain(link.url)}
                              </span>
                              <ArrowUpRight
                                className="w-3.5 h-3.5 flex-shrink-0 transition-all duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                                style={{
                                  color: settings.textColor,
                                  opacity: isHovered ? 0.75 : 0.25,
                                }}
                              />
                            </a>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {editingLink && (
          <LinkEditor
            categoryId={editingLink.categoryId}
            link={editingLink.link}
            onClose={() => setEditingLink(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {editingCategory && (
          <CategoryEditor
            category={editingCategory}
            onClose={() => setEditingCategory(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function LinkEditor({ categoryId, link, onClose }: { categoryId: string; link?: Link; onClose: () => void }) {
  const { addBookmark, updateBookmark } = useAppStore();
  const { settings } = useSettingsStore();
  const [name, setName] = useState(link?.name || '');
  const [url, setUrl] = useState(link?.url || '');
  const isNew = !link;
  const dark = isColorDark(settings.backgroundColor);

  const handleSave = async () => {
    if (!name.trim() || !url.trim()) return;
    if (isNew) await addBookmark(categoryId, { name: name.trim(), url: normalizeUrl(url.trim()) });
    else await updateBookmark(categoryId, link.id, { name: name.trim(), url: normalizeUrl(url.trim()) });
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
          {isNew ? '添加书签链接' : '编辑书签链接'}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5 opacity-70" style={{ color: settings.textColor }}>
              名称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') onClose();
              }}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm"
              style={{
                background: rgba(settings.textColor, 0.04),
                border: `1px solid ${rgba(settings.textColor, 0.1)}`,
                color: settings.textColor,
              }}
              placeholder="书签名称"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 opacity-70" style={{ color: settings.textColor }}>
              网址 (URL)
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') onClose();
              }}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm"
              style={{
                background: rgba(settings.textColor, 0.04),
                border: `1px solid ${rgba(settings.textColor, 0.1)}`,
                color: settings.textColor,
              }}
              placeholder="https://..."
            />
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

function CategoryEditor({ category, onClose }: { category: Bookmark; onClose: () => void }) {
  const { addBookmarkCategory, updateBookmarkCategory } = useAppStore();
  const { settings } = useSettingsStore();
  const [name, setName] = useState(category.category);
  const isNew = !category.id;
  const dark = isColorDark(settings.backgroundColor);

  const handleSave = async () => {
    if (!name.trim()) return;
    if (isNew) await addBookmarkCategory({ category: name.trim() });
    else await updateBookmarkCategory(category.id, { category: name.trim() });
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
          {isNew ? '新建书签分类' : '编辑书签分类'}
        </h3>
        <div>
          <label className="block text-xs font-medium mb-1.5 opacity-70" style={{ color: settings.textColor }}>
            分类名称
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') onClose();
            }}
            className="w-full px-3.5 py-2.5 rounded-xl text-sm"
            style={{
              background: rgba(settings.textColor, 0.04),
              border: `1px solid ${rgba(settings.textColor, 0.1)}`,
              color: settings.textColor,
            }}
            placeholder="分类名称"
            autoFocus
          />
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
            disabled={!name.trim()}
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

export default BookmarkList;
