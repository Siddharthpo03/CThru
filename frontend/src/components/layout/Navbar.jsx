import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link
          to="/"
          className="text-2xl font-bold tracking-wide text-indigo-400"
        >
          CThru
        </Link>

        <div className="flex items-center gap-6">
          <a href="#features" className="hover:text-indigo-400">
            Features
          </a>

          <a href="#how" className="hover:text-indigo-400">
            How it Works
          </a>

          <Link
            to="/login"
            className="rounded-lg bg-indigo-600 px-4 py-2 hover:bg-indigo-500"
          >
            Login
          </Link>
        </div>
      </div>
    </nav>
  );
}
