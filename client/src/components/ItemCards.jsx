import { ExternalLink, Lock, Zap } from 'lucide-react';
import { toast } from 'sonner';
import useStore from '../store/useStore';
import { API_URL, getAuthHeaders } from '../services/api';

// Helper to format time relative to now
function formatTimeAgo(item) {
    // Check if item already has pre-formatted time from API
    if (item.time) return item.time;

    // Try multiple timestamp field names
    const timestamp = item.createdAt || item.created_at || item.timestamp || item.created_at_iso;

    if (!timestamp) return 'just now';

    try {
        const now = new Date();
        const itemTime = new Date(timestamp);

        // Invalid date check
        if (isNaN(itemTime.getTime())) return 'just now';

        const diffMs = now - itemTime;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        if (diffSec < 60) return 'just now';
        if (diffMin === 1) return '1 minute ago';
        if (diffMin < 60) return `${diffMin} minutes ago`;
        if (diffHour === 1) return '1 hour ago';
        if (diffHour < 24) return `${diffHour} hours ago`;
        if (diffDay === 1) return '1 day ago';
        if (diffDay < 7) return `${diffDay} days ago`;

        return itemTime.toLocaleDateString();
    } catch (e) {
        return 'just now';
    }
}

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
        <div className="relative flex flex-col overflow-hidden transition-all border rounded-2xl border-neutral-800 hover:border-neutral-700 group h-80">
            {/* Background Image */}
            <img
                src={item.imageUrl || item.image_url || 'https://via.placeholder.com/300?text=No+Image'}
                alt={item.title}
                className="absolute inset-0 object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

            {/* Content Container */}
            <div className="absolute inset-0 flex flex-col justify-between p-4">
                {/* Top Section: Time */}
                <div className="flex items-start">
                    <span className="text-xs font-medium text-neutral-300 bg-black/50 backdrop-blur px-2.5 py-1 rounded-lg">
                        {formatTimeAgo(item)}
                    </span>
                </div>

                {/* Bottom Section: Tags and Button */}
                <div className="flex flex-col gap-3">
                    {/* Price */}
                    <span className="text-lg font-bold text-white-400 73B017 text-shadow-lg/40 ">
                        {item.price}€
                    </span>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                        {item.brand && (
                            <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white/10 backdrop-blur border border-white/20 text-white">
                                {item.brand}
                            </span>
                        )}
                        {item.size && (
                            <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white/10 backdrop-blur border border-white/20 text-white">
                                Size {item.size}
                            </span>
                        )}
                    </div>

                    {/* Button */}
                    <button
                        onClick={handleLinkClick}
                        className="flex items-center justify-center w-full gap-2 py-2.5 text-sm font-medium text-black transition-all bg-white rounded-xl hover:bg-neutral-100"
                    >
                        <ExternalLink className="w-4 h-4" /> View on {item.platform}
                    </button>
                </div>
            </div>
        </div>
    );
}