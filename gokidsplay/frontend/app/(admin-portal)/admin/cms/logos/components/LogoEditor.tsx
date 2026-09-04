'use client';

import { useState } from 'react';
import { Logo, createLogo, setActiveLogo, deleteLogo } from '@/app/actions/logos';
import { Upload, Check, Trash2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface LogoEditorProps {
    logos: Logo[];
}

export default function LogoEditor({ logos: initialLogos }: LogoEditorProps) {
    const [logos, setLogos] = useState<Logo[]>(initialLogos);
    const [isUploading, setIsUploading] = useState(false);
    const [logoName, setLogoName] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedFile || !logoName.trim()) {
            toast.error('Please provide a logo name and select an image');
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('name', logoName);
        formData.append('image', selectedFile);
        // Don't set as active by default - user must click "Set Active" button
        formData.append('is_active', 'false');

        const result = await createLogo(formData);

        if (result.success) {
            toast.success('Logo uploaded successfully');
            setLogoName('');
            setSelectedFile(null);
            setPreviewUrl(null);
            // Refresh the page to get updated logos
            window.location.reload();
        } else {
            toast.error(result.error || 'Failed to upload logo');
        }

        setIsUploading(false);
    };

    const handleSetActive = async (id: number) => {
        const result = await setActiveLogo(id);

        if (result.success) {
            toast.success('Logo set as active');
            // Update local state
            setLogos(logos.map(logo => ({
                ...logo,
                is_active: logo.id === id
            })));
        } else {
            toast.error(result.error || 'Failed to set active logo');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this logo?')) {
            return;
        }

        const result = await deleteLogo(id);

        if (result.success) {
            toast.success('Logo deleted successfully');
            setLogos(logos.filter(logo => logo.id !== id));
        } else {
            toast.error(result.error || 'Failed to delete logo');
        }
    };

    return (
        <div className="space-y-8">
            {/* Upload Form */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Upload className="w-5 h-5 text-blue-600" />
                    Upload New Logo
                </h2>

                <form onSubmit={handleUpload} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Logo Name *
                        </label>
                        <input
                            type="text"
                            value={logoName}
                            onChange={(e) => setLogoName(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors text-slate-900 placeholder:text-slate-400"
                            placeholder="e.g., Main Logo, Dark Logo, etc."
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Logo Image *
                        </label>
                        <div className="flex items-center gap-4">
                            <label className="flex-1 cursor-pointer">
                                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 hover:border-blue-500 hover:bg-slate-50 transition-colors text-center group">
                                    {previewUrl ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <Image
                                                src={previewUrl}
                                                alt="Preview"
                                                width={200}
                                                height={100}
                                                className="max-h-24 w-auto object-contain"
                                            />
                                            <p className="text-sm text-slate-500">{selectedFile?.name}</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <ImageIcon className="w-12 h-12 text-slate-300 group-hover:text-blue-400 transition-colors" />
                                            <p className="text-slate-600 font-medium">Click to select image</p>
                                            <p className="text-xs text-slate-400">PNG, JPG, SVG (Max 5MB)</p>
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    required
                                />
                            </label>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isUploading}
                        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                    >
                        {isUploading ? 'Uploading...' : 'Upload Logo'}
                    </button>
                </form>
            </div>

            {/* Logos Grid */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold text-slate-900 mb-4">
                    All Logos ({logos.length})
                </h2>

                {logos.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p>No logos uploaded yet</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {logos.map((logo) => (
                            <div
                                key={logo.id}
                                className={`relative p-4 rounded-xl border-2 transition-all bg-white ${logo.is_active
                                    ? 'border-blue-500 shadow-md ring-1 ring-blue-100'
                                    : 'border-slate-200 hover:border-blue-300 hover:shadow-sm'
                                    }`}
                            >
                                {logo.is_active && (
                                    <div className="absolute top-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                                        <Check className="w-3 h-3" />
                                        Active
                                    </div>
                                )}

                                <div className="mb-3 flex items-center justify-center h-32 bg-slate-50 rounded-lg border border-slate-100">
                                    <Image
                                        src={logo.image_url}
                                        alt={logo.name}
                                        width={200}
                                        height={100}
                                        className="max-h-28 w-auto object-contain"
                                    />
                                </div>

                                <h3 className="text-slate-900 font-bold mb-1">{logo.name}</h3>
                                <p className="text-xs text-slate-500 mb-4">
                                    Uploaded {new Date(logo.created_at).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                                </p>

                                <div className="flex gap-2">
                                    {!logo.is_active && (
                                        <button
                                            onClick={() => handleSetActive(logo.id)}
                                            className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-all text-sm border border-slate-200"
                                        >
                                            Set Active
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(logo.id)}
                                        className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all border border-red-100 hover:border-red-200"
                                        title="Delete logo"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
