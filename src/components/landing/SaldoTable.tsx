import { SALDO_ROWS } from "@/lib/landingContent";

/** Rincian mekanisme saldo biaya pengajuan — dipakai di jawaban FAQ
 *  pertama. Nominalnya sengaja pakai font mono supaya angka sejajar
 *  dan terbaca sebagai data, bukan hiasan. */
export function SaldoTable() {
  return (
    <div className="lp-saldo">
      {SALDO_ROWS.map((r) => (
        <div key={r.title} className="lp-saldo__row">
          <div>
            <h4>{r.title}</h4>
            <p>{r.desc}</p>
          </div>
          <span className={`lp-saldo__amt lp-saldo__amt--${r.tone}`}>
            {r.amount}
          </span>
        </div>
      ))}
    </div>
  );
}
