import { Link } from "react-router-dom";
import { Heart, Twitter, Youtube, Mail } from "lucide-react";
import brandLogo from "../assets/logo.png";

const footerLinks = {
  about: {
    title: "About",
    links: [
      { label: "Our Mission", href: "/about" },
      { label: "Statement of Faith", href: "/about#faith" },
      { label: "Leadership", href: "/about#leadership" },
      { label: "Contact Us", href: "/about#contact" },
    ],
  },
  quickLinks: {
    title: "Quick Links",
    links: [
      { label: "Scriptures", href: "/bible" },
      { label: "Prayer Wall", href: "/prayer-wall" },
      { label: "Sermon Library", href: "/sermons" },
      { label: "Events Calendar", href: "/events" },
      { label: "Giving History", href: "/donations" },
    ],
  },
  resources: {
    title: "Resources",
    links: [
      { label: "Scripture Study", href: "/bible" },
      { label: "Prayer Requests", href: "/prayer-wall" },
      { label: "Sermons & Media", href: "/sermons" },
      { label: "Global Missions", href: "/events" },
    ],
  },
};

export default function Footer() {
  return (
    <footer className="bg-[#0c1b33] text-white">
      {/* Top gradient line */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-[#d4af37]/30 to-transparent" />

      <div className="container-main mx-auto px-4 sm:px-6 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img src={brandLogo} alt="Kingdom Missions Network" className="h-10 w-auto object-contain" width="40" height="40" />
              <span className="font-brand text-xl font-bold">Kingdom Missions Network</span>
            </Link>
            <p className="text-white/60 text-sm leading-relaxed max-w-sm mb-6">
              A global platform connecting Christian believers worldwide through
              prayer, scripture, and fellowship.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="/"
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#d4af37]/20 transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="/"
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#d4af37]/20 transition-colors"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a
                href="/"
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#d4af37]/20 transition-colors"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Link Columns */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h4 className="font-display text-lg font-semibold mb-4">{section.title}</h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-white/60 hover:text-[#d4af37] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/50 flex items-center gap-1.5">
            &copy; 2026 Kingdom Missions Network. All Rights Reserved.
            <Heart className="w-3 h-3 text-[#d4af37] fill-[#d4af37]" />
          </p>
          <div className="flex items-center gap-4 text-xs text-white/40">
            <Link to="/about" className="hover:text-[#d4af37] transition-colors">About Us</Link>
            <Link to="/about#faith" className="hover:text-[#d4af37] transition-colors">Statement of Faith</Link>
            <Link to="/about#contact" className="hover:text-[#d4af37] transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
