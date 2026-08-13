import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Users,
  Activity,
  Trash2,
  Lock,
  Search,
  Filter,
  Eye,
  EyeOff,
  Copy,
  Check,
  Sparkles,
  Phone,
  Mail,
  Key,
  Link,
  Power,
  Server,
  Send,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { User, ActivityLog, UserRole, SmtpConfig } from '../types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export const AdminPanelView: React.FC = () => {
  const { isAdmin, user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  
  // SMTP Config state
  const [smtp, setSmtp] = useState<SmtpConfig>({
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    user: 'apikey',
    pass: '',
    fromEmail: 'noreply@cmo.ai',
    fromName: 'CMO Intelligence Security',
    enabled: true
  });
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [smtpMsg, setSmtpMsg] = useState<string | null>(null);

  // Modal state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [roleInput, setRoleInput] = useState<UserRole>('user');
  const [statusInput, setStatusInput] = useState<'active' | 'inactive'>('active');
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Table state
  const [visiblePassMap, setVisiblePassMap] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generatedResetLink, setGeneratedResetLink] = useState<{ email: string; url: string } | null>(null);

  // Filters
  const [logFilter, setLogFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');

  const loadAdminData = async () => {
    if (!isAdmin) return;
    try {
      const uList = await api.getUsers();
      setUsers(uList);
      const lList = await api.getActivityLogs();
      setLogs(lList);
      const smtpConf = await api.getSmtpConfig();
      if (smtpConf) setSmtp(smtpConf);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-1">Admin Access Restricted</h3>
        <p className="text-xs text-slate-500 mb-6">You are currently logged in with a non-admin role. Switch role to Admin to view user management, password resets, and system security logs.</p>
      </div>
    );
  }

  const handleGenerateRandomPassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*';
    
    let rand = '';
    rand += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    rand += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    rand += numbers.charAt(Math.floor(Math.random() * numbers.length));
    rand += special.charAt(Math.floor(Math.random() * special.length));

    const all = uppercase + lowercase + numbers + special;
    for (let i = 0; i < 6; i++) {
      rand += all.charAt(Math.floor(Math.random() * all.length));
    }
    setPasswordInput(rand);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!emailInput || !passwordInput) {
      setErrorMsg('Email Address and Password are required.');
      return;
    }

    try {
      await api.createUser({
        name: nameInput.trim() || emailInput.trim().split('@')[0],
        email: emailInput.trim(),
        password: passwordInput,
        phone: phoneInput.trim(),
        role: roleInput,
        status: statusInput
      });

      setSuccessMsg(`Successfully created user account for ${emailInput.trim()}!`);
      setNameInput('');
      setEmailInput('');
      setPasswordInput('');
      setPhoneInput('');
      setShowAddUserModal(false);
      loadAdminData();

      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to create user');
    }
  };

  const handleToggleStatus = async (user: User) => {
    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await api.updateUser(user.id, { status: nextStatus });
      setSuccessMsg(`Updated ${user.email} status to ${nextStatus}.`);
      loadAdminData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to update user status.');
    }
  };

  const handleRoleChange = async (user: User, newRole: UserRole) => {
    try {
      await api.updateUser(user.id, { role: newRole });
      setSuccessMsg(`Updated ${user.email} role to ${newRole}.`);
      loadAdminData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to update user role.');
    }
  };

  const handleGenerateResetLink = async (user: User) => {
    try {
      const res = await api.generateUserResetLink(user.id);
      setGeneratedResetLink({
        email: user.email,
        url: window.location.origin + res.resetUrl
      });
      loadAdminData();
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to generate reset link.');
    }
  };

  const handleDeleteUser = async (id: string, email: string) => {
    if (!confirm(`Are you sure you want to delete user account ${email}?`)) return;
    try {
      await api.deleteUser(id);
      setSuccessMsg(`Deleted user account ${email}.`);
      loadAdminData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to delete user.');
    }
  };

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSmtpSaving(true);
    setSmtpMsg(null);
    try {
      const res = await api.updateSmtpConfig(smtp);
      setSmtpMsg(res.message || 'SMTP settings updated successfully.');
      setTimeout(() => setSmtpMsg(null), 4000);
    } catch (e: any) {
      setSmtpMsg(e.message || 'Failed to save SMTP settings.');
    } finally {
      setSmtpSaving(false);
    }
  };

  const handleTestSmtp = async () => {
    setSmtpTesting(true);
    setSmtpMsg(null);
    try {
      const res = await api.testSmtpConfig();
      setSmtpMsg(res.message);
      setTimeout(() => setSmtpMsg(null), 4000);
    } catch (e: any) {
      setSmtpMsg(e.message || 'Test email failed.');
    } finally {
      setSmtpTesting(false);
    }
  };

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePassMap(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.phone && u.phone.includes(userSearch))
  );

  const filteredLogs = logs.filter(l => {
    if (logFilter === 'all') return true;
    return l.category === logFilter;
  });

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Generated Password Reset Link Banner */}
      {generatedResetLink && (
        <div className="p-4 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-200 text-xs font-medium space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-white">
              <Link className="w-4 h-4 text-indigo-400" />
              <span>Password Reset Link Generated for {generatedResetLink.email}</span>
            </div>
            <button onClick={() => setGeneratedResetLink(null)} className="text-slate-400 hover:text-white">Close</button>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
            <input
              type="text"
              readOnly
              value={generatedResetLink.url}
              className="w-full bg-transparent font-mono text-[11px] text-indigo-300 outline-none"
            />
            <button
              onClick={() => handleCopyText('reset-link', generatedResetLink.url)}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold shrink-0 cursor-pointer flex items-center gap-1"
            >
              {copiedId === 'reset-link' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === 'reset-link' ? 'Copied' : 'Copy Link'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-purple-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Admin Security Panel
            </span>
            <span className="text-xs text-slate-400">• Logged in: <strong className="text-purple-300">{currentUser?.email}</strong></span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            User Management & Security Control
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Create user accounts, assign roles (Admin, Manager, User), activate/deactivate accounts, trigger password resets, and configure SMTP settings.
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMsg(null);
            setShowAddUserModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/25 transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New User Account</span>
        </button>
      </div>

      {/* User Management Table */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            Registered Database Users ({users.length})
          </h3>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search email, name, phone..."
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 text-xs rounded-xl pl-8 pr-3 py-1.5 outline-none border border-transparent focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <th className="p-3 font-bold">User</th>
                <th className="p-3 font-bold">Registered Email</th>
                <th className="p-3 font-bold">Role</th>
                <th className="p-3 font-bold">Status</th>
                <th className="p-3 font-bold">Last Login</th>
                <th className="p-3 font-bold text-right">Security Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.map(u => {
                const isPassVisible = !!visiblePassMap[u.id];
                const displayPass = u.password || '••••••••••';

                return (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-2.5">
                        <img src={u.avatar} alt={u.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                        <div>
                          <div className="font-bold">{u.name}</div>
                          {u.email === 'ombir@omangentic.com' && (
                            <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400">Primary Admin</span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="p-3 font-medium text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="font-mono text-xs">{u.email}</span>
                      </div>
                    </td>

                    <td className="p-3">
                      <select
                        value={u.role}
                        onChange={e => handleRoleChange(u, e.target.value as UserRole)}
                        className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg px-2 py-1 border border-slate-200 dark:border-slate-700 outline-none cursor-pointer"
                      >
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="user">User</option>
                      </select>
                    </td>

                    <td className="p-3">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-all cursor-pointer ${
                          u.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        <span>{u.status}</span>
                      </button>
                    </td>

                    <td className="p-3 text-slate-500 text-[11px]">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleGenerateResetLink(u)}
                          title="Generate Password Reset Link"
                          className="px-2.5 py-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <Link className="w-3.5 h-3.5" />
                          <span>Reset Link</span>
                        </button>

                        {u.email !== 'ombir@omangentic.com' && (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.email)}
                            title="Delete User Account"
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Configurable SMTP Email Settings */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
            <Server className="w-5 h-5 text-purple-500" />
            Configurable SMTP Server Settings (Password Reset Emails)
          </h3>
          <span className="text-xs text-slate-400 font-medium">Production Email Delivery</span>
        </div>

        {smtpMsg && (
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-indigo-400" />
            <span>{smtpMsg}</span>
          </div>
        )}

        <form onSubmit={handleSaveSmtp} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">SMTP Host / Server</label>
            <input
              type="text"
              required
              value={smtp.host}
              onChange={e => setSmtp({ ...smtp, host: e.target.value })}
              placeholder="smtp.sendgrid.net"
              className="w-full bg-slate-50 dark:bg-slate-800 text-xs rounded-xl p-2.5 border border-slate-200 dark:border-slate-700 mt-1 outline-none font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">SMTP Port</label>
            <input
              type="number"
              required
              value={smtp.port}
              onChange={e => setSmtp({ ...smtp, port: Number(e.target.value) })}
              placeholder="587"
              className="w-full bg-slate-50 dark:bg-slate-800 text-xs rounded-xl p-2.5 border border-slate-200 dark:border-slate-700 mt-1 outline-none font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">From Email Address</label>
            <input
              type="email"
              required
              value={smtp.fromEmail}
              onChange={e => setSmtp({ ...smtp, fromEmail: e.target.value })}
              placeholder="noreply@cmo.ai"
              className="w-full bg-slate-50 dark:bg-slate-800 text-xs rounded-xl p-2.5 border border-slate-200 dark:border-slate-700 mt-1 outline-none font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">SMTP Username</label>
            <input
              type="text"
              value={smtp.user}
              onChange={e => setSmtp({ ...smtp, user: e.target.value })}
              placeholder="apikey"
              className="w-full bg-slate-50 dark:bg-slate-800 text-xs rounded-xl p-2.5 border border-slate-200 dark:border-slate-700 mt-1 outline-none font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">SMTP Secret Password</label>
            <input
              type="password"
              value={smtp.pass}
              onChange={e => setSmtp({ ...smtp, pass: e.target.value })}
              placeholder="••••••••••••"
              className="w-full bg-slate-50 dark:bg-slate-800 text-xs rounded-xl p-2.5 border border-slate-200 dark:border-slate-700 mt-1 outline-none font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">From Name</label>
            <input
              type="text"
              value={smtp.fromName}
              onChange={e => setSmtp({ ...smtp, fromName: e.target.value })}
              placeholder="CMO Intelligence Security"
              className="w-full bg-slate-50 dark:bg-slate-800 text-xs rounded-xl p-2.5 border border-slate-200 dark:border-slate-700 mt-1 outline-none"
            />
          </div>

          <div className="md:col-span-3 flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={smtp.enabled}
                onChange={e => setSmtp({ ...smtp, enabled: e.target.checked })}
                className="rounded border-slate-700 text-purple-600 focus:ring-purple-500 w-4 h-4"
              />
              <span>Enable Email Service for Password Resets</span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestSmtp}
                disabled={smtpTesting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{smtpTesting ? 'Testing...' : 'Send Test Reset Email'}</span>
              </button>

              <button
                type="submit"
                disabled={smtpSaving}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all cursor-pointer"
              >
                {smtpSaving ? 'Saving...' : 'Save SMTP Configuration'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Activity Logs & Audit Trail */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-500" />
            Security Audit Logs ({filteredLogs.length})
          </h3>

          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={logFilter}
              onChange={e => setLogFilter(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl px-3 py-1.5 border border-slate-200 dark:border-slate-700 outline-none"
            >
              <option value="all">All Categories</option>
              <option value="auth">Auth Events</option>
              <option value="admin">Admin Actions</option>
              <option value="crm_sync">CRM Sync</option>
              <option value="ai_analysis">AI Analysis</option>
            </select>
          </div>
        </div>

        <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
          {filteredLogs.map(log => (
            <div key={log.id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                  <span>{log.action}</span>
                  <span className="text-[10px] font-normal text-slate-400">by {log.userName} ({log.userRole})</span>
                </div>
                <p className="text-[11px] text-slate-500">{log.details}</p>
              </div>

              <span className="text-[10px] text-slate-400 shrink-0 ml-4 font-mono">
                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <form onSubmit={handleCreateUser} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-500" />
                Create User Account
              </h3>
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ×
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-indigo-500" />
                Registered Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                placeholder="e.g. newuser@cmo.ai"
                className="w-full bg-slate-50 dark:bg-slate-800 text-xs rounded-xl p-2.5 border border-slate-200 dark:border-slate-700 mt-1 focus:border-indigo-500 outline-none font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-amber-500" />
                  Password <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGenerateRandomPassword}
                  className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> Strong Password Generator
                </button>
              </div>
              <div className="relative mt-1">
                <input
                  type={showModalPassword ? 'text' : 'password'}
                  required
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  placeholder="Min 8 chars with uppercase, lowercase, number & special char"
                  className="w-full bg-slate-50 dark:bg-slate-800 text-xs rounded-xl pl-2.5 pr-10 py-2.5 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowModalPassword(!showModalPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showModalPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-500" />
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={phoneInput}
                onChange={e => setPhoneInput(e.target.value)}
                placeholder="e.g. 9836844509"
                className="w-full bg-slate-50 dark:bg-slate-800 text-xs rounded-xl p-2.5 border border-slate-200 dark:border-slate-700 mt-1 focus:border-indigo-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Full Name / Display Name</label>
              <input
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full bg-slate-50 dark:bg-slate-800 text-xs rounded-xl p-2.5 border border-slate-200 dark:border-slate-700 mt-1 focus:border-indigo-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">System Role</label>
                <select
                  value={roleInput}
                  onChange={e => setRoleInput(e.target.value as UserRole)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-xs rounded-xl p-2.5 border border-slate-200 dark:border-slate-700 mt-1 focus:border-indigo-500 outline-none cursor-pointer"
                >
                  <option value="user">User</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Account Status</label>
                <select
                  value={statusInput}
                  onChange={e => setStatusInput(e.target.value as 'active' | 'inactive')}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-xs rounded-xl p-2.5 border border-slate-200 dark:border-slate-700 mt-1 focus:border-indigo-500 outline-none cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-500 shadow-md shadow-purple-600/20 transition-all cursor-pointer"
              >
                Create Account
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};