import type { Metadata } from "next";
import { getMetadata } from "@/seo/seo.config";

export const metadata: Metadata = getMetadata(
    "Disclaimer | Go Kids Play",
    "Legal disclaimer for Go Kids Play Coventry."
);

export default function DisclaimerPage() {
    return (
        <main className="min-h-screen bg-background text-white pt-32 pb-20 px-4">
            <div className="max-w-4xl mx-auto prose prose-invert prose-p:text-white/70 prose-headings:text-white">
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-8">
                    Disclaimer
                </h1>
                
                <p>The information contained on the Go Kids Play website is for general information purposes only.</p>

                <h2>1. General Disclaimer</h2>
                <p>Go Kids Play assumes no responsibility for errors or omissions in the contents on the Service. In no event shall Go Kids Play be liable for any special, direct, indirect, consequential, or incidental damages or any damages whatsoever, whether in an action of contract, negligence or other tort, arising out of or in connection with the use of the Service or the contents of the Service.</p>

                <h2>2. External Links Disclaimer</h2>
                <p>The website may contain links to external websites that are not provided or maintained by or in any way affiliated with Go Kids Play. Please note that Go Kids Play does not guarantee the accuracy, relevance, timeliness, or completeness of any information on these external websites.</p>

                <h2>3. Activity Disclaimer</h2>
                <p>Participation in physical activities at Go Kids Play (including but not limited to Soft Play, Go Karts, Laser Arena, and Inflatable Park) involves inherent risks. Participants and guardians assume full responsibility for any risks of injury or damage.</p>
            </div>
        </main>
    );
}
