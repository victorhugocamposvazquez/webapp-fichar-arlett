import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { LogOut, Clock, History, ChevronDown, ChevronUp, KeyRound, X, Delete } from 'lucide-react';

function formatTime(dateStr) {
  if (!dateStr) return '--:--';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(minutes) {
  if (!minutes && minutes !== 0) return '--';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

function LiveTimer({ clockIn }) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const update = () => {
      const start = new Date(clockIn);
      const now = new Date();
      const diff = Math.floor((now - start) / 1000);
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      setElapsed(
        `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [clockIn]);

  return <span className="font-mono text-3xl md:text-4xl text-gold-400">{elapsed}</span>;
}

function ChangePinModal({ open, onClose }) {
  const [step, setStep] = useState('current');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const reset = () => {
    setStep('current');
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setError('');
    setSuccess(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const activePin = step === 'current' ? currentPin : step === 'new' ? newPin : confirmPin;
  const setActivePin = step === 'current' ? setCurrentPin : step === 'new' ? setNewPin : setConfirmPin;

  const handleDigit = (digit) => {
    if (loading || activePin.length >= 4) return;
    setError('');
    const val = activePin + digit;
    setActivePin(val);

    if (step === 'current' && val.length === 4) {
      setTimeout(() => setStep('new'), 300);
    } else if (step === 'new' && val.length === 4) {
      setTimeout(() => setStep('confirm'), 300);
    } else if (step === 'confirm' && val.length === 4) {
      submitChange(currentPin, newPin, val);
    }
  };

  const handleDelete = () => {
    setActivePin(activePin.slice(0, -1));
    setError('');
  };

  const submitChange = async (cur, np, cp) => {
    if (np !== cp) {
      setError('Los PINs no coinciden');
      setConfirmPin('');
      setStep('new');
      setNewPin('');
      return;
    }
    setLoading(true);
    try {
      await api.changePin(cur, np);
      setSuccess(true);
      setTimeout(handleClose, 1500);
    } catch (err) {
      setError(err.message);
      reset();
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const labels = {
    current: 'Introduce tu PIN actual',
    new: 'Elige tu nuevo PIN de 4 dígitos',
    confirm: 'Confirma tu nuevo PIN',
  };
  const maxDots = 4;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={handleClose}>
      <div className="glass-strong rounded-2xl p-6 w-full max-w-xs animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <KeyRound size={18} className="text-gold-400" /> Cambiar PIN
          </h2>
          <button onClick={handleClose} className="text-dark-400 hover:text-white"><X size={20} /></button>
        </div>

        {success ? (
          <div className="text-center py-8 animate-fade-in">
            <p className="text-green-400 text-lg">PIN cambiado correctamente</p>
          </div>
        ) : (
          <>
            <p className="text-dark-300 text-sm text-center mb-4">{labels[step]}</p>
            <div className="flex justify-center gap-2.5 mb-4">
              {[...Array(maxDots)].map((_, i) => (
                <div key={i} className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  i < activePin.length ? 'bg-gold-400 scale-125 shadow-[0_0_8px_rgba(220,149,36,0.5)]' : 'bg-dark-700'
                }`} />
              ))}
            </div>
            {error && <p className="text-red-400 text-sm mb-3 text-center animate-fade-in">{error}</p>}
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((key, idx) => {
                if (key === null) return <div key={idx} />;
                if (key === 'del') return (
                  <button key={idx} onClick={handleDelete} className="aspect-square rounded-xl bg-dark-800/50 text-dark-300 flex items-center justify-center hover:bg-dark-700 active:scale-95 transition-all">
                    <Delete size={18} />
                  </button>
                );
                return (
                  <button key={idx} onClick={() => handleDigit(String(key))} disabled={loading}
                    className="aspect-square rounded-xl bg-dark-800/50 text-white text-lg font-light hover:bg-dark-700 hover:text-gold-300 active:scale-95 transition-all disabled:opacity-50">
                    {key}
                  </button>
                );
              })}
            </div>
            {step !== 'current' && (
              <button onClick={reset} className="w-full mt-3 text-dark-400 text-xs hover:text-gold-400 transition-colors">
                ← Empezar de nuevo
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showChangePin, setShowChangePin] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchStatus = useCallback(async () => {
    try {
      const data = await api.status();
      setStatus(data);
    } catch {
      setError('Error al obtener el estado');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const handleClockIn = async () => {
    setActionLoading(true);
    setError('');
    try {
      await api.clockIn();
      setSuccess('¡Jornada iniciada!');
      await fetchStatus();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    setActionLoading(true);
    setError('');
    try {
      await api.clockOut();
      setSuccess('¡Jornada finalizada!');
      await fetchStatus();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isWorking = status?.isWorking;

  return (
    <div className="min-h-full flex flex-col">
      <header className="glass-strong px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <img src="/logo-arlett.png" alt="Arlett" className="w-9 h-9 object-contain" />
          <div>
            <p className="text-white font-medium text-sm leading-tight">{user.name}</p>
            <p className="text-dark-400 text-xs">ID: {user.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowChangePin(true)}
            className="p-2 rounded-lg hover:bg-dark-800 text-dark-400 hover:text-gold-400 transition-colors"
            title="Cambiar PIN"
          >
            <KeyRound size={18} />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-dark-800 text-dark-400 hover:text-gold-400 transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 gap-6">
        <div className="text-center animate-fade-in">
          <p className="text-dark-400 text-sm uppercase tracking-widest">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        {/* Big clock button */}
        <div className="animate-slide-up">
          <button
            onClick={isWorking ? handleClockOut : handleClockIn}
            disabled={actionLoading}
            className={`relative w-48 h-48 md:w-56 md:h-56 rounded-full flex flex-col items-center justify-center transition-all duration-500 active:scale-95 disabled:opacity-70 ${
              isWorking
                ? 'bg-gradient-to-br from-red-600/80 to-red-800/80 shadow-[0_0_40px_rgba(220,38,38,0.3)] hover:shadow-[0_0_60px_rgba(220,38,38,0.4)]'
                : 'bg-gradient-to-br from-gold-500/80 to-gold-700/80 shadow-[0_0_40px_rgba(220,149,36,0.3)] hover:shadow-[0_0_60px_rgba(220,149,36,0.4)]'
            } ${!actionLoading && !isWorking ? 'animate-pulse-gold' : ''}`}
          >
            <div className={`absolute inset-0 rounded-full border-2 ${isWorking ? 'border-red-400/30' : 'border-gold-300/30'}`} />
            <div className={`absolute -inset-2 rounded-full border ${isWorking ? 'border-red-500/10' : 'border-gold-400/10'}`} />

            {actionLoading ? (
              <div className="w-10 h-10 border-3 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Clock size={32} className="text-white/90 mb-2" />
                <span className="text-white font-semibold text-lg">
                  {isWorking ? 'Finalizar' : 'Iniciar'}
                </span>
                <span className="text-white/70 text-xs uppercase tracking-wider">jornada</span>
              </>
            )}
          </button>
        </div>

        {isWorking && status.currentRecord && (
          <div className="text-center animate-fade-in">
            <p className="text-dark-400 text-xs uppercase tracking-wider mb-1">Tiempo transcurrido</p>
            <LiveTimer clockIn={status.currentRecord.clock_in} />
            <p className="text-dark-500 text-xs mt-2">
              Entrada: {formatTime(status.currentRecord.clock_in)}
            </p>
          </div>
        )}

        {!isWorking && status?.totalMinutesToday > 0 && (
          <div className="text-center animate-fade-in">
            <p className="text-dark-400 text-xs uppercase tracking-wider mb-1">Total hoy</p>
            <span className="text-2xl text-gold-400 font-mono">
              {formatDuration(status.totalMinutesToday)}
            </span>
          </div>
        )}

        {error && (
          <div className="glass rounded-xl px-4 py-3 border-red-500/30 border animate-fade-in max-w-xs">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}
        {success && (
          <div className="glass rounded-xl px-4 py-3 border-green-500/30 border animate-fade-in max-w-xs">
            <p className="text-green-400 text-sm text-center">{success}</p>
          </div>
        )}

        {status?.todayRecords?.length > 0 && (
          <div className="w-full max-w-sm animate-fade-in">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-center gap-2 text-dark-400 text-sm py-2 hover:text-gold-400 transition-colors"
            >
              <History size={16} />
              Registros de hoy ({status.todayRecords.length})
              {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showHistory && (
              <div className="glass rounded-xl p-4 mt-2 space-y-3 animate-fade-in">
                {status.todayRecords.map((record) => (
                  <div key={record.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${record.clock_out ? 'bg-dark-500' : 'bg-green-400 animate-pulse'}`} />
                      <span className="text-dark-300">
                        {formatTime(record.clock_in)}
                        {record.clock_out && ` → ${formatTime(record.clock_out)}`}
                      </span>
                    </div>
                    <span className="text-dark-500 font-mono text-xs">
                      {record.duration_minutes ? formatDuration(record.duration_minutes) : 'En curso'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="text-center py-4 text-dark-600 text-xs">
        RD-ley 8/2019 · Registro de jornada laboral
      </footer>

      <ChangePinModal open={showChangePin} onClose={() => setShowChangePin(false)} />
    </div>
  );
}
