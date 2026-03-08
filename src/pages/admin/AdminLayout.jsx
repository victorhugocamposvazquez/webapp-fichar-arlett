import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Users, ClipboardList, LogOut, Timer, LayoutDashboard } from 'lucide-react';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Panel', end: true },
  { to: '/admin/users', icon: Users, label: 'Empleados' },
  { to: '/admin/records', icon: ClipboardList, label: 'Registros' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-full flex flex-col">
      <header className="glass-strong sticky top-0 z-20 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-arlett.png" alt="Arlett" className="w-9 h-9 object-contain" />
            <div>
              <p className="text-white font-medium text-sm leading-tight">Backoffice</p>
              <p className="text-dark-400 text-xs">{user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NavLink
              to="/dashboard"
              className="p-2 rounded-lg hover:bg-dark-800 text-dark-400 hover:text-gold-400 transition-colors"
              title="Mi fichaje"
            >
              <Timer size={20} />
            </NavLink>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-dark-800 text-dark-400 hover:text-gold-400 transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <nav className="glass border-b border-dark-800 sticky top-[57px] z-10">
        <div className="max-w-5xl mx-auto flex">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-3 text-sm transition-colors border-b-2 ${
                  isActive
                    ? 'border-gold-500 text-gold-400'
                    : 'border-transparent text-dark-400 hover:text-dark-200'
                }`
              }
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
