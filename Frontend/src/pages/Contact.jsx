import { useRef, useState } from "react";
import { Mail, Linkedin, Instagram, Github, MessageCircle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { PageHero, Reveal } from "../components/Section";
import { Seo } from "../components/Seo";
import { webPageSchema, breadcrumbSchema } from "../lib/seo";
import { SITE_EMAIL, GITHUB_ORG_URL, WHATSAPP_URL } from "../lib/site";
import { apiClient, apiErrorMessage } from "../services/apiClient";

const TOPICS = [
  ["project", "Project"],
  ["mentorship", "Mentorship"],
  ["collab", "Collaboration"],
  ["other", "Other"],
];

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const formRef = useRef(null);

  const onSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const values = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      phone: String(formData.get("phone") || ""),
      topic: String(formData.get("topic") || "project"),
      message: String(formData.get("message") || ""),
    };

    const errs = {};
    if (!values.name.trim()) errs.name = "Please tell us your name";
    if (values.name.trim().length > 80) errs.name = "Name must be under 80 characters";
    if (!values.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
      errs.email = "That doesn't look like a valid email";
    if (values.email.trim().length > 160) errs.email = "Email must be under 160 characters";
    if (values.phone.trim().length < 10 || values.phone.trim().length > 15)
      errs.phone = "Please enter a valid mobile number";
    if (!values.message.trim() || values.message.trim().length < 10)
      errs.message = "A few more words would help";
    if (values.message.trim().length > 1500) errs.message = "Message must be under 1500 characters";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setFormError("");
    setIsSending(true);

    try {
      await apiClient.post("/contact", {
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        topic: values.topic,
        message: values.message.trim(),
      });
      setSubmittedData(values);
      setSubmitted(true);
    } catch (err) {
      const fieldErrors = {};
      if (err.errors && Array.isArray(err.errors)) {
        err.errors.forEach((fe) => {
          if (fe && typeof fe.field === "string" && fe.message) {
            fieldErrors[fe.field] = fe.message;
          }
        });
      }
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
      } else {
        setFormError(apiErrorMessage(err, "We couldn't send your message. Please try again."));
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Seo
        title="Contact - GhostCode Dynamics"
        description="Start a conversation about your project, mentorship, or collaboration with GhostCode Dynamics."
        path="/contact"
        schemas={[
          webPageSchema(
            "Contact - GhostCode Dynamics",
            "Start a conversation about your project, mentorship, or collaboration with GhostCode Dynamics.",
            "/contact",
          ),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Contact", path: "/contact" },
          ]),
        ]}
      />
      <PageHero
        eyebrow="Contact"
        title="Let's build something."
        description="Tell us about your project, idea, or what you're trying to learn. Real replies from a real person — usually within a day or two."
      />

      <section className="container-prose pt-16 pb-24 md:pt-20">
        <div className="grid gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 md:p-10 shadow-elevated">
              <div className="absolute inset-0 bg-aurora opacity-30" aria-hidden />
              <div className="relative">
                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="py-10 text-center"
                  >
                    <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <h2 className="mt-5 font-display text-2xl font-semibold text-foreground">
                      Inquiry received.
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Thanks, {submittedData.name.split(" ")[0]}. We received your inquiry and will
                      reply within 24–48 hours at{" "}
                      <span className="text-foreground">{submittedData.email}</span>.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSubmitted(false);
                        setSubmittedData(null);
                        formRef.current?.reset();
                      }}
                      className="mt-6 text-sm font-medium text-primary hover:underline"
                    >
                      Send another message
                    </button>
                  </motion.div>
                ) : (
                  <form ref={formRef} onSubmit={onSubmit} className="space-y-5" noValidate>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field id="contact-name" label="Your name" error={errors.name}>
                        <input
                          id="contact-name"
                          name="name"
                          required
                          maxLength={80}
                          className={inputCls(!!errors.name)}
                          placeholder="Enter your name"
                          autoComplete="name"
                        />
                      </Field>
                      <Field id="contact-email" label="Email" error={errors.email}>
                        <input
                          id="contact-email"
                          name="email"
                          required
                          type="email"
                          maxLength={160}
                          className={inputCls(!!errors.email)}
                          placeholder="you@company.com"
                          autoComplete="email"
                        />
                      </Field>
                      <Field id="contact-phone" label="Mobile Number" error={errors.phone}>
                        <input
                          id="contact-phone"
                          name="phone"
                          type="tel"
                          required
                          maxLength={15}
                          className={inputCls(!!errors.phone)}
                          placeholder="+91 0000000000"
                          autoComplete="tel"
                        />
                      </Field>
                    </div>

                    <Field label="What can we help with?">
                      <div className="flex flex-wrap gap-2">
                        {TOPICS.map(([val, label]) => (
                          <label key={val} className="cursor-pointer">
                            <input
                              type="radio"
                              name="topic"
                              value={val}
                              defaultChecked={val === "project"}
                              className="peer sr-only"
                            />
                            <span className="inline-flex rounded-full border border-border bg-surface/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground peer-checked:border-primary/60 peer-checked:bg-primary/15 peer-checked:text-foreground">
                              {label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </Field>

                    <Field id="contact-message" label="Message" error={errors.message}>
                      <textarea
                        id="contact-message"
                        name="message"
                        required
                        rows={6}
                        maxLength={1500}
                        className={inputCls(!!errors.message) + " resize-y"}
                        placeholder="Tell us about your project, goal or what you're trying to learn..."
                      />
                    </Field>

                    {formError && (
                      <p className="text-xs text-destructive" role="alert">
                        {formError}
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-4">
                      <p className="text-xs text-muted-foreground">
                        We&apos;ll only use your email to reply. No newsletters, no spam.
                      </p>
                      <button
                        type="submit"
                        disabled={isSending}
                        className="inline-flex items-center justify-center rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 shadow-elevated"
                      >
                        {isSending ? "Sending..." : "Send message"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </Reveal>

          <Reveal className="lg:col-span-5" delay={0.1}>
            <div className="space-y-4">
              <ContactCard
                icon={<Mail className="h-4 w-4" />}
                label="Email"
                value={SITE_EMAIL}
                href={`mailto:${SITE_EMAIL}`}
              />
              <ContactCard
                icon={<Linkedin className="h-4 w-4" />}
                label="LinkedIn — Company"
                value="ghostcodedynamics"
                href="https://www.linkedin.com/company/ghostcodedynamics/"
                external
              />
              <ContactCard
                icon={<Linkedin className="h-4 w-4" />}
                label="LinkedIn — Founder"
                value="jeetahirwar"
                href="https://www.linkedin.com/in/jeetahirwar/"
                external
              />
              <ContactCard
                icon={<Instagram className="h-4 w-4" />}
                label="Instagram"
                value="@ghostcode_dynamics"
                href="https://www.instagram.com/ghostcode_dynamics"
                external
              />
              <ContactCard
                icon={<Github className="h-4 w-4" />}
                label="GitHub"
                value="ghostcodedynamics"
                href={GITHUB_ORG_URL}
                external
              />
              {WHATSAPP_URL ? (
                <ContactCard
                  icon={<MessageCircle className="h-4 w-4" />}
                  label="WhatsApp"
                  value="Chat with us"
                  href={WHATSAPP_URL}
                  external
                />
              ) : (
                <ContactCard
                  icon={<MessageCircle className="h-4 w-4" />}
                  label="WhatsApp"
                  value="Available on request"
                />
              )}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

function Field({ id, label, error, children }) {
  const labelClass = "text-xs font-medium uppercase tracking-wider text-muted-foreground";
  return (
    <div className="block">
      {id ? (
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
      ) : (
        <p className={labelClass}>{label}</p>
      )}
      <div className="mt-2">{children}</div>
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function inputCls(hasError) {
  return [
    "w-full rounded-xl border bg-surface/60 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground",
    "transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
    hasError ? "border-destructive" : "border-border focus:border-primary/60",
  ].join(" ");
}

function ContactCard({ icon, label, value, href, external = false }) {
  const inner = (
    <div className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40">
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-surface-elevated text-primary ring-1 ring-border">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
  if (!href) return inner;
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="block"
    >
      {inner}
    </a>
  );
}
