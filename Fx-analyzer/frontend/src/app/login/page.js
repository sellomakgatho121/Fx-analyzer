"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await signIn("credentials", {
            redirect: false,
            username,
            password,
        });

        if (result.error) {
            setError("Invalid credentials (try: user/password)");
        } else {
            router.push("/");
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-black font-sans text-gray-100 selection:bg-cyan-500/30">
            {/* Ambient Background */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-cyan-500/10 blur-[120px] rounded-full animate-pulse-slow"></div>
                <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse-slow delay-1000"></div>
            </div>

            <div className="relative z-10 w-full max-w-md p-8 bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl ring-1 ring-white/5">
                <h1 className="mb-6 text-3xl font-bold text-center bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                    FX Analyzer Pro
                </h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-3 text-sm text-red-400 bg-red-900/20 border border-red-500/20 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-400">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all text-white placeholder-gray-600"
                            placeholder="Enter username"
                        />
                    </div>

                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-400">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-white placeholder-gray-600"
                            placeholder="Enter password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold rounded-lg shadow-lg shadow-cyan-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Access Terminal
                    </button>
                </form>

                <div className="mt-6 text-center text-xs text-gray-500">
                    System Restricted Access &bull; version 2.0
                </div>
            </div>
        </div>
    );
}
