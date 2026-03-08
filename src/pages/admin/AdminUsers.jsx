import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../lib/api';
import { Plus, RotateCcw, UserX, UserCheck, X, Shield, User, Copy, Check, Share2, Link } from 'lucide-react';

function Modal({ open, onClose, children }) {
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-strong rounded-2xl p-6 w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body
  );
}

function getSetupUrl(code) {
  return `${window.location.origin}/setup/${code}`;
}

function CopyLinkButton({ code, compact = false }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getSetupUrl(code));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback */ }
  };

  if (compact) {
    return (
      <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-gold-400 transition-colors" title="Copiar enlace">
        {copied ? <Check size={14} className="text-green-400" /> : <Link size={14} />}
      </button>
    );
  }

  return (
    <button onClick={handleCopy}
      className="flex-1 flex items-center justify-center gap-2 bg-dark-800 hover:bg-dark-700 text-white font-medium py-3 rounded-xl transition-colors">
      {copied ? <><Check size={18} className="text-green-400" /> Copiado</> : <><Copy size={18} /> Copiar enlace</>}
    </button>
  );
}

function WhatsAppButton({ code, name }) {
  const handleShare = () => {
    const url = getSetupUrl(code);
    const text = `Hola ${name}, usa este enlace para configurar tu acceso al sistema de fichaje de Arlett:\n\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <button onClick={handleShare}
      className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-medium py-3 rounded-xl transition-colors">
      <Share2 size={18} /> WhatsApp
    </button>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'employee' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch {
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async () => {
    if (!newUser.name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    setCreating(true);
    setError('');
    try {
      const created = await api.createUser(newUser);
      setShowCreate(false);
      setNewUser({ name: '', email: '', role: 'employee' });
      setShowInvite(created);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleResetPin = async (u) => {
    if (!confirm(`¿Resetear el PIN de ${u.name}? Se generará un nuevo enlace de acceso.`)) return;
    try {
      const result = await api.resetPin(u.id);
      setShowInvite({ ...u, invite_code: result.invite_code });
      setSuccess(`PIN de ${u.name} reseteado`);
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleActive = async (id, currentActive, name) => {
    try {
      await api.updateUser(id, { active: !currentActive });
      setSuccess(`${name} ${currentActive ? 'desactivado' : 'activado'}`);
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Empleados</h1>
        <button
          onClick={() => { setShowCreate(true); setError(''); }}
          className="flex items-center gap-2 bg-gradient-to-r from-gold-600 to-gold-500 text-dark-950 font-medium px-4 py-2.5 rounded-xl text-sm hover:from-gold-500 hover:to-gold-400 transition-all active:scale-[0.98]"
        >
          <Plus size={16} />
          Nuevo
        </button>
      </div>

      {error && !showCreate && (
        <div className="glass rounded-xl px-4 py-3 border-red-500/30 border animate-fade-in">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="glass rounded-xl px-4 py-3 border-green-500/30 border animate-fade-in">
          <p className="text-green-400 text-sm">{success}</p>
        </div>
      )}

      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className={`glass rounded-xl p-4 transition-opacity ${!u.active ? 'opacity-50' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  u.role === 'admin'
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'bg-gold-500/20 text-gold-400'
                }`}>
                  {u.role === 'admin' ? <Shield size={18} /> : <User size={18} />}
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{u.name}</p>
                  <div className="flex items-center gap-2 text-xs text-dark-400 flex-wrap">
                    {u.email && <span className="truncate">{u.email}</span>}
                    {u.pin_set ? (
                      <span className="text-green-400/70">PIN activo</span>
                    ) : u.invite_code ? (
                      <span className="flex items-center gap-1 text-amber-400/70">
                        Pendiente de registro
                        <CopyLinkButton code={u.invite_code} compact />
                      </span>
                    ) : (
                      <span className="text-dark-500">Sin acceso</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleResetPin(u)}
                  className="p-2 rounded-lg hover:bg-dark-800 text-dark-400 hover:text-gold-400 transition-colors"
                  title="Resetear PIN"
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  onClick={() => handleToggleActive(u.id, u.active, u.name)}
                  className={`p-2 rounded-lg hover:bg-dark-800 transition-colors ${
                    u.active ? 'text-dark-400 hover:text-red-400' : 'text-dark-400 hover:text-green-400'
                  }`}
                  title={u.active ? 'Desactivar' : 'Activar'}
                >
                  {u.active ? <UserX size={16} /> : <UserCheck size={16} />}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create user modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Nuevo empleado</h2>
          <button onClick={() => setShowCreate(false)} className="text-dark-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-dark-300 text-sm mb-1">Nombre *</label>
            <input
              type="text"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              className="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500 transition-colors"
              placeholder="Nombre del empleado"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-dark-300 text-sm mb-1">Email <span className="text-dark-500">(opcional)</span></label>
            <input
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500 transition-colors"
              placeholder="email@ejemplo.com"
            />
          </div>
          <div>
            <label className="block text-dark-300 text-sm mb-1">Rol</label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              className="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500 transition-colors"
            >
              <option value="employee">Empleado</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          {error && showCreate && <p className="text-red-400 text-sm">{error}</p>}
          <button
            onClick={handleCreate}
            disabled={creating}
            className="w-full bg-gradient-to-r from-gold-600 to-gold-500 text-dark-950 font-semibold py-3 rounded-xl disabled:opacity-50 hover:from-gold-500 hover:to-gold-400 transition-all active:scale-[0.98]"
          >
            {creating ? 'Creando...' : 'Crear empleado'}
          </button>
        </div>
      </Modal>

      {/* Invite link modal */}
      <Modal open={!!showInvite} onClose={() => setShowInvite(null)}>
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center mx-auto">
            <User size={24} className="text-dark-950" />
          </div>
          <div>
            <p className="text-white font-medium text-lg">{showInvite?.name}</p>
            <p className="text-dark-400 text-sm mt-1">Envíale este enlace para que configure su acceso:</p>
          </div>
          <div className="bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 break-all">
            <p className="text-gold-400 text-sm font-mono">{showInvite?.invite_code && getSetupUrl(showInvite.invite_code)}</p>
          </div>
          <div className="flex gap-3">
            <CopyLinkButton code={showInvite?.invite_code || ''} />
            <WhatsAppButton code={showInvite?.invite_code || ''} name={showInvite?.name || ''} />
          </div>
          <p className="text-dark-500 text-xs">
            El empleado abrirá el enlace, pondrá su nombre completo y elegirá su PIN.
          </p>
          <button
            onClick={() => setShowInvite(null)}
            className="w-full bg-dark-800 text-dark-300 font-medium py-2.5 rounded-xl hover:bg-dark-700 transition-colors text-sm"
          >
            Cerrar
          </button>
        </div>
      </Modal>
    </div>
  );
}
