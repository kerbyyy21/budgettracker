import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-leaf-100 text-leaf-700"><Compass className="h-10 w-10" /></span>
      <h1 className="text-4xl font-extrabold">Page not found</h1>
      <p className="max-w-sm text-ink-soft">We could not find that page. It may have moved, or the link is mistyped.</p>
      <div className="flex gap-2">
        <Link to="/app" className="btn btn-primary">Go to dashboard</Link>
        <Link to="/" className="btn btn-outline">Home</Link>
      </div>
    </div>
  );
}
