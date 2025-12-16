import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, ExternalLink, Link as LinkIcon } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import type { Bookmark, Link } from '../types';

interface BookmarkListProps {
  bookmarks: Bookmark[];
}

function BookmarkList({ bookmarks }: BookmarkListProps) {
  const { deleteBookmark, deleteBookmarkCategory } = useAppStore();
  const { isEditMode, settings } = useSettingsStore();
  const [editingLink, setEditingLink] = useState<{ categoryId: string; link?: Link } | null>(null);
  const [editingCategory, setEditingCategory] = useState<Bookmark | null>(null);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Bookmark Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {bookmarks.map((category, idx) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: idx * 0.05, type: 'spring', stiffness: 200 }}
            className="rounded-2xl p-4 sm:p-5 transition-all duration-300 hover:shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${settings.accentColor}10 0%, ${settings.accentColor}05 100%)`,
              border: `1px solid ${settings.accentColor}20`,
              boxShadow: `0 4px 20px -8px ${settings.accentColor}15`,
            }}
          >
            {/* Category Header */}
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${settings.accentColor}25 0%, ${settings.accentColor}10 100%)`,
                }}
              >
                <LinkIcon className="w-4 h-4" style={{ color: settings.accentColor }} />
              </div>
              <h4
                className="text-sm font-semibold flex-1"
                style={{ color: settings.textColor }}
              >
                {category.category}
              </h4>
              {isEditMode && (
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditingCategory(category)}
                    className="p-1.5 rounded-lg transition-colors hover:opacity-70"
                    style={{ background: `${settings.accentColor}15` }}
                  >
                    <Pencil className="w-3 h-3" style={{ color: settings.accentColor }} />
                  </button>
                  <button
                    onClick={() => { if (confirm('Delete category?')) deleteBookmarkCategory(category.id); }}
                    className="p-1.5 rounded-lg transition-colors hover:opacity-70 bg-red-500/10"
                  >
                    <Trash2 className="w-3 h-3 text-red-400" />
                  </button>
                </div>
              )}
            </div>

            {/* Links List */}
            <div className="space-y-1.5">
              {category.links.map((link, linkIdx) => (
                <motion.div
                  key={link.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 + linkIdx * 0.02 }}
                  onMouseEnter={() => setHoveredLink(link.id)}
                  onMouseLeave={() => setHoveredLink(null)}
                >
                  {isEditMode ? (
                    <div
                      className="flex items-center gap-2 px-3 py-2 rounded-lg"
                      style={{
                        background: `${settings.accentColor}10`,
                      }}
                    >
                      <span className="text-sm flex-1 truncate" style={{ color: settings.textColor }}>{link.name}</span>
                      <button
                        onClick={() => setEditingLink({ categoryId: category.id, link })}
                        className="p-1 rounded hover:opacity-70"
                      >
                        <Pencil className="w-3 h-3" style={{ color: settings.accentColor }} />
                      </button>
                      <button
                        onClick={() => { if (confirm('Delete?')) deleteBookmark(category.id, link.id); }}
                        className="p-1 rounded hover:opacity-70"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  ) : (
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200"
                      style={{
                        background: hoveredLink === link.id ? `${settings.accentColor}15` : 'transparent',
                      }}
                    >
                      <span
                        className="text-sm flex-1 truncate transition-colors duration-200"
                        style={{
                          color: hoveredLink === link.id ? settings.textColor : settings.accentColor,
                        }}
                      >
                        {link.name}
                      </span>
                      <ExternalLink
                        className="w-3.5 h-3.5 flex-shrink-0 transition-all duration-200"
                        style={{
                          color: settings.accentColor,
                          opacity: hoveredLink === link.id ? 0.8 : 0.3,
                        }}
                      />
                    </a>
                  )}
                </motion.div>
              ))}

              {/* Add Link Button */}
              {isEditMode && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setEditingLink({ categoryId: category.id })}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed transition-all duration-300 hover:opacity-80"
                  style={{
                    borderColor: settings.accentColor + '30',
                    color: settings.accentColor,
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="text-xs">Add Link</span>
                </motion.button>
              )}
            </div>
          </motion.div>
        ))}

        {/* Add Category Card */}
        {isEditMode && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setEditingCategory({ id: '', category: '', links: [] })}
            className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 border-dashed transition-all duration-300 hover:scale-[1.02] min-h-[120px]"
            style={{
              borderColor: settings.accentColor + '30',
              color: settings.accentColor,
            }}
          >
            <Plus className="w-6 h-6" />
            <span className="text-sm">New Category</span>
          </motion.button>
        )}
      </div>

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

  const handleSave = async () => {
    if (!name.trim() || !url.trim()) return;
    if (isNew) await addBookmark(categoryId, { name, url });
    else await updateBookmark(categoryId, link.id, { name, url });
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
          {isNew ? 'New Link' : 'Edit Link'}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-2" style={{ color: settings.accentColor }}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-transparent border focus:outline-none transition-colors"
              style={{
                borderColor: settings.accentColor + '40',
                color: settings.textColor,
              }}
              placeholder="Link name"
            />
          </div>
          <div>
            <label className="block text-sm mb-2" style={{ color: settings.accentColor }}>URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-transparent border focus:outline-none transition-colors"
              style={{
                borderColor: settings.accentColor + '40',
                color: settings.textColor,
              }}
              placeholder="https://..."
            />
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
            disabled={!name.trim() || !url.trim()}
            className="px-5 py-2.5 rounded-xl font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
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

function CategoryEditor({ category, onClose }: { category: Bookmark; onClose: () => void }) {
  const { addBookmarkCategory, updateBookmarkCategory } = useAppStore();
  const { settings } = useSettingsStore();
  const [name, setName] = useState(category.category);
  const isNew = !category.id;

  const handleSave = async () => {
    if (!name.trim()) return;
    if (isNew) await addBookmarkCategory({ category: name });
    else await updateBookmarkCategory(category.id, { category: name });
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
          {isNew ? 'New Category' : 'Edit Category'}
        </h3>
        <div>
          <label className="block text-sm mb-2" style={{ color: settings.accentColor }}>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-transparent border focus:outline-none transition-colors"
            style={{
              borderColor: settings.accentColor + '40',
              color: settings.textColor,
            }}
            placeholder="Category name"
          />
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
            disabled={!name.trim()}
            className="px-5 py-2.5 rounded-xl font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
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

export default BookmarkList;
