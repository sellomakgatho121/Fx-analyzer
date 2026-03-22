"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const result = await signIn("credentials", {
            redirect: false,
            username: email,
            password,
        });

        setLoading(false);

        if (result.error) {
            setError("Invalid credentials");
        } else {
            router.push("/dashboard");
        }
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-void)', fontFamily: 'var(--font-display)',
            position: 'relative', overflow: 'hidden',
        }}>
            {/* Ambient glow */}
            <div style={{
                position: 'absolute', top: '-20%', left: '-10%', width: '50%', height: '50%',
                background: 'radial-gradient(circle, rgba(0,242,255,0.06), transparent 70%)',
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', bottom: '-20%', right: '-10%', width: '50%', height: '50%',
                background: 'radial-gradient(circle, rgba(0,255,136,0.04), transparent 70%)',
                pointerEvents: 'none',
            }} />

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
                style={{
                    position: 'relative', zIndex: 10, width: '100%', maxWidth: '420px',
                    padding: '48px 40px', borderRadius: '20px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
                }}
            >
                {/* Top accent */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                    background: 'linear-gradient(90deg, #00f2ff, #00ff88)',
                    borderRadius: '20px 20px 0 0',
                }} />

                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{
                        width: '48px', height: '48px', borderRadius: '14px', margin: '0 auto 16px',
                        background: 'linear-gradient(135deg, #00f2ff, #00ff88)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 900, fontSize: '0.875rem', color: '#000',
                    }}>FX</div>
                    <h1 style={{
                        fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em',
                        marginBottom: '4px',
                    }}>
                        Welcome Back
                    </h1>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        Sign in to your trading terminal
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '12px 16px', borderRadius: '10px',
                                background: 'rgba(255, 15, 66, 0.08)',
                                border: '1px solid rgba(255, 15, 66, 0.2)',
                                fontSize: '0.8125rem', color: '#ff3366',
                            }}
                        >
                            <AlertCircle size={14} />
                            {error}
                        </motion.div>
                    )}

                    <div>
                        <label style={{
                            display: 'block', marginBottom: '8px', fontSize: '0.75rem',
                            fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
                            color: 'var(--text-secondary)',
                        }}>Email</label>
                        <input
                            type="text"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="trader@fx.com"
                            required
                            style={{
                                width: '100%', padding: '14px 16px', borderRadius: '10px',
                                background: 'var(--bg-elevated)',
                                border: '1px solid var(--border-default)',
                                color: 'var(--text-primary)',
                                fontFamily: 'var(--font-mono)', fontSize: '0.875rem',
                                outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = 'rgba(0,242,255,0.4)';
                                e.target.style.boxShadow = '0 0 0 3px rgba(0,242,255,0.08)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = 'var(--border-default)';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>

                    <div>
                        <label style={{
                            display: 'block', marginBottom: '8px', fontSize: '0.75rem',
                            fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
                            color: 'var(--text-secondary)',
                        }}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            required
                            style={{
                                width: '100%', padding: '14px 16px', borderRadius: '10px',
                                background: 'var(--bg-elevated)',
                                border: '1px solid var(--border-default)',
                                color: 'var(--text-primary)',
                                fontFamily: 'var(--font-mono)', fontSize: '0.875rem',
                                outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = 'rgba(0,242,255,0.4)';
                                e.target.style.boxShadow = '0 0 0 3px rgba(0,242,255,0.08)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = 'var(--border-default)';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={loading}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                            width: '100%', padding: '16px', marginTop: '8px',
                            borderRadius: '12px', fontWeight: 700, fontSize: '0.875rem',
                            textTransform: 'uppercase', letterSpacing: '0.04em',
                            background: 'linear-gradient(135deg, #00f2ff, #00ff88)',
                            color: '#000', border: 'none', cursor: 'pointer',
                            boxShadow: '0 0 20px rgba(0, 242, 255, 0.2)',
                            opacity: loading ? 0.7 : 1,
                            transition: 'opacity 0.2s',
                        }}
                    >
                        {loading ? (
                            <span>Authenticating...</span>
                        ) : (
                            <>Access Terminal <ArrowRight size={16} /></>
                        )}
                    </motion.button>
                </form>

                <div style={{
                    marginTop: '32px', textAlign: 'center',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    fontSize: '0.6875rem', color: 'var(--text-tertiary)',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>
                    <Lock size={10} />
                    Encrypted Connection — v2.0
                </div>
            </motion.div>
        </div>
    );
}

