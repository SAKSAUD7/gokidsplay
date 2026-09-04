"use client";

import React from 'react';
import Link from 'next/link';
import { Edit, Plus, Trash2, Eye } from 'lucide-react';
import { CMSBackLink } from './CMSBackLink';
import { PermissionGate } from '../../PermissionGate';
import { ModelSchema } from '@/lib/cms/types';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getMediaUrl } from '@/lib/media-utils';

interface CollectionListProps {
    title?: string;
    description?: string;
    items: any[];
    schema: ModelSchema;
    basePath: string;
    onDelete?: (id: string) => Promise<{ success: boolean }>;
    titleField?: string;
    subtitleField?: string;
    imageField?: string;
    showBackButton?: boolean;
    viewOnly?: boolean;
}

export function CollectionList({ title, description, items, schema, basePath, onDelete, titleField, subtitleField, imageField, showBackButton = true, viewOnly = false }: CollectionListProps) {
    const router = useRouter();

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this item?')) return;

        if (onDelete) {
            const result = await onDelete(id);
            if (result.success) {
                toast.success('Item deleted');
                router.refresh();
            } else {
                toast.error('Failed to delete item');
            }
        }
    };

    // Determine which fields to show in the table (first 5 fields usually, include textareas but truncate)
    const displayFields = schema.fields.filter((f: any) => f.type !== 'json_list' && f.type !== 'rich_text').slice(0, 5);

    return (
        <div className="space-y-6">
            {showBackButton && <CMSBackLink />}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
                    <p className="text-slate-500">{description}</p>
                </div>
                {!viewOnly && (
                    <PermissionGate entity="cms" action="write">
                        <Link
                            href={`${basePath}/new`}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                        >
                            <Plus className="w-4 h-4" />
                            New {schema.name}
                        </Link>
                    </PermissionGate>
                )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            {displayFields.map((field: any) => (
                                <th key={field.name} className="px-6 py-3 font-medium text-slate-500">
                                    {field.label}
                                </th>
                            ))}
                            <th className="px-6 py-3 font-medium text-slate-500 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={displayFields.length + 1} className="px-6 py-8 text-center text-slate-500">
                                    No items found. Create one to get started.
                                </td>
                            </tr>
                        ) : (
                            items.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                    {displayFields.map((field: any) => (
                                        <td key={field.name} className="px-6 py-4 text-slate-600">
                                            {field.type === 'image' ? (
                                                <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden">
                                                    <img src={getMediaUrl(item[field.name])} alt="" className="w-full h-full object-cover" />
                                                </div>
                                            ) : field.type === 'boolean' ? (
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${item[field.name] ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                                                    }`}>
                                                    {item[field.name] ? "Active" : "Inactive"}
                                                </span>
                                            ) : (
                                                <span className="truncate max-w-xs block" title={String(item[field.name])}>
                                                    {field.type === 'textarea' && item[field.name]?.length > 50
                                                        ? item[field.name].substring(0, 50) + '...'
                                                        : item[field.name]}
                                                </span>
                                            )}
                                        </td>
                                    ))}
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <PermissionGate entity="cms" action="write">
                                                <Link
                                                    href={`${basePath}/${item.id}`}
                                                    className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                                                    title={viewOnly ? "View Details" : "Edit"}
                                                >
                                                    {viewOnly ? <Eye className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                                                </Link>
                                            </PermissionGate>

                                            {onDelete && (
                                                <PermissionGate entity="cms" action="delete">
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </PermissionGate>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
