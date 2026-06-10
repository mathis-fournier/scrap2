import React from 'react';
import { ACCENT } from './landingConstants';

const features = [
    { icon: '⚡', title: 'Instant alerts', detail: 'Notified the second a matching listing appears.' },
    { icon: '🔍', title: 'Smart filters', detail: 'Refine by price, condition, location, and more.' },
    { icon: '✅', title: 'Verified sources', detail: 'Only trusted marketplaces and live feeds.' },
    { icon: '📱', title: 'Mobile-friendly', detail: 'Stay updated from anywhere, any device.' },
];

const FeaturesSection = () => (
    <section className="mx-auto max-w-6xl px-5 py-24">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>
            Why choose FinderPro
        </p>
        <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Real-time sourcing with the smartest filters.
        </h2>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
                <div
                    key={feature.title}
                    className="rounded-2xl border border-white/10 bg-[#161616] p-6 transition hover:border-white/20"
                >
                    <div
                        className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl text-lg"
                        style={{ background: `${ACCENT}20` }}
                    >
                        {feature.icon}
                    </div>
                    <p className="text-base font-bold text-white">{feature.title}</p>
                    <p className="mt-2 text-sm leading-relaxed text-white/40">{feature.detail}</p>
                </div>
            ))}
        </div>
    </section>
);

export default FeaturesSection;
