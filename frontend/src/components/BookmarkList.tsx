import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react';
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

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {bookmarks.map((category, idx) => (
        <motion.div
          key={category.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.03 }}
          className="rounded-xl overflow-hidden backdrop-blur-[12px]"
          style={{
            background: settings.theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
            border: `1px solid ${settings.theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`,
          }}
        >
          {/* Category Header */}
          <div
            className="flex items-center gap-2 px-3 py-2"
            style={{ borderBottom: `1px solid ${settings.accentColor}20` }}
          >
            <h4 className="font-medium flex-1 text-sm" style={{ color: settings.textColor }}>{category.category}</h4>
            {isEditMode && (
              <div className="flex gap-1">
                <button onClick={() => setEditingCategory(category)} className="p-1 rounded hover:opacity-70">
                  <Pencil className="w-3 h-3" style={{ color: settings.accentColor }} />
                </button>
                <button onClick={() => { if (confirm('Delete?')) deleteBookmarkCategory(category.id); }} className="p-1 rounded hover:opacity-70">
                  <Trash2 className="w-3 h-3 text-red-400" />
                </button>
              </div>
            )}
          </div>

          {/* Links */}
          <div className="p-2 space-y-1">
            {category.links.map((link) => (
              <LinkItem
                key={link.id}
                link={link}
                isEditMode={isEditMode}
                onEdit={() => setEditingLink({ categoryId: category.id, link })}
                onDelete={() => deleteBookmark(category.id, link.id)}
              />
            ))}
            {isEditMode && (
              <button
                onClick={() => setEditingLink({ categoryId: category.id })}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors hover:opacity-70"
                style={{ color: settings.accentColor }}
              >
                <Plus className="w-3 h-3" />Add Link
              </button>
            )}
          </div>
        </motion.div>
      ))}

      {isEditMode && (
        <button
          onClick={() => setEditingCategory({ id: '', category: '', links: [] })}
          className="rounded-xl p-4 flex flex-col items-center justify-center gap-2 border-2 border-dashed min-h-[100px] transition-all hover:opacity-70"
          style={{ borderColor: settings.accentColor, color: settings.accentColor }}
        >
          <Plus className="w-5 h-5" />
          <span className="text-sm">Add Category</span>
        </button>
      )}

      <AnimatePresence>{editingLink && <LinkEditor categoryId={editingLink.categoryId} link={editingLink.link} onClose={() => setEditingLink(null)} />}</AnimatePresence>
      <AnimatePresence>{editingCategory && <CategoryEditor category={editingCategory} onClose={() => setEditingCategory(null)} />}</AnimatePresence>
    </div>
  );
}

function LinkItem({ link, isEditMode, onEdit, onDelete }: { link: Link; isEditMode: boolean; onEdit: () => void; onDelete: () => void }) {
  const { settings } = useSettingsStore();

  if (isEditMode) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 rounded" style={{ background: `${settings.accentColor}10` }}>
        <span className="text-sm flex-1 truncate" style={{ color: settings.textColor }}>{link.name}</span>
        <button onClick={onEdit} className="p-1 rounded hover:opacity-70"><Pencil className="w-3 h-3" style={{ color: settings.accentColor }} /></button>
        <button onClick={() => { if (confirm('Delete?')) onDelete(); }} className="p-1 rounded hover:opacity-70"><Trash2 className="w-3 h-3 text-red-400" /></button>
      </div>
    );
  }

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-2 py-1.5 rounded transition-colors group"
      style={{ color: settings.textColor }}
    >
      <span
        className="text-sm flex-1 truncate transition-colors"
        style={{ borderBottom: `1px solid transparent` }}
        onMouseOver={(e) => (e.currentTarget.style.borderBottomColor = settings.accentColor)}
        onMouseOut={(e) => (e.currentTarget.style.borderBottomColor = 'transparent')}
      >
        {link.name}
      </span>
      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: settings.accentColor }} />
    </a>
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
        className="rounded-2xl p-6 w-full max-w-md"
        style={{ background: settings.backgroundColor, border: `1px solid ${settings.accentColor}40` }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold mb-4" style={{ color: settings.textColor }}>{isNew ? 'Add Link' : 'Edit Link'}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1" style={{ color: settings.accentColor }}>Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-transparent border focus:outline-none" style={{ borderColor: settings.accentColor, color: settings.textColor }} />
          </div>
          <div>
            <label className="block text-sm mb-1" style={{ color: settings.accentColor }}>URL</label>
            <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-transparent border focus:outline-none" style={{ borderColor: settings.accentColor, color: settings.textColor }} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-lg" style={{ color: settings.accentColor }}>Cancel</button>
          <button onClick={handleSave} disabled={!name.trim() || !url.trim()} className="px-4 py-2 rounded-lg disabled:opacity-50" style={{ background: settings.accentColor, color: settings.backgroundColor }}>Save</button>
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
        className="rounded-2xl p-6 w-full max-w-md"
        style={{ background: settings.backgroundColor, border: `1px solid ${settings.accentColor}40` }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold mb-4" style={{ color: settings.textColor }}>{isNew ? 'Add Category' : 'Edit Category'}</h3>
        <div>
          <label className="block text-sm mb-1" style={{ color: settings.accentColor }}>Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-transparent border focus:outline-none" style={{ borderColor: settings.accentColor, color: settings.textColor }} />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-lg" style={{ color: settings.accentColor }}>Cancel</button>
          <button onClick={handleSave} disabled={!name.trim()} className="px-4 py-2 rounded-lg disabled:opacity-50" style={{ background: settings.accentColor, color: settings.backgroundColor }}>Save</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default BookmarkList;
