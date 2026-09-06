import { Link } from "react-router";
import { Github, Linkedin, Instagram, Mail } from "lucide-react";
import { Logo } from "../components/Logo";
import { SITE_EMAIL, GITHUB_ORG_URL } from "../lib/site";

export function Footer() {
  return (
    <footer className="relative border-t border-border/60 bg-surface/30">
      <div className="container-prose py-16">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <Logo height={56} />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Building digital solutions for businesses while empowering the next generation of tech
              professionals.
            </p>
            <div className="mt-6 flex items-center gap-2">
              <SocialLink
                href="https://www.linkedin.com/company/ghostcodedynamics/"
                label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </SocialLink>
              <SocialLink href="https://www.instagram.com/ghostcode_dynamics" label="Instagram">
                <Instagram className="h-4 w-4" />
              </SocialLink>
              <SocialLink href={GITHUB_ORG_URL} label="GitHub">
                <Github className="h-4 w-4" />
              </SocialLink>
              <SocialLink href={`mailto:${SITE_EMAIL}`} label="Email">
                <Mail className="h-4 w-4" />
              </SocialLink>
            </div>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Explore
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <FooterLink to="/services">Services</FooterLink>
              <FooterLink to="/portfolio">Portfolio</FooterLink>
              <FooterLink to="/about">About</FooterLink>
              <FooterLink to="/founder">Founder</FooterLink>
              <FooterLink to="/" hash="why-choose-us">
                Why Choose Us
              </FooterLink>
              <FooterLink to="/contact">Contact</FooterLink>
            </ul>
          </div>

          <div className="md:col-span-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Get in touch
            </h4>
            <a
              href={`mailto:${SITE_EMAIL}`}
              className="mt-4 block text-sm text-foreground hover:text-primary transition-colors"
            >
              {SITE_EMAIL}
            </a>
            <p className="mt-2 text-sm text-muted-foreground">
              For project inquiries, mentorship & collaborations.
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} GhostCode Dynamics. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built with passion by <span className="text-foreground">GhostCode Dynamics</span>.
          </p>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({ href, label, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface/60 text-muted-foreground transition hover:text-foreground hover:border-primary/40"
    >
      {children}
    </a>
  );
}

function FooterLink({ to, hash, children }) {
  const href = hash ? `/${to.replace(/^\//, "")}#${hash}` : to;
  return (
    <li>
      <Link
        to={href}
        className="text-muted-foreground transition-colors hover:text-foreground"
      >
        {children}
      </Link>
    </li>
  );
}
