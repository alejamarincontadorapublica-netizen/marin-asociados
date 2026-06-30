"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError("Correo o contraseña incorrectos. Intenta de nuevo.");
      setLoading(false);
      return;
    }

    router.push("/panel");
    router.refresh();
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ backgroundColor: "#1A1814" }}
    >
      {/* Logo / identidad */}
      <div className="mb-10 text-center">
        <div
          className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 border-2"
          style={{ borderColor: "#C0A36B", backgroundColor: "#211E19" }}
        >
          <span
            className="font-serif font-bold text-3xl"
            style={{ color: "#C0A36B" }}
          >
            MA
          </span>
        </div>
        <h1
          className="font-serif font-bold text-2xl tracking-widest"
          style={{ color: "#C0A36B" }}
        >
          MARÍN & ASOCIADOS
        </h1>
        <p className="text-sm mt-1" style={{ color: "#9A7223" }}>
          soluciones contables que generan valor
        </p>
      </div>

      {/* Tarjeta de login */}
      <div
        className="w-full max-w-sm rounded-xl p-8 border"
        style={{
          backgroundColor: "#211E19",
          borderColor: "#2A261F",
        }}
      >
        <h2
          className="font-serif text-lg mb-6 text-center"
          style={{ color: "#FAF8F4" }}
        >
          Acceso al sistema
        </h2>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label
              className="block text-xs font-medium mb-1.5 tracking-wide"
              style={{ color: "#9A9281" }}
            >
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tucorreo@ejemplo.com"
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
              style={{
                backgroundColor: "#2A261F",
                border: "1px solid #3A3528",
                color: "#FAF8F4",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#C0A36B")}
              onBlur={(e) => (e.target.style.borderColor = "#3A3528")}
            />
          </div>

          <div>
            <label
              className="block text-xs font-medium mb-1.5 tracking-wide"
              style={{ color: "#9A9281" }}
            >
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
              style={{
                backgroundColor: "#2A261F",
                border: "1px solid #3A3528",
                color: "#FAF8F4",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#C0A36B")}
              onBlur={(e) => (e.target.style.borderColor = "#3A3528")}
            />
          </div>

          {error && (
            <p
              className="text-xs text-center rounded-lg px-3 py-2"
              style={{ backgroundColor: "#F6E9E6", color: "#9E4332" }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-opacity disabled:opacity-60"
            style={{ backgroundColor: "#C0A36B", color: "#1A1814" }}
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>

      <p className="mt-8 text-xs" style={{ color: "#6B4F2A" }}>
        T.P. 327147 · Solo acceso autorizado
      </p>
    </div>
  );
}
