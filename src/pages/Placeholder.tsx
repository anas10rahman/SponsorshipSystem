import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { Empty } from "@/components/Empty";

type Props = { title: string; subtitle?: string };

/** Halaman skeleton — diisi penuh di milestone berikutnya. */
export default function Placeholder({ title, subtitle }: Props) {
  return (
    <>
      <Topbar title={title} />
      <div className="sh-shell__content">
        <PageHead title={title} subtitle={subtitle} />
        <Empty
          title="Halaman dalam pengerjaan"
          description="This page will be filled in at the next milestone per PRD §13."
        />
      </div>
    </>
  );
}
