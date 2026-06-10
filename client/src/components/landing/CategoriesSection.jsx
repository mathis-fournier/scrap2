import React from 'react';
import { Link } from 'react-router-dom';
import { ACCENT } from './landingConstants';

const categories = [
    { emoji: '📷', title: 'Electronics', description: 'Phones, cameras, and accessories.' },
    { emoji: '👗', title: 'Fashion', description: 'Clothes, shoes, and vintage pieces.' },
    { emoji: '🛋️', title: 'Home & Living', description: 'Furniture, decor, and kitchen gear.' },
    { emoji: '🏆', title: 'Collectibles', description: 'Rare finds, art, and memorabilia.' },
];

const CategoriesSection = () => (
    <section className="border-t border-white/10 bg-[#0f0f0f]">
        <div className="mx-auto max-w-6xl px-5 py-24">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>
                        Browse
                    </p>
                    <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        Every category, one search.
                    </h2>
                </div>
                <Link
                    to="/login"
                    className="self-start rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white/70 transition hover:border-white/40 hover:text-white sm:self-auto"
                >
                    Explore all →
                </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {categories.map((category) => (
                    <div
                        key={category.title}
                        className="group cursor-pointer rounded-2xl border border-white/10 bg-[#161616] p-6 transition hover:border-white/25"
                    >
                        <span className="text-3xl">{category.emoji}</span>
                        <p className="mt-4 text-base font-bold text-white">{category.title}</p>
                        <p className="mt-1 text-sm text-white/40">{category.description}</p>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

export default CategoriesSection;
