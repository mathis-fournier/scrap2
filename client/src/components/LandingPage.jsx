import React, { useState } from 'react';

export default function LandingPage() {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);

        // TODO: Connect to your backend API route here later
        // await fetch('/api/waitlist', { method: 'POST', body: JSON.stringify({ email }) });

        setTimeout(() => {
            setLoading(false);
            setSubmitted(true);
            setEmail('');
        }, 800);
    };

    return (
        <div className="flex flex-col justify-between relative min-h-screen overflow-hidden font-sans antialiased text-neutral-100 bg-neutral-950 selection:bg-emerald-500 selection:text-black">

            {/* Decorative Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent blur-3xl pointer-events-none z-0" />
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <header className="relative z-10 flex items-center justify-between w-full max-w-5xl px-6 py-6 mx-auto">
                <div className="flex items-center gap-2">
                    <span className="font-mono text-xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">
                        gratte<span className="text-emerald-400">.sh</span>
                    </span>
                </div>
                <div className="flex items-center gap-2 border border-neutral-800/80 bg-neutral-900/40 px-3 py-1.5 rounded-full backdrop-blur-md">
                    <span className="relative flex w-2 h-2">
                        <span className="absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping bg-emerald-400"></span>
                        <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500"></span>
                    </span>
                    <span className="font-mono text-xs font-medium tracking-wide text-neutral-400">v1.0-beta cooking</span>
                </div>
            </header>

            {/* Main Hero Section */}
            <main className="relative z-10 flex flex-col items-center justify-center flex-1 w-full max-w-4xl px-6 py-12 mx-auto text-center">

                {/* Micro Tagline */}
                <p className="px-3 py-1 mb-6 font-mono text-xs tracking-widest uppercase border rounded-full text-emerald-400 bg-emerald-500/5 border-emerald-500/20">
                    The Omni-Market Arbitrage Hub
                </p>

                {/* Catchy Hero Header */}
                <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-[1.1] mb-6 text-white">
                    All platforms.<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-100 via-neutral-300 to-neutral-500">
                        One feed.
                    </span>
                </h1>

                {/* Pain Point Paragraph */}
                <p className="max-w-2xl mb-10 text-base leading-relaxed sm:text-lg text-neutral-400">
                    Zero-latency extraction across Vinted, Leboncoin, Depop, and Wallapop. Bypass DataDome and Cloudflare silently on the backend, and centralize all your steals into a single, unified feed.
                </p>

                {/* Subscription Input Form Container */}
                <div className="w-full max-w-md p-2 shadow-2xl bg-neutral-900/60 border border-neutral-800 rounded-2xl backdrop-blur-xl shadow-black/50">
                    {!submitted ? (
                        <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email address"
                                disabled={loading}
                                className="flex-1 px-4 py-3 font-mono text-sm text-white transition-all border bg-neutral-950 border-neutral-800 focus:border-emerald-500/50 rounded-xl placeholder:text-neutral-600 focus:outline-none disabled:opacity-50"
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center justify-center px-6 py-3 text-sm font-semibold text-black transition-all bg-neutral-100 hover:bg-white rounded-xl active:scale-[0.98] min-w-[120px] disabled:opacity-50 cursor-pointer"
                            >
                                {loading ? (
                                    <svg className="w-5 h-5 text-black animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                ) : (
                                    'Join Watchlist'
                                )}
                            </button>
                        </form>
                    ) : (
                        <div className="flex items-center justify-center gap-3 px-3 py-4 font-mono text-sm animate-fade-in text-emerald-400">
                            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>You are on the list. Access details arriving soon.</span>
                        </div>
                    )}
                </div>

                {/* Value Props Bullet Points */}
                <div className="w-full max-w-2xl pt-8 mt-16 text-left border-t grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8 border-neutral-900">
                    <div>
                        <h3 className="mb-2 font-mono text-xs font-bold tracking-wider uppercase text-emerald-400">🌐 Unified Hub</h3>
                        <p className="text-sm text-neutral-500">Stop managing 4 different tabs. Vinted, Leboncoin, and Depop data piped directly into one clean client-side UI.</p>
                    </div>
                    <div>
                        <h3 className="mb-2 font-mono text-xs font-bold tracking-wider uppercase text-emerald-400">🛡️ Multi-WAF Evasion</h3>
                        <p className="text-sm text-neutral-500">Dynamic TLS fingerprinting and proxy rotation designed specifically to shatter DataDome and Cloudflare barriers.</p>
                    </div>
                    <div>
                        <h3 className="mb-2 font-mono text-xs font-bold tracking-wider uppercase text-emerald-400">⚡ Global Webhooks</h3>
                        <p className="text-sm text-neutral-500">Millisecond push notifications routed straight to your custom Discord servers or mobile devices.</p>
                    </div>
                    <div>
                        <h3 className="mb-2 font-mono text-xs font-bold tracking-wider uppercase text-emerald-400">📈 Cross-Market Arbitrage</h3>
                        <p className="text-sm text-neutral-500">Identify the heavy undercuts on Wallapop and instantly verify the flip margins on other platforms.</p>
                    </div>
                </div>

            </main>

            {/* Footer */}
            <footer className="relative z-10 flex items-center justify-between w-full max-w-5xl px-6 py-6 mx-auto font-mono border-t text-[11px] border-neutral-900 text-neutral-600">
                <p>&copy; {new Date().getFullYear()} gratte.sh. All rights reserved.</p>
                <p className="cursor-pointer hover:text-neutral-400 transition-colors">Built for high-margin extraction.</p>
            </footer>
        </div>
    );
}