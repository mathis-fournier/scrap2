import React from 'react';
import { Link } from 'react-router-dom';
const LandingPage = () => {
    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Navigation */}
            <header className="border-b border-slate-200 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <span className="font-bold text-xl tracking-tight">FinderPro</span>
                    </div>
                    <div className="flex gap-4">
                        <Link to="/login" className="text-slate-600 hover:text-slate-900 font-medium px-3 py-2 transition-colors">
                            Log in
                        </Link>
                        <Link to="/login" className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-4 py-2 rounded-md transition-colors">
                            Get Started
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <main>
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
                    <div className="max-w-3xl">
                        <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
                            Never miss a second-hand deal again.
                        </h1>
                        <p className="text-xl text-slate-600 mb-10 max-w-2xl leading-relaxed">
                            Automate your search. Get real-time, low-latency notifications the second an item that matches your criteria drops. Stop refreshing and start securing the best finds.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link to="/login" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-md text-lg transition-colors flex items-center justify-center gap-2">
                                Start Tracking for Free
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </Link>
                            <button className="bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold px-6 py-3 rounded-md text-lg transition-colors flex items-center justify-center">
                                View Documentation
                            </button>
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="border-t border-slate-200 bg-white py-24">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="mb-16">
                            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                                Built for speed and precision.
                            </h2>
                            <p className="mt-4 text-lg text-slate-600">
                                Everything you need to scale your second-hand sourcing.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-12">
                            {/* Feature 1 */}
                            <div>
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-6 border border-blue-100">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">Real-Time WebSockets</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    Our infrastructure hooks directly into drops. As soon as an item is listed, it's pushed to your dashboard with zero delay.
                                </p>
                            </div>

                            {/* Feature 2 */}
                            <div>
                                <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center mb-6 border border-slate-200">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">Advanced Filtering</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    Set specific keywords, price ranges, and condition requirements. Only get notified for items that actually matter to you.
                                </p>
                            </div>

                            {/* Feature 3 */}
                            <div>
                                <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center mb-6 border border-slate-200">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">Secure & Scalable</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    Built on a modern stack with dedicated queues and rate limiting to ensure reliable delivery, even during peak drop hours.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2 text-white">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span className="font-bold tracking-tight">FinderPro</span>
                    </div>
                    <p className="text-sm">
                        © {new Date().getFullYear()} FinderPro. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;