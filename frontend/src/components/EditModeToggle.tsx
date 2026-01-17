import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Pencil, X, Lock } from 'lucide-react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { authApi } from '../services/api';

function EditModeToggle() {
  const { isEditMode, toggleEditMode, settings } = useSettingsStore();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const handleEditClick = async () => {
    if (isEditMode) {
      toggleEditMode();
      return;
    }

    // If already verified in this session, allow edit
    if (isVerified) {
      toggleEditMode();
      return;
    }

    // Check if password is required
    const required = await authApi.isPasswordRequired();
    if (!required) {
      setIsVerified(true);
      toggleEditMode();
      return;
    }

    // Show password dialog
    setShowPasswordDialog(true);
    setPassword('');
    setError('');
  };

  const handleVerify = async () => {
    const success = await authApi.verifyPassword(password);
    if (success) {
      setIsVerified(true);
      setShowPasswordDialog(false);
      toggleEditMode();
    } else {
      setError('密码错误');
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
      <motion.div
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 flex flex-col gap-2 sm:gap-3 z-40"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleEditClick}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg transition-colors"
          style={{
            background: isEditMode ? '#ef4444' : `${settings.accentColor}30`,
            border: `1px solid ${isEditMode ? '#ef4444' : settings.accentColor}`,
          }}
        >
          {isEditMode ? (
            <X className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#ffffff' }} />
          ) : (
            <Pencil className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: settings.textColor }} />
          )}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => window.dispatchEvent(new CustomEvent('openSettings'))}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg transition-colors"
          style={{
            background: `${settings.accentColor}30`,
            border: `1px solid ${settings.accentColor}`,
          }}
        >
          <Settings className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: settings.textColor }} />
        </motion.button>
      </motion.div>

      {/* Password Dialog */}
      <AnimatePresence>
        {showPasswordDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPasswordDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="rounded-2xl p-6 w-full max-w-sm"
              style={{
                background: settings.backgroundColor,
                border: `1px solid ${settings.accentColor}40`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-6 h-6" style={{ color: settings.accentColor }} />
                <h3 className="text-lg font-medium" style={{ color: settings.textColor }}>
                  编辑需要密码
                </h3>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="请输入编辑密码"
                autoFocus
                className="w-full px-4 py-3 rounded-lg mb-3"
                style={{
                  background: `${settings.accentColor}20`,
                  border: `1px solid ${error ? '#ef4444' : settings.accentColor}40`,
                  color: settings.textColor,
                }}
              />
              {error && (
                <p className="text-red-400 text-sm mb-3">{error}</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPasswordDialog(false)}
                  className="flex-1 px-4 py-2 rounded-lg transition-colors"
                  style={{
                    background: `${settings.accentColor}20`,
                    color: settings.textColor,
                  }}
                >
                  取消
                </button>
                <button
                  onClick={handleVerify}
                  className="flex-1 px-4 py-2 rounded-lg transition-colors"
                  style={{
                    background: settings.accentColor,
                    color: settings.backgroundColor,
                  }}
                >
                  确认
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
