import { paragraphs } from "@/lib/cms/page-registry";

/**
 * Shared layout for the legal / policy pages. The body is plain text from the CMS:
 * blank lines separate blocks, a block starting with "## " is a heading, single
 * line breaks inside a block are kept (useful for addresses).
 */
export function LegalPage({ content }: { content: Record<string, Record<string, string> | null> }) {
    const page = content.page;
    if (!page) return <main className="min-h-screen bg-background" />;

    return (
        <main className="min-h-screen bg-background text-white pt-32 pb-20 px-4">
            <div className="max-w-4xl mx-auto prose prose-invert prose-p:text-white/70 prose-headings:text-white">
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-8">
                    {page.title}
                </h1>
                {page.updated && <p>{page.updated}</p>}

                {paragraphs(page.body).map((block, i) =>
                    block.startsWith("## ") ? (
                        <h2 key={i}>{block.slice(3).trim()}</h2>
                    ) : (
                        <p key={i} className="whitespace-pre-line">{block}</p>
                    )
                )}
            </div>
        </main>
    );
}
