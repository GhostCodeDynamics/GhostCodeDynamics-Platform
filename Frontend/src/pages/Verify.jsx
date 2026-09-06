import { Search, ShieldCheck, FileText, QrCode } from "lucide-react";
import { PageHero, SectionHeader, Reveal } from "../components/Section";
import { Seo } from "../components/Seo";
import { Faq, FeatureGrid, ProgramCta, StatusNote } from "../components/ProgramPage";
import { webPageSchema, breadcrumbSchema, NOINDEX_ROBOTS } from "../lib/seo";

const title = "Certificate Verification - GhostCode Dynamics";
const description =
  "How GhostCode Dynamics verifiable credential IDs are checked. The registry opens with the first issued certificate.";
const path = "/verify";

const FEATURES = [
  {
    icon: <Search className="h-5 w-5" />,
    title: "Public lookup",
    desc: "Anyone with a certificate ID will be able to confirm it without an account, a login or a support email.",
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: "Tamper-evident IDs",
    desc: "Each certificate carries a signed identifier tied to the credential record, so edited documents fail to match.",
  },
  {
    icon: <FileText className="h-5 w-5" />,
    title: "Issued-on details",
    desc: "Verification returns the recipient name, programme, issue date and completion status — nothing more.",
  },
  {
    icon: <QrCode className="h-5 w-5" />,
    title: "QR friendly",
    desc: "Every certificate prints a QR code that opens this page with the ID already filled in.",
  },
];

const FAQS = [
  {
    q: "Is verification live?",
    a: "Not yet. No GhostCode certificates have been issued, so the registry is empty and the lookup has not been switched on. It opens together with the first issued certificate — this page will be the single place to check one.",
  },
  {
    q: "What does a certificate ID look like?",
    a: "GCD-YYYY-XXXXXX — for example GCD-2026-A81C4F. It is printed on the certificate and encoded in its QR code.",
  },
  {
    q: "Can an employer trust a verified result?",
    a: "Once the registry is live, yes. Verification is served from our own registry and returns the exact programme and dates, so claims can be checked against the certificate itself. Until certificates are actually issued, there is nothing automated to verify.",
  },
  {
    q: "I need a certificate checked before the registry opens?",
    a: "Email us, and we will confirm the document manually against our records. Automated lookup starts with the first cohort.",
  },
];

export default function Verify() {
  return (
    <>
      <Seo
        title={title}
        description={description}
        path={path}
        robots={NOINDEX_ROBOTS}
        schemas={[
          webPageSchema(title, description, path),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Verify", path },
          ]),
        ]}
      />
      <PageHero
        eyebrow="Verify · Registry opening soon"
        title="Verify a GhostCode certificate."
        description="Certificates issued for internships and programmes can be checked here in seconds using the ID printed on the document."
      >
        <StatusNote>No certificates issued yet · Registry empty by design</StatusNote>
      </PageHero>

      <section className="relative py-8 md:py-12">
        <div className="container-prose">
          <Reveal className="mx-auto max-w-2xl rounded-3xl border border-border bg-card/60 p-6 backdrop-blur sm:p-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">
              Current status
            </p>
            <h2 className="mt-3 font-display text-xl font-semibold tracking-tight text-foreground">
              Live lookups start with the first issued certificate
            </h2>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                No GhostCode certificates have been issued yet, so the registry is intentionally
                empty and the lookup is not running. There is no point in a search box that answers
                "not found" for every input — that would tell you nothing.
              </p>
              <p>
                When the first credential is issued, verification switches on right here: enter the
                ID exactly as printed and the result shows the recipient name, programme, issue
                date and completion status.
              </p>
            </div>

            <dl className="mt-6 rounded-2xl border border-border bg-surface/60 p-5">
              <dt className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">
                Certificate ID format
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
                <span className="font-mono text-foreground">GCD-YYYY-XXXXXX</span> — for example{" "}
                <span className="font-mono text-foreground">GCD-2026-A81C4F</span>. Printed on the
                document and encoded in the QR code on the certificate.
              </dd>
            </dl>

            <div className="mt-6 rounded-2xl border border-dashed border-border p-4 text-sm leading-relaxed text-muted-foreground">
              Need a document checked before the registry opens?{" "}
              <a
                href="mailto:ghostcodedynamics@gmail.com"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Send it to us
              </a>{" "}
              and we will confirm it manually against our records.
            </div>
          </Reveal>
        </div>
      </section>

      <FeatureGrid
        eyebrow="On launch"
        title="What verification guarantees"
        items={FEATURES}
        columns={4}
      />

      <section className="relative border-t border-border/60 py-16 md:py-24">
        <div className="container-prose">
          <SectionHeader
            eyebrow="Anatomy"
            title="What's on a GhostCode certificate"
            description="Every certificate is built around the same fields so verification results can be matched line for line."
          />
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { k: "Recipient", v: "Full name as enrolled" },
              { k: "Program", v: "Cohort, track or internship block" },
              { k: "Issued on", v: "Completion date" },
              { k: "Certificate ID", v: "GCD-YYYY-XXXXXX + QR" },
            ].map((f) => (
              <Reveal key={f.k}>
                <li className="h-full rounded-2xl border border-border bg-card/60 p-5 backdrop-blur">
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">
                    {f.k}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{f.v}</p>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <Faq items={FAQS} />

      <ProgramCta
        title="Need a manual check?"
        description="Send us the ID or a copy of the document and we will confirm its authenticity directly. Automated lookup goes live with the first issued certificate."
        primaryLabel="Contact us"
      />
    </>
  );
}