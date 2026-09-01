import { Link } from "react-router-dom";
import { ShieldCheck, Heart, BookOpen, Globe, Users, Flame, ArrowRight, Mail, Compass, Award, Anchor } from "lucide-react";
import SEO from "../components/SEO";
import ScrollReveal from "../components/ScrollReveal";
import brandLogo from "../assets/logo.png";

const faithStatements = [
  {
    number: "01",
    title: "The Holy Scriptures",
    scripture: "2 Timothy 3:16-17; 2 Peter 1:20-21",
    text: "We believe the Holy Bible, consisting of the Old and New Testaments, is the fully inspired, infallible, and authoritative Word of God. It serves as our supreme and final rule of faith, doctrine, and practice.",
  },
  {
    number: "02",
    title: "The Triune God",
    scripture: "Deuteronomy 6:4; Matthew 28:19; 2 Corinthians 13:14",
    text: "We believe in one eternally existing God, Creator of all things, who manifests Himself in three co-equal, co-eternal Persons: God the Father, God the Son, and God the Holy Spirit.",
  },
  {
    number: "03",
    title: "The Lord Jesus Christ",
    scripture: "John 1:1,14; 1 Corinthians 15:3-4; Hebrews 4:15",
    text: "We believe in the full deity and true humanity of Jesus Christ, His virgin birth, sinless life, atoning death on the Cross, physical resurrection from the grave, ascension to the right hand of the Father, and imminent bodily return in glory.",
  },
  {
    number: "04",
    title: "Salvation by Grace",
    scripture: "Ephesians 2:8-9; Romans 10:9-10; Titus 3:5",
    text: "We believe that salvation is a free gift of God's grace received through personal faith in the Lord Jesus Christ alone, whose shed blood cleanses us from all sin. No human effort can earn or substitute for this divine redemption.",
  },
  {
    number: "05",
    title: "The Holy Spirit & Spiritual Life",
    scripture: "Acts 1:8; Galatians 5:22-25; 1 Corinthians 12:4-11",
    text: "We believe the Holy Spirit indwells, empowers, and seals every believer upon salvation. He produces the fruit of Christlike character, distributes spiritual gifts for ministry, and guides God's people into all truth.",
  },
  {
    number: "06",
    title: "The Power of Intercessory Prayer",
    scripture: "James 5:16; 1 Thessalonians 5:17; Matthew 18:19-20",
    text: "We believe prayer is an indispensable spiritual weapon and a sacred privilege. Through fervent, united prayer in Jesus' name, God breaks chains, heals sickness, restores families, and releases spiritual awakening across the nations.",
  },
  {
    number: "07",
    title: "The Universal Body of Christ",
    scripture: "1 Corinthians 12:12-14; Ephesians 4:3-6",
    text: "We believe that all genuine believers across all tribes, tongues, and nations are joined into one spiritual Body—the Church—with Christ as the supreme Head. We are committed to fostering genuine brotherly love and spiritual fellowship.",
  },
  {
    number: "08",
    title: "The Great Commission & Missions",
    scripture: "Matthew 28:18-20; Mark 16:15; Acts 13:2-3",
    text: "We believe it is the urgent calling of the Church to proclaim the Gospel to every creature and disciple all nations, mobilizing resources, technology, and workers to advance God's Kingdom to the ends of the earth.",
  },
  {
    number: "09",
    title: "Christian Integrity & Stewardship",
    scripture: "Colossians 3:17; 2 Corinthians 9:6-8; Micah 6:8",
    text: "We believe every believer is called to live a holy, honorable life of integrity, walking in love, caring for the vulnerable, and generously stewarding time, talents, and financial resources for God's glory.",
  },
  {
    number: "10",
    title: "The Blessed Hope & Eternal Life",
    scripture: "Titus 2:13; 1 Thessalonians 4:16-17; Revelation 21:1-4",
    text: "We believe in the personal, victorious return of our Lord Jesus Christ, the resurrection of both the just and the unjust, the eternal reward of the righteous in God's presence, and the establishment of His everlasting Kingdom.",
  },
];

const corePillars = [
  {
    icon: Heart,
    title: "24/7 Global Prayer Altar",
    desc: "An uninterrupted digital prayer sanctuary connecting intercessors worldwide in real-time agreement for breakthroughs and revival.",
  },
  {
    icon: BookOpen,
    title: "Scripture in 22 Translations",
    desc: "Providing instant access to God's living Word with cross-translation comparisons, commentary, and verse bookmarks.",
  },
  {
    icon: Globe,
    title: "Global Mission Outreach",
    desc: "Supporting frontline gospel workers, conferences, community outreach, and unreached communities worldwide.",
  },
  {
    icon: Users,
    title: "Kingdom Unity & Fellowship",
    desc: "Uniting the Body of Christ across geographic and cultural divides around the singular supremacy of Jesus Christ.",
  },
];

export default function AboutUs() {
  return (
    <div className="pt-[108px] min-h-screen bg-[#FAF7F2] text-[#0c1b33]">
      <SEO
        title="About Us & Statement of Faith"
        description="Learn about Kingdom Missions Network (kingdommissionsnetwork.org) — our global vision, core pillars, leadership commitment, and foundational Statement of Faith."
        url="/about"
      />

      {/* Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0c1b33] to-[#071324] text-white py-20 lg:py-28 px-4 sm:px-6">
        {/* Subtle decorative background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_center,rgba(212,175,55,0.18),transparent_70%)] pointer-events-none" />

        <div className="container-main mx-auto relative z-10 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/10 border border-[#d4af37]/40 text-[#fbf5b7] text-xs sm:text-sm font-semibold mb-6 shadow-inner">
            <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
            Official Platform & Ministry Foundation
          </div>

          <div className="flex justify-center mb-6">
            <img
              src={brandLogo}
              alt="Kingdom Missions Network"
              className="h-20 sm:h-24 w-auto object-contain filter drop-shadow-[0_4px_16px_rgba(212,175,55,0.4)]"
            />
          </div>

          <h1 className="font-brand text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6 leading-tight">
            Advancing the Kingdom <br className="hidden sm:inline" />
            <span className="text-[#d4af37]">Across Nations</span>
          </h1>

          <p className="font-outfit text-base sm:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed mb-8">
            Kingdom Missions Network is a worldwide fellowship of Christian believers dedicated to continuous intercession, deep scripture study, and global mission advancement.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="#faith"
              className="px-6 py-3 rounded-full bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#c5961d] text-[#0c1b33] font-bold text-sm hover:shadow-[0_0_20px_rgba(212,175,55,0.5)] transition-all flex items-center gap-2"
            >
              Statement of Faith <ArrowRight className="w-4 h-4" />
            </a>
            <Link
              to="/prayer-wall"
              className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm transition-all"
            >
              Visit 24/7 Prayer Wall
            </Link>
          </div>
        </div>
      </section>

      {/* Core Identity & Pillars */}
      <section className="py-20 px-4 sm:px-6 container-main mx-auto">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="font-outfit text-xs font-bold tracking-[0.25em] text-[#996515] uppercase">
              Who We Are
            </span>
            <h2 className="font-brand text-3xl sm:text-4xl font-bold text-[#0c1b33] mt-2 mb-4">
              Our Vision & Core Pillars
            </h2>
            <div className="w-16 h-1 bg-[#d4af37] mx-auto rounded-full" />
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {corePillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <ScrollReveal key={pillar.title} delay={idx * 0.1}>
                <div className="h-full p-8 rounded-2xl bg-white border border-[#e5dccb] shadow-[0_4px_20px_rgba(12,27,51,0.06)] hover:border-[#d4af37] hover:shadow-[0_8px_30px_rgba(212,175,55,0.15)] transition-all flex flex-col items-start">
                  <div className="w-12 h-12 rounded-xl bg-[#0c1b33] text-[#d4af37] flex items-center justify-center mb-6 shadow-sm">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-brand text-lg font-bold text-[#0c1b33] mb-3">
                    {pillar.title}
                  </h3>
                  <p className="text-sm text-[#4a5568] leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {/* Statement of Faith Section */}
      <section id="faith" className="py-20 px-4 sm:px-6 bg-[#f4eee4] border-y border-[#e2d7c5]">
        <div className="container-main mx-auto max-w-5xl">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0c1b33] text-[#d4af37] text-xs font-bold uppercase tracking-wider mb-4">
                <ShieldCheck className="w-3.5 h-3.5" /> Foundational Tenets
              </div>
              <h2 className="font-brand text-3xl sm:text-5xl font-bold text-[#0c1b33] mb-4">
                Statement of Faith
              </h2>
              <p className="font-outfit text-base sm:text-lg text-[#5a6578]">
                Kingdom Missions Network stands firmly upon the uncompromised, historical truths of the Christian faith. These ten tenets define our doctrinal conviction and guiding mandate.
              </p>
            </div>
          </ScrollReveal>

          <div className="space-y-6">
            {faithStatements.map((item, index) => (
              <ScrollReveal key={item.number} delay={index * 0.05}>
                <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#ded3be] shadow-sm hover:border-[#d4af37] transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 mb-3">
                    <span className="font-brand text-2xl font-extrabold text-[#d4af37]">
                      {item.number}
                    </span>
                    <h3 className="font-brand text-xl sm:text-2xl font-bold text-[#0c1b33]">
                      {item.title}
                    </h3>
                    <span className="text-xs font-semibold text-[#8b5e3c] italic sm:ml-auto">
                      {item.scripture}
                    </span>
                  </div>
                  <p className="text-[#3a4556] leading-relaxed text-sm sm:text-base pl-0 sm:pl-10">
                    {item.text}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Founder & Leadership Section */}
      <section id="leadership" className="py-20 px-4 sm:px-6 container-main mx-auto max-w-5xl">
        <ScrollReveal>
          <div className="bg-[#0c1b33] text-white rounded-3xl p-8 sm:p-14 shadow-2xl relative overflow-hidden border border-[#d4af37]/30">
            {/* Background watermark icon */}
            <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
              <Compass className="w-80 h-80 text-white" />
            </div>

            <div className="relative z-10 grid lg:grid-cols-3 gap-10 items-center">
              {/* Founder Profile Card */}
              <div className="lg:col-span-1 flex flex-col items-center text-center p-6 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-sm">
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 bg-gradient-to-tr from-[#d4af37] via-[#f3e5ab] to-[#8c6508] mb-4 shadow-[0_0_20px_rgba(212,175,55,0.4)] flex items-center justify-center">
                  <div className="w-full h-full rounded-full bg-[#071324] flex items-center justify-center overflow-hidden">
                    <img
                      src={brandLogo}
                      alt="Bishop Dr. George Githinji"
                      className="w-20 h-20 object-contain filter drop-shadow-[0_2px_8px_rgba(212,175,55,0.5)]"
                    />
                  </div>
                </div>

                <h3 className="font-brand text-xl sm:text-2xl font-bold text-white leading-tight">
                  Bishop Dr. George Githinji
                </h3>
                <span className="font-outfit text-xs font-bold uppercase tracking-wider text-[#d4af37] mt-1 mb-3">
                  Founder & Spiritual Overseer
                </span>
                <p className="text-xs text-white/70 leading-relaxed">
                  General Overseer of HKM Ministries International & Kingdom Missions Network.
                </p>

                <div className="mt-4 pt-4 border-t border-white/10 w-full flex justify-center gap-3 text-xs text-[#fbf5b7]">
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" /> Verified Ministry
                  </span>
                </div>
              </div>

              {/* Founder Vision & Message */}
              <div className="lg:col-span-2 space-y-5">
                <div className="inline-flex items-center gap-2.5 px-3.5 py-1 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/40 text-[#fbf5b7] text-xs font-bold uppercase tracking-wider">
                  <Award className="w-4 h-4 text-[#d4af37]" /> Founder's Vision & Mandate
                </div>

                <h2 className="font-brand text-2xl sm:text-4xl font-bold text-white leading-snug">
                  "Uniting the Global Body of Christ in Prayer and Kingdom Purpose"
                </h2>

                <p className="text-white/85 text-sm sm:text-base leading-relaxed">
                  Under the spiritual leadership of <strong>Bishop Dr. George Githinji</strong>, Kingdom Missions Network was birthed to bridge nations and denominations through a 24/7 digital altar of intercessory prayer, accessible Bible truth, and gospel impact.
                </p>

                <p className="text-white/70 text-xs sm:text-sm leading-relaxed">
                  Partnering alongside <em>HKM Ministries International (Heavenly God's Kingdom Ministry)</em>, our mission extends from local community transformation to frontline global intercession, empowering believers everywhere to stand as one in Christ.
                </p>

                <div className="grid sm:grid-cols-2 gap-3 pt-4 border-t border-white/10 text-xs text-white/80 font-medium">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-[#d4af37] shrink-0" />
                    <span>Apostolic & pastoral spiritual oversight</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Anchor className="w-4 h-4 text-[#d4af37] shrink-0" />
                    <span>Unyielding commitment to biblical stewardship</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Contact & Partnership CTA */}
      <section id="contact" className="pb-24 px-4 sm:px-6 container-main mx-auto text-center max-w-3xl">
        <ScrollReveal>
          <div className="p-8 sm:p-12 rounded-3xl bg-white border border-[#e2d7c5] shadow-lg">
            <h2 className="font-brand text-2xl sm:text-3xl font-bold text-[#0c1b33] mb-3">
              Partner With Us in the Gospel
            </h2>
            <p className="text-[#5a6578] text-sm sm:text-base mb-8 max-w-xl mx-auto">
              Have questions or want to partner with Kingdom Missions Network? Reach out to our global coordination team.
            </p>

            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-[#f4eee4] border border-[#d4af37]/40 text-[#0c1b33] font-semibold text-sm mb-8">
              <Mail className="w-4 h-4 text-[#996515]" />
              <span>giving@kingdommissionsnetwork.org</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/subscribe"
                className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#c5961d] text-[#0c1b33] font-bold text-sm hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all"
              >
                Become a Kingdom Partner
              </Link>
              <Link
                to="/bible"
                className="px-8 py-3.5 rounded-full bg-[#0c1b33] text-white font-bold text-sm hover:bg-[#162a4a] transition-all"
              >
                Explore Bible Reader
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
