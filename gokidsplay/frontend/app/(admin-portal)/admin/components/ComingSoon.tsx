import { Construction } from "lucide-react";

export default function ComingSoonPage({ title }: { title: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <Construction className="w-10 h-10 text-slate-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">{title}</h1>
            <p className="text-slate-500 max-w-md">
                This feature is currently under development. Check back soon for updates!
            </p>
        </div>
    );
}
