import React from 'react';
import { ACCENT } from './landingConstants';

const items = [
    { name: 'Retro camera — Olympus OM-1', badge: 'Just listed', price: '$89', time: '2 min ago', hot: true },
    { name: 'Vintage leather jacket — M', badge: 'Excellent', price: '$134', time: '8 min ago', hot: false },
    { name: 'Nike Air Max 90 — Size 42', badge: 'Good', price: '$72', time: '14 min ago', hot: false },
];

const HeroCard = () => (
    <section className="mx-auto max-w-3xl px-5 pb-24">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#161616]">
            <div className="flex items-center gap-2 border-b border-white/10 px-6 py-4">
                <div className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <div className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <div className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="ml-3 text-xs font-medium text-white/30">Live feed — updated now</span>
                <span
                    className="ml-auto flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold text-black"
                    style={{ background: ACCENT }}
                >
                    <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-black" />
                    LIVE
                </span>
            </div>

            <div className="divide-y divide-white/5">
                {items.map((item) => (
                    <div key={item.name} className="flex items-center gap-4 px-6 py-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg">
                            📸
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-white">{item.name}</p>
                            <p className="text-xs text-white/40">{item.time}</p>
                        </div>
                        <span
                            className={`hidden rounded-full px-2.5 py-0.5 text-xs font-semibold sm:inline ${item.hot
                                ? 'text-black'
                                : 'border border-white/10 bg-white/5 text-white/50'
                                }`}
                            style={item.hot ? { background: ACCENT } : {}}
                        >
                            {item.badge}
                        </span>
                        <p className="text-sm font-bold text-white">{item.price}</p>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

export default HeroCard;
