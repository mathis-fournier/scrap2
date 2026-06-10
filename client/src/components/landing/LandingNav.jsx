import React from 'react';
import { Link } from 'react-router-dom';
import { ACCENT } from './landingConstants';

const LandingNav = () => (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0c0c0c]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
            <div className="flex items-center gap-2">
                <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-black"
                    style={{ background: ACCENT }}
                >
                    F
                </div>
                <span className="text-base font-semibold tracking-tight text-white">FinderPro</span>
            </div>
            <div className="flex items-center gap-3">
                <Link to="/login" className="hidden text-sm font-medium text-white/60 hover:text-white sm:block">
                    Log in
                </Link>
                <Link
                    to="/login"
                    className="rounded-full px-5 py-2 text-sm font-semibold text-black transition hover:opacity-90"
                    style={{ background: ACCENT }}
                >
                    Start for free
                </Link>
            </div>
        </div>
    </header>
);

export default LandingNav;
