import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Users, Search, MoreHorizontal, Pencil, KeyRound, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import type { AdminUser } from '@/hooks/useAdminUsers';
import { EditUserModal } from './EditUserModal';
import { ResetPasswordModal } from './ResetPasswordModal';
import { TruncateWithTooltip } from '@/components/ui/truncate-with-tooltip';

interface AdminUsersProps {
  users: AdminUser[];
  loading: boolean;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalUsers?: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null;
  page: number;
  onPageChange: (page: number) => void;
  onToggleStatus: (id: string | number) => void;
  onUpdateRole: (id: string | number, role: string) => void;
  onAddUser: () => void;
  onDeleteUser: (id: string | number) => void;
  onUserUpdated: () => void;
}

const getStatusBadgeClass = (isActive: boolean) =>
  isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';

const USER_ROLES = ['user', 'publisher', 'admin'];

export const AdminUsers = ({ users, loading, pagination, page, onPageChange, onToggleStatus, onUpdateRole, onAddUser, onDeleteUser, onUserUpdated }: AdminUsersProps) => {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [menuRect, setMenuRect] = useState<{ top: number; left: number } | null>(null);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<AdminUser | null>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const openMenu = (id: string) => {
    const btn = buttonRefs.current[id];
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const left = Math.max(8, Math.min(rect.right - 140, window.innerWidth - 148));
      setMenuRect({ top: rect.bottom + 4, left });
      setMenuOpen(id);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-user-menu]') && !target.closest('[data-user-menu-trigger]')) {
        setMenuOpen(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold font-heading">{t('admin.users')}</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t('admin.searchUsers')} className="pl-10 w-full sm:w-64" />
          </div>
          <Button onClick={onAddUser}>
            <Users className="h-4 w-4 mr-2" />
            {t('admin.addUser')}
          </Button>
        </div>
      </div>
      <div className="bg-card rounded-lg border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <p className="mt-2">{t('common.loading') || 'Loading...'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <colgroup>
                <col style={{ width: 160 }} />
                <col style={{ width: 220 }} />
                <col style={{ width: 130 }} />
                <col style={{ width: 100 }} />
                <col style={{ width: 90 }} />
                <col style={{ width: 110 }} />
                <col style={{ width: 120 }} />
                <col style={{ width: 270 }} />
              </colgroup>
              <thead className="bg-muted">
                <tr>
                  <th className="text-left py-3 px-4">{t('admin.user.username')}</th>
                  <th className="text-left py-3 px-4">{t('admin.user.email')}</th>
                  <th className="text-left py-3 px-4">{t('admin.user.role')}</th>
                  <th className="text-left py-3 px-4">{t('admin.user.status')}</th>
                  <th className="text-left py-3 px-4">{t('admin.user.skillCount')}</th>
                  <th className="text-left py-3 px-4">{t('admin.user.downloadCount')}</th>
                  <th className="text-left py-3 px-4">{t('admin.user.joinDate')}</th>
                  <th className="text-center py-3 px-4">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {users?.length > 0 ? (
                  users.map(user => {
                    const id = user.id ?? user._id;
                    const isActive = user.isActive ?? user.status === 'active';
                    return (
                      <tr key={id} className="border-t">
                        <td className="py-3 px-4 font-medium overflow-hidden min-w-0">
                          <TruncateWithTooltip content={user.username}>{user.username}</TruncateWithTooltip>
                        </td>
                        <td className="py-3 px-4 overflow-hidden min-w-0">
                          <TruncateWithTooltip content={user.email}>{user.email}</TruncateWithTooltip>
                        </td>
                        <td className="py-3 px-4 overflow-hidden min-w-0">
                          <div className="min-w-0 max-w-full">
                            <select
                              value={user.role}
                              onChange={e => id != null && onUpdateRole(id, e.target.value)}
                              className="text-sm border rounded-md px-2 py-1 bg-background w-full max-w-full"
                            >
                            {USER_ROLES.map(r => (
                              <option key={r} value={r}>{t(`admin.role.${r}`)}</option>
                            ))}
                          </select>
                          </div>
                        </td>
                        <td className="py-3 px-4 overflow-hidden min-w-0">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs whitespace-nowrap truncate max-w-full ${getStatusBadgeClass(isActive)}`}>
                            {isActive ? t('admin.user.active') : t('admin.user.inactive')}
                          </span>
                        </td>
                        <td className="py-3 px-4">{user.skillsCount ?? 0}</td>
                        <td className="py-3 px-4">{(user.downloads ?? 0).toLocaleString()}</td>
                        <td className="py-3 px-4">{new Date(user.createdAt || user.joinDate || '').toLocaleDateString()}</td>
                        <td className="py-3 px-4 overflow-hidden min-w-0">
                          <div className="flex justify-center gap-1 items-center flex-wrap">
                            <Button variant="outline" size="sm" onClick={() => id != null && onToggleStatus(id)}>
                              {isActive ? t('admin.disable') : t('admin.enable')}
                            </Button>
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                ref={el => { buttonRefs.current[String(id)] = el; }}
                                data-user-menu-trigger
                                onClick={() => menuOpen === String(id) ? setMenuOpen(null) : openMenu(String(id))}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                              {menuOpen === String(id) && menuRect && createPortal(
                                <div
                                  data-user-menu
                                  className="fixed py-1 bg-card border rounded-md shadow-lg min-w-[140px]"
                                  style={{ top: menuRect.top, left: menuRect.left, zIndex: 9999 }}
                                >
                                  <button
                                    type="button"
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                                    onClick={() => { setEditUser(user); setMenuOpen(null); }}
                                  >
                                    <Pencil className="h-4 w-4" />
                                    {t('admin.edit')}
                                  </button>
                                  <button
                                    type="button"
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                                    onClick={() => { setResetPasswordUser(user); setMenuOpen(null); }}
                                  >
                                    <KeyRound className="h-4 w-4" />
                                    {t('admin.resetPassword')}
                                  </button>
                                  <button
                                    type="button"
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-destructive/10 text-destructive flex items-center gap-2"
                                    onClick={() => {
                                      if (confirm(t('admin.deleteUserConfirm')) && id != null) {
                                        onDeleteUser(id);
                                        setMenuOpen(null);
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    {t('admin.delete')}
                                  </button>
                                </div>,
                                document.body
                              )}
                            </>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 px-4 text-center text-muted-foreground">
                      {t('admin.noUsersFound') || 'No users found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-between items-center mt-6 px-4 py-3 border-t">
          <span className="text-sm text-muted-foreground">
            {t('pagination.pageInfo', {
              currentPage: pagination.currentPage,
              totalPages: pagination.totalPages
            })}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrev}
              onClick={() => onPageChange(Math.max(1, page - 1))}
            >
              {t('pagination.prev')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNext}
              onClick={() => onPageChange(page + 1)}
            >
              {t('pagination.next')}
            </Button>
          </div>
        </div>
      )}

      <EditUserModal
        isOpen={!!editUser}
        onClose={() => setEditUser(null)}
        user={editUser}
        onSuccess={onUserUpdated}
      />
      <ResetPasswordModal
        isOpen={!!resetPasswordUser}
        onClose={() => setResetPasswordUser(null)}
        user={resetPasswordUser}
      />
    </div>
  );
};
