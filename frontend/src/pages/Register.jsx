import { useState } from "react";

import { ArrowRight, LoaderCircle, Mail, User } from "lucide-react";

import { Link, useNavigate } from "react-router-dom";

import toast from "react-hot-toast";

import AuthLayout from "../components/auth/AuthLayout";
import PasswordInput from "../components/auth/PasswordInput";

import { useAuth } from "../contexts/AuthContext";

export default function Register() {
  const navigate = useNavigate();

  const { register } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const passwordStrength = () => {
    let strength = 0;

    if (form.password.length >= 8) {
      strength++;
    }

    if (/[A-Z]/.test(form.password)) {
      strength++;
    }

    if (/[0-9]/.test(form.password)) {
      strength++;
    }

    if (/[^A-Za-z0-9]/.test(form.password)) {
      strength++;
    }

    return strength;
  };

  const strength = passwordStrength();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error("Enter your name.");

      return;
    }

    if (!form.email.trim()) {
      toast.error("Enter your email address.");

      return;
    }

    if (form.password.length < 8) {
      toast.error("Password must contain at least 8 characters.");

      return;
    }

    if (!/[A-Z]/.test(form.password)) {
      toast.error("Password must contain an uppercase letter.");

      return;
    }

    if (!/[0-9]/.test(form.password)) {
      toast.error("Password must contain a number.");

      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match.");

      return;
    }

    try {
      setLoading(true);

      await register({
        name: form.name,
        email: form.email,
        password: form.password,
      });

      toast.success("CThru account created.");

      navigate("/dashboard", {
        replace: true,
      });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      description="Start analyzing and improving your code with CThru."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Full name
          </label>

          <div className="relative">
            <User
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
            />

            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="Your name"
              autoComplete="name"
              className="h-12 w-full rounded-xl border border-zinc-200 bg-white pl-11 pr-4 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />
          </div>
        </div>

        <div>
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
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              className="h-12 w-full rounded-xl border border-zinc-200 bg-white pl-11 pr-4 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Password
          </label>

          <PasswordInput
            id="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Create a password"
            autoComplete="new-password"
          />

          {form.password && (
            <div className="mt-3">
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1.5 rounded-full ${
                      level <= strength
                        ? strength <= 1
                          ? "bg-red-500"
                          : strength <= 2
                            ? "bg-amber-500"
                            : strength === 3
                              ? "bg-blue-500"
                              : "bg-green-500"
                        : "bg-zinc-200 dark:bg-zinc-800"
                    }`}
                  />
                ))}
              </div>

              <p className="mt-2 text-xs text-zinc-500">
                Use 8+ characters, uppercase, number, and symbol.
              </p>
            </div>
          )}
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Confirm password
          </label>

          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Repeat your password"
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <LoaderCircle size={19} className="animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              Create account
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
