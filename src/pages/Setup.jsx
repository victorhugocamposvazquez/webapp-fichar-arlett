import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Delete, ArrowLeft } from 'lucide-react';

export default function Setup() {
  const [step, setStep] = useState('code');
  const [inviteCode, setInviteCode] = useState('');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleCodeSubmit = () => {
    if (inviteCode.trim().length < 4) {
      setError('Introduce tu código de invitación');
      return;
    }
    setError('');
    setStep('name');
  };

  const handleNameSubmit = () => {
    if (!name.trim()) {
      setError('El nombre completo es obligatorio');
      return;
    }
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
      const data = await api.setup(inviteCode, name, pin);
      login(data.user, data.token);
      navigate(data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.message);
      setPin('');
      setConfirmPin('');
      if (err.message.includes('código') || err.message.includes('Código')) {
        setStep('code');
      } else {
        setStep('pin');
      }
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = {
    code: { title: 'Código de invitación', desc: 'Introduce el código que te ha dado tu responsable.' },
    name: { title: 'Tu nombre completo', desc: 'Nombre y apellidos tal como quieres que aparezcan en los registros.' },
    pin: { title: 'Elige tu PIN', desc: 'Un PIN de 4 dígitos que solo tú conocerás.' },
    confirm: { title: 'Confirma tu PIN', desc: 'Repite el PIN para asegurar que es correcto.' },
  };

  return (
    <div className="min-h-full flex flex-col items-center justify-center px-4 py-8">
      <div className="animate-fade-in mb-6 flex flex-col items-center">
        <img src="/logo-arlett.png" alt="Arlett" className="w-20 h-20 object-contain mb-3" />
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center mb-3">
          <UserPlus size={22} className="text-dark-950" />
        </div>
        <h1 className="text-lg font-semibold text-white">{stepLabels[step].title}</h1>
        <p className="text-dark-400 text-sm mt-1 text-center max-w-xs">{stepLabels[step].desc}</p>
      </div>

      <div className="animate-slide-up w-full max-w-xs">
        <div className="glass rounded-2xl p-6">
          {step === 'code' && (
            <>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => { setInviteCode(e.target.value.toUpperCase()); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleCodeSubmit()}
                className="w-full bg-dark-900/80 border border-dark-700 rounded-xl px-4 py-4 text-center text-2xl tracking-[0.4em] font-mono text-white uppercase focus:outline-none focus:border-gold-500 transition-colors"
                placeholder="ABC123"
                maxLength={8}
                autoFocus
              />
              {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
              <button
                onClick={handleCodeSubmit}
                className="w-full mt-4 bg-gradient-to-r from-gold-600 to-gold-500 text-dark-950 font-semibold py-3 rounded-xl hover:from-gold-500 hover:to-gold-400 transition-all active:scale-[0.98]"
              >
                Continuar
              </button>
              <button onClick={() => navigate('/')}
                className="w-full mt-3 text-dark-400 text-sm flex items-center justify-center gap-1 hover:text-gold-400 transition-colors">
                <ArrowLeft size={14} /> Volver al login
              </button>
            </>
          )}

          {step === 'name' && (
            <>
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
              <button onClick={() => setStep('code')}
                className="w-full mt-3 text-dark-400 text-xs hover:text-gold-400 transition-colors">
                ← Volver
              </button>
            </>
          )}

          {(step === 'pin' || step === 'confirm') && (
            <>
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
              <button onClick={() => { setStep('pin'); setPin(''); setConfirmPin(''); setError(''); }}
                className="w-full mt-3 text-dark-400 text-xs hover:text-gold-400 transition-colors">
                ← Empezar de nuevo
              </button>
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
