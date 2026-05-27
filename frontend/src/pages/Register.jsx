import { UserPlus } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import AuthLayout from "../components/AuthLayout";
import FormField from "../components/FormField";
import { useAuth } from "../context/useAuth";

const Register = () => {
  const navigate = useNavigate();
  const { isAuthenticated, register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.name || !form.email || !form.password) {
      setError("Name, email, and password are required.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      setIsSubmitting(true);
      await register(form);
      navigate("/dashboard");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout heading="Create account" subheading="Set up your workspace and start tracking tasks.">
      <form className="space-y-6" onSubmit={handleSubmit}>
        {error ? (
          <div className="rounded-xl border border-red-200 dark:border-red-950 bg-red-50 dark:bg-red-950/20 px-4 py-3.5 text-sm text-red-700 dark:text-red-400 animate-fade-in" role="alert">
            {error}
          </div>
        ) : null}

        <FormField
          autoComplete="name"
          label="Your Name"
          name="name"
          onChange={handleChange}
          placeholder="John Doe"
          type="text"
          value={form.name}
        />
        <FormField
          autoComplete="email"
          label="Email Address"
          name="email"
          onChange={handleChange}
          placeholder="you@example.com"
          type="email"
          value={form.email}
        />
        <FormField
          autoComplete="new-password"
          label="Password"
          name="password"
          onChange={handleChange}
          placeholder="Minimum 8 characters"
          type="password"
          value={form.password}
        />

        <button
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 hover:bg-slate-900 dark:bg-emerald-600 dark:hover:bg-emerald-500 active:scale-[0.98] px-4 text-sm font-semibold text-white transition-all focus:outline-none focus:ring-4 focus:ring-slate-300 dark:focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60 shadow-md shadow-slate-950/10 dark:shadow-emerald-500/10"
          disabled={isSubmitting}
          type="submit"
        >
          <UserPlus size={18} />
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account?{" "}
        <Link className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors" to="/login">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Register;

