"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/use-session";

export default function LoginPage() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useSession();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pin.length !== 4) {
      setError("请输入4位数字密码");
      return;
    }
    setLoading(true);
    setError("");

    try {
      await login(pin);
      router.push("/frontdesk");
    } catch (err: any) {
      setError(err.message || "登录失败，请重试");
    } finally {
      setLoading(false);
    }
  }

  function handleDigit(d: string) {
    if (pin.length < 4) {
      setPin(pin + d);
      setError("");
    }
  }

  function handleDelete() {
    setPin(pin.slice(0, -1));
    setError("");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm border border-zinc-200">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
            <svg className="h-7 w-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-zinc-800">Lake Spa</h1>
          <p className="mt-1 text-sm text-zinc-500">工作日志系统</p>
        </div>

        <form id="login-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center">
            <div className="flex justify-center gap-3 mb-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-4 w-4 rounded-full border-2 transition-all ${
                    pin.length > i
                      ? "border-blue-500 bg-blue-500"
                      : "border-zinc-300 bg-white"
                  }`}
                />
              ))}
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => handleDigit(String(d))}
                className="h-14 w-full rounded-xl bg-zinc-100 text-lg font-semibold text-zinc-800 hover:bg-zinc-200 active:bg-zinc-300 transition-colors"
              >
                {d}
              </button>
            ))}
            <div />
            <button
              type="button"
              onClick={() => handleDigit("0")}
              className="h-14 w-full rounded-xl bg-zinc-100 text-lg font-semibold text-zinc-800 hover:bg-zinc-200 active:bg-zinc-300 transition-colors"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="h-14 w-full rounded-xl bg-zinc-100 text-sm text-zinc-500 hover:bg-zinc-200 active:bg-zinc-300 transition-colors"
            >
              删除
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-colors"
          >
            {loading ? "登录中..." : "登录"}
          </button>
        </form>
      </div>
    </div>
  );
}