import React from 'react';
import { ACCENT } from './landingConstants';

const stats = [
    { value: '12k+', label: 'Items tracked' },
    { value: '240+', label: 'Active alerts' },
    { value: '32%', label: 'Average savings' },
];

const StatsSection = () => (
    <section className="border-y border-white/10">
        <div className="mx-auto grid max-w-6xl grid-cols-3 divide-x divide-white/10 px-5">
            {stats.map((stat) => (
                <div key={stat.label} className="px-6 py-10 text-center">
                    <p className="text-4xl font-bold tracking-tight" style={{ color: ACCENT }}>
                        {stat.value}
                    </p>
                    <p className="mt-2 text-sm text-white/40">{stat.label}</p>
                </div>
            ))}
        </div>
    </section>
);

export default StatsSection;
