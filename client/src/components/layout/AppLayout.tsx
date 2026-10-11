import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { Home, ArrowLeftRight, Plus, PiggyBank, Menu, X, ArrowLeft } from 'lucide-react';
import { Logo } from './Logo';
import { NAV_ITEMS } from './navItems';
import { useFetch } from '../../hooks/useFetch';
import { profileApi } from '../../api/endpoints';
import { Modal } from '../ui/Modal';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-[44px] items-center gap-3 rounded-xl px-3.5 text-[15px] font-semibold transition ${
    isActive ? 'bg-white/12 text-white' : 'text-white/65 hover:bg-white/8 hover:text-white'
  }`;

function ProfileChip() {
  const { data } = useFetch(() => profileApi.get(), []);
  const initial = data?.name?.trim()[0]?.toUpperCase() ?? 'S';
  return (
    <Link to="/app/profile" className="flex items-center gap-3 rounded-2xl bg-white/8 p-3 transition hover:bg-white/12">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-leaf-400 font-display text-lg font-extrabold text-ink">{initial}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-white">{data?.name ?? 'Your profile'}</span>
        <span className="block text-xs font-semibold text-leaf-300">{data ? `${data.plan} plan` : ' '}</span>
      </span>
    </Link>
  );
}

export function AppLayout() {
  const [moreOpen, setMoreOpen] = useState(false);

  const tab = (isActive: boolean) => `flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-bold ${isActive ? 'text-leaf-700' : 'text-ink-muted'}`;

  return (
    <div className="min-h-dvh md:pl-72">
      <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col bg-ink p-5 md:flex">
        <Link to="/" className="mb-8 px-1" aria-label="BudgetTracker home"><Logo dark /></Link>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto" aria-label="Main">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              <Icon className="h-5 w-5" /> {label}
            </NavLink>
          ))}
        </nav>
        <Link to="/" className="mb-3 flex items-center gap-2 px-3 text-sm font-semibold text-white/55 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to website</Link>
        <ProfileChip />
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-paper/90 px-4 py-3 backdrop-blur md:hidden">
        <Link to="/app" aria-label="Dashboard"><Logo /></Link>
        <button onClick={() => setMoreOpen(true)} aria-label="Open menu" className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-paper-deep"><Menu className="h-6 w-6" /></button>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-32 pt-6 md:px-10 md:pb-12 md:pt-10">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-end border-t border-line bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="Quick navigation">
        <NavLink to="/app" end className={({ isActive }) => tab(isActive)}><Home className="h-5 w-5" />Home</NavLink>
        <NavLink to="/app/transactions" end className={({ isActive }) => tab(isActive)}><ArrowLeftRight className="h-5 w-5" />Activity</NavLink>
        <Link to="/app/transactions/new" aria-label="Add transaction" className="relative -top-4 mx-1 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-leaf-600 text-white shadow-pop active:scale-95"><Plus className="h-7 w-7" /></Link>
        <NavLink to="/app/savings" className={({ isActive }) => tab(isActive)}><PiggyBank className="h-5 w-5" />Savings</NavLink>
        <button onClick={() => setMoreOpen(true)} className={tab(false)}><Menu className="h-5 w-5" />More</button>
      </nav>

      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title="Menu" size="sm">
        <div className="grid grid-cols-2 gap-2">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} onClick={() => setMoreOpen(false)} className="flex min-h-[64px] flex-col items-start justify-center gap-1 rounded-2xl bg-paper p-3.5 text-sm font-bold hover:bg-paper-deep">
              <Icon className="h-5 w-5 text-leaf-600" /> {label}
            </Link>
          ))}
        </div>
        <Link to="/" onClick={() => setMoreOpen(false)} className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-ink-muted"><X className="h-4 w-4 rotate-45" /> Back to website</Link>
      </Modal>
    </div>
  );
}
