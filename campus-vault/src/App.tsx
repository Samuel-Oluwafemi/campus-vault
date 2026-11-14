import { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { authService, resourceService, ApiError } from '@/services';
import type { Resource } from '@/types';

/** Temporary smoke test: proves the mock services and seed data are wired. Replace with real routes next. */
function ServiceCheck() {
  const [items, setItems] = useState<Resource[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        await authService.login('ada@student.test');
        const page = await resourceService.list();
        setItems(page.items);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'Something went wrong.');
      }
    })();
  }, []);

  if (error) return <p className="p-6 text-red-700">{error}</p>;
  if (!items) return <p className="p-6 text-slate-600">Loading resources...</p>;
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">Campus Vault</h1>
      <p className="mb-4 text-slate-600">{items.length} approved resources loaded from mock services.</p>
      <ul className="space-y-2">
        {items.map((r) => (
          <li key={r.id} className="rounded border border-slate-200 p-3">
            {r.title}
          </li>
        ))}
      </ul>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="*" element={<ServiceCheck />} />
    </Routes>
  );
}
