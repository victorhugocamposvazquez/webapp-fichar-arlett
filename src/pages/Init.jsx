import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Delete } from 'lucide-react';

export default function Init() {
  const [step, setStep] = useState('name');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleNameSubmit = () => {
    if (!name.trim()) { setError('El nombre es obligatorio'); return; }
    setError('');
    setStep('pin');
  };

  const activeVal = step === 'pin' ? pin : confirmPin;
  const setActiveVal = step === 'pin' ? setPin : setConfirmPin;

  const handleDigit = (digit) => {
    if (loading || activeVal.length >= 4) return;
    setError('');
    const val = activeVal + digit;
    setActiveVal(val);

    if (step === 'pin' && val.length === 4) {
      setTimeout(() => setStep('confirm'), 300);
    } else if (step === 'confirm' && val.length === 4) {
      handleSubmit(val);
    }
  };

  const handleDelete = () => {
    setActiveVal(activeVal.slice(0, -1));
    setError('');
  };

  const handleSubmit = async (cp) => {
    if (pin !== cp) {
      setError('Los PINs no coinciden');
      setConfirmPin('');
      setPin('');
      setStep('pin');
      return;
    }
    setLoading(true);
    try {
      const data = await api.initAdmin(name, pin);
      login(data.user, data.token);
      navigate('/admin');
    } catch (err) {
      setError(err.message);
      setPin('');
      setConfirmPin('');
      setStep('pin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col items-center justify-center px-4 py-8">
      <div className="animate-fade-in mb-6 flex flex-col items-center">
        <img src="/logo-arlett.png" alt="Arlett" className="w-24 h-24 object-contain mb-3" />
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center mb-3">
          <ShieldCheck size={24} className="text-dark-950" />
        </div>
        <h1 className="text-xl font-semibold text-white">Configuración inicial</h1>
        <p className="text-dark-400 text-sm mt-1 text-center max-w-xs">
          Crea la cuenta de administrador para empezar a usar el sistema de fichaje.
        </p>
      </div>

      <div className="animate-slide-up w-full max-w-xs">
        <div className="glass rounded-2xl p-6">
          {step === 'name' ? (
            <>
              <label className="block text-dark-300 text-sm mb-2">Tu nombre completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                className="w-full bg-dark-900/80 border border-dark-700 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-gold-500 transition-colors"
                placeholder="Nombre y apellidos"
                autoFocus
              />
              {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
              <button
                onClick={handleNameSubmit}
                className="w-full mt-4 bg-gradient-to-r from-gold-600 to-gold-500 text-dark-950 font-semibold py-3 rounded-xl hover:from-gold-500 hover:to-gold-400 transition-all active:scale-[0.98]"
              >
                Continuar
              </button>
            </>
          ) : (
            <>
              <p className="text-dark-300 text-sm text-center mb-4">
                {step === 'pin' ? 'Elige tu PIN de 4 dígitos' : 'Confirma tu PIN'}
              </p>
              <div className="flex justify-center gap-3 mb-5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                    i < activeVal.length
                      ? 'bg-gold-400 scale-125 shadow-[0_0_10px_rgba(220,149,36,0.5)]'
                      : 'bg-dark-700/60 border border-dark-600'
                  }`} />
                ))}
              </div>
              {error && <p className="text-red-400 text-sm mb-3 text-center animate-fade-in">{error}</p>}
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((key, idx) => {
                  if (key === null) return <div key={idx} />;
                  if (key === 'del') return (
                    <button key={idx} onClick={handleDelete}
                      className="aspect-square rounded-xl bg-dark-800/40 text-dark-300 flex items-center justify-center hover:bg-dark-700 active:scale-95 transition-all">
                      <Delete size={20} />
                    </button>
                  );
                  return (
                    <button key={idx} onClick={() => handleDigit(String(key))} disabled={loading}
                      className="aspect-square rounded-xl bg-dark-800/40 text-white text-xl font-light hover:bg-dark-700 hover:text-gold-300 active:scale-95 active:bg-gold-600/20 transition-all disabled:opacity-30">
                      {key}
                    </button>
                  );
                })}
              </div>
              {step === 'confirm' && (
                <button onClick={() => { setStep('pin'); setPin(''); setConfirmPin(''); setError(''); }}
                  className="w-full mt-3 text-dark-400 text-xs hover:text-gold-400 transition-colors">
                  ← Empezar de nuevo
                </button>
              )}
              {loading && (
                <div className="mt-4 flex justify-center">
                  <div className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
