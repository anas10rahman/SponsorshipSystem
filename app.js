const STORAGE_KEY = "sponsorhub-state-v1";
const DEMO_PASSWORD = "Akundemo12345";

const users = [
  { id: "u-org", nama: "Rani Prameswari", username: "organisasi", email: "organisasi@sponsorhub.test", role: "Organisasi", password: DEMO_PASSWORD },
  { id: "u-funder", nama: "Budi Santoso", username: "pendana", email: "pendana@sponsorhub.test", role: "Pendana", password: DEMO_PASSWORD },
  { id: "u-admin", nama: "Maya Admin", username: "Admin", email: "admin@sponsorhub.test", role: "Admin", password: DEMO_PASSWORD },
];

const statusClass = {
  Draft: "badge-gray",
  "Review Admin": "badge-blue",
  "Perlu Revisi": "badge-yellow",
  Ditolak: "badge-red",
  Terbuka: "badge-green",
  "Ditinjau Pendana": "badge-blue",
  "Disetujui Pendana": "badge-green",
  "Menunggu Transfer": "badge-yellow",
  "Transfer Terverifikasi": "badge-green",
  Selesai: "badge-gray",
};

const initialRequests = [
  {
    id: "req-1",
    event: "Festival Musik Nusantara",
    organisasi: "Yayasan Seni Budaya",
    tanggal: "18 Mei 2026",
    lokasi: "Istora Senayan",
    kategori: "Hiburan",
    deskripsi: "Festival musik lintas daerah dengan panggung utama dan area UMKM kreatif.",
    budget: 200000000,
    nominal: 50000000,
    jenis: "In Cash",
    benefit: [
      "Booth eksklusif ukuran 3x3m di area utama",
      "Logo premium di semua materi promosi",
      "Akses 5 tiket VIP untuk perwakilan sponsor",
      "Kesempatan presentasi selama 15 menit",
    ],
    bagiHasil: 20,
    status: "Review Admin",
    proposal: "proposal-festival-musik.pdf",
    funderId: null,
    transfer: null,
    history: [
      historyItem("Diajukan", "Organisasi", "Proposal dikirim untuk review admin.", "01 Sep 2026, 10:30"),
      historyItem("Admin Meninjau", "Admin", "Dokumen sedang dicek.", "02 Sep 2026, 14:15"),
    ],
  },
  {
    id: "req-2",
    event: "Program Edukasi Digital",
    organisasi: "Komunitas Belajar",
    tanggal: "24 Juni 2026",
    lokasi: "Bandung Creative Hub",
    kategori: "Edukasi",
    deskripsi: "Pelatihan literasi digital untuk pelajar dan pelaku UMKM pemula.",
    budget: 90000000,
    nominal: 25000000,
    jenis: "In Cash",
    benefit: ["Logo di modul peserta", "Sesi product sharing", "Publikasi sosial media"],
    bagiHasil: 12,
    status: "Terbuka",
    proposal: "proposal-edukasi-digital.pdf",
    funderId: null,
    transfer: null,
    history: [
      historyItem("Diajukan", "Organisasi", "Proposal diajukan.", "05 Sep 2026, 09:00"),
      historyItem("Admin Setuju", "Admin", "Pengajuan dibuka untuk pendanaan.", "06 Sep 2026, 11:00"),
    ],
  },
  {
    id: "req-3",
    event: "Pekan Olahraga Mahasiswa",
    organisasi: "BEM Universitas Indonesia",
    tanggal: "10 Juli 2026",
    lokasi: "Kampus UI Depok",
    kategori: "Olahraga",
    deskripsi: "Kompetisi olahraga antar fakultas dengan final terbuka untuk publik.",
    budget: 150000000,
    nominal: 75000000,
    jenis: "In Cash",
    benefit: ["Naming rights area final", "Booth sponsor", "Logo jersey panitia"],
    bagiHasil: 10,
    status: "Menunggu Transfer",
    proposal: "proposal-pekan-olahraga.pdf",
    funderId: "u-funder",
    transfer: { nominal: 75000000, referensi: "", bukti: "", status: "Menunggu Transfer" },
    history: [
      historyItem("Diajukan", "Organisasi", "Proposal diajukan.", "10 Sep 2026, 08:30"),
      historyItem("Admin Setuju", "Admin", "Pengajuan memenuhi syarat.", "11 Sep 2026, 09:45"),
      historyItem("Disetujui Pendana", "Pendana", "Pendana menyetujui nominal.", "12 Sep 2026, 13:15"),
      historyItem("Menunggu Transfer", "Admin", "Skema bagi hasil disetujui.", "12 Sep 2026, 15:00"),
    ],
  },
  {
    id: "req-4",
    event: "Tech Summit 2026",
    organisasi: "Komunitas IT Nusantara",
    tanggal: "15-17 Oktober 2026",
    lokasi: "Jakarta Convention Center",
    kategori: "Teknologi",
    deskripsi: "Konferensi teknologi untuk founder, engineer, mahasiswa, dan komunitas digital.",
    budget: 200000000,
    nominal: 50000000,
    jenis: "In Cash",
    benefit: [
      "Booth eksklusif ukuran 3x3m di area utama",
      "Penempatan logo premium di semua materi promosi",
      "Akses 5 tiket VIP untuk perwakilan sponsor",
      "Kesempatan presentasi selama 15 menit di panggung utama",
    ],
    bagiHasil: 20,
    status: "Ditinjau Pendana",
    proposal: "proposal-tech-summit.pdf",
    funderId: "u-funder",
    transfer: null,
    history: [
      historyItem("Diajukan", "Organisasi", "Proposal dikirim.", "01 Sep 2026, 10:30"),
      historyItem("Admin Meninjau", "Admin", "Detail anggaran dicek.", "02 Sep 2026, 14:15"),
      historyItem("Admin Setuju", "Admin", "Pengajuan dibuka.", "03 Sep 2026, 09:00"),
      historyItem("Ditinjau Pendana", "Pendana", "Pendana membuka detail proposal.", "05 Sep 2026, 11:00"),
    ],
  },
  {
    id: "req-5",
    event: "Kongres Robotik Nasional",
    organisasi: "Komunitas Robotik Nasional",
    tanggal: "08 April 2026",
    lokasi: "Surabaya Expo Center",
    kategori: "Teknologi",
    deskripsi: "Pameran dan lomba robotik untuk sekolah, kampus, dan komunitas maker.",
    budget: 130000000,
    nominal: 45000000,
    jenis: "In Kind",
    benefit: ["Logo sponsor di area demo", "Booth produk", "Liputan media partner"],
    bagiHasil: 0,
    status: "Perlu Revisi",
    proposal: "proposal-robotik.pdf",
    funderId: null,
    transfer: null,
    history: [
      historyItem("Diajukan", "Organisasi", "Proposal dikirim.", "08 Apr 2026, 09:00"),
      historyItem("Perlu Revisi", "Admin", "Rincian in-kind perlu dibuat lebih spesifik.", "09 Apr 2026, 15:25"),
    ],
  },
];

let state = loadState();

function historyItem(aksi, aktor, catatan, waktu) {
  return { aksi, aktor, catatan, waktu };
}

function defaultState() {
  return {
    activeUserId: null,
    loginError: "",
    page: "Dashboard",
    selectedRequestId: null,
    search: "",
    filterStatus: "Semua",
    requests: initialRequests,
  };
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return defaultState();
  try {
    return { ...defaultState(), ...JSON.parse(saved) };
  } catch {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setState(next) {
  const shouldResetScroll =
    Object.prototype.hasOwnProperty.call(next, "page") ||
    Object.prototype.hasOwnProperty.call(next, "selectedRequestId");
  state = { ...state, ...next };
  saveState();
  render();
  if (shouldResetScroll) {
    window.scrollTo({ top: 0, behavior: "instant" });
  }
}

function currentUser() {
  return users.find((user) => user.id === state.activeUserId);
}

function rupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function todayStamp() {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function badge(status) {
  return `<span class="badge ${statusClass[status] || "badge-gray"}">${escapeHtml(status)}</span>`;
}

function render() {
  const app = document.querySelector("#app");
  const user = currentUser();
  app.innerHTML = user ? renderShell(user) : renderLogin();
}

function renderLogin() {
  return `
    <main class="hero-login">
      <section class="login-art">
        <div class="login-card">
          <div class="brand"><span class="brand-mark">S</span><span>SponsorHub</span></div>
          <h1>Login Sponsorship</h1>
          <p class="meta-label">Masuk memakai akun demo yang sudah disiapkan.</p>
          <div class="field">
            <label>Username</label>
            <input id="loginUsername" placeholder="Admin / organisasi / pendana" autofocus />
          </div>
          <div class="field">
            <label>Password</label>
            <input id="loginPassword" onkeydown="if(event.key === 'Enter') login()" type="password" placeholder="Masukkan password" />
          </div>
          ${state.loginError ? `<div class="notice">${escapeHtml(state.loginError)}</div>` : ""}
          <button class="primary" style="width: 100%" onclick="login()">Masuk</button>
          <p class="meta-label" style="text-align: center; margin-bottom: 0;">Admin / organisasi / pendana - Akundemo12345</p>
        </div>
      </section>
    </main>
  `;
}

function login() {
  const username = document.querySelector("#loginUsername")?.value.trim() || "";
  const password = document.querySelector("#loginPassword")?.value || "";
  const user = users.find((item) => item.username === username && item.password === password);
  if (!user) {
    setState({ loginError: "Username atau password tidak sesuai." });
    return;
  }
  setState({
    activeUserId: user.id,
    loginError: "",
    page: "Dashboard",
    selectedRequestId: null,
  });
}

function logout() {
  setState({ activeUserId: null, page: "Dashboard", selectedRequestId: null });
}

function renderShell(user) {
  return `
    <div class="app-shell">
      <header class="topbar">
        <div class="brand"><span class="brand-mark">S</span><span>SponsorHub</span></div>
        <div class="role-title">${roleTitle(user.role)}</div>
        <nav class="nav" aria-label="Navigasi utama">
          ${navItems(user.role)
            .map(
              (item) => `
                <button class="${state.page === item ? "active" : ""}" onclick="setState({ page: '${item}', selectedRequestId: null })">
                  ${item}
                </button>
              `,
            )
            .join("")}
        </nav>
        <div class="user-strip">
          <span>${user.role}</span>
          <span class="avatar">${user.nama.charAt(0)}</span>
          <button class="logout" onclick="logout()">Keluar</button>
        </div>
      </header>
      <main class="container">${renderPage(user)}</main>
    </div>
  `;
}

function roleTitle(role) {
  if (role === "Admin") return "Dashboard Admin Sponsorship";
  if (role === "Pendana") return "Dashboard Pendana Sponsorship";
  return "Dashboard Organisasi Sponsorship";
}

function navItems(role) {
  if (role === "Admin") return ["Dashboard", "Antrian Review", "Bagi Hasil", "Verifikasi Transfer"];
  if (role === "Pendana") return ["Dashboard", "Upcoming Event", "Komitmen Saya", "Transfer"];
  return ["Dashboard", "Pengajuan Saya", "Buat Pengajuan", "Transfer"];
}

function renderPage(user) {
  if (state.selectedRequestId) return renderDetail(user, findRequest(state.selectedRequestId));
  if (state.page === "Buat Pengajuan") return renderCreateForm();
  if (state.page === "Upcoming Event") return renderMarketplace();
  if (state.page === "Antrian Review") return renderAdminQueue();
  if (state.page === "Bagi Hasil") return renderTermsPage();
  if (state.page === "Verifikasi Transfer" || state.page === "Transfer") return renderTransferPage(user);
  if (state.page === "Komitmen Saya") return renderCommitments();
  if (state.page === "Pengajuan Saya") return renderOrganizationRequests();
  return renderDashboard(user);
}

function findRequest(id) {
  return state.requests.find((request) => request.id === id);
}

function renderDashboard(user) {
  if (user.role === "Admin") return renderAdminDashboard();
  if (user.role === "Pendana") return renderFunderDashboard();
  return renderOrganizationDashboard();
}

function renderAdminDashboard() {
  const active = state.requests.filter((request) => !["Ditolak", "Selesai"].includes(request.status)).length;
  const review = state.requests.filter((request) => request.status === "Review Admin").length;
  const funded = state.requests
    .filter((request) => ["Transfer Terverifikasi", "Selesai", "Menunggu Transfer"].includes(request.status))
    .reduce((total, request) => total + request.nominal, 0);
  return `
    ${pageHead("Dashboard Admin", "Pantau semua pengajuan, review, dan pendanaan aktif.")}
    ${kpiGrid([
      ["Pengajuan Aktif", active, "A"],
      ["Menunggu Review", review, "R"],
      ["Total Terdanai", rupiah(funded), "Rp"],
    ])}
    ${requestsTable("Daftar Pengajuan Sponsorship", filteredRequests(), "Admin")}
  `;
}

function renderOrganizationDashboard() {
  const mine = organizationRequests();
  const active = mine.filter((request) => !["Ditolak", "Selesai"].includes(request.status)).length;
  const revisions = mine.filter((request) => request.status === "Perlu Revisi").length;
  const funded = mine.filter((request) => request.status === "Selesai").reduce((total, request) => total + request.nominal, 0);
  return `
    ${pageHead("Dashboard Organisasi", "Kelola proposal sponsorship dari draft sampai dana diterima.", `<button class="primary" onclick="setState({ page: 'Buat Pengajuan' })">Buat Pengajuan</button>`)}
    ${kpiGrid([
      ["Pengajuan Aktif", active, "A"],
      ["Perlu Revisi", revisions, "R"],
      ["Dana Selesai", rupiah(funded), "Rp"],
    ])}
    ${requestsTable("Pengajuan Saya", mine, "Organisasi")}
  `;
}

function renderFunderDashboard() {
  const commitments = state.requests.filter((request) => request.funderId === "u-funder");
  const total = commitments.reduce((sum, request) => sum + request.nominal, 0);
  const running = commitments.filter((request) => request.status !== "Selesai").length;
  const pendingTransfer = commitments.filter((request) => request.status === "Menunggu Transfer").reduce((sum, request) => sum + request.nominal, 0);
  return `
    ${pageHead("Dashboard Pendana", "Review peluang sponsorship dan selesaikan komitmen transfer.")}
    ${kpiGrid([
      ["Total Komitmen", rupiah(total), "Rp"],
      ["Proyek Berjalan", running, "P"],
      ["Menunggu Transfer", rupiah(pendingTransfer), "T"],
    ])}
    ${requestsTable("Komitmen Aktif", commitments, "Pendana")}
  `;
}

function pageHead(title, subtitle, action = "") {
  return `
    <section class="view-head">
      <div>
        <h1>${title}</h1>
        <p>${subtitle}</p>
      </div>
      ${action}
    </section>
  `;
}

function kpiGrid(items) {
  return `
    <section class="kpi-grid">
      ${items
        .map(
          ([label, value, icon]) => `
            <article class="kpi-card">
              <div>
                <div class="kpi-label">${label}</div>
                <div class="kpi-value">${value}</div>
              </div>
              <div class="kpi-icon">${icon}</div>
            </article>
          `,
        )
        .join("")}
    </section>
  `;
}

function renderOrganizationRequests() {
  return `
    ${pageHead("Pengajuan Saya", "Cari, cek status, dan lanjutkan pengajuan sponsorship.", `<button class="primary" onclick="setState({ page: 'Buat Pengajuan' })">Buat Pengajuan</button>`)}
    ${requestsTable("Daftar Pengajuan", organizationRequests(), "Organisasi", true)}
  `;
}

function organizationRequests() {
  return state.requests.filter((request) => !request.ownerId || request.ownerId === "u-org");
}

function renderAdminQueue() {
  const rows = state.requests.filter((request) => ["Review Admin", "Perlu Revisi"].includes(request.status));
  return `
    ${pageHead("Antrian Review", "Validasi proposal masuk dan arahkan status pengajuan.")}
    ${requestsTable("Proposal Menunggu Keputusan", rows, "Admin")}
  `;
}

function renderTermsPage() {
  const rows = state.requests.filter((request) => request.status === "Disetujui Pendana");
  return `
    ${pageHead("Bagi Hasil", "Atur atau konfirmasi skema bagi hasil sebelum transfer.")}
    ${requestsTable("Menunggu Pengaturan Bagi Hasil", rows, "Admin")}
  `;
}

function renderCommitments() {
  const rows = state.requests.filter((request) => request.funderId === "u-funder");
  return `
    ${pageHead("Komitmen Saya", "Daftar event yang sedang atau sudah didanai.")}
    ${requestsTable("Komitmen Aktif", rows, "Pendana")}
  `;
}

function renderMarketplace() {
  const rows = state.requests.filter((request) => request.status === "Terbuka");
  return `
    ${pageHead("Upcoming Event Pendana", "Temukan event yang siap didanai.")}
    <section class="toolbar">
      <input class="search-input" placeholder="Cari acara..." value="${escapeHtml(state.search)}" oninput="setState({ search: this.value })" />
      <select onchange="setState({ filterStatus: this.value })">
        <option ${state.filterStatus === "Semua" ? "selected" : ""}>Semua</option>
        <option ${state.filterStatus === "Teknologi" ? "selected" : ""}>Teknologi</option>
        <option ${state.filterStatus === "Edukasi" ? "selected" : ""}>Edukasi</option>
        <option ${state.filterStatus === "Hiburan" ? "selected" : ""}>Hiburan</option>
      </select>
    </section>
    <section class="market-grid">
      ${marketplaceRows(rows)
        .map(
          (request) => `
            <article class="event-card">
              <div class="event-card-header">
                <div>
                  <h3>${escapeHtml(request.event)}</h3>
                  <div class="meta-label">Organisasi</div>
                  <div class="meta-value">${escapeHtml(request.organisasi)}</div>
                </div>
                ${badge(request.status)}
              </div>
              <div class="meta-label">Jumlah Diminta</div>
              <div class="meta-value">${rupiah(request.nominal)}</div>
              <div class="meta-label">Bagi Hasil</div>
              <div class="meta-value">${request.bagiHasil || 0}%</div>
              <button class="primary" onclick="openDetail('${request.id}')">Review Detail</button>
            </article>
          `,
        )
        .join("") || `<div class="empty-state">Belum ada event yang sesuai filter.</div>`}
    </section>
  `;
}

function marketplaceRows(rows) {
  const query = state.search.trim().toLowerCase();
  return rows.filter((request) => {
    const matchesQuery = !query || [request.event, request.organisasi, request.kategori].join(" ").toLowerCase().includes(query);
    const matchesCategory = state.filterStatus === "Semua" || request.kategori === state.filterStatus;
    return matchesQuery && matchesCategory;
  });
}

function renderTransferPage(user) {
  const rows =
    user.role === "Pendana"
      ? state.requests.filter((request) => request.funderId === user.id && request.status === "Menunggu Transfer")
      : state.requests.filter((request) => ["Menunggu Transfer", "Transfer Terverifikasi"].includes(request.status));
  return `
    ${pageHead(user.role === "Admin" ? "Verifikasi Transfer" : "Transfer", "Kelola bukti transfer sponsorship.")}
    ${requestsTable(user.role === "Admin" ? "Transfer Masuk" : "Menunggu Transfer", rows, user.role)}
  `;
}

function filteredRequests() {
  const query = state.search.trim().toLowerCase();
  return state.requests.filter((request) => {
    const text = [request.event, request.organisasi, request.status, request.kategori].join(" ").toLowerCase();
    return !query || text.includes(query);
  });
}

function requestsTable(title, rows, role, withToolbar = true) {
  const visibleRows = filterRows(rows);
  return `
    <section class="panel">
      <div class="panel-header">
        <h2>${title}</h2>
      </div>
      ${
        withToolbar
          ? `<div class="toolbar">
              <input class="search-input" placeholder="Cari event, organisasi, status..." value="${escapeHtml(state.search)}" oninput="setState({ search: this.value })" />
            </div>`
          : ""
      }
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Event/Campaign</th>
              <th>Organisasi</th>
              <th>Status</th>
              <th>Nominal</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${
              visibleRows.length
                ? visibleRows
                    .map(
                      (request) => `
                        <tr>
                          <td><strong>${escapeHtml(request.event)}</strong><br><span class="meta-label">${escapeHtml(request.tanggal)}</span></td>
                          <td>${escapeHtml(request.organisasi)}</td>
                          <td>${badge(request.status)}</td>
                          <td>${rupiah(request.nominal)}</td>
                          <td><div class="row-actions">${rowActions(request, role)}</div></td>
                        </tr>
                      `,
                    )
                    .join("")
                : `<tr><td colspan="5" class="empty-state">Data belum tersedia.</td></tr>`
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function filterRows(rows) {
  const query = state.search.trim().toLowerCase();
  if (!query) return rows;
  return rows.filter((request) => [request.event, request.organisasi, request.status, request.kategori].join(" ").toLowerCase().includes(query));
}

function rowActions(request, role) {
  const detail = `<button class="icon-btn" onclick="openDetail('${request.id}')" title="Lihat detail">Detail</button>`;
  if (role === "Admin" && request.status === "Review Admin") {
    return `${detail}<button class="icon-btn" onclick="quickApprove('${request.id}')">Setuju</button>`;
  }
  if (role === "Admin" && request.status === "Disetujui Pendana") {
    return `${detail}<button class="icon-btn" onclick="setTerms('${request.id}')">Bagi Hasil</button>`;
  }
  if (role === "Admin" && request.status === "Menunggu Transfer") {
    return `${detail}<button class="icon-btn" onclick="verifyTransfer('${request.id}')">Verif</button>`;
  }
  if (role === "Pendana" && request.status === "Terbuka") {
    return `${detail}<button class="icon-btn" onclick="funderReview('${request.id}')">Review</button>`;
  }
  if (role === "Pendana" && request.status === "Menunggu Transfer") {
    return `${detail}<button class="icon-btn" onclick="openDetail('${request.id}')">Transfer</button>`;
  }
  return detail;
}

function renderCreateForm() {
  return `
    ${pageHead("Buat Pengajuan dengan Jenis Sponsorship", "Isi detail event, nominal, benefit sponsor, dan dokumen proposal.")}
    <form class="panel" onsubmit="submitRequest(event, 'Review Admin')">
      <section class="form-section">
        <h2>1. Informasi Event</h2>
        <div class="form-grid">
          ${field("Nama Event", "event", "Misal: Festival Musik Kampus")}
          ${field("Tanggal Event", "tanggal", "Misal: 20-22 Juli 2026")}
          ${field("Lokasi Event", "lokasi", "Misal: Jakarta Convention Center")}
          ${field("Kategori", "kategori", "Teknologi / Edukasi / Hiburan")}
          ${field("Deskripsi Event", "deskripsi", "Ceritakan detail tentang event Anda...", "textarea", "wide")}
        </div>
      </section>
      <section class="form-section">
        <h2>2. Jenis Sponsorship</h2>
        <div class="form-grid">
          <div class="field">
            <label>Jenis Sponsorship</label>
            <select name="jenis">
              <option>In Cash</option>
              <option>In Kind</option>
            </select>
          </div>
          ${field("Nominal yang Diajukan", "nominal", "Misal: 20000000", "number")}
          ${field("Total Budget", "budget", "Misal: 80000000", "number")}
          ${field("Usulan Bagi Hasil (%)", "bagiHasil", "Misal: 15", "number")}
        </div>
      </section>
      <section class="form-section">
        <h2>3. Benefit untuk Sponsor</h2>
        ${field("Benefit untuk Sponsor", "benefit", "Pisahkan tiap benefit dengan koma.", "textarea", "wide")}
      </section>
      <section class="form-section">
        <h2>4. Dokumen Pendukung</h2>
        <div class="file-drop">Seret file ke sini atau klik untuk unggah. Untuk MVP, nama file akan disimulasikan.</div>
      </section>
      <div class="form-actions">
        <button class="secondary" type="button" onclick="saveDraftFromForm(this.form)">Simpan Draft</button>
        <button class="primary" type="submit">Tahap Berikutnya</button>
      </div>
    </form>
  `;
}

function field(label, name, placeholder, type = "text", className = "") {
  const input =
    type === "textarea"
      ? `<textarea name="${name}" placeholder="${placeholder}" required></textarea>`
      : `<input name="${name}" type="${type}" placeholder="${placeholder}" required />`;
  return `<div class="field ${className}"><label>${label}</label>${input}</div>`;
}

function saveDraftFromForm(form) {
  createRequest(form, "Draft");
}

function submitRequest(event, status) {
  event.preventDefault();
  createRequest(event.currentTarget, status);
}

function createRequest(form, status) {
  const data = new FormData(form);
  const request = {
    id: `req-${Date.now()}`,
    ownerId: "u-org",
    event: data.get("event"),
    organisasi: "Komunitas Baru",
    tanggal: data.get("tanggal"),
    lokasi: data.get("lokasi"),
    kategori: data.get("kategori"),
    deskripsi: data.get("deskripsi"),
    budget: Number(data.get("budget")),
    nominal: Number(data.get("nominal")),
    jenis: data.get("jenis"),
    benefit: String(data.get("benefit")).split(",").map((item) => item.trim()).filter(Boolean),
    bagiHasil: Number(data.get("bagiHasil")),
    status,
    proposal: "proposal-demo.pdf",
    funderId: null,
    transfer: null,
    history: [
      historyItem(status === "Draft" ? "Draft Disimpan" : "Diajukan", "Organisasi", status === "Draft" ? "Pengajuan disimpan sebagai draft." : "Pengajuan dikirim ke admin.", todayStamp()),
    ],
  };
  state.requests = [request, ...state.requests];
  setState({ page: "Pengajuan Saya", selectedRequestId: request.id });
}

function openDetail(id) {
  const request = findRequest(id);
  const user = currentUser();
  if (user.role === "Pendana" && request.status === "Terbuka") {
    updateRequest(id, {
      status: "Ditinjau Pendana",
      funderId: user.id,
      history: [...request.history, historyItem("Ditinjau Pendana", "Pendana", "Pendana membuka detail proposal.", todayStamp())],
    });
  }
  setState({ selectedRequestId: id });
}

function renderDetail(user, request) {
  if (!request) return `<div class="empty-state">Pengajuan tidak ditemukan.</div>`;
  return `
    ${pageHead(request.event, `${request.organisasi} - ${request.status}`, `<button class="secondary" onclick="setState({ selectedRequestId: null })">Kembali</button>`)}
    <section class="detail-layout">
      <div class="detail-stack">
        <article class="detail-card">
          <h2>Informasi Acara</h2>
          <h1>${escapeHtml(request.event)}</h1>
          <p>
            <strong>Organisasi:</strong> ${escapeHtml(request.organisasi)}<br>
            <strong>Tanggal:</strong> ${escapeHtml(request.tanggal)}<br>
            <strong>Lokasi:</strong> ${escapeHtml(request.lokasi)}
          </p>
          <p>${escapeHtml(request.deskripsi)}</p>
        </article>
        <article class="detail-card">
          <h2>Detail Keuangan</h2>
          <p>
            Total Anggaran: <strong>${rupiah(request.budget)}</strong><br>
            Pengajuan Dana: <strong>${rupiah(request.nominal)}</strong><br>
            Jenis Sponsorship: <strong>${escapeHtml(request.jenis)}</strong><br>
            Bagi Hasil yang Diajukan: <strong>${request.bagiHasil || 0}%</strong>
          </p>
        </article>
        <div class="split-grid">
          <article class="detail-card">
            <h3>Benefit Sponsor</h3>
            <ul class="benefit-list">${request.benefit.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
          </article>
          <article class="detail-card">
            <h3>Dokumen Pendukung</h3>
            <p>${escapeHtml(request.proposal)}</p>
            <button class="primary">Unduh Proposal (PDF)</button>
          </article>
        </div>
        ${renderTransferInput(user, request)}
      </div>
      <aside class="detail-card">
        <h2>Riwayat Status</h2>
        <div class="timeline">
          ${request.history
            .map(
              (item) => `
                <div class="timeline-item">
                  <div class="timeline-action">${escapeHtml(item.aksi)}</div>
                  <div class="timeline-time">${escapeHtml(item.waktu)}</div>
                  <div>oleh ${escapeHtml(item.aktor)}</div>
                  <div class="timeline-note">${escapeHtml(item.catatan)}</div>
                </div>
              `,
            )
            .join("")}
        </div>
      </aside>
    </section>
    ${detailActions(user, request)}
  `;
}

function renderTransferInput(user, request) {
  if (user.role !== "Pendana" || request.status !== "Menunggu Transfer") return "";
  if (request.transfer?.status === "Menunggu Verifikasi Admin") {
    return `
      <article class="detail-card">
        <h3>Bukti Transfer Terkirim</h3>
        <p>Referensi: <strong>${escapeHtml(request.transfer.referensi || request.transfer.bukti)}</strong></p>
        <div class="notice">Bukti transfer sedang menunggu verifikasi admin.</div>
      </article>
    `;
  }
  return `
    <article class="detail-card">
      <h3>Input Bukti Transfer</h3>
      <div class="transfer-form" style="padding: 0;">
        <div class="field"><label>Nominal Transfer</label><input id="transferAmount" value="${request.nominal}" type="number" /></div>
        <div class="field"><label>Referensi / Bukti</label><input id="transferProof" placeholder="TRX-2026-001 atau bukti-transfer.pdf" /></div>
        <button class="primary" onclick="submitTransfer('${request.id}')">Kirim Bukti</button>
      </div>
    </article>
  `;
}

function detailActions(user, request) {
  const actions = [];
  if (user.role === "Admin" && request.status === "Review Admin") {
    actions.push(`<button class="primary" onclick="quickApprove('${request.id}')">Setujui</button>`);
    actions.push(`<button class="danger" onclick="rejectRequest('${request.id}')">Tolak</button>`);
    actions.push(`<button class="warning" onclick="requestRevision('${request.id}')">Minta Revisi</button>`);
  }
  if (user.role === "Admin" && request.status === "Disetujui Pendana") {
    actions.push(`<button class="primary" onclick="setTerms('${request.id}')">Setujui Bagi Hasil</button>`);
  }
  if (user.role === "Admin" && request.status === "Menunggu Transfer") {
    actions.push(`<button class="primary" onclick="verifyTransfer('${request.id}')">Verifikasi Transfer</button>`);
    actions.push(`<button class="warning" onclick="markTransferIssue('${request.id}')">Minta Perbaikan Bukti</button>`);
  }
  if (user.role === "Pendana" && ["Terbuka", "Ditinjau Pendana"].includes(request.status)) {
    actions.push(`<button class="primary" onclick="approveFunding('${request.id}')">Setujui Pendanaan</button>`);
    actions.push(`<button class="danger" onclick="funderReject('${request.id}')">Tolak</button>`);
  }
  if (user.role === "Organisasi" && ["Draft", "Perlu Revisi"].includes(request.status)) {
    actions.push(`<button class="primary" onclick="resubmitRequest('${request.id}')">Submit ke Admin</button>`);
  }
  if (!actions.length) return "";
  return `<div class="action-bar">${actions.join("")}</div>`;
}

function updateRequest(id, patch) {
  state.requests = state.requests.map((request) => (request.id === id ? { ...request, ...patch } : request));
  saveState();
}

function withHistory(request, status, aksi, aktor, catatan, extra = {}) {
  return {
    ...extra,
    status,
    history: [...request.history, historyItem(aksi, aktor, catatan, todayStamp())],
  };
}

function quickApprove(id) {
  const request = findRequest(id);
  updateRequest(id, withHistory(request, "Terbuka", "Admin Setuju", "Admin", "Pengajuan dibuka untuk pendanaan."));
  setState({ selectedRequestId: id });
}

function rejectRequest(id) {
  const request = findRequest(id);
  updateRequest(id, withHistory(request, "Ditolak", "Ditolak", "Admin", "Proposal belum memenuhi kriteria sponsorship."));
  setState({ selectedRequestId: id });
}

function requestRevision(id) {
  const request = findRequest(id);
  updateRequest(id, withHistory(request, "Perlu Revisi", "Perlu Revisi", "Admin", "Mohon lengkapi detail budget dan benefit sponsor."));
  setState({ selectedRequestId: id });
}

function funderReview(id) {
  openDetail(id);
}

function approveFunding(id) {
  const request = findRequest(id);
  updateRequest(id, withHistory(request, "Disetujui Pendana", "Disetujui Pendana", "Pendana", "Pendana menyetujui pengajuan.", { funderId: "u-funder" }));
  setState({ selectedRequestId: id });
}

function funderReject(id) {
  const request = findRequest(id);
  updateRequest(id, withHistory(request, "Terbuka", "Ditolak Pendana", "Pendana", "Pendana menolak, proposal tetap terbuka untuk pendana lain.", { funderId: null }));
  setState({ selectedRequestId: id });
}

function setTerms(id) {
  const request = findRequest(id);
  updateRequest(
    id,
    withHistory(request, "Menunggu Transfer", "Bagi Hasil Disetujui", "Admin", `Skema bagi hasil ${request.bagiHasil || 0}% disetujui.`, {
      transfer: { nominal: request.nominal, referensi: "", bukti: "", status: "Menunggu Transfer" },
    }),
  );
  setState({ selectedRequestId: id });
}

function submitTransfer(id) {
  const request = findRequest(id);
  const amount = Number(document.querySelector("#transferAmount")?.value || request.nominal);
  const proof = document.querySelector("#transferProof")?.value || "bukti-transfer-demo.pdf";
  updateRequest(
    id,
    withHistory(request, "Menunggu Transfer", "Bukti Transfer Dikirim", "Pendana", `Bukti transfer ${proof} dikirim.`, {
      transfer: { nominal: amount, referensi: proof, bukti: proof, status: "Menunggu Verifikasi Admin" },
    }),
  );
  setState({ selectedRequestId: id });
}

function verifyTransfer(id) {
  const request = findRequest(id);
  updateRequest(
    id,
    withHistory(request, "Selesai", "Transfer Terverifikasi", "Admin", "Dana sponsorship sudah diverifikasi dan proses selesai.", {
      transfer: { ...(request.transfer || {}), status: "Terverifikasi" },
    }),
  );
  setState({ selectedRequestId: id });
}

function markTransferIssue(id) {
  const request = findRequest(id);
  updateRequest(id, withHistory(request, "Menunggu Transfer", "Bukti Transfer Perlu Diperbaiki", "Admin", "Referensi transfer belum cukup jelas."));
  setState({ selectedRequestId: id });
}

function resubmitRequest(id) {
  const request = findRequest(id);
  updateRequest(id, withHistory(request, "Review Admin", "Diajukan Ulang", "Organisasi", "Pengajuan dikirim ulang setelah revisi."));
  setState({ selectedRequestId: id });
}

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

window.setState = setState;
window.login = login;
window.logout = logout;
window.openDetail = openDetail;
window.quickApprove = quickApprove;
window.rejectRequest = rejectRequest;
window.requestRevision = requestRevision;
window.funderReview = funderReview;
window.approveFunding = approveFunding;
window.funderReject = funderReject;
window.setTerms = setTerms;
window.submitTransfer = submitTransfer;
window.verifyTransfer = verifyTransfer;
window.markTransferIssue = markTransferIssue;
window.resubmitRequest = resubmitRequest;
window.submitRequest = submitRequest;
window.saveDraftFromForm = saveDraftFromForm;

render();
window.scrollTo({ top: 0, behavior: "instant" });
