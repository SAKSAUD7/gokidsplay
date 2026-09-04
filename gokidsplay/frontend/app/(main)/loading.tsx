// Loading skeleton for public pages while data fetches from Django
export default function Loading() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center pt-16">
            <div className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-white/10" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
                </div>
                <div className="text-white/40 text-sm font-medium tracking-wider uppercase">
                    Loading...
                </div>
            </div>
        </div>
    );
}
