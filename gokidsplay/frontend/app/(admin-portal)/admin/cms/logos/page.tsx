import { getLogos } from '@/app/actions/logos';
import LogoEditor from './components/LogoEditor';
import { CMSBackLink } from '@/components/admin/cms/CMSBackLink';

export default async function LogosPage() {
    const logos = await getLogos();

    return (
        <div className="min-h-screen bg-slate-50/50 p-6">
            <div className="max-w-6xl mx-auto">
                <CMSBackLink />

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">
                        Logo Management
                    </h1>
                    <p className="text-slate-500">
                        Upload and manage your site logos. Only one logo can be active at a time.
                    </p>
                </div>

                <LogoEditor logos={logos} />
            </div>
        </div>
    );
}
