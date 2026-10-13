import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-slate-100">
      <div className="text-center">
        <p className="text-sm uppercase tracking-widest text-slate-500">404</p>
        <h1 className="mt-2 text-3xl font-semibold">Page not found</h1>
        <Link to="/" className="mt-5 inline-block rounded-lg bg-blue-600 px-4 py-2.5 font-medium hover:bg-blue-500">
          Return to dashboard
        </Link>
      </div>
    </main>
  );
}
