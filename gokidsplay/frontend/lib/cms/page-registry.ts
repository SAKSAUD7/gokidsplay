/**
 * Page content registry — the single source of truth for every editable
 * section on the public website.
 *
 * - The admin "Pages" editor (/admin/cms/pages) renders its forms from this file.
 * - Public pages call `resolveSections()` to read saved CMS values, falling back
 *   to the defaults below (the site's original content) when nothing is saved.
 *
 * Storage: each section is one `PageSection` row keyed by (page, section_key).
 * Fields with a `column` are stored in that model column (kept for compatibility
 * with older editors); every other field is stored in the row's `extra` JSON.
 */

export type FieldType = 'text' | 'textarea' | 'image' | 'video' | 'link' | 'list';

export type SectionColumn =
    | 'title' | 'subtitle' | 'content' | 'image_url' | 'video_url' | 'cta_text' | 'cta_link';

export interface FieldDef {
    name: string;
    label: string;
    type: FieldType;
    column?: SectionColumn;
    help?: string;
    default?: string;
}

export interface SectionDef {
    key: string;
    label: string;
    description?: string;
    fields: FieldDef[];
}

export interface CollectionLink {
    label: string;
    href: string;
    description: string;
}

export interface PageDef {
    key: string;
    label: string;
    path: string;
    description: string;
    sections: SectionDef[];
    collections?: CollectionLink[];
}

// ── Field helpers ────────────────────────────────────────────────────────────

const text = (name: string, label: string, def = '', column?: SectionColumn, help?: string): FieldDef =>
    ({ name, label, type: 'text', default: def, column, help });
const area = (name: string, label: string, def = '', column?: SectionColumn, help?: string): FieldDef =>
    ({ name, label, type: 'textarea', default: def, column, help });
const image = (name: string, label: string, def = '', column?: SectionColumn, help?: string): FieldDef =>
    ({ name, label, type: 'image', default: def, column, help });
const video = (name: string, label: string, def = '', column?: SectionColumn, help?: string): FieldDef =>
    ({ name, label, type: 'video', default: def, column, help });
const link = (name: string, label: string, def = '', column?: SectionColumn, help?: string): FieldDef =>
    ({ name, label, type: 'link', default: def, column, help });
const list = (name: string, label: string, def = '', help = 'One item per line'): FieldDef =>
    ({ name, label, type: 'list', default: def, help });

/** Standard heading block: small badge, heading, intro paragraph. */
const heading = (badge: string, title: string, subtitle: string): FieldDef[] => [
    text('badge', 'Badge / eyebrow text', badge),
    text('title', 'Heading', title, 'title'),
    area('subtitle', 'Intro text', subtitle, 'subtitle'),
];

/** The four attraction detail pages share one layout (components/AttractionDetail.tsx). */
interface AttractionDefaults {
    badge: string; title: string; subtitle: string; aboutTitle: string; about: string;
    features: string; images: string[]; cards: string[][]; button: string; buttonLink: string;
}

function attractionPage(slug: string, label: string, d: AttractionDefaults): PageDef {
    return {
        key: `attraction-${slug}`,
        label: `${label} (attraction page)`,
        path: `/attractions/${slug}`,
        description: `The ${label} detail page: hero, description, photos, info cards and booking button.`,
        sections: [
            {
                key: 'hero',
                label: 'Hero',
                fields: [
                    text('badge', 'Badge text', d.badge),
                    text('title', 'Heading', d.title, 'title'),
                    area('subtitle', 'Subheading', d.subtitle, 'subtitle'),
                    image('image', 'Hero image', d.images[0], 'image_url'),
                ],
            },
            {
                key: 'about',
                label: 'Description & photos',
                fields: [
                    text('title', 'Heading', d.aboutTitle, 'title'),
                    area('content', 'Description (leave a blank line between paragraphs)', d.about, 'content'),
                    list('features', 'Feature list (ticks)', d.features),
                    ...d.images.map((src, i) => image(`photo${i + 1}`, `Photo ${i + 1}`, src)),
                    video('video', 'Video (optional — shown under the photos; MP4 upload or YouTube link)', '', 'video_url'),
                ],
            },
            {
                key: 'info',
                label: 'Info cards',
                description: 'The four small cards (sessions, ages, price, safety).',
                fields: d.cards.flatMap(([cardLabel, value], i) => [
                    text(`card${i + 1}_label`, `Card ${i + 1} label`, cardLabel),
                    text(`card${i + 1}_value`, `Card ${i + 1} value`, value),
                ]),
            },
            {
                key: 'cta',
                label: 'Booking button',
                fields: [
                    text('button_text', 'Button text', d.button, 'cta_text'),
                    link('button_link', 'Button link', d.buttonLink, 'cta_link'),
                    text('call_text', 'Text before the phone number', 'Or call us'),
                    text('phone', 'Phone number', '07349110865'),
                ],
            },
        ],
        collections: [
            { label: 'Attractions', href: '/admin/cms/attractions', description: 'Cards on the main Attractions page' },
        ],
    };
}

/** Legal / policy pages share one layout (components/LegalPage.tsx). */
function legalPage(slug: string, label: string, title: string, updated: string, body: string): PageDef {
    return {
        key: `legal-${slug}`,
        label,
        path: `/${slug}`,
        description: `The ${label} page text.`,
        sections: [
            {
                key: 'page',
                label: 'Page text',
                fields: [
                    text('title', 'Page heading', title, 'title'),
                    text('updated', 'Last updated line (optional)', updated),
                    area('body', 'Body text', body, 'content',
                        'Leave a blank line between paragraphs. Start a line with "## " to make it a heading.'),
                ],
            },
        ],
    };
}

// ── Pages ────────────────────────────────────────────────────────────────────

export const PAGES: PageDef[] = [
    {
        key: 'home',
        label: 'Home',
        path: '/',
        description: 'Hero, about block, gallery heading, events teaser and the final call-to-action.',
        sections: [
            {
                key: 'hero',
                label: 'Hero banner',
                description: 'The full-screen banner at the top of the homepage.',
                fields: [
                    text('badge', 'Badge text', 'Soft Play · Laser Arena · Go Karts · Inflatable Park'),
                    text('title', 'Main heading', 'The Ultimate Kids Play Experience in Coventry', 'title'),
                    area('subtitle', 'Subheading', 'Soft Play · Laser Arena · Go Karts · Inflatable Park · Birthday Parties — all under one roof!', 'content'),
                    image('image', 'Background image', '/images/gokidsplay/unnamed.webp', 'image_url'),
                    video('video', 'Background video (optional — plays instead of the image)', '', 'video_url'),
                    text('location_text', 'Location button text', '📍 Go Kids Play · Coventry'),
                    link('location_link', 'Location button link', 'https://www.google.com/maps/search/Go+Kids+Play+Coventry'),
                    text('button1_text', 'Button 1 text', 'Book Tickets Now', 'cta_text'),
                    link('button1_link', 'Button 1 link', '/book', 'cta_link'),
                    text('button2_text', 'Button 2 text', '🎂 Plan a Party'),
                    link('button2_link', 'Button 2 link', '/party-booking'),
                    text('button3_text', 'Button 3 text', 'View Attractions'),
                    link('button3_link', 'Button 3 link', '/attractions'),
                ],
            },
            {
                key: 'about',
                label: 'About block',
                description: 'Text and photo below the opening-hours bar.',
                fields: [
                    text('badge', 'Badge text', 'About Us'),
                    text('title', 'Heading', "Coventry's Ultimate Kids Play Centre", 'title'),
                    area('content', 'First paragraph', 'Go Kids Play Coventry is the ultimate family entertainment venue – packed with Soft Play, Laser Arena, Go Karts and an Inflatable Park. The perfect adventure for kids of all ages.', 'content'),
                    area('content2', 'Second paragraph', 'Located in Coventry, Go Kids Play is the perfect destination for birthday parties, family days out, and school holiday fun. Our activities are designed to challenge, excite, and entertain kids of all ages.'),
                    image('image', 'Photo', '/images/gokidsplay/unnamed (4).webp', 'image_url'),
                    text('button_text', 'Button text', 'Read Our Story', 'cta_text'),
                    link('button_link', 'Button link', '/about', 'cta_link'),
                ],
            },
            {
                key: 'attractions',
                label: 'Attractions strip',
                description: 'The scrolling attraction names come from Attractions; this sets the button below.',
                fields: [
                    text('button_text', 'Button text', 'View All Attractions', 'cta_text'),
                    link('button_link', 'Button link', '/attractions', 'cta_link'),
                ],
            },
            {
                key: 'gallery',
                label: 'Photo gallery heading',
                description: 'Photos themselves are managed in Gallery.',
                fields: [
                    text('title', 'Heading', 'See The Action', 'title'),
                    area('subtitle', 'Intro text', 'Real moments, real fun! Check out what awaits you at Go Kids Play.', 'subtitle'),
                ],
            },
            {
                key: 'events',
                label: 'Special events teaser',
                fields: [
                    text('badge', 'Badge text', 'Special Events'),
                    text('title', 'Heading', 'Unforgettable Events', 'title'),
                    area('subtitle', 'Intro text', 'From Halloween frenzies to Christmas magic — book your spot at our exclusive seasonal events and themed parties.', 'subtitle'),
                    list('cards', 'Event cards (emoji + name per line)', '🎃 Halloween Party\n🎄 Christmas Party\n🐣 Easter Fun\n🎂 Birthday Special', 'One card per line: an emoji, a space, then the name'),
                    text('button_text', 'Button text', 'Browse All Events', 'cta_text'),
                    link('button_link', 'Button link', '/events', 'cta_link'),
                ],
            },
            {
                key: 'cta',
                label: 'Final call-to-action',
                description: 'The "Ready to GO KIDS PLAY!" block at the bottom of the page.',
                fields: [
                    text('title', 'Heading (first line)', 'Ready to', 'title'),
                    text('title_highlight', 'Heading (highlighted line)', 'GO KIDS PLAY!'),
                    area('subtitle', 'Text', 'Soft Play · Laser Arena · Go Karts · Inflatable Park · Birthday Parties — all under one roof in Coventry. Book online in minutes.', 'subtitle'),
                    text('button1_text', 'Button 1 text', 'Book Tickets Now', 'cta_text'),
                    link('button1_link', 'Button 1 link', '/pricing', 'cta_link'),
                    text('button2_text', 'Button 2 text', 'Plan a Party'),
                    link('button2_link', 'Button 2 link', '/parties'),
                    text('phone_label', 'Phone label', 'Questions?'),
                    text('phone', 'Phone number', '07349110865'),
                ],
            },
        ],
        collections: [
            { label: 'Gallery', href: '/admin/cms/gallery', description: 'Photos shown in "See The Action"' },
            { label: 'Stat Cards', href: '/admin/cms/stat-cards', description: 'The four numbers under the hero' },
            { label: 'Instagram Reels', href: '/admin/cms/instagram-reels', description: 'Reels carousel' },
            { label: 'Attractions', href: '/admin/cms/attractions', description: 'Scrolling attraction names' },
            { label: 'Opening Hours', href: '/admin/cms/timing-cards', description: 'Hours bar under the hero' },
        ],
    },
    {
        key: 'about',
        label: 'About Us',
        path: '/about',
        description: 'Hero, our story, journey, values, reviews, FAQ heading and closing call-to-action.',
        sections: [
            {
                key: 'hero',
                label: 'Hero',
                fields: [
                    text('badge', 'Badge text', 'About Us'),
                    text('title', 'Heading', "Coventry's Best Indoor Play Centre", 'title'),
                    area('subtitle', 'Subheading', 'Soft Play, Laser Arena, Go Karts, Inflatable Park — all under one roof. Fun for all ages at Go Kids Play Coventry.', 'content'),
                ],
            },
            {
                key: 'story',
                label: 'Our Story',
                fields: [
                    text('title', 'Heading', 'Our Story', 'title'),
                    area('content', 'Story text (leave a blank line between paragraphs)', [
                        'Go Kids Play was founded with a simple mission: to create a safe, fun, and exciting space where children and families can enjoy incredible activities together in Coventry.',
                        "Based at 310 Kingfield Road, Coventry, we've created the area's premier indoor play and party centre with Soft Play, Laser Arena, Go Karts, and an Inflatable Park — all under one roof.",
                        "Whether you're looking for a fun family day out, a birthday party venue, or a school holiday adventure, Go Kids Play is your destination for unforgettable memories in Coventry.",
                    ].join('\n\n'), 'content'),
                    image('image', 'Photo', '/images/gokidsplay/unnamed (11).webp', 'image_url'),
                ],
            },
            {
                key: 'journey',
                label: 'Our Journey heading',
                description: 'The milestones are managed in Timeline.',
                fields: [text('title', 'Heading', 'Our Journey', 'title')],
            },
            {
                key: 'values',
                label: 'Our Values heading',
                description: 'The value cards are managed in Values.',
                fields: [text('title', 'Heading', 'Our Values', 'title')],
            },
            {
                key: 'reviews',
                label: 'Video reviews',
                description: 'The review videos are managed in Instagram Reels.',
                fields: [
                    text('title', 'Heading', 'People Reviews on Go Kids Play', 'title'),
                    area('subtitle', 'Intro text', 'Check out these amazing reviews from our visitors!', 'subtitle'),
                    text('card_title', 'Card heading', 'Watch Review'),
                    text('card_link_text', 'Card link text', 'View on Instagram'),
                    text('empty_text', 'Text when there are no videos', 'Check out our Instagram for reviews!'),
                ],
            },
            {
                key: 'faq',
                label: 'FAQ heading',
                description: 'The questions are managed in FAQs.',
                fields: [
                    text('title', 'Heading', 'Frequently Asked Questions', 'title'),
                    area('subtitle', 'Intro text', "Got questions? We've got answers!", 'subtitle'),
                ],
            },
            {
                key: 'cta',
                label: 'Closing call-to-action',
                fields: [
                    text('title', 'Heading (first line)', 'Join the', 'title'),
                    text('title_highlight', 'Heading (highlighted line)', 'Adventure!'),
                    area('subtitle', 'Text', 'Come and experience Go Kids Play Coventry — the ultimate indoor play centre for the whole family!', 'subtitle'),
                    text('button1_text', 'Button 1 text', 'Book Tickets', 'cta_text'),
                    link('button1_link', 'Button 1 link', '/book', 'cta_link'),
                    text('button2_text', 'Button 2 text', 'Contact Us'),
                    link('button2_link', 'Button 2 link', '/contact'),
                ],
            },
        ],
        collections: [
            { label: 'Stat Cards', href: '/admin/cms/stat-cards', description: 'Numbers under the hero (page: about)' },
            { label: 'Timeline', href: '/admin/cms/timeline-items', description: 'Our Journey milestones' },
            { label: 'Values', href: '/admin/cms/value-items', description: 'Our Values cards' },
            { label: 'Instagram Reels', href: '/admin/cms/instagram-reels', description: 'Video reviews' },
            { label: 'FAQs', href: '/admin/faqs', description: 'Frequently asked questions' },
        ],
    },
    {
        key: 'attractions',
        label: 'Attractions',
        path: '/attractions',
        description: 'Hero, "everything under one roof" cards, facilities heading and closing call-to-action.',
        sections: [
            {
                key: 'hero',
                label: 'Hero',
                fields: [
                    text('badge', 'Badge text', '', undefined, 'Leave empty to show the number of activities automatically (e.g. "4 Activities")'),
                    text('title', 'Heading', 'Our Activities', 'title'),
                    area('subtitle', 'Subheading', 'Soft Play, Laser Arena, Go Karts, and Inflatable Park — Go Kids Play has something for everyone. Perfect for families, friends, and parties in Coventry.', 'content'),
                    text('button1_text', 'Button 1 text', '🎟️ Book Tickets', 'cta_text'),
                    link('button1_link', 'Button 1 link', '/book', 'cta_link'),
                    text('button2_text', 'Button 2 text', 'View Pricing'),
                    link('button2_link', 'Button 2 link', '/pricing'),
                ],
            },
            {
                key: 'highlights',
                label: '"Everything under one roof" cards',
                fields: [
                    text('title', 'Small heading', 'Everything under one roof', 'title'),
                    list('cards', 'Cards', [
                        '🧨 | Soft Play | Three tier soft play frame with toddler area. Safe and fun for all ages.',
                        '🔫 | Laser Arena | Multi-level laser tag arena. Grab your blaster and enter the battle!',
                        '🏎️ | Go Kart | Indoor go kart racing track. Put your foot down and race to the finish!',
                        '👁️ | Inflatable Park | Massive bouncy castles and inflatable obstacle courses. Jump in!',
                    ].join('\n'), 'One card per line: emoji | title | description'),
                ],
            },
            {
                key: 'facilities',
                label: 'Venue facilities heading',
                description: 'The facility cards are managed in Facilities.',
                fields: [
                    text('title', 'Heading', 'Venue Facilities', 'title'),
                    area('subtitle', 'Intro text', 'More than just activities — our venue is designed for your total comfort and enjoyment.', 'subtitle'),
                ],
            },
            {
                key: 'cta',
                label: 'Closing call-to-action',
                fields: [
                    text('title', 'Heading', 'Ready for a great time?', 'title'),
                    area('subtitle', 'Text', 'Book your session online — Soft Play, Laser Arena, Go Karts, or Inflatables, your choice!', 'subtitle'),
                    text('button_text', 'Button text', '🎟️ Book Tickets — every activity included', 'cta_text'),
                    link('button_link', 'Button link', '/book', 'cta_link'),
                    text('note', 'Opening hours note', 'Open Wed–Sun (10am–5:30pm). Also open Bank & School Holidays.'),
                ],
            },
        ],
        collections: [
            { label: 'Attractions', href: '/admin/cms/attractions', description: 'Activity cards, details and images' },
            { label: 'Attraction Video', href: '/admin/cms/attractions', description: 'Video section (on the Attractions editor)' },
            { label: 'Facilities', href: '/admin/cms/facility-items', description: 'Venue facility cards' },
        ],
    },
    attractionPage("soft-play", "Soft Play", {
        badge: "🧨 Soft Play",
        title: "Soft Play Zone",
        subtitle: "Coventry's most exciting soft play area for kids of all ages",
        aboutTitle: "A World of Play Awaits",
        about: "Go Kids Play's Soft Play area is a safe and exciting zone for toddlers and young children. With tunnels, slides, ball pits, and climbing frames, children can explore, bounce, and play to their hearts' content in a fully supervised environment.\n\nOur dedicated toddler area means even the smallest adventurers can join in safely, while older children conquer the 3-tier soft play frame. Open weekends and school holidays.",
        features: "3-tier soft play frame\nDedicated toddler area\nTunnels, slides & ball pits\nClimbing frames\nFully supervised sessions\nSocks required for hygiene",
        images: ["/images/gokidsplay/unnamed (4).webp", "/images/gokidsplay/unnamed (5).webp", "/images/gokidsplay/unnamed (6).webp", "/images/gokidsplay/unnamed.webp"],
        cards: [["Sessions", "45 mins"], ["Age Range", "All ages"], ["Ticket", "Included with entry"], ["Safety", "Fully supervised"]],
        button: "Book Tickets",
        buttonLink: "/book",
    }),
    attractionPage("laser-arena", "Laser Arena", {
        badge: "🔫 Laser Arena",
        title: "Laser Tag Battle",
        subtitle: "Suit up and dive into Coventry's most thrilling indoor laser arena.",
        aboutTitle: "Adrenaline Pumping Action",
        about: "Step into the darkness of our multi-level Laser Arena. Armed with state-of-the-art phasers, you'll navigate through fog, dodge laser fire, and outsmart your opponents in a highly immersive battle environment.\n\nWhether you're playing solo or teaming up with friends, our real-time scoring system keeps track of every tag. Perfect for older kids, teens, and even adults who want in on the action!",
        features: "Multi-level battle arena\nState-of-the-art vests & phasers\nSolo or team deathmatch\nImmersive fog & lighting\nReal-time scoring\nBriefing room before play",
        images: ["/images/gokidsplay/unnamed (1).webp", "/images/gokidsplay/unnamed (7).webp", "/images/gokidsplay/unnamed (8).webp", "/images/gokidsplay/unnamed (2).webp"],
        cards: [["Sessions", "20 mins"], ["Age Range", "7+ years"], ["Ticket", "Included with entry"], ["Safety", "Briefing required"]],
        button: "Book Tickets",
        buttonLink: "/book",
    }),
    attractionPage("go-karts", "Go Karts", {
        badge: "🏎️ Go Karts",
        title: "Indoor Racing",
        subtitle: "Start your engines! Safe and fun indoor go-karting for kids.",
        aboutTitle: "Race to the Finish Line",
        about: "Let your little ones experience the thrill of the track in our specially designed indoor electric Go Karts. Our track provides a safe environment for young drivers to navigate twists, turns, and straightaways.\n\nSafety is our top priority. All karts have controlled speeds, and our track marshals ensure everyone follows the rules. Helmets are provided, and drivers are briefed before they hit the pedal!",
        features: "Indoor electric racing track\nSafe, controlled speeds\nHelmets & safety gear provided\nTimed lap races\nPerfect for young beginners\nTrack marshals on duty",
        images: ["/images/gokidsplay/unnamed (9).webp", "/images/gokidsplay/unnamed (10).webp", "/images/gokidsplay/unnamed (11).webp", "/images/gokidsplay/unnamed (3).webp"],
        cards: [["Sessions", "Multiple Laps"], ["Age Range", "4-12 years"], ["Ticket", "Included with entry"], ["Safety", "Helmets provided"]],
        button: "Book Tickets",
        buttonLink: "/book",
    }),
    attractionPage("inflatable-park", "Inflatable Park", {
        badge: "🪂 Inflatable Park",
        title: "Giant Bounce Park",
        subtitle: "Defy gravity in our massive indoor inflatable theme park.",
        aboutTitle: "Wall-to-Wall Bouncing Fun",
        about: "Prepare to catch some air! Our Inflatable Park is a huge, continuous bounce arena filled with epic challenges. From scaling the giant slide to tackling the wipeout obstacles, it's the ultimate way to burn off energy.\n\nWe haven't forgotten the little ones — there's a dedicated toddler area so they can bounce safely away from the bigger kids. Please note that special grip socks are required to use the park.",
        features: "Massive continuous bounce zone\nGiant inflatable slides\nWipeout challenges & obstacles\nDedicated toddler bounce area\nGrip socks required\nHigh-energy active fun",
        images: ["/images/gokidsplay/unnamed (12).webp", "/images/gokidsplay/2025-04-15.webp", "/images/gokidsplay/2025-05-01.webp", "/images/gokidsplay/unnamed.webp"],
        cards: [["Sessions", "45 mins"], ["Age Range", "All ages"], ["Ticket", "Included with entry"], ["Safety", "Grip socks req."]],
        button: "Book Tickets",
        buttonLink: "/book",
    }),
    legalPage("privacy", "Privacy Policy", "Privacy Policy", "Last updated: September 2026", "## 1. Introduction\n\nWelcome to Go Kids Play. We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy notice, or our practices with regards to your personal information, please contact us at info@gokidsplay.co.uk.\n\n## 2. Information We Collect\n\nWe collect personal information that you voluntarily provide to us when you register on the website, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Website or otherwise when you contact us.\n\n## 3. How We Use Your Information\n\nWe use personal information collected via our Website for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.\n\n## 4. Sharing Your Information\n\nWe only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.\n\n## 5. Contact Us\n\nIf you have questions or comments about this notice, you may email us at info@gokidsplay.co.uk or by post to:\nGo Kids Play\n310 Kingfield Road\nCoventry, CV14LD"),
    legalPage("terms", "Terms & Conditions", "Terms of Service", "Last updated: September 2026", "## 1. Agreement to Terms\n\nThese Terms of Service constitute a legally binding agreement made between you and Go Kids Play concerning your access to and use of the website as well as any other media form, media channel, mobile website or mobile application related, linked, or otherwise connected thereto.\n\n## 2. Bookings and Payments\n\nAll bookings must be paid for in advance unless otherwise agreed. For party bookings, a 50% non-refundable deposit is required to confirm the booking. The remaining balance must be paid before the party starts.\n\n## 3. Park Rules\n\nUsers must comply with all posted rules and instructions given by Go Kids Play staff. This includes the requirement to wear grip socks on certain attractions and adhering to age/height restrictions.\n\n## 4. Liability\n\nWhile we take every precaution to ensure the safety of our visitors, Go Kids Play accepts no liability for personal injury, loss, or damage to property while on the premises, unless caused by our negligence.\n\n## 5. Contact Us\n\nIn order to resolve a complaint regarding the Site or to receive further information regarding use of the Site, please contact us at: info@gokidsplay.co.uk."),
    legalPage("cookies", "Cookie Policy", "Cookie Policy", "Last updated: September 2026", "## 1. What Are Cookies?\n\nCookies are small text files that are stored on your computer or mobile device when you visit a website. They allow the website to recognize your device and remember if you've been to the website before.\n\n## 2. How We Use Cookies\n\nWe use cookies to understand how you use our site and to improve your experience. This includes personalizing content and advertising, providing social media features, and analyzing our traffic.\n\n## 3. Your Choices\n\nYou can choose to accept or decline cookies. Most web browsers automatically accept cookies, but you can usually modify your browser setting to decline cookies if you prefer. This may prevent you from taking full advantage of the website."),
    legalPage("disclaimer", "Disclaimer", "Disclaimer", "", "The information contained on the Go Kids Play website is for general information purposes only.\n\n## 1. General Disclaimer\n\nGo Kids Play assumes no responsibility for errors or omissions in the contents on the Service. In no event shall Go Kids Play be liable for any special, direct, indirect, consequential, or incidental damages or any damages whatsoever, whether in an action of contract, negligence or other tort, arising out of or in connection with the use of the Service or the contents of the Service.\n\n## 2. External Links Disclaimer\n\nThe website may contain links to external websites that are not provided or maintained by or in any way affiliated with Go Kids Play. Please note that Go Kids Play does not guarantee the accuracy, relevance, timeliness, or completeness of any information on these external websites.\n\n## 3. Activity Disclaimer\n\nParticipation in physical activities at Go Kids Play (including but not limited to Soft Play, Go Karts, Laser Arena, and Inflatable Park) involves inherent risks. Participants and guardians assume full responsibility for any risks of injury or damage."),
    legalPage("rights", "Your Rights", "Your Privacy Rights", "", "Under data protection laws, you have rights including:\n\n## 1. Your right of access\n\nYou have the right to ask us for copies of your personal information.\n\n## 2. Your right to rectification\n\nYou have the right to ask us to rectify personal information you think is inaccurate. You also have the right to ask us to complete information you think is incomplete.\n\n## 3. Your right to erasure\n\nYou have the right to ask us to erase your personal information in certain circumstances.\n\n## 4. Your right to restriction of processing\n\nYou have the right to ask us to restrict the processing of your personal information in certain circumstances.\n\n## How to exercise your rights\n\nPlease contact us at info@gokidsplay.co.uk if you wish to make a request."),
    legalPage("security", "Security Policy", "Security Policy", "", "## 1. On-Site Security\n\nGo Kids Play operates a secure entry and exit system. Children must be accompanied by an adult at all times and cannot leave the premises unaccompanied. We have CCTV in operation throughout the facility for the safety and security of our guests and staff.\n\n## 2. Data Security\n\nWe are committed to ensuring that your information is secure. In order to prevent unauthorized access or disclosure, we have put in place suitable physical, electronic, and managerial procedures to safeguard and secure the information we collect online.\n\n## 3. Payment Security\n\nAll online payments are processed through secure, encrypted gateways. We do not store your credit card details on our servers."),
    {
        key: 'faq',
        label: 'FAQ',
        path: '/faq',
        description: 'Heading of the FAQ page. The questions themselves are managed in FAQs.',
        sections: [
            {
                key: 'hero',
                label: 'Heading',
                fields: [
                    text('title', 'Heading', 'Frequently Asked Questions', 'title'),
                    area('subtitle', 'Intro text', "Got questions? We've got answers.", 'subtitle'),
                ],
            },
        ],
        collections: [
            { label: 'FAQs', href: '/admin/faqs', description: 'Add, edit, reorder or hide questions' },
        ],
    },
    {
        key: 'information',
        label: 'Information hub',
        path: '/information',
        description: 'Heading and link cards of the Information page.',
        sections: [
            {
                key: 'hero',
                label: 'Heading',
                fields: [
                    text('title', 'Heading', 'Information Hub', 'title'),
                    area('subtitle', 'Intro text', 'Everything you need to know about visiting Go Kids Play Coventry. From our facilities to our legal policies.', 'subtitle'),
                ],
            },
            {
                key: 'cards',
                label: 'Link cards',
                fields: [
                    list('cards', 'Cards', [
                        "FAQ's | /faq | Got questions? We've got answers.",
                        "Facilities | /facilities | Discover what's available on-site.",
                        'Privacy Policy | /privacy | How we protect your data.',
                        'Cookies | /cookies | Our cookie tracking policy.',
                        'Your Rights | /rights | Your data and legal rights.',
                        'Security | /security | Our on-site security measures.',
                        'Disclaimer | /disclaimer | Legal disclaimers for the park.',
                        'Terms of Service | /terms | Rules and terms of booking.',
                        'Contact Us | /contact | Get in touch with our team.',
                    ].join('\n'), 'One card per line: title | link | description. The icon is chosen from the link.'),
                    text('link_text', 'Card link text', 'View details →'),
                ],
            },
        ],
    },
    {
        key: 'pricing',
        label: 'Prices',
        path: '/pricing',
        description: 'Text around the price cards. The prices themselves are managed in Pricing Plans (type: Session).',
        sections: [
            {
                key: 'hero',
                label: 'Heading',
                fields: [
                    text('badge', 'Badge text', 'Admission'),
                    text('title', 'Heading', 'Our Prices', 'title'),
                    area('subtitle', 'Intro text', 'Your ticket gives you an action-packed 2-hour play session with access to all our amazing attractions.', 'content'),
                ],
            },
            {
                key: 'notice',
                label: 'Session info banner',
                fields: [
                    text('title', 'Banner heading', 'Play Session is for 2 hours only', 'title'),
                    area('content', 'Banner text', 'Open SATURDAY, SUNDAY, SCHOOL & BANK HOLIDAYS. (10:00am - 5:30pm)', 'content'),
                ],
            },
            {
                key: 'included',
                label: "What's included",
                fields: [
                    text('title', 'Heading', "What's Included in Your Session?", 'title'),
                    list('items', 'Included activities', 'Mega Soft Play\nLaser Arena\nGo Karts\nNinja Inflatable\nTangle Tower\nSports Pitch'),
                    text('note', 'Note under the list', "* Plus a dedicated Toddler Play Area for under 5's!"),
                ],
            },
            {
                key: 'cards',
                label: 'Price cards',
                description: 'Labels on the price cards. Prices, ages and descriptions come from Pricing Plans.',
                fields: [
                    text('popular_label', '"Most popular" ribbon text', 'Most Popular'),
                    text('select_text', 'Card button text', 'Select'),
                    link('select_link', 'Card button link', '/book'),
                ],
            },
            {
                key: 'footer',
                label: 'Note & booking button',
                fields: [
                    area('note', 'Small print', 'Prices and availability are subject to change. Please ensure you select the correct age group when booking.', 'content'),
                    text('button_text', 'Button text', 'Book Tickets Now', 'cta_text'),
                    link('button_link', 'Button link', '/book', 'cta_link'),
                ],
            },
        ],
        collections: [
            { label: 'Pricing Plans', href: '/admin/cms/pricing-plans', description: 'Prices, age groups and descriptions' },
        ],
    },
    {
        // Key kept as 'party-booking' — the existing party editors already save here
        key: 'party-booking',
        label: 'Parties',
        path: '/parties',
        description: 'Party hero, package card, feast menu, features, party T&Cs and call-to-action.',
        sections: [
            {
                key: 'hero',
                label: 'Hero',
                fields: [
                    text('badge', 'Badge text', '🎉 Parties & Events'),
                    text('title', 'Heading', 'Go Kids Play Party Booking', 'title'),
                    area('subtitle', 'Subheading', "Celebrate with the ultimate adventure! Birthdays, school trips, corporate events - we've got you covered.", 'content'),
                    image('image', 'Background image', '/images/uploads/img-3.jpg', 'image_url'),
                    text('availability', 'Availability line', 'Available: Wednesday - Sunday'),
                ],
            },
            {
                key: 'package',
                label: 'Party package',
                fields: [
                    text('title', 'Section heading', 'Our £250 Party Package', 'title'),
                    area('subtitle', 'Section intro', 'Looking for a fun way to celebrate? Our £250 Party Package is the perfect choice for an unforgettable experience. This package includes everything you need for a great time: 75 minutes of play across our main attractions, a dedicated party area, food, and much more!', 'subtitle'),
                    text('card_title', 'Card title', 'Go Kids Play Party'),
                    text('price', 'Price shown on card', '£250'),
                    text('card_subtitle', 'Card intro', 'The complete party experience — everything included for 10 kids.'),
                    list('includes', "What's included", [
                        'Entry for 10 Kids (additional child £20 each)',
                        'Free entry for 10 adults (additional adult £4.95 each)',
                        '75 Minutes of Play — Soft Play, Laser Arena & Go Karts',
                        '45 Minutes use of private Party Room',
                        'Party Food for Kids (see menu →)',
                        'Squash drinks & Mini Slush for children',
                        'Online Party Invitation',
                        'Inflatable Park add-on available (+£5 per person)',
                    ].join('\n')),
                    text('card_button_text', 'Card button text', 'Book This Party', 'cta_text'),
                    link('button_link', 'Booking link (all party buttons)', '/party-booking', 'cta_link'),
                    text('main_button_text', 'Large button text (under the cards)', 'Book Your Party'),
                ],
            },
            {
                key: 'feast',
                label: 'Party feast menu',
                description: 'The full café menu in the pop-up is managed in Menu Sections.',
                fields: [
                    text('title', 'Card title', 'Party Feast Menu', 'title'),
                    text('note', 'Small note', 'Kids only · 1 portion each per item'),
                    list('items', 'Menu items', [
                        '🥪 Chocolate & Jam Sandwiches', '🍕 Pizza', '🍗 Chicken Chunks', '🥔 Potato Puffs', '🧅 Onion Rings',
                        '🧄 Garlic Bread', '🍟 Curly Fries', '🍟 Chips', '🧃 Unlimited Squash', '🧊 Slush',
                    ].join('\n')),
                    text('dietary', 'Dietary line', '✅ Vegetarian & Halal options available'),
                    text('menu_button', 'Menu button text', 'View Full Café Menu'),
                ],
            },
            {
                key: 'features',
                label: 'Feature cards',
                fields: [
                    list('cards', 'Cards', 'Private Party Room | Exclusive space for celebration\nComplete Package | Everything included\nAll Activities | Full park access',
                        'One card per line: title | description'),
                ],
            },
            {
                key: 'terms',
                label: 'Party terms & conditions',
                fields: [
                    text('title', 'Heading', 'Party T&C', 'title'),
                    list('items', 'Terms', [
                        '50% non-refundable deposit confirms your booking',
                        'Minimum 10 participants required (under 14s)',
                        'Full balance (including extras) due before party starts',
                        'Free rescheduling with 14+ days notice (1 change only)',
                        'Rescheduling under 14 days: £50 admin fee applies',
                        'No rescheduling or refund within 48 hours of party time',
                        'Cancellations must be confirmed by email',
                        'Party lasts approx 2 hours: 75 mins play + 45 mins party room',
                        'Additional adults/children charged at entry',
                        'Inflatable Park not included (£5 per person add-on)',
                        'Allergy/dietary info must be provided at least 2 days prior',
                        'No sparkler candles, flower pot candles, poppers or confetti',
                        'Please arrive 15 minutes before your party start time',
                        'Extra time in party room: £5 per 15 minutes',
                        'Car park: max 3 hours. We accept no liability for parking charges',
                    ].join('\n')),
                    text('email', 'Contact email', 'info@gokidsplay.co.uk'),
                ],
            },
            {
                key: 'cta',
                label: 'Closing call-to-action',
                fields: [
                    text('title', 'Heading', 'Ready to Party?', 'title'),
                    area('subtitle', 'Text', 'Book now and make it unforgettable!', 'subtitle'),
                    text('button_text', 'Button text', 'Book Your Party', 'cta_text'),
                    link('button_link', 'Button link', '/party-booking', 'cta_link'),
                ],
            },
        ],
        collections: [
            { label: 'Menu Sections', href: '/admin/cms/menu-sections', description: 'Full café menu pop-up' },
            { label: 'Party Packages', href: '/admin/cms/party-packages', description: 'Packages offered in the party booking wizard' },
            { label: 'Party Booking wizard', href: '/admin/cms/party-booking', description: 'Text on each step of the booking wizard' },
        ],
    },
    {
        key: 'contact',
        label: 'Contact',
        path: '/contact',
        description: 'Contact page text. Phone, email, address and map link come from Settings; hours come from Opening Hours.',
        sections: [
            {
                key: 'hero',
                label: 'Hero',
                fields: [
                    text('badge', 'Badge text', 'Get in Touch'),
                    text('title', 'Heading', 'Contact Us', 'title'),
                    area('subtitle', 'Subheading', "Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible!", 'subtitle'),
                    image('image', 'Background image', '/images/uploads/img-7.jpg', 'image_url'),
                ],
            },
            {
                key: 'contact_form',
                label: 'Contact form',
                fields: [
                    text('title', 'Form heading', 'Send us a Message', 'title'),
                    area('subtitle', 'Form intro (optional)', '', 'subtitle'),
                    text('success_title', 'Message shown after sending', 'Message Sent Successfully!'),
                ],
            },
            {
                key: 'map',
                label: 'Map card',
                fields: [
                    text('title', 'Text', 'Find us easily', 'title'),
                    text('link_text', 'Link text', 'View on Google Maps'),
                ],
            },
            {
                key: 'hours',
                label: 'Opening hours card',
                description: 'The hours themselves are managed in Opening Hours.',
                fields: [text('title', 'Heading', 'Operating Hours', 'title')],
            },
            {
                key: 'cta',
                label: 'Closing call-to-action',
                fields: [
                    text('title', 'Heading', 'Ready to Visit?', 'title'),
                    area('subtitle', 'Text', 'Book your tickets online and skip the queue!', 'subtitle'),
                    text('button_text', 'Button text', 'Book Now', 'cta_text'),
                    link('button_link', 'Button link', '/book', 'cta_link'),
                ],
            },
        ],
        collections: [
            { label: 'Settings', href: '/admin/settings', description: 'Phone, email, address and map link' },
            { label: 'Opening Hours', href: '/admin/cms/timing-cards', description: 'Opening hours' },
            { label: 'Contact Messages', href: '/admin/cms/contact-messages', description: 'Messages sent through the form' },
        ],
    },
    {
        key: 'groups',
        label: 'Group Bookings',
        path: '/groups',
        description: 'Groups hero, package heading, how-it-works steps and help line. Packages and benefits are managed as lists.',
        sections: [
            {
                key: 'hero',
                label: 'Hero',
                fields: [
                    text('badge', 'Badge text', 'Special Group Rates'),
                    text('title', 'Heading', 'Group Bookings', 'title'),
                    area('subtitle', 'Subheading', 'Bring your team, class, or friends for an unforgettable adventure! Enjoy exclusive group rates and dedicated support.', 'content'),
                    image('image', 'Background image', '/images/gallery-1.jpg', 'image_url'),
                ],
            },
            {
                key: 'packages',
                label: 'Packages heading',
                description: 'Shown only when at least one Group Package is active.',
                fields: [
                    text('title', 'Heading', 'Choose Your Package', 'title'),
                    area('subtitle', 'Intro text', 'Select the perfect package for your group and let us handle the rest!', 'subtitle'),
                    text('popular_label', '"Most popular" ribbon text', 'MOST POPULAR'),
                    text('button_text', 'Package button text', 'Enquire Now', 'cta_text'),
                    link('button_link', 'Package button link', '/contact#contactForm', 'cta_link'),
                ],
            },
            {
                key: 'how',
                label: 'How it works',
                fields: [
                    text('title', 'Heading', 'How It Works', 'title'),
                    list('steps', 'Steps', [
                        'Contact Us | Fill out the enquiry form with your group details',
                        "Get Quote | We'll send you a customized quote within 24 hours",
                        'Book & Enjoy | Confirm your booking and have an amazing time!',
                    ].join('\n'), 'One step per line: title | description'),
                ],
            },
            {
                key: 'help',
                label: 'Help line',
                fields: [
                    text('title', 'Text', 'Have questions? Our team is here to help!', 'title'),
                    text('button_text', 'Button text', 'Contact Us Now', 'cta_text'),
                    link('button_link', 'Button link', '/contact#contactForm', 'cta_link'),
                ],
            },
        ],
        collections: [
            { label: 'Group Packages', href: '/admin/cms/group-packages', description: 'Packages, prices and features' },
            { label: 'Group Benefits', href: '/admin/cms/groups', description: 'Benefit cards under the hero' },
        ],
    },
    {
        key: 'gallery',
        label: 'Gallery',
        path: '/gallery',
        description: 'Gallery heading and stats. Photos are managed in Gallery (set a category to place them under a filter).',
        sections: [
            {
                key: 'hero',
                label: 'Heading',
                fields: [
                    text('badge', 'Badge text', 'Photo Gallery'),
                    text('title', 'Heading', 'Our Gallery', 'title'),
                    area('subtitle', 'Intro text', "Take a look inside Coventry's ultimate indoor play centre. Real moments, real fun!", 'subtitle'),
                    text('stat2_value', 'Stat 2 number', '6+'),
                    text('stat2_label', 'Stat 2 label', 'Attractions'),
                    text('stat3_value', 'Stat 3 number', '5,000+'),
                    text('stat3_label', 'Stat 3 label', 'Happy Visitors'),
                ],
            },
        ],
        collections: [
            { label: 'Gallery', href: '/admin/cms/gallery', description: 'Upload photos and choose their category' },
        ],
    },
    {
        key: 'facilities',
        label: 'Facilities',
        path: '/facilities',
        description: 'Facilities heading and closing banner. The facility cards are managed in Facilities.',
        sections: [
            {
                key: 'hero',
                label: 'Heading',
                fields: [
                    text('badge', 'Badge text', 'On-Site Amenities'),
                    text('title', 'Heading', 'Our Facilities', 'title'),
                    area('subtitle', 'Intro text', 'Everything you need for a comfortable, safe, and unforgettable visit at Go Kids Play Coventry.', 'subtitle'),
                ],
            },
            {
                key: 'cta',
                label: 'Closing banner',
                fields: [
                    text('emoji', 'Emoji', '🎉'),
                    text('title', 'Heading', 'Planning a Visit or Party?', 'title'),
                    area('subtitle', 'Text', 'Book your session online or enquire about our premium birthday party packages — all designed to create unforgettable memories.', 'subtitle'),
                    text('button1_text', 'Button 1 text', '🎟️ Book Tickets', 'cta_text'),
                    link('button1_link', 'Button 1 link', '/book', 'cta_link'),
                    text('button2_text', 'Button 2 text', '🎂 Plan a Party'),
                    link('button2_link', 'Button 2 link', '/parties'),
                ],
            },
        ],
        collections: [
            { label: 'Facilities', href: '/admin/cms/facility-items', description: 'Facility cards (title, description, icon)' },
        ],
    },
    {
        key: 'guidelines',
        label: 'Guidelines',
        path: '/guidelines',
        description: 'Guidelines heading and FAQ tab. The policy tabs show the same text as the Privacy, Terms, Cookies, Disclaimer, Your Rights and Security pages.',
        sections: [
            {
                key: 'hero',
                label: 'Heading',
                fields: [
                    text('badge', 'Badge text', 'Information & Support'),
                    text('title', 'Heading', 'Safety Guidelines', 'title'),
                    area('subtitle', 'Intro text', 'Your safety is our priority. Please read our guidelines before your visit to Go Kids Play Coventry.', 'content'),
                ],
            },
            {
                key: 'faq',
                label: 'FAQ tab',
                fields: [
                    text('title', 'Heading', 'Frequently Asked Questions', 'title'),
                    text('empty_text', 'Text when there are no FAQs', 'No FAQs available at the moment.'),
                ],
            },
        ],
        collections: [
            { label: 'FAQs', href: '/admin/faqs', description: 'Questions shown in the FAQ tab' },
            { label: 'Policy pages', href: '/admin/cms', description: 'Edit Privacy, Terms, Cookies, etc. under Pages' },
        ],
    },
    {
        key: 'events',
        label: 'Events',
        path: '/events',
        description: 'Events page heading and empty-state text. The events themselves are managed under Events.',
        sections: [
            {
                key: 'hero',
                label: 'Heading',
                fields: [
                    text('badge', 'Badge text', 'Special Events & Parties'),
                    text('title', 'Heading', 'Go Kids Play Events', 'title'),
                    area('subtitle', 'Intro text', 'From Birthday parties to Halloween nights — create unforgettable memories at Go Kids Play Coventry.', 'subtitle'),
                ],
            },
            {
                key: 'empty',
                label: 'When there are no events',
                fields: [
                    text('title', 'Heading', 'No events found', 'title'),
                    text('subtitle', 'Text', 'Check back soon for upcoming events!', 'subtitle'),
                ],
            },
        ],
        collections: [
            { label: 'Events', href: '/admin/events', description: 'Create events, set dates, prices and cover images' },
        ],
    },
    {
        key: 'shop',
        label: 'Shop',
        path: '/shop',
        description: 'Shop heading and "buy in person" banner. Products (with photos) are managed in Shop Products.',
        sections: [
            {
                key: 'hero',
                label: 'Heading',
                fields: [
                    text('badge', 'Badge text', 'Go Kids Play Shop'),
                    text('title', 'Heading (first part)', 'Gift Cards &', 'title'),
                    text('title_highlight', 'Heading (highlighted part)', 'Merchandise'),
                    area('subtitle', 'Intro text', 'Give the gift of adventure! Browse our gift cards, branded merchandise, and party extras.', 'subtitle'),
                    text('empty_text', 'Text when there are no products', 'Shop items coming soon! Check back shortly.'),
                ],
            },
            {
                key: 'buy',
                label: 'Buying',
                description: 'Online checkout is not enabled yet, so the Buy button calls this number.',
                fields: [
                    text('button_text', 'Product button text', 'Buy'),
                    text('phone', 'Phone number for orders', '07349 110 865'),
                ],
            },
            {
                key: 'banner',
                label: '"Buy in person" banner',
                fields: [
                    text('title', 'Heading', 'Want to purchase in person?', 'title'),
                    area('subtitle', 'Text', "Visit us or give us a call — we're happy to arrange gift cards and merchandise orders over the phone.", 'subtitle'),
                    text('button_text', 'Second button text', 'Get In Touch', 'cta_text'),
                    link('button_link', 'Second button link', '/contact', 'cta_link'),
                ],
            },
        ],
        collections: [
            { label: 'Shop Products', href: '/admin/cms/collections/products', description: 'Products, prices, stock and photos' },
        ],
    },
    {
        key: 'memberships',
        label: 'Memberships',
        path: '/memberships',
        description: 'Memberships heading and plan card labels. Plans are managed in Membership Plans.',
        sections: [
            {
                key: 'hero',
                label: 'Heading',
                fields: [
                    text('title', 'Heading (first part)', 'Go Kids Play', 'title'),
                    text('title_highlight', 'Heading (highlighted part)', 'Memberships'),
                    area('subtitle', 'Intro text', 'Unlock unlimited play, exclusive perks, and VIP discounts with our new Membership Plans!', 'subtitle'),
                    text('empty_text', 'Text when there are no plans', 'Membership plans are being updated. Please check back soon!'),
                ],
            },
            {
                key: 'cards',
                label: 'Plan cards',
                fields: [
                    text('best_value', '"Best value" ribbon text', 'Best Value'),
                    text('button_text', 'Button text', 'Purchase', 'cta_text'),
                    link('button_link', 'Button link', '/contact', 'cta_link',
                        'Online membership checkout is not enabled yet — point this at the contact page or a phone link (tel:…)'),
                ],
            },
        ],
        collections: [
            { label: 'Membership Plans', href: '/admin/cms/collections/memberships', description: 'Plans, prices, benefits and images' },
        ],
    },
    {
        key: 'testimonies',
        label: 'Customer Reviews',
        path: '/testimonies',
        description: 'Reviews page text. The reviews themselves are managed in Customer Reviews — only add genuine reviews.',
        sections: [
            {
                key: 'hero',
                label: 'Heading',
                fields: [
                    text('badge', 'Badge text', 'What Parents Say'),
                    text('title', 'Heading', 'Customer Reviews', 'title'),
                    area('subtitle', 'Intro text', "Don't just take our word for it — here's what Coventry families say about their Go Kids Play experience.", 'subtitle'),
                ],
            },
            {
                key: 'summary',
                label: 'Rating summary & review link',
                fields: [
                    text('empty_text', 'Text before any reviews are added', 'Be one of the first to tell other families about your visit!'),
                    area('prompt', 'Prompt above the button', 'Visited us?\nShare your experience!'),
                    text('button_text', 'Button text', 'Leave a Review', 'cta_text'),
                    link('review_link', 'Review link', 'https://www.google.com/maps/search/Go+Kids+Play+Coventry', 'cta_link',
                        'Paste your Google Business "Ask for reviews" link here'),
                ],
            },
            {
                key: 'cta',
                label: 'Closing call-to-action',
                fields: [
                    text('title', 'Heading', 'Ready to Create Your Own Memory?', 'title'),
                    area('subtitle', 'Text', "Join thousands of Coventry families who've made unforgettable memories at Go Kids Play. Book your session or party today.", 'subtitle'),
                    text('button1_text', 'Button 1 text', '🎟️ Book Tickets'),
                    link('button1_link', 'Button 1 link', '/book'),
                    text('button2_text', 'Button 2 text', '🎂 Book a Party'),
                    link('button2_link', 'Button 2 link', '/party-booking'),
                ],
            },
        ],
        collections: [
            { label: 'Customer Reviews', href: '/admin/cms/collections/testimonials', description: 'Add genuine reviews' },
        ],
    },
    // @@PAGES_END — new page definitions go above this line
];

// ── Lookup & resolution ──────────────────────────────────────────────────────

export function getPageDef(key: string): PageDef | undefined {
    return PAGES.find((p) => p.key === key);
}

export function getSectionDef(pageKey: string, sectionKey: string): SectionDef | undefined {
    return getPageDef(pageKey)?.sections.find((s) => s.key === sectionKey);
}

const isFilled = (v: unknown) => v !== null && v !== undefined && String(v).trim() !== '';

/** Read one field's stored value from a PageSection row (column or extra JSON). */
export function readField(row: any, field: FieldDef): string | undefined {
    if (!row) return undefined;
    const raw = field.column ? row[field.column] : row.extra?.[field.name];
    return isFilled(raw) ? String(raw) : undefined;
}

export type ResolvedSection = Record<string, string> & { _saved: string };

/**
 * Merge saved CMS rows over the registry defaults for one page.
 * Returns { [sectionKey]: { [fieldName]: value } } — every registered field is present.
 * A section the admin has switched off (active=false) resolves to `null`.
 */
export function resolveSections(pageKey: string, rows: any[] = []): Record<string, ResolvedSection | null> {
    const page = getPageDef(pageKey);
    const out: Record<string, ResolvedSection | null> = {};
    if (!page) return out;
    for (const section of page.sections) {
        const row = rows.find((r) => r?.section_key === section.key);
        if (row && row.active === false) {
            out[section.key] = null;
            continue;
        }
        const values: Record<string, string> = { _saved: row ? 'yes' : '' };
        for (const field of section.fields) {
            values[field.name] = readField(row, field) ?? field.default ?? '';
        }
        out[section.key] = values as ResolvedSection;
    }
    return out;
}

/** Split a `list` field into trimmed, non-empty lines. */
export function listItems(value: string | undefined): string[] {
    return (value || '').split('\n').map((l) => l.trim()).filter(Boolean);
}

/** Split long text into paragraphs on blank lines. */
export function paragraphs(value: string | undefined): string[] {
    return (value || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}

/** Build the PageSection payload (columns + extra) to save for one section. */
export function toSectionPayload(pageKey: string, section: SectionDef, values: Record<string, string>, order: number) {
    const payload: Record<string, any> & { section_key: string } = { page: pageKey, section_key: section.key, order, extra: {} };
    for (const field of section.fields) {
        const v = values[field.name] ?? '';
        if (field.column) payload[field.column] = v === '' ? null : v;
        else payload.extra[field.name] = v;
    }
    return payload;
}
