import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Users, Clock, CalendarDays, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [u, r] = await Promise.all([
          api.getUsers(),
          api.getAllRecords({ limit: 10 }),
        ]);
        setUsers(u);
        setRecords(r.records);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeUsers = users.filter(u => u.active);
  const workingNow = records.filter(r => !r.clock_out).length;
  const today = new Date().toLocaleDateString('sv-SE');
  const todayRecords = records.filter(r => r.clock_in?.startsWith(today));

  const stats = [
    { icon: Users, label: 'Empleados activos', value: activeUsers.length, color: 'text-blue-400' },
    { icon: Clock, label: 'Trabajando ahora', value: workingNow, color: 'text-green-400' },
    { icon: CalendarDays, label: 'Fichajes hoy', value: todayRecords.length, color: 'text-gold-400' },
    { icon: TrendingUp, label: 'Total empleados', value: users.length, color: 'text-purple-400' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-xl font-semibold text-white">Panel de control</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="glass rounded-xl p-4">
            <Icon size={20} className={`${color} mb-2`} />
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-dark-400 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="glass rounded-xl p-4">
        <h2 className="text-sm font-medium text-dark-300 mb-4 uppercase tracking-wider">Últimos fichajes</h2>
        {records.length === 0 ? (
          <p className="text-dark-500 text-sm">No hay registros todavía.</p>
        ) : (
          <div className="space-y-2">
            {records.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-dark-800 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${r.clock_out ? 'bg-dark-500' : 'bg-green-400 animate-pulse'}`} />
                  <div>
                    <p className="text-white text-sm">{r.user_name}</p>
                    <p className="text-dark-500 text-xs">
                      {new Date(r.clock_in).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      {r.clock_out && ` → ${new Date(r.clock_out).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`}
                    </p>
                  </div>
                </div>
                {r.duration_minutes != null && (
                  <span className="text-dark-400 font-mono text-xs">
                    {Math.floor(r.duration_minutes / 60)}h {(r.duration_minutes % 60).toString().padStart(2, '0')}m
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
