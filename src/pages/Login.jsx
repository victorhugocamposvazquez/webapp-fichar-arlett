import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { Delete, Circle } from 'lucide-react';

export default function Login() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState([]);
  const { login } = useAuth();
  const navigate = useNavigate();

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    api.getWorking().then((data) => setWorking(data.working || [])).catch(() => setWorking([]));
    const interval = setInterval(() => {
      api.getWorking().then((data) => setWorking(data.working || [])).catch(() => setWorking([]));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleDigit = (digit) => {
    if (loading || pin.length >= 4) return;
    setError('');
    const newPin = pin + digit;
    setPin(newPin);

    if (newPin.length === 4) {
      handleLogin(newPin);
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  const handleLogin = async (currentPin) => {
    setLoading(true);
    setError('');
    try {
      const data = await api.login(currentPin);
      login(data.user, data.token);
      navigate(data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.message);
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col items-center justify-center px-4 py-8">
      {working.length > 0 && (
        <div className="w-full max-w-xs mb-4 animate-fade-in">
          <p className="text-dark-400 text-xs uppercase tracking-wider mb-2">Con jornada iniciada</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {working.map((u) => (
              <div
                key={u.id}
                className="inline-flex items-center gap-2 rounded-lg border-2 border-green-500/80 bg-green-500/10 px-3 py-1.5"
              >
                <Circle size={10} className="shrink-0 fill-green-400 text-green-400 animate-pulse" />
                <span className="text-gold-400 font-medium text-sm">{u.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="animate-fade-in mb-6 flex flex-col items-center">
        <img
          src="/logo-arlett.png"
          alt="Arlett Beauty & Health"
          className="w-24 h-24 md:w-32 md:h-32 object-contain mb-3"
        />
        <p className="text-dark-400 text-xs tracking-[0.3em] uppercase mb-4">Sistema de fichaje</p>
        <p className="text-white/60 text-sm">
          {now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <p className="text-gold-400 text-3xl font-light font-mono tracking-wider">
          {now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </p>
      </div>

      <div className="animate-slide-up w-full max-w-xs">
        <div className="glass rounded-2xl p-6">
          <p className="text-dark-300 text-sm text-center mb-5">Introduce tu PIN</p>

          <div className="flex justify-center gap-3 mb-5">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                  i < pin.length
                    ? 'bg-gold-400 scale-125 shadow-[0_0_10px_rgba(220,149,36,0.5)]'
                    : 'bg-dark-700/60 border border-dark-600'
                }`}
              />
            ))}
          </div>

          {error && (
            <div className="mb-4 text-center animate-fade-in">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((key, idx) => {
              if (key === null) return <div key={idx} />;
              if (key === 'del') {
                return (
                  <button
                    key={idx}
                    onClick={handleDelete}
                    disabled={loading}
                    className="aspect-square rounded-xl bg-dark-800/40 text-dark-300 flex items-center justify-center hover:bg-dark-700 active:scale-95 transition-all disabled:opacity-30"
                  >
                    <Delete size={20} />
                  </button>
                );
              }
              return (
                <button
                  key={idx}
                  onClick={() => handleDigit(String(key))}
                  disabled={loading}
                  className="aspect-square rounded-xl bg-dark-800/40 text-white text-xl font-light hover:bg-dark-700 hover:text-gold-300 active:scale-95 active:bg-gold-600/20 transition-all disabled:opacity-30"
                >
                  {key}
                </button>
              );
            })}
          </div>

          {loading && (
            <div className="mt-5 flex justify-center">
              <div className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

      </div>

      <footer className="mt-6 text-dark-600 text-xs text-center">
        RD-ley 8/2019 · Registro de jornada laboral
      </footer>
    </div>
  );
}
