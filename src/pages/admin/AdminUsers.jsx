import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Plus, RotateCcw, UserX, UserCheck, X, Shield, User } from 'lucide-react';

function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-strong rounded-2xl p-6 w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showResetPin, setShowResetPin] = useState(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'employee', pin: '' });
  const [resetPinValue, setResetPinValue] = useState('');
  const [creating, setCreating] = useState(false);
  const [resetting, setResetting] = useState(false);
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
    if (!newUser.pin || newUser.pin.length < 4 || newUser.pin.length > 6) {
      setError('El PIN debe tener entre 4 y 6 dígitos');
      return;
    }
    setCreating(true);
    setError('');
    try {
      await api.createUser(newUser);
      setSuccess('Empleado creado correctamente');
      setShowCreate(false);
      setNewUser({ name: '', email: '', role: 'employee', pin: '' });
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleResetPin = async () => {
    if (!resetPinValue || resetPinValue.length < 4 || resetPinValue.length > 6) {
      setError('El nuevo PIN debe tener entre 4 y 6 dígitos');
      return;
    }
    setResetting(true);
    setError('');
    try {
      await api.resetPin(showResetPin.id, resetPinValue);
      setSuccess(`PIN de ${showResetPin.name} actualizado`);
      setShowResetPin(null);
      setResetPinValue('');
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setResetting(false);
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

      {error && !showCreate && !showResetPin && (
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
                    <span>ID: {u.id}</span>
                    {u.email && <span className="truncate">· {u.email}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => { setShowResetPin(u); setResetPinValue(''); setError(''); }}
                  className="p-2 rounded-lg hover:bg-dark-800 text-dark-400 hover:text-gold-400 transition-colors"
                  title="Cambiar PIN"
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
              placeholder="Nombre completo"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-dark-300 text-sm mb-1">PIN * <span className="text-dark-500">(4-6 dígitos, debe ser único)</span></label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={newUser.pin}
              onChange={(e) => setNewUser({ ...newUser, pin: e.target.value.replace(/\D/g, '') })}
              className="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-3 text-white text-center text-xl tracking-[0.5em] font-mono focus:outline-none focus:border-gold-500 transition-colors"
              placeholder="····"
            />
          </div>
          <div>
            <label className="block text-dark-300 text-sm mb-1">Email</label>
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
          <p className="text-dark-500 text-xs text-center">
            Comunica el PIN al empleado. Podrá cambiarlo desde su panel.
          </p>
        </div>
      </Modal>

      {/* Reset PIN modal */}
      <Modal open={!!showResetPin} onClose={() => setShowResetPin(null)}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Cambiar PIN</h2>
          <button onClick={() => setShowResetPin(null)} className="text-dark-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">
          <p className="text-dark-300 text-sm">
            Nuevo PIN para <span className="text-gold-400 font-medium">{showResetPin?.name}</span>
          </p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={resetPinValue}
            onChange={(e) => setResetPinValue(e.target.value.replace(/\D/g, ''))}
            className="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-3 text-white text-center text-xl tracking-[0.5em] font-mono focus:outline-none focus:border-gold-500 transition-colors"
            placeholder="····"
            autoFocus
          />
          {error && showResetPin && <p className="text-red-400 text-sm">{error}</p>}
          <button
            onClick={handleResetPin}
            disabled={resetting}
            className="w-full bg-gradient-to-r from-gold-600 to-gold-500 text-dark-950 font-semibold py-3 rounded-xl disabled:opacity-50 hover:from-gold-500 hover:to-gold-400 transition-all active:scale-[0.98]"
          >
            {resetting ? 'Actualizando...' : 'Actualizar PIN'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
