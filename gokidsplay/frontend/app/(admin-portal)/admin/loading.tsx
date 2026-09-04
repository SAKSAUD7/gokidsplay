// Admin portal global loading state
// Shows a branded spinner while admin pages are loading

export default function AdminLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 animate-spin" />
                </div>
                <p className="text-slate-500 text-sm font-medium">Loading...</p>
            </div>
        </div>
    );
}
