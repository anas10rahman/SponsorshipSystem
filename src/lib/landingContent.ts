/* ============================================================
   Landing page copy — sourced from "DealMatch Compro.docx" and
   reference.html. Every string lives here so wording can change
   without touching components.

   The platform's two sides map onto the two brand colours:
     Organization   → blue  (--dm-blue  #1E3A8A)
     Sponsor Partner → green (--dm-green #10B981)
   Same as the DM logo: a blue D and a green M joined by one node.
   ============================================================ */

export const TAGLINE = "Two Sides. One Match.";

/* Public navigation — each entry is its own page, not an in-page anchor. */
export const NAV_LINKS = [
  { href: "/about", label: "About Us" },
  { href: "/program", label: "Program" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
  { href: "/faq", label: "FAQ" },
] as const;

/* ---------- About Us ---------- */

export const ABOUT_LEAD =
  "DealMatch connects Organizations with Sponsor Partners on one platform that is simpler, faster, and more focused.";

export const ABOUT_BODY =
  "We make it easier for Organizations to submit sponsorship proposals. On the other side, DealMatch helps Sponsor Partners find collaborations that fit their campaign goals and target audience.";

export const VALUE_PROPS = [
  {
    icon: "target",
    title: "Smart Matching",
    desc: "No more sending proposals at random. Go straight to the sponsor partner you actually want.",
  },
  {
    icon: "grid",
    title: "One Platform",
    desc: "The whole sponsorship process lives in one place, from first draft to signed deal.",
  },
  {
    icon: "eye",
    title: "Transparent Process",
    desc: "Track proposal status and balance in real time. No guesswork.",
  },
  {
    icon: "sparkles",
    title: "Quality Connections",
    desc: "We match you with sponsor partners genuinely relevant to your event.",
  },
  {
    icon: "clock",
    title: "Save Time",
    desc: "A structured process with clear response deadlines. No waiting in the dark.",
  },
] as const;

/* ---------- Who it is for ---------- */

export const AUDIENCES = [
  {
    side: "org",
    title: "Organizations",
    who: "Event organizers, communities, student bodies, youth groups, and any organization that needs sponsor support.",
    points: [
      "Find the sponsor partners most relevant to you",
      "Submit proposals directly, save as draft, pick up any time",
      "Track every submission from a single dashboard",
      "Get a clear outcome: Approved, Needs Revision, or Rejected",
      "Build long-term collaboration once a proposal is approved",
    ],
  },
  {
    side: "sponsor",
    title: "Sponsor Partners",
    who: "Brands, companies, and partners looking to reach audiences through events and collaboration.",
    points: [
      "Receive proposals that are already curated",
      "Review full event details in one place",
      "Confirm proposal status in a single click",
      "Build exposure with the right communities",
    ],
  },
] as const;

/* ---------- How it works (per role) ---------- */

export const FLOWS = {
  org: [
    {
      title: "Sign Up & Complete Your Profile",
      desc: "Create an account as an Organization, then complete your profile and legal documents.",
    },
    {
      title: "Admin Verification",
      desc: "Admin reviews your details and documents to make sure every account holds valid information before it can use the platform.",
    },
    {
      title: "Find Sponsor Partners",
      desc: "Browse the Sponsor Partner directory by what your event needs, the fields they support, and the collaboration they offer.",
    },
    {
      title: "Submit a Proposal",
      desc: "Fill in the event details, pick or build a sponsorship package, upload the proposal PDF, then send it to the Sponsor Partner you choose.",
    },
    {
      title: "Get Sponsor Support",
      desc: "The Sponsor Partner reviews your submission and gives the final decision on the proposal.",
    },
  ],
  sponsor: [
    {
      title: "Sign Up & Complete Your Profile",
      desc: "Create an account as a Sponsor Partner, then complete your profile and legal documents.",
    },
    {
      title: "Admin Verification",
      desc: "Admin reviews your details and documents to make sure every account holds valid information before it can use the platform.",
    },
    {
      title: "Receive Proposals",
      desc: "See incoming event proposals and spot the collaborations that fit your target audience.",
    },
    {
      title: "Review Proposals",
      desc: "Study the event details, target audience, sponsorship benefits, packages on offer, and supporting information.",
    },
    {
      title: "Decide on the Partnership",
      desc: "Give your decision on the proposal: Approved, Needs Revision, or Rejected.",
    },
  ],
} as const;

/* ---------- Ready to Match ---------- */

export const READY_CARDS = [
  {
    side: "org",
    title: "Looking for sponsors?",
    desc: "Register your organization and find the best sponsor partners for your event.",
    cta: "Sign up now",
  },
  {
    side: "sponsor",
    title: "Interested in sponsoring?",
    desc: "Register your company or brand as a trusted sponsor partner.",
    cta: "Sign up now",
  },
] as const;

/* ---------- Balance breakdown (first FAQ answer) ---------- */

export const SALDO_ROWS = [
  {
    title: "Proposal sent",
    desc: "Deducted when the proposal goes to your chosen brand",
    amount: "− Rp50,000",
    tone: "minus",
  },
  {
    title: "Brand approves",
    desc: "Brand contact opens, the submission fee is spent",
    amount: "Spent",
    tone: "neutral",
  },
  {
    title: "Brand rejects",
    desc: "Part of the balance returns to your account automatically",
    amount: "+ Rp40,000",
    tone: "plus",
  },
  {
    title: "No response after 7 days",
    desc: "Counted as the brand's lapse, not yours",
    amount: "+ Rp50,000",
    tone: "plus",
  },
] as const;

/* ---------- FAQ ---------- */

export const FAQ = [
  {
    q: "Is there a fee to sign up?",
    a: "Signing up and creating an account is free. Submitting a proposal draws on your balance as follows:",
    withSaldo: true,
  },
  {
    q: "Who can start a submission?",
    a: "Organizations only. Sponsor partners do not offer funding first — they review what lands in their inbox, then decide.",
  },
  {
    q: "Can an admin overturn a sponsor's decision?",
    a: "No. A sponsor partner's approval is final. Admin monitors and records; it does not approve or cancel.",
  },
  {
    q: "How does organization verification work?",
    a: "Complete your organization profile along with the legal documents, then request verification from the settings page. An admin will review it.",
  },
  {
    q: "What happens if a submission is sent back for revision?",
    a: "It returns to the organization to be fixed, then can be resent to the same sponsor partner at no extra cost.",
  },
  {
    q: "Why is the phone number partly hidden?",
    a: "The full number only opens once a submission has been sent between the two parties, so coordination stays recorded inside the system.",
  },
] as const;

/* ---------- Footer ---------- */

export const FOOTER_TAGLINE =
  "The platform where Organizations and Sponsor Partners meet — simpler, faster, more focused.";

export const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Program", href: "/program" },
      { label: "Gallery", href: "/gallery" },
    ],
  },
  {
    title: "For",
    links: [
      { label: "Organizations", href: "/about" },
      { label: "Sponsor Partners", href: "/about" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "FAQ", href: "/faq" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy Policy", href: "/kebijakan-privasi" },
      { label: "Terms & Conditions", href: "/syarat-ketentuan" },
    ],
  },
] as const;

/* ---------- Contact ----------
   The single source of public contact details. The /contact page cannot read
   the admin email from the store: public pages render without a session, and
   /api/state deliberately returns nothing for anonymous visitors. */

/* TODO(anas): replace with real DealMatch contact details.
   `email` is also where the partnership enquiry form sends to, so while it
   stays a placeholder no enquiry reaches anyone.

   `phone`/`whatsapp` are deliberately EMPTY rather than filled with an
   example: a plausible-looking invented number may belong to a real person,
   and this page is public. The phone row hides itself while empty — fill
   both to bring it back. */
export const CONTACT_INFO = {
  email: "halo@dealmatch.id",
  phone: "",
  /** Used for the wa.me link — digits only, no punctuation. */
  whatsapp: "",
  address: "Jakarta, Indonesia",
  instagram: "@dealmatch.id",
  instagramUrl: "https://instagram.com/dealmatch.id",
} as const;

/** Subject options on the partnership enquiry form. `other` reveals a free
 *  text field so enquiries outside the list still have somewhere to go. */
export const CONTACT_SUBJECTS = [
  { value: "media-partner", label: "Media Partner" },
  { value: "co-branding", label: "Co-Branding / Co-Campaign" },
  { value: "community", label: "Community Collaboration" },
  { value: "other", label: "Other…" },
] as const;

/* ---------- Program ----------
   DealMatch programs. An array so the next program is just another entry
   here, with no component changes. */

export const PROGRAMS = [
  {
    id: "webinar-sponsorship-2026-08",
    title: "Understanding Sponsorship from the Brand's Point of View",
    category: "Online Program",
    poster: "/poster-webinar-sponsorship.jpeg",
    date: "29 August 2026",
    time: "14.00 – 16.00 WIB",
    price: "Rp 30,000 / person · Rp 50,000 / 2 people (save 10K)",
    highlights: [
      "Why brands keep ghosting your proposals",
      'Shift from "asking for sponsorship" to "offering value"',
      "The 2026 sponsorship trends brands are chasing",
      "Spot the red flags before a partnership goes wrong",
      "One step closer to a sponsorship proposal that gets approved",
    ],
    speakers: [
      { name: "Ali Abdi", role: "Marketing Communications, Media Partner Amazing Malang" },
      { name: "Adelia PH", role: "Sponsorship & Community Strategist" },
    ],
    ctaLabel: "Register for the Program",
    ctaUrl: "https://bit.ly/daftarwebinarsponsorship",
  },
] as const;
