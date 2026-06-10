import React from 'react';
import { Link } from 'react-router-dom';
import { ACCENT } from './landingConstants';

const LandingFooter = () => (
    <footer className="border-t border-white/10 bg-[#0c0c0c] py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
                <div
                    className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold text-black"
                    style={{ background: ACCENT }}
                >
                    F
                </div>
                <span className="text-sm font-semibold text-white/70">FinderPro</span>
            </div>
            <div className="flex flex-wrap items-center gap-5 text-sm text-white/30">
                <Link to="/login" className="transition hover:text-white">Login</Link>
                <Link to="/login" className="transition hover:text-white">Get Started</Link>
                <span>© {new Date().getFullYear()} FinderPro</span>
            </div>
        </div>
    </footer>
);

export default LandingFooter;
