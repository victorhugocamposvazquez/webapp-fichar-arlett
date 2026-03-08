import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Search, Download } from 'lucide-react';

function formatDuration(minutes) {
  if (minutes == null) return 'En curso';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

export default function AdminRecords() {
  const [records, setRecords] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    userId: '',
    from: '',
    to: '',
  });
  const [total, setTotal] = useState(0);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.userId) params.userId = filters.userId;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;

      const data = await api.getAllRecords(params);
      setRecords(data.records);
      setTotal(data.total);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.getUsers().then(setUsers).catch(() => {});
    fetchRecords();
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchRecords();
  };

  const exportCSV = () => {
    const headers = ['Empleado', 'Entrada', 'Salida', 'Duración (min)', 'Nota entrada', 'Nota salida'];
    const rows = records.map(r => [
      r.user_name,
      r.clock_in,
      r.clock_out || '',
      r.duration_minutes || '',
      r.clock_in_note || '',
      r.clock_out_note || '',
    ]);

    const csv = [headers, ...rows].map(r => r.join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fichajes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-semibold text-white">Registros de fichaje</h1>
        <button
          onClick={exportCSV}
          disabled={records.length === 0}
          className="flex items-center gap-2 text-dark-400 hover:text-gold-400 text-sm transition-colors disabled:opacity-30"
        >
          <Download size={16} />
          Exportar CSV
        </button>
      </div>

      <form onSubmit={handleFilter} className="glass rounded-xl p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[140px]">
          <label className="block text-dark-400 text-xs mb-1">Empleado</label>
          <select
            value={filters.userId}
            onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
            className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold-500"
          >
            <option value="">Todos</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
        <div className="min-w-[130px]">
          <label className="block text-dark-400 text-xs mb-1">Desde</label>
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold-500"
          />
        </div>
        <div className="min-w-[130px]">
          <label className="block text-dark-400 text-xs mb-1">Hasta</label>
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold-500"
          />
        </div>
        <button
          type="submit"
          className="bg-gold-600 hover:bg-gold-500 text-dark-950 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
        >
          <Search size={14} />
          Filtrar
        </button>
      </form>

      <p className="text-dark-500 text-xs">{total} registros encontrados</p>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : records.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center text-dark-500">
          No se encontraron registros
        </div>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-800 text-dark-400 text-xs uppercase">
                  <th className="text-left px-4 py-3">Empleado</th>
                  <th className="text-left px-4 py-3">Entrada</th>
                  <th className="text-left px-4 py-3">Salida</th>
                  <th className="text-left px-4 py-3">Duración</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id} className="border-b border-dark-800/50 hover:bg-dark-800/30">
                    <td className="px-4 py-3 text-white">{r.user_name}</td>
                    <td className="px-4 py-3 text-dark-300">
                      {new Date(r.clock_in).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-dark-300">
                      {r.clock_out
                        ? new Date(r.clock_out).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
                        : <span className="text-green-400 text-xs">En curso</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-dark-400 font-mono">{formatDuration(r.duration_minutes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-dark-800">
            {records.map(r => (
              <div key={r.id} className="p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-white text-sm font-medium">{r.user_name}</span>
                  <span className="text-dark-400 font-mono text-xs">{formatDuration(r.duration_minutes)}</span>
                </div>
                <p className="text-dark-400 text-xs">
                  {new Date(r.clock_in).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  {r.clock_out
                    ? ` → ${new Date(r.clock_out).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
                    : ' → En curso'
                  }
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
