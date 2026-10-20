import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Pencil, Check, Lock, Search, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useSettingsStore, rgba, isColorDark } from '../stores/useSettingsStore';
import { authApi } from '../services/api';

interface EditModeToggleProps {
  onOpenCommandPalette?: () => void;
}

function EditModeToggle({ onOpenCommandPalette }: EditModeToggleProps) {
  const { isEditMode, toggleEditMode, settings, notify, toasts, dismissToast } = useSettingsStore();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const dark = isColorDark(settings.backgroundColor);

  const handleEditClick = useCallback(async () => {
    if (isEditMode) {
      toggleEditMode();
      notify('已退出编辑模式', 'info');
      return;
    }

    const status = await authApi.checkStatus();
    if (!status.required || status.authenticated) {
      toggleEditMode();
      notify('已进入编辑模式，可拖拽排序或增删内容', 'info');
      return;
    }

    setShowPasswordDialog(true);
    setPassword('');
    setError('');
  }, [isEditMode, toggleEditMode, notify]);

  useEffect(() => {
    const handleRequestEdit = () => {
      handleEditClick();
    };
    window.addEventListener('requestEditMode', handleRequestEdit);
    return () => window.removeEventListener('requestEditMode', handleRequestEdit);
  }, [handleEditClick]);

  const handleVerify = async () => {
    const success = await authApi.verifyPassword(password);
    if (success) {
      setShowPasswordDialog(false);
      toggleEditMode();
      notify('验证成功，已进入编辑模式', 'success');
    } else {
      setError('密码错误，请重试');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify();
    } else if (e.key === 'Escape') {
      setShowPasswordDialog(false);
    }
  };

  return (
    <>
      {/* Top-Center Dynamic Pill Toast Notifications */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] flex flex-col items-center gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -14, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              onClick={() => dismissToast(toast.id)}
              className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium backdrop-blur-2xl cursor-pointer shadow-lg"
              style={{
                background: dark ? rgba('#18181b', 0.92) : rgba('#18181b', 0.9),
                color: '#f5f5f7',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }}
            >
              {toast.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              {toast.type === 'error' && <AlertCircle className="w-3.5 h-3.5 text-red-400" />}
              {(!toast.type || toast.type === 'info') && <Info className="w-3.5 h-3.5 text-sky-400" />}
              <span>{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Bottom-Right Floating Control Pill */}
      <motion.div
        className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 flex items-center gap-1 p-1.5 rounded-full backdrop-blur-2xl"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          background: dark ? rgba('#18181b', 0.78) : rgba('#ffffff', 0.82),
          border: `1px solid ${rgba(settings.textColor, 0.11)}`,
          boxShadow: `0 10px 30px -6px ${rgba('#000000', dark ? 0.5 : 0.12)}`,
        }}
      >
        {onOpenCommandPalette && (
          <motion.button
            type="button"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.94 }}
            onClick={onOpenCommandPalette}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
            style={{
              color: settings.textColor,
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = rgba(settings.textColor, 0.07);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            title="快速搜索与命令 (⌘K)"
          >
            <Search className="w-4 h-4 opacity-80" />
          </motion.button>
        )}

        <motion.button
          type="button"
          layout
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleEditClick}
          className={`h-9 rounded-full flex items-center justify-center gap-1.5 transition-colors ${
            isEditMode ? 'px-3.5' : 'w-9'
          }`}
          style={{
            background: isEditMode ? settings.textColor : 'transparent',
            color: isEditMode ? settings.backgroundColor : settings.textColor,
          }}
          onMouseEnter={(e) => {
            if (!isEditMode) e.currentTarget.style.background = rgba(settings.textColor, 0.07);
          }}
          onMouseLeave={(e) => {
            if (!isEditMode) e.currentTarget.style.background = 'transparent';
          }}
          title={isEditMode ? '完成编辑' : '进入编辑模式'}
        >
          {isEditMode ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">完成</span>
            </>
          ) : (
            <Pencil className="w-4 h-4 opacity-80" />
          )}
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => window.dispatchEvent(new CustomEvent('openSettings'))}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
          style={{
            color: settings.textColor,
            background: 'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = rgba(settings.textColor, 0.07);
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
          title="偏好设置"
        >
          <Settings className="w-4 h-4 opacity-80" />
        </motion.button>
      </motion.div>

      {/* Password Dialog */}
      <AnimatePresence>
        {showPasswordDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/45 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setShowPasswordDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 10, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              className="rounded-3xl p-6 w-full max-w-sm backdrop-blur-2xl"
              style={{
                background: dark ? rgba('#18181b', 0.95) : rgba('#ffffff', 0.96),
                border: `1px solid ${rgba(settings.textColor, 0.12)}`,
                boxShadow: `0 24px 60px -12px ${rgba('#000000', dark ? 0.65 : 0.2)}`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2.5 mb-4">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: rgba(settings.textColor, 0.06) }}
                >
                  <Lock className="w-4 h-4" style={{ color: settings.textColor }} />
                </div>
                <div>
                  <h3 className="text-base font-semibold" style={{ color: settings.textColor }}>
                    解锁编辑模式
                  </h3>
                  <p className="text-xs opacity-55" style={{ color: settings.textColor }}>
                    请输入管理员密码以修改内容
                  </p>
                </div>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                onKeyDown={handleKeyDown}
                placeholder="输入编辑密码..."
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl text-sm mb-3"
                style={{
                  background: rgba(settings.textColor, 0.045),
                  border: `1px solid ${error ? '#ef4444' : rgba(settings.textColor, 0.12)}`,
                  color: settings.textColor,
                }}
              />
              {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordDialog(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium opacity-70 hover:opacity-100 transition-opacity"
                  style={{ color: settings.textColor }}
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleVerify}
                  className="px-5 py-2 rounded-xl text-sm font-medium transition-all active:scale-95"
                  style={{
                    background: settings.textColor,
                    color: settings.backgroundColor,
                  }}
                >
                  解锁
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default EditModeToggle;
