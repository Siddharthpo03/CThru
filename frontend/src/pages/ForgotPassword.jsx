import { useState } from "react";
import { ArrowLeft, LoaderCircle, Mail, Send } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import AuthLayout from "../components/auth/AuthLayout";
import { useAuth } from "../contexts/AuthContext";

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      toast.error("Enter your email address.");
      return;
    }

    try {
      setLoading(true);

      const data = await forgotPassword(trimmedEmail);

      setSent(true);

      toast.success(data.message);
    } catch (error) {
      toast.error(error.message || "Unable to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={sent ? "Check your inbox" : "Forgot your password?"}
      description={
        sent
          ? "If an account exists with this email, we've sent password reset instructions."
          : "Enter your email address and we'll send you a password reset link."
      }
    >
      {sent ? (
        <div>
          <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center dark:border-green-500/20 dark:bg-green-500/10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400">
              <Send size={25} />
            </div>

            <p className="mt-5 font-medium text-zinc-900 dark:text-white">
              If an account exists for
            </p>

            <p className="mt-1 break-all text-sm text-zinc-500 dark:text-zinc-400">
              {email}
            </p>

            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
              We've sent password reset instructions. Please check your inbox
              and spam folder.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setSent(false);
              setEmail("");
            }}
            className="mt-5 w-full text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            Try another email
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Email address
          </label>

          <div className="relative">
            <Mail
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
            />

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              className="h-12 w-full rounded-xl border border-zinc-200 bg-white pl-11 pr-4 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <LoaderCircle size={19} className="animate-spin" />
                Sending...
              </>
            ) : (
              <>
                Send reset instructions
                <Send size={18} />
              </>
            )}
          </button>
        </form>
      )}

      <Link
        to="/login"
        className="mt-8 flex items-center justify-center gap-2 text-sm font-medium text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400"
      >
        <ArrowLeft size={17} />
        Back to sign in
      </Link>
    </AuthLayout>
  );
}
