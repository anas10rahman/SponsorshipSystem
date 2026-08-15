import { useState, type FormEvent } from "react";
import { Mail, Phone, MapPin, Instagram, Send, Info, ListRestart } from "lucide-react";
import { CONTACT_INFO, CONTACT_SUBJECTS } from "@/lib/landingContent";

type Errors = Partial<
  Record<"name" | "email" | "phone" | "org" | "subject" | "message", string>
>;

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Label subjek yang dikirim: untuk "Lainnya…" pakai isian bebas pengguna. */
function subjectLabel(subject: string, otherSubject: string): string {
  if (subject === "other") return otherSubject.trim();
  return CONTACT_SUBJECTS.find((s) => s.value === subject)?.label ?? "";
}

/** Halaman kontak + form penawaran kerja sama.
 *
 *  Pengiriman memakai `mailto:` — kuota Serverless Function Vercel (Hobby)
 *  sudah terpakai penuh 12/12, jadi form ini sengaja tanpa endpoint sendiri.
 *  ponytail: mailto, ganti ke endpoint (op pada fungsi yang ada) bila
 *  penawaran mulai ramai dan perlu tercatat di dalam sistem. */
export function ContactPartnership() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    org: "",
    subject: "",
    otherSubject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Errors>({});

  const set = (k: keyof typeof form) => (v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    // `otherSubject` berbagi satu field (dan satu pesan galat) dengan `subject`.
    const errKey = k === "otherSubject" ? "subject" : k;
    setErrors((e) => ({ ...e, [errKey]: undefined }));
  };

  function validate(): Errors {
    const e: Errors = {};
    if (!form.name.trim()) e.name = "Nama lengkap wajib diisi.";
    if (!form.email.trim()) e.email = "Email wajib diisi.";
    else if (!EMAIL_RE.test(form.email.trim())) e.email = "Format email tidak valid.";
    if (!form.phone.trim()) e.phone = "Nomor telepon wajib diisi.";
    if (!form.org.trim()) e.org = "Organisasi / brand wajib diisi.";
    // Satu field: dropdown, atau isian bebas saat "Lainnya…" dipilih.
    if (!form.subject) e.subject = "Pilih penawaran partnership.";
    else if (form.subject === "other" && !form.otherSubject.trim())
      e.subject = "Tuliskan penawaran partnership Anda.";
    if (!form.message.trim()) e.message = "Pesan wajib diisi.";
    return e;
  }

  function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    const subject = subjectLabel(form.subject, form.otherSubject);
    const body = [
      `Nama Lengkap : ${form.name.trim()}`,
      `Email        : ${form.email.trim()}`,
      `Telepon      : ${form.phone.trim() || "-"}`,
      `Organisasi   : ${form.org.trim() || "-"}`,
      `Subjek       : ${subject}`,
      "",
      "Pesan:",
      form.message.trim(),
    ].join("\n");

    window.location.href =
      `mailto:${CONTACT_INFO.email}` +
      `?subject=${encodeURIComponent(`[Partnership] ${subject}`)}` +
      `&body=${encodeURIComponent(body)}`;
  }

  return (
    <section className="lp-sec lp-contact">
      <div className="lp-wrap">
        {/* Judul & deskripsi sengaja tidak ditampilkan — halaman langsung ke
            informasi kontak dan form. h1 tetap ada untuk pembaca layar dan
            mesin telusur, karena setiap halaman butuh satu judul. */}
        <h1 className="lp-sr-only">Penawaran Kerja Sama DealMatch</h1>

        <div className="lp-contact__grid">
          {/* ---------- Informasi kontak ---------- */}
          <aside className="lp-contact__info" data-reveal>
            <h2 className="lp-contact__card-title">
              <Info size={18} />
              Informasi Kontak
            </h2>

            <a className="lp-contact__row" href={`mailto:${CONTACT_INFO.email}`}>
              <span className="lp-contact__ico">
                <Mail size={16} />
              </span>
              <span>
                <strong>Email</strong>
                {CONTACT_INFO.email}
              </span>
            </a>

            {/* Disembunyikan selama nomor belum diisi — lebih baik tidak ada
                baris telepon daripada menayangkan nomor contoh di halaman
                publik. Lihat CONTACT_INFO di landingContent.ts. */}
            {CONTACT_INFO.phone && CONTACT_INFO.whatsapp && (
              <a
                className="lp-contact__row"
                href={`https://wa.me/${CONTACT_INFO.whatsapp}`}
                target="_blank"
                rel="noreferrer"
              >
                <span className="lp-contact__ico">
                  <Phone size={16} />
                </span>
                <span>
                  <strong>Telepon / WhatsApp</strong>
                  {CONTACT_INFO.phone}
                </span>
              </a>
            )}

            <div className="lp-contact__row">
              <span className="lp-contact__ico">
                <MapPin size={16} />
              </span>
              <span>
                <strong>Alamat</strong>
                {CONTACT_INFO.address}
              </span>
            </div>

            <div className="lp-contact__social">
              <h3>Ikuti Kami</h3>
              <a
                href={CONTACT_INFO.instagramUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`Instagram ${CONTACT_INFO.instagram}`}
              >
                <Instagram size={18} />
                {CONTACT_INFO.instagram}
              </a>
            </div>
          </aside>

          {/* ---------- Form penawaran ---------- */}
          <form className="lp-contact__form" onSubmit={onSubmit} noValidate data-reveal>
            <h2 className="lp-contact__card-title">
              <Send size={18} />
              Kirim Penawaran Kerja Sama
            </h2>

            <div className="lp-contact__two">
              <Field label="Nama Lengkap" required error={errors.name} htmlFor="ct-name">
                <input
                  id="ct-name"
                  value={form.name}
                  onChange={(e) => set("name")(e.target.value)}
                  placeholder="Masukkan nama lengkap Anda"
                  autoComplete="name"
                />
              </Field>

              <Field label="Email" required error={errors.email} htmlFor="ct-email">
                <input
                  id="ct-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email")(e.target.value)}
                  placeholder="nama@perusahaan.com"
                  autoComplete="email"
                />
              </Field>
            </div>

            <div className="lp-contact__two">
              <Field label="Nomor Telepon" required error={errors.phone} htmlFor="ct-phone">
                <input
                  id="ct-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set("phone")(e.target.value)}
                  placeholder="08xx-xxxx-xxxx"
                  autoComplete="tel"
                />
              </Field>

              <Field
                label="Organisasi / Brand"
                required
                error={errors.org}
                htmlFor="ct-org"
              >
                <input
                  id="ct-org"
                  value={form.org}
                  onChange={(e) => set("org")(e.target.value)}
                  placeholder="Nama organisasi atau brand"
                  autoComplete="organization"
                />
              </Field>
            </div>

            {/* Satu field saja. Memilih "Lainnya…" menukar dropdown menjadi
                isian bebas di tempat yang sama — bukan field baru di bawahnya
                — sehingga labelnya tetap satu: "Penawaran Partnership". */}
            <Field
              label="Penawaran Partnership"
              required
              error={errors.subject}
              htmlFor={form.subject === "other" ? "ct-other" : "ct-subject"}
            >
              {form.subject === "other" ? (
                <div className="lp-field__swap">
                  <input
                    id="ct-other"
                    value={form.otherSubject}
                    onChange={(e) => set("otherSubject")(e.target.value)}
                    placeholder="Tuliskan penawaran partnership Anda"
                    autoFocus
                  />
                  <button
                    type="button"
                    className="lp-field__revert"
                    onClick={() => {
                      set("subject")("");
                      set("otherSubject")("");
                    }}
                    title="Kembali ke daftar pilihan"
                  >
                    <ListRestart size={16} />
                    <span>Pilih dari daftar</span>
                  </button>
                </div>
              ) : (
                <select
                  id="ct-subject"
                  value={form.subject}
                  onChange={(e) => set("subject")(e.target.value)}
                >
                  <option value="">Pilih penawaran partnership…</option>
                  {CONTACT_SUBJECTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              )}
            </Field>

            <Field label="Pesan" required error={errors.message} htmlFor="ct-message">
              <textarea
                id="ct-message"
                rows={6}
                value={form.message}
                onChange={(e) => set("message")(e.target.value)}
                placeholder="Ceritakan penawaran kerja sama Anda — bentuk kolaborasi, target audiens, dan waktu pelaksanaan."
              />
            </Field>

            <button type="submit" className="lp-btn lp-btn--org lp-contact__submit">
              <Send size={16} />
              Kirim Penawaran
            </button>
            <p className="lp-contact__note">
              Tombol ini membuka aplikasi email Anda dengan pesan yang sudah
              terisi, lalu tinggal dikirim.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}

/* Satu baris field: label + kontrol + pesan galat. */
function Field({
  label,
  required,
  error,
  htmlFor,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`lp-field${error ? " is-invalid" : ""}`}>
      <label htmlFor={htmlFor}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {children}
      {error && <span className="lp-field__err">{error}</span>}
    </div>
  );
}
