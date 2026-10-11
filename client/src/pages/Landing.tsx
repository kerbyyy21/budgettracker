import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Check, PiggyBank, Target, Wallet, Tags, Sparkles, Plus } from 'lucide-react';
import { Logo } from '../components/layout/Logo';

const FEATURES = [
  { icon: Wallet, title: 'Every wallet in one place', text: 'Cash, GCash, Maya, BPI, BDO. Each wallet keeps its own running balance, and a payment can never overdraw it.' },
  { icon: Target, title: 'A budget that talks back', text: 'Set a monthly limit and see what is left, how much you can spend per day, and whether your pace will break it.' },
  { icon: PiggyBank, title: 'Savings goals with rules', text: 'Deposit only what is truly free. Goals track progress, what you still need, and what to save each month.' },
  { icon: BarChart3, title: 'Reports you can read', text: 'Category breakdowns, six-month trends and plain-language insights, such as "spending is up 18% from last month".' },
  { icon: Tags, title: 'Your own categories', text: 'Start with student-friendly defaults like Fare, Load and School, then add icons and colors that fit your life.' },
  { icon: Sparkles, title: 'Plans that grow with you', text: 'Start free with one wallet. Try Plus or Premium for seven days when you need more wallets.' },
];

const STEPS = [
  { n: '1', title: 'Add your wallets', text: 'Enter your starting balance for each one.' },
  { n: '2', title: 'Log what comes in and goes out', text: 'Pick a category, wallet and amount. It takes about ten seconds.' },
  { n: '3', title: 'Watch the numbers work for you', text: 'Balances, budget pace and goal progress update instantly.' },
];

const PLANS = [
  { name: 'Basic', price: 'Free', note: 'forever', items: ['1 wallet', 'Budget and savings goals', 'Monthly reports'], featured: false },
  { name: 'Plus', price: '₱99', note: 'per month', items: ['Up to 3 wallets', 'Everything in Basic', '7-day free trial'], featured: true },
  { name: 'Premium', price: '₱179', note: 'per month', items: ['Unlimited wallets', 'Everything in Plus', 'Best for freelancers'], featured: false },
];

function HeroMock() {
  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden>
      <div className="absolute -right-4 -top-6 h-40 w-40 rounded-full bg-sun-100 blur-2xl" />
      <div className="absolute -bottom-8 -left-6 h-48 w-48 rounded-full bg-leaf-200/70 blur-2xl" />
      <div className="relative rotate-1 rounded-3xl bg-ink p-6 text-white shadow-pop">
        <p className="text-sm font-semibold text-leaf-300">Available to spend</p>
        <p className="mt-1 font-display text-4xl font-extrabold">₱9,758.00</p>
        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-white/10 p-3"><p className="text-white/60">Income</p><p className="font-bold text-leaf-300">+₱8,800</p></div>
          <div className="rounded-2xl bg-white/10 p-3"><p className="text-white/60">Expenses</p><p className="font-bold text-coral-100">−₱6,656</p></div>
        </div>
      </div>
      <div className="relative -mt-4 ml-8 -rotate-2 rounded-3xl border border-line bg-white p-5 shadow-card">
        <div className="flex items-center justify-between text-sm font-bold"><span>October budget</span><span className="text-leaf-700">67% used</span></div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-paper-deep"><div className="h-full w-[67%] rounded-full bg-leaf-500" /></div>
        <p className="mt-2 text-xs text-ink-muted">Safe to spend about ₱152 a day for 22 days</p>
      </div>
      <div className="relative -mt-3 mr-8 rotate-1 rounded-3xl border border-line bg-white p-4 shadow-card">
        {[['Milk tea', 'GCash', '−₱120'], ['Weekly pocket money', 'Wallet', '+₱1,000']].map(([a, b, c]) => (
          <div key={a} className="flex items-center justify-between py-1.5 text-sm">
            <span><span className="font-bold">{a}</span> <span className="text-ink-muted">· {b}</span></span>
            <span className={`font-display font-bold ${c.startsWith('+') ? 'text-leaf-600' : 'text-coral-600'}`}>{c}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-dvh overflow-x-hidden">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-8 sm:py-6">
        <Logo />
        <nav className="flex items-center gap-1 sm:gap-3" aria-label="Website">
          <a href="#features" className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-paper-deep sm:block">Features</a>
          <a href="#plans" className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-paper-deep sm:block">Plans</a>
          <Link to="/app" className="btn btn-dark">Open the app</Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-6 sm:px-8 lg:grid-cols-[1.1fr_.9fr] lg:pb-28 lg:pt-14">
        <div>
          <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-leaf-100 px-3.5 py-1.5 text-sm font-bold text-leaf-800">
            <span className="h-2 w-2 rounded-full bg-leaf-500" /> For Filipino students and young professionals
          </p>
          <h1 className="text-5xl font-extrabold leading-[1.02] sm:text-6xl lg:text-7xl">
            Know where <span className="relative whitespace-nowrap"><span className="relative z-10">every peso</span><span className="absolute inset-x-0 bottom-1 z-0 h-3 rounded-full bg-sun-500/60 sm:h-4" /></span> goes.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
            BudgetTracker tracks your allowance, salary and every expense across cash, e-wallets and banks, then tells you in plain words if you are on pace to last the month.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/app" className="btn btn-primary px-6 py-3.5 text-base">Start tracking <ArrowRight className="h-5 w-5" /></Link>
            <Link to="/app/transactions/new" className="btn btn-outline px-6 py-3.5 text-base"><Plus className="h-5 w-5" /> Add a transaction</Link>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-ink-soft">
            {['Pesos, not dollars', 'Works on your phone', 'Free to start'].map((t) => (
              <li key={t} className="flex items-center gap-1.5"><Check className="h-4 w-4 text-leaf-600" /> {t}</li>
            ))}
          </ul>
        </div>
        <HeroMock />
      </section>

      <section id="features" className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <h2 className="max-w-2xl text-4xl font-extrabold sm:text-5xl">Built around how you really spend.</h2>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-3xl border border-line bg-paper p-6 transition hover:-translate-y-1 hover:shadow-card">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-leaf-300"><Icon className="h-6 w-6" /></span>
                <h3 className="mt-5 text-xl font-bold">{title}</h3>
                <p className="mt-2 leading-relaxed text-ink-soft">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-8 sm:py-24">
        <h2 className="text-4xl font-extrabold sm:text-5xl">Three steps. No spreadsheets.</h2>
        <ol className="mt-12 grid gap-8 md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="relative">
              <span className="font-display text-7xl font-extrabold text-leaf-200">{s.n}</span>
              <h3 className="-mt-3 text-xl font-bold">{s.title}</h3>
              <p className="mt-2 text-ink-soft">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="plans" className="bg-ink py-16 text-white sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <h2 className="text-4xl font-extrabold sm:text-5xl">Start free. Upgrade when you need more wallets.</h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {PLANS.map((p) => (
              <article key={p.name} className={`rounded-3xl p-7 ${p.featured ? 'bg-leaf-400 text-ink' : 'bg-white/8 ring-1 ring-white/15'}`}>
                <h3 className="text-lg font-bold">{p.name}</h3>
                <p className="mt-3 font-display text-5xl font-extrabold">{p.price}</p>
                <p className={`text-sm ${p.featured ? 'text-ink-soft' : 'text-white/60'}`}>{p.note}</p>
                <ul className="mt-6 space-y-2.5 text-sm font-semibold">
                  {p.items.map((i) => <li key={i} className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0" /> {i}</li>)}
                </ul>
              </article>
            ))}
          </div>
          <Link to="/app/subscription" className="btn mt-10 bg-white text-ink hover:bg-leaf-100">Compare plans <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-10 text-sm text-ink-muted sm:flex-row sm:items-center sm:px-8">
        <Logo />
        <p>Built with React, Express and MongoDB for Advanced Web Programming.</p>
      </footer>
    </div>
  );
}
