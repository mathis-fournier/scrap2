import { ExternalLink, Lock, Zap } from 'lucide-react';
import { toast } from 'sonner';
import useStore from '../store/useStore';
import { API_URL, getAuthHeaders } from '../services/api';

export function ItemCard({ item }) {
    // Pull the tier directly from global state
    const userTier = useStore((state) => state.userTier);

    // We assume you store your auth token/user ID in local storage
    const userId = localStorage.getItem('userId'); // Adjust this based on your auth setup

    const handleLinkClick = async (e) => {
        e.preventDefault(); // Stop the default <a> tag behavior

        // Premium users go straight through, no database check needed
        if (userTier === 'premium') {
            window.open(item.url, '_blank', 'noopener,noreferrer');
            return;
        }

        // Show a micro-loading state to build anticipation
        const toastId = toast.loading('Securing link...', { duration: 1000 });

        try {
            const res = await fetch(`${API_URL}/api/users/track-click`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ userId, tier: userTier })
            });

            const data = await res.json();

            if (data.allowed) {
                // Let them through and show remaining clicks to build anxiety
                toast.success(
                    data.remaining > 0
                        ? `${data.remaining} free views remaining today.`
                        : 'Last free view used. Make it count!',
                    { id: toastId }
                );
                window.open(item.url, '_blank', 'noopener,noreferrer');
            } else {
                // THE TRAP TRIGGERS
                toast.error(
                    <div className="flex flex-col gap-3 py-1">
                        <div className="flex items-center gap-2 text-red-500">
                            <Lock className="w-5 h-5" />
                            <span className="font-bold text-white">Daily Limit Reached!</span>
                        </div>
                        <p className="text-sm text-neutral-300">
                            You've used all 3 free drops today. Other users are buying right now.
                        </p>
                        <button
                            onClick={() => {
                                toast.dismiss(toastId);
                                alert('Redirecting to Stripe Checkout...'); // Replace with actual redirect
                            }}
                            className="flex items-center justify-center gap-2 py-2 mt-1 text-sm font-bold text-white transition-all bg-red-600 rounded-lg hover:bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                        >
                            <Zap className="w-4 h-4 fill-white" />
                            Upgrade to Premium Now
                        </button>
                    </div>,
                    { id: toastId, duration: 8000, className: 'border-red-500/50 bg-neutral-900' }
                );
            }
        } catch (err) {
            toast.error("Network error validating access.", { id: toastId });
        }
    };

    return (
        <div className="flex flex-col overflow-hidden transition-all border rounded-2xl border-neutral-800 bg-neutral-900/50 hover:border-neutral-700">
            <div className="relative h-48 overflow-hidden bg-neutral-800">
                <img
                    // FIX: Accept both camelCase (live socket) and snake_case (database refresh)
                    src={item.imageUrl || item.image_url || 'https://via.placeholder.com/300?text=No+Image'}
                    alt={item.title}
                    className="object-cover w-full h-full transition-transform duration-500 hover:scale-105"
                    loading="lazy"
                />
                <div className="absolute top-3 right-3 flex items-center gap-1 rounded-lg bg-black/70 px-2.5 py-1 backdrop-blur-md">
                    <span className="font-bold text-green-400">{item.price}€</span>
                </div>
            </div>

            <div className="flex flex-col flex-1 p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-medium leading-tight text-white line-clamp-2">{item.title}</h3>
                </div>

                <div className="flex items-center gap-2 mb-4 text-xs text-neutral-400">
                    <span className="px-2 py-1 rounded-md bg-neutral-800">{item.brand}</span>
                    <span className="px-2 py-1 rounded-md bg-neutral-800">Size {item.size}</span>
                </div>

                <div className="mt-auto">
                    {/* Intercept the click here using a button instead of an 'a' tag */}
                    <button
                        onClick={handleLinkClick}
                        className="flex items-center justify-center w-full gap-2 py-2.5 text-sm font-medium text-black transition-colors bg-white rounded-xl hover:bg-neutral-200"
                    >
                        <ExternalLink className="w-4 h-4" /> View on {item.platform}
                    </button>
                </div>
            </div>
        </div>
    );
}