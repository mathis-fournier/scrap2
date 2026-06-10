import React from 'react';
import { Link } from 'react-router-dom';
import { ACCENT } from './landingConstants';

const CTASection = () => (
    <section className="mx-auto max-w-6xl px-5 py-24 text-center">
        <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Start making profit now.
        </h2>
        <p className="mx-auto mt-5 max-w-md text-lg text-white/40">
            Free to start. Set your first alert in under a minute.
        </p>
        <Link
            to="/login"
            className="mt-10 inline-flex rounded-full px-10 py-4 text-base font-bold text-black transition hover:opacity-90"
            style={{ background: ACCENT }}
        >
            Start for free →
        </Link>
    </section>
);

export default CTASection;
