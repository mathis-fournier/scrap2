import React from 'react';
import { Link } from 'react-router-dom';
import { ACCENT } from './landingConstants';

const HeroSection = () => (
    <section className="mx-auto max-w-6xl px-5 pb-16 pt-20 sm:pt-28">
        <div className="grid items-center gap-16 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="text-center sm:text-left">
                <div
                    className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
                    style={{ color: ACCENT }}
                >
                    <span
                        className="inline-block h-1.5 w-1.5 rounded-full"
                        style={{ background: ACCENT }}
                    />
                    #1 Resell App
                </div>

                <h1 className="mx-auto max-w-4xl text-5xl font-bold leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl">
                    Buy. Sell. <span style={{ color: ACCENT }}>Profit.</span>
                </h1>

                <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-white/50 sm:mx-0">
                    Search across listings, filter by price and condition, and get instant alerts when the exact item you want becomes available.
                </p>

                <div className="mt-10 flex justify-center sm:justify-start">
                    <Link
                        to="/login"
                        className="rounded-full px-8 py-3.5 text-base font-bold text-black shadow-lg transition hover:opacity-90"
                        style={{ background: ACCENT }}
                    >
                        Start for free
                    </Link>
                </div>

                <p className="mt-10 text-sm text-white/40">
                    Trusted by{' '}
                    <span className="font-semibold text-white/70">12,000+</span> active trackers ·{' '}
                    <span className="font-semibold text-white/70">2M+</span> purchases made
                </p>
            </div>

            <div className="flex justify-center">
                <div className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#161616] p-6 shadow-2xl shadow-black/20">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(205,253,83,.15),transparent_25%)]" />
                    <div className="relative">
                        <div className="mb-6 overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-white/5 via-white/10 to-white/5 p-6">
                            <div className="h-56 rounded-3xl bg-[#0c0c0c] shadow-inner" />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="rounded-3xl bg-white/5 p-5">
                                <p className="text-sm font-semibold text-white">Live tracker</p>
                                <p className="mt-2 text-xs text-white/40">Instant alerts as items appear.</p>
                            </div>
                            <div className="rounded-3xl bg-white/5 p-5">
                                <p className="text-sm font-semibold text-white">Smart filters</p>
                                <p className="mt-2 text-xs text-white/40">Search by price, brand, and condition.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

export default HeroSection;
