import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import SupportModal from "../components/SupportModal.jsx";
import MeetNovaLogo from "../components/MeetNovaLogo.jsx";

// Unsplash premium image URLs
const IMAGES = {
  contactCenter: "https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&w=800&q=80",
  meetings: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
  notesBg: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
  webinars: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80",
  rooms: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
  phone: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80",
  caseShareCo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80",
  caseTechCorp: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
  caseSLIIT: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80"
};

const products = [
  {
    id: "contact-center",
    title: "Contact Center",
    category: "Customer Service",
    description: "Omnichannel agent routing and customer helpdesk built directly into your workspace.",
    colorClass: "from-orange-500 to-red-600",
    bgTint: "bg-orange-50/50 dark:bg-orange-950/20",
    imageUrl: IMAGES.contactCenter,
    accentColor: "#f97316"
  },
  {
    id: "meetings",
    title: "Meetings",
    category: "Collaboration",
    description: "High-fidelity, encrypted video conferencing with automated transcription and notes.",
    colorClass: "from-blue-500 to-indigo-600",
    bgTint: "bg-blue-50/50 dark:bg-blue-950/20",
    imageUrl: IMAGES.meetings,
    accentColor: "#3b82f6"
  },
  {
    id: "my-notes",
    title: "My Notes",
    category: "Notes",
    description: "Collaborative, real-time rich document editor to write ideas and share notes.",
    colorClass: "from-purple-500 to-indigo-500",
    bgTint: "bg-purple-50/50 dark:bg-purple-950/20",
    imageUrl: IMAGES.notesBg,
    accentColor: "#a855f7"
  },
  {
    id: "whiteboard",
    title: "Whiteboard",
    category: "Collaboration",
    description: "Collaborative, real-time interactive drawing canvas to brainstorm ideas visually.",
    colorClass: "from-cyan-500 to-blue-600",
    bgTint: "bg-cyan-50/50 dark:bg-cyan-950/20",
    imageUrl: "whiteboard",
    accentColor: "#06b6d4"
  },
  {
    id: "productivity-suite",
    title: "Productivity Suite",
    category: "Suite",
    description: "Seamless calendar integration, whiteboards, tasks, and document sharing in one app.",
    colorClass: "from-emerald-500 to-teal-600",
    bgTint: "bg-emerald-50/50 dark:bg-emerald-950/20",
    imageUrl: "suite",
    accentColor: "#10b981"
  },
  {
    id: "phone",
    title: "Phone",
    category: "Communication",
    description: "Enterprise cloud business phone system with SMS, call recording, and active queue routing.",
    colorClass: "from-rose-500 to-pink-600",
    bgTint: "bg-rose-50/50 dark:bg-rose-950/20",
    imageUrl: IMAGES.phone,
    accentColor: "#f43f5e"
  },
  {
    id: "webinars",
    title: "Webinars",
    category: "Events",
    description: "Host large-scale, high-engagement webinars with live emojis, polling, and Q&A panels.",
    colorClass: "from-amber-500 to-yellow-600",
    bgTint: "bg-amber-50/50 dark:bg-amber-950/20",
    imageUrl: IMAGES.webinars,
    accentColor: "#f59e0b"
  },
  {
    id: "bonsai",
    title: "Bonsai",
    category: "Workflow",
    description: "Intelligent CRM and sales pipelines to manage contacts, deals, and automated engagements.",
    colorClass: "from-indigo-600 to-purple-700",
    bgTint: "bg-indigo-50/50 dark:bg-indigo-950/20",
    imageUrl: "crm",
    accentColor: "#4f46e5"
  },
  {
    id: "rooms",
    title: "Rooms",
    category: "Hardware",
    description: "Transform physical meeting areas with modern hardware setups and scheduling terminals.",
    colorClass: "from-slate-600 to-slate-800",
    bgTint: "bg-slate-50/50 dark:bg-slate-950/20",
    imageUrl: IMAGES.rooms,
    accentColor: "#475569"
  }
];

const tabsData = {
  collaboration: {
    title: "Collaboration",
    bullets: [
      {
        bold: "Support hybrid and remote work",
        text: "Keep global teams engaged with reliable video, chat, documents, and more."
      },
      {
        bold: "Seamless communication",
        text: "Save time and cut costs with Meetings, Phone, Chat, and more, in one unified platform."
      },
      {
        bold: "Keep workflows moving",
        text: "From brainstorms to documents, MeetNova helps teams cut friction and avoid stalls."
      },
      {
        bold: "Work smarter together",
        text: "Organize meetings, set agendas, assign tasks, and capture notes in one unified interface."
      }
    ]
  },
  support: {
    title: "Customer support",
    bullets: [
      {
        bold: "Frictionless resolutions",
        text: "Route tickets and calls instantly to the right agent based on skill, language, and queue status."
      },
      {
        bold: "Omnichannel customer care",
        text: "Respond through web chat, voice call, email, or video call without switching dashboards."
      },
      {
        bold: "Real-time supervisor assistance",
        text: "Allow managers to listen in, whisper guidance, and barge in to maintain service level agreements."
      },
      {
        bold: "Advanced customer analytics",
        text: "Get detailed reports, sentiment scores, and summary trends for every interaction."
      }
    ]
  },
  marketing: {
    title: "Marketing",
    bullets: [
      {
        bold: "High-impact events",
        text: "Design customizable webinar registration forms, branded landing pages, and interactive sessions."
      },
      {
        bold: "Build user communities",
        text: "Engage users with live chat polls, moderated Q&As, and interactive feedback widgets."
      },
      {
        bold: "Post-event insights",
        text: "Retrieve detailed attendee engagement scores, survey feedback, and drop-off analytics."
      },
      {
        bold: "CRM integrations",
        text: "Sync webinar sign-ups and leads directly to Salesforce, HubSpot, or our built-in Bonsai CRM."
      }
    ]
  },
  sales: {
    title: "Sales",
    bullets: [
      {
        bold: "Shorten sales cycles",
        text: "Schedule video calls with clients in one click and capture real-time conversational intelligence."
      },
      {
        bold: "Interactive sales decks",
        text: "Share slides, run digital whiteboards, and co-annotate files during live presentations."
      },
      {
        bold: "Bonsai deals tracker",
        text: "Manage customer leads, customize deal pipelines, and view active conversation histories."
      },
      {
        bold: "Instant updates",
        text: "Draft follow-up emails and sync action plans immediately after a client demo."
      }
    ]
  },
  engagement: {
    title: "Employee engagement",
    bullets: [
      {
        bold: "Company-wide townhalls",
        text: "Broadcast all-hands sessions to thousands of employees with low-latency streaming."
      },
      {
        bold: "Interactive whiteboard hubs",
        text: "Conduct brain-storming sessions where everyone can add sticky notes, drawings, and shapes."
      },
      {
        bold: "Seamless instant messages",
        text: "Keep teams connected in persistent group chats, thread discussions, and shared channels."
      },
      {
        bold: "Surveys and recognition",
        text: "Run internal surveys and celebrate milestones with shared video clips and peer awards."
      }
    ]
  }
};

const caseStudies = [
  {
    title: "Advancing mental wellness through TheShareCo's journey with MeetNova Video SDK",
    subtitle: "How a telehealth startup scaled clinical consulting globally.",
    imageUrl: IMAGES.caseShareCo,
    logo: "TheShareCo."
  },
  {
    title: "Empowering remote engineering: How TechCorp coordinates sprints daily",
    subtitle: "A distributed software giant saved 15 hours a week in engineering alignment.",
    imageUrl: IMAGES.caseTechCorp,
    logo: "TechCorp"
  },
  {
    title: "Reimagining modern classrooms: SLIIT's massive virtual lectures transformation",
    subtitle: "Delivering real-time education to over 20,000 students concurrently.",
    imageUrl: IMAGES.caseSLIIT,
    logo: "SLIIT Virtual"
  }
];

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [showBanner, setShowBanner] = useState(true);
  const [activeProduct, setActiveProduct] = useState(products[2]); // My Notes default
  const [activeTab, setActiveTab] = useState("collaboration");
  const [activeCaseIndex, setActiveCaseIndex] = useState(0);
  const [supportOpen, setSupportOpen] = useState(false);

  // Dropdown states
  const [activeDropdown, setActiveDropdown] = useState(null); // 'products' | 'ai' | 'solutions' | 'meet' | null

  // Horizontal product slider scroll
  const sliderRef = useRef(null);

  const scrollSlider = (direction) => {
    if (sliderRef.current) {
      const scrollAmt = direction === "left" ? -300 : 300;
      sliderRef.current.scrollBy({ left: scrollAmt, behavior: "smooth" });
    }
  };

  // Find index of active product to synchronize slider dots
  const activeProductIndex = products.findIndex((p) => p.id === activeProduct.id);

  // Handle outside click to close dropdowns
  useEffect(() => {
    function handleOutsideClick() {
      setActiveDropdown(null);
    }
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  const toggleDropdown = (e, name) => {
    e.stopPropagation();
    setActiveDropdown((prev) => (prev === name ? null : name));
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-[#0c142c] border-b border-slate-800 px-6 py-4 flex items-center justify-between text-white transition-all shadow-md">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <MeetNovaLogo size="lg" variant="dark" linkTo="/" />

          {/* Navigation Links */}
          <nav className="hidden xl:flex items-center gap-6 text-[15px] font-medium text-slate-300">
            {/* Products Dropdown */}
            <div className="relative">
              <button
                onClick={(e) => toggleDropdown(e, "products")}
                className="flex items-center gap-1 hover:text-white transition"
              >
                Products <span className="text-[10px] opacity-75">▼</span>
              </button>
              {activeDropdown === "products" && (
                <div className="absolute top-8 left-0 w-80 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 grid grid-cols-1 gap-2 animate-fade-in z-50">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Featured Products</p>
                  {products.slice(0, 5).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setActiveProduct(p);
                        document.getElementById("featured-product-showcase")?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition"
                    >
                      <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${p.colorClass} mt-1.5 flex-shrink-0`} />
                      <div>
                        <p className="font-semibold text-sm">{p.title}</p>
                        <p className="text-xs text-slate-500 line-clamp-1">{p.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>



            {/* Solutions Dropdown */}
            <div className="relative">
              <button
                onClick={(e) => toggleDropdown(e, "solutions")}
                className="flex items-center gap-1 hover:text-white transition"
              >
                Solutions <span className="text-[10px] opacity-75">▼</span>
              </button>
              {activeDropdown === "solutions" && (
                <div className="absolute top-8 left-0 w-64 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 flex flex-col gap-1 animate-fade-in z-50">
                  <Link to="/pricing?highlight=student" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-sm">
                    Education Program
                  </Link>
                  <Link to="/pricing?highlight=corporate" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-sm">
                    Corporate Meetings
                  </Link>
                  <Link to="/pricing?highlight=basic" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-sm">
                    Telehealth Consultations
                  </Link>
                </div>
              )}
            </div>

            {/* Pricing */}
            <Link to="/pricing" className="hover:text-white transition">
              Pricing
            </Link>
          </nav>
        </div>

        {/* Right Nav Options */}
        <div className="flex items-center gap-4 text-[14px]">
          {/* Search Icon */}
          <button className="text-slate-400 hover:text-white transition p-1.5" title="Search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-[18px] h-[18px]">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

          {/* Meet Dropdown */}
          <div className="relative">
            <button
              onClick={(e) => toggleDropdown(e, "meet")}
              className="hidden lg:flex items-center gap-1 font-semibold hover:text-white transition py-1.5"
            >
              Meet <span className="text-[9px] opacity-75">▼</span>
            </button>
            {activeDropdown === "meet" && (
              <div className="absolute top-8 right-0 w-56 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2.5 flex flex-col gap-1 z-50">
                <Link to="/login" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left font-medium text-sm">
                  Join a Meeting
                </Link>
                <Link to="/login" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left font-medium text-sm">
                  Host Instant Meeting
                </Link>
                <Link to="/login" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left font-medium text-sm">
                  Schedule Meeting
                </Link>
              </div>
            )}
          </div>

          {/* Sign In */}
          {isAuthenticated ? (
            <Link to="/" className="font-semibold text-slate-300 hover:text-white transition">
              Dashboard
            </Link>
          ) : (
            <Link to="/login" className="font-semibold text-slate-300 hover:text-white transition">
              Sign In
            </Link>
          )}

          <button
            onClick={() => setSupportOpen(true)}
            className="hidden sm:inline-block text-slate-400 hover:text-white transition bg-transparent border-none cursor-pointer font-semibold"
          >
            Support
          </button>

          {/* Contact Sales */}
          <Link
            to="/pricing"
            className="hidden md:inline-block border border-blue-500/80 text-blue-400 hover:text-white hover:bg-blue-600/20 px-4 py-1.5 rounded-full font-bold transition text-xs xl:text-sm"
          >
            Contact Sales
          </Link>

          {/* Sign Up Free */}
          {isAuthenticated ? (
            <Link
              to="/profile"
              className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-1.5 rounded-full font-bold transition shadow-md shadow-blue-900/10 text-xs xl:text-sm"
            >
              My Profile
            </Link>
          ) : (
            <Link
              to="/register"
              className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-1.5 rounded-full font-bold transition shadow-md shadow-blue-900/10 text-xs xl:text-sm"
            >
              Sign Up Free
            </Link>
          )}

          {/* Grid Menu Icon */}
          <button className="text-slate-400 hover:text-white transition p-1" title="App launcher">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
              <path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Banner Notification ── */}
      {showBanner && (
        <div className="bg-gradient-to-r from-blue-950 via-[#132247] to-[#1c2c56] border-b border-blue-900/40 text-slate-100 py-3 px-6 flex items-center justify-center gap-3 relative transition-all animate-slide-down">
          <span className="text-xs md:text-sm font-medium tracking-wide">
            Introducing <span className="text-blue-300 font-bold">MeetNova Whiteboards</span>, collaborate in real time.
          </span>
          <a
            href="#featured-product-showcase"
            className="bg-pink-600 hover:bg-pink-700 text-white font-bold text-[10px] md:text-xs px-3 py-1 rounded-full transition shadow-lg shadow-pink-950/20"
          >
            Explore Whiteboard
          </a>
          <button
            onClick={() => setShowBanner(false)}
            className="absolute right-4 text-slate-400 hover:text-white p-1"
            title="Dismiss"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0c142c] via-[#111e42] to-[#1c3066] text-white pt-20 pb-24 px-6 border-b border-blue-950/20">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-r from-blue-500/20 to-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.15] mb-6 animate-fade-in-up">
            Find out what&apos;s possible <br className="hidden sm:inline" /> when work connects
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-blue-200/80 max-w-2xl mx-auto mb-10 font-normal leading-relaxed animate-fade-in-up delay-100">
            Bridge the gap between talking and doing with the unified collaboration platform built for you.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-200">
            <a
              href="#one-platform"
              className="w-full sm:w-auto bg-[#0a1027] border border-blue-800 text-blue-300 hover:bg-[#121c40] px-8 py-3.5 rounded-full font-bold transition text-base text-center shadow-lg"
            >
              Explore products
            </a>
            <Link
              to="/pricing"
              className="w-full sm:w-auto bg-white text-blue-950 hover:bg-slate-100 px-8 py-3.5 rounded-full font-bold transition text-base text-center shadow-2xl"
            >
              Find your plan
            </Link>
          </div>
        </div>

        {/* ── Dynamic Product Carousel ── */}
        <div className="mt-20 max-w-7xl mx-auto relative px-4">
          {/* Arrow navigation buttons */}
          <div className="absolute -top-12 left-4 flex gap-2">
            <button
              onClick={() => scrollSlider("left")}
              className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2.5 transition border border-white/5"
              title="Previous"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-[18px] h-[18px]">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              onClick={() => scrollSlider("right")}
              className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2.5 transition border border-white/5"
              title="Next"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-[18px] h-[18px]">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Cards slider row */}
          <div
            ref={sliderRef}
            className="flex gap-5 overflow-x-auto pb-6 pt-2 snap-x scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent justify-start select-none"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {products.map((p) => {
              const isActive = p.id === activeProduct.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setActiveProduct(p)}
                  className={`flex-shrink-0 w-[240px] md:w-[280px] rounded-3xl p-5 cursor-pointer transition-all duration-300 snap-start relative overflow-hidden group ${
                    isActive
                      ? "bg-white text-slate-900 border-2 border-blue-500 scale-[1.02] shadow-2xl shadow-blue-500/20"
                      : "bg-[#14234c]/85 hover:bg-[#1a2d60] text-slate-100 border border-slate-700/30 hover:scale-[1.01]"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-3 h-3 rounded-full bg-gradient-to-r ${p.colorClass}`} />
                    <span className={`text-xs font-semibold uppercase tracking-wider ${isActive ? "text-blue-600" : "text-blue-300"}`}>
                      {p.category}
                    </span>
                  </div>

                  <h3 className="text-lg md:text-xl font-bold mb-2 tracking-tight group-hover:text-blue-400 transition-colors">
                    {p.title}
                  </h3>
                  <p className={`text-xs md:text-sm line-clamp-3 leading-relaxed ${isActive ? "text-slate-600" : "text-slate-300"}`}>
                    {p.description}
                  </p>

                  <div className="mt-4 flex items-center justify-between">
                    <span className={`text-xs font-bold ${isActive ? "text-blue-600" : "text-slate-400"}`}>
                      {isActive ? "Viewing details" : "Learn more"}
                    </span>
                    <span className={`text-[15px] transition-transform ${isActive ? "translate-x-1.5 text-blue-600" : "text-slate-400 group-hover:translate-x-1"}`}>
                      ➜
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dot Indicator */}
          <div className="mt-8 flex justify-center gap-2">
            {products.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => setActiveProduct(p)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  p.id === activeProduct.id ? "bg-white w-8" : "bg-white/30 w-2.5 hover:bg-white/50"
                }`}
                title={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCT SHOWCASE SECTION ── */}
      <section id="featured-product-showcase" className="py-20 px-6 bg-[#f8fafc] dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-800">
        <div className="max-w-6xl mx-auto">
          {/* Header element */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div className="flex items-center gap-4">
              {/* Product Icon / Design bubble */}
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${activeProduct.colorClass} flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-500/10`}>
                {activeProduct.title.charAt(0)}
              </div>
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">{activeProduct.category}</span>
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-0.5">
                  {activeProduct.title}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/pricing")}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-full transition shadow-lg shadow-blue-500/10 text-sm"
              >
                Explore {activeProduct.title}
              </button>
            </div>
          </div>

          {/* Large dynamic UI mockup */}
          <div className="rounded-[1.75rem] bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 p-3 sm:p-5 shadow-2xl relative overflow-hidden transition-all duration-500">
            {/* The Mockup content */}
            {activeProduct.id === "my-notes" ? (
              <div className="rounded-2xl border border-slate-100 overflow-hidden bg-white shadow-lg">
                {/* Mockup Title bar */}
                <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-400" />
                    <span className="w-3 h-3 rounded-full bg-yellow-400" />
                    <span className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="mx-auto bg-white border border-slate-200 rounded-md px-12 py-0.5 text-[11px] text-slate-400 flex items-center gap-1">
                    <span>🔒</span> meetnova.com/workplace/notes
                  </div>
                </div>

                {/* Editor Container with image background */}
                <div className="relative h-[480px] bg-slate-900 text-white flex flex-col justify-between p-6">
                  {/* Photo background */}
                  <img
                    src={IMAGES.notesBg}
                    alt="Notes landscape background"
                    className="absolute inset-0 w-full h-full object-cover opacity-35 select-none pointer-events-none"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-slate-900/20 select-none pointer-events-none" />

                  {/* Editor Top Navigation */}
                  <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-600 p-1.5 rounded-lg text-white font-extrabold text-xs">MN</span>
                      <span className="text-sm font-semibold tracking-wide">Workplace Notes</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <span className="bg-white/10 px-2.5 py-1 rounded">Text</span>
                      <span className="bg-white/10 px-2.5 py-1 rounded font-bold">B</span>
                      <span className="bg-white/10 px-2.5 py-1 rounded italic">I</span>
                      <span className="bg-white/10 px-2.5 py-1 rounded underline">U</span>
                      <span className="bg-white/10 px-2.5 py-1 rounded">📋 Table</span>
                      <span className="bg-white/20 text-white font-bold px-3 py-1 rounded-full cursor-pointer hover:bg-white/30 transition">
                        Share
                      </span>
                    </div>
                  </div>

                  {/* Note Body */}
                  <div className="relative z-10 max-w-2xl mx-auto w-full flex-grow flex flex-col justify-center text-left mt-8">
                    <h3 className="text-3xl font-extrabold tracking-tight mb-2 text-white">[My Note] Q3 Marketing Kickoff</h3>
                    <p className="text-slate-400 text-xs mb-6 flex items-center gap-2">
                      <span>👤 Created by Rashini Chathurangi</span>
                      <span>•</span>
                      <span>📅 Updated today</span>
                    </p>

                    <div className="space-y-4 text-sm md:text-base text-slate-200">
                      <p className="leading-relaxed">
                        The team met as part of the Q3 marketing kickoff to align on priorities and confirm next steps for the upcoming workspace rollout.
                      </p>
                      <ul className="list-disc pl-5 space-y-2 text-slate-300">
                        <li>
                          <strong className="text-white">Short-term focus:</strong> Revamp the landing page to feature high-fidelity product sliders and dynamic tab configurations.
                        </li>
                        <li>
                          <strong className="text-white">Productivity boost:</strong> Connect Google Calendar and Stripe subscription services directly to customer profiles.
                        </li>
                        <li>
                          <strong className="text-white">Productivity enhancements:</strong> Link your Google Calendar and coordinate schedules on the fly.
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Floating note settings */}
                  <div className="relative z-10 bg-black/60 backdrop-blur border border-white/10 p-3.5 rounded-xl max-w-sm ml-auto text-left shadow-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-cyan-400">✦</span>
                      <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Note Settings</span>
                    </div>
                    <div className="space-y-2 text-[11px] text-slate-300">
                      <label className="flex items-center gap-2 cursor-pointer hover:text-white transition">
                        <input type="radio" name="note-length" defaultChecked className="accent-cyan-400" />
                        <span>Short summary note (Recommended)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer hover:text-white transition">
                        <input type="radio" name="note-length" className="accent-cyan-400" />
                        <span>Long transcription layout</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeProduct.id === "meetings" ? (
              <div className="rounded-2xl border border-slate-100 overflow-hidden bg-slate-950 text-white shadow-lg">
                {/* Mockup Title bar */}
                <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span className="text-xs text-slate-400 font-medium">MeetNova Room ID: MN-4328-X</span>
                  </div>
                  <span className="bg-red-600 text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded-full tracking-wider">LIVE</span>
                </div>

                {/* Video Call grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-slate-900 min-h-[400px]">
                  <div className="relative rounded-xl overflow-hidden bg-slate-800 h-[180px] md:h-[220px]">
                    <img src={IMAGES.caseShareCo} alt="User video stream" className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 left-2 bg-black/60 px-3 py-1 rounded text-xs font-semibold">Sarah (Host)</div>
                  </div>
                  <div className="relative rounded-xl overflow-hidden bg-slate-800 h-[180px] md:h-[220px]">
                    <img src={IMAGES.caseSLIIT} alt="User video stream" className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 left-2 bg-black/60 px-3 py-1 rounded text-xs font-semibold">Engineering Team</div>
                  </div>
                </div>

                {/* Control bar */}
                <div className="bg-slate-950 p-4 flex items-center justify-center gap-4 text-sm border-t border-slate-800">
                  <button className="bg-slate-800 hover:bg-slate-700 p-2.5 rounded-full text-slate-100">🎙️ Mute</button>
                  <button className="bg-slate-800 hover:bg-slate-700 p-2.5 rounded-full text-slate-100">📹 Stop Video</button>
                  <button className="bg-blue-600 hover:bg-blue-500 p-2.5 px-5 rounded-full text-white font-bold">📤 Share Screen</button>
                  <button className="bg-slate-800 hover:bg-slate-700 p-2.5 rounded-full text-slate-100">💬 Chat</button>
                  <button className="bg-red-600 hover:bg-red-700 p-2.5 px-6 rounded-full text-white font-bold">Leave</button>
                </div>
              </div>
            ) : (
              // General Mockup fallback
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl h-[420px] flex flex-col items-center justify-center p-8 text-center text-white border border-slate-800">
                {activeProduct.imageUrl && activeProduct.imageUrl.startsWith("http") ? (
                  <img
                    src={activeProduct.imageUrl}
                    alt={activeProduct.title}
                    className="w-full h-full object-cover opacity-45 rounded-xl absolute inset-0 select-none pointer-events-none"
                  />
                ) : null}
                <div className="relative z-10 max-w-lg">
                  <div className="text-5xl mb-4">✦</div>
                  <h3 className="text-2xl font-bold mb-3">{activeProduct.title} Console View</h3>
                  <p className="text-slate-300 text-sm leading-relaxed mb-6">
                    {activeProduct.description} Fully integrated with secure signaling, custom styling, and real-time dashboard notifications.
                  </p>
                  <button
                    onClick={() => navigate("/pricing")}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-full transition shadow-lg"
                  >
                    Get Started With {activeProduct.title}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── ONE PLATFORM SECTION ── */}
      <section id="one-platform" className="py-24 px-6 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4">
              One platform. <br className="sm:hidden" /> Endless ways to work together.
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto text-base">
              Customize your workspaces and simplify communications in one secure interface.
            </p>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 mb-16">
            {Object.keys(tabsData).map((tabKey) => {
              const active = tabKey === activeTab;
              return (
                <button
                  key={tabKey}
                  onClick={() => setActiveTab(tabKey)}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold tracking-wide transition-all ${
                    active
                      ? "bg-blue-50 text-blue-600 border-2 border-blue-500 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-transparent border-2 border-transparent"
                  }`}
                >
                  {tabsData[tabKey].title}
                </button>
              );
            })}
          </div>

          {/* Tab Content Layout */}
          <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] items-center">
            {/* Left side Bullet Points */}
            <div className="space-y-6">
              {tabsData[activeTab].bullets.map((bullet, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  {/* Blue check icon */}
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold mt-1.5 flex-shrink-0">
                    ✓
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-[15px] sm:text-base">
                      {bullet.bold}
                    </h4>
                    <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-[15px] mt-1 leading-relaxed">
                      {bullet.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right side App Mockup */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-900/50 shadow-xl">
              {/* MeetNova Team Workspace Chat Window */}
              <div className="rounded-xl border border-slate-200 bg-white dark:bg-slate-950 p-4 shadow-md text-left">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    💬
                  </div>
                  <div>
                    <h5 className="font-extrabold text-xs text-slate-800 dark:text-white uppercase tracking-wider">Team Workspace Chat</h5>
                    <p className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> 5 members online
                    </p>
                  </div>
                </div>

                <div className="space-y-4 min-h-[200px] text-xs">
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-purple-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                      RC
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl rounded-tl-sm max-w-[85%] text-slate-700 dark:text-slate-200">
                      <p className="font-semibold mb-0.5 text-slate-900 dark:text-white">Rashini Chathurangi</p>
                      I have updated the team whiteboard with our Q3 design layout. Let me know what you think!
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <div className="bg-blue-500 text-white p-3 rounded-2xl rounded-tr-sm max-w-[85%]">
                      <p className="font-semibold mb-0.5 text-blue-100">You (Host)</p>
                      Awesome! I will schedule a review meeting for this afternoon and import the task checklist.
                    </div>
                  </div>
                </div>

                {/* Input bar */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                  <input
                    type="text"
                    placeholder="Send a message to the team..."
                    disabled
                    className="flex-grow bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-xs outline-none cursor-not-allowed text-slate-400"
                  />
                  <button disabled className="bg-blue-600/80 text-white rounded-full p-2 cursor-not-allowed" title="Send">
                    ➤
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CLIENT CASE STUDIES CAROUSEL ── */}
      <section className="py-24 px-6 bg-slate-50 dark:bg-slate-900 border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-16">
            Businesses achieve more with MeetNova
          </h2>

          <div className="relative rounded-3xl overflow-hidden shadow-2xl h-[420px] sm:h-[480px] bg-slate-900 text-white flex flex-col justify-end p-6 sm:p-12 text-left">
            {/* Slide Image */}
            <img
              src={caseStudies[activeCaseIndex].imageUrl}
              alt="Customer case study background"
              className="absolute inset-0 w-full h-full object-cover opacity-40 transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

            <div className="relative z-10 max-w-2xl">
              <span className="bg-blue-600 px-3.5 py-1 rounded text-xs font-bold uppercase tracking-wider">
                {caseStudies[activeCaseIndex].logo} Success Story
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold mt-4 mb-3 leading-snug">
                {caseStudies[activeCaseIndex].title}
              </h3>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                {caseStudies[activeCaseIndex].subtitle}
              </p>
            </div>

            {/* Dots navigation */}
            <div className="relative z-10 mt-8 flex gap-2">
              {caseStudies.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveCaseIndex(idx)}
                  className={`h-2.5 rounded-full transition-all ${
                    idx === activeCaseIndex ? "bg-blue-500 w-8" : "bg-white/40 w-2.5 hover:bg-white/70"
                  }`}
                  title={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FOOTER BANNER ── */}
      <section className="py-20 px-6 bg-[#0c142c] text-white text-center relative overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-blue-900/10 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-xl mx-auto">
          <h2 className="text-3xl font-extrabold tracking-tight mb-4">Ready to get started?</h2>
          <p className="text-slate-300 text-sm sm:text-base mb-8">
            Create a free basic account and experience encrypted video calling and real-time notes.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-full transition shadow-lg"
            >
              Sign Up Free
            </Link>
            <Link
              to="/login"
              className="border border-slate-600 text-slate-300 hover:text-white hover:bg-white/5 px-8 py-3 rounded-full font-bold transition"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
           MAIN FOOTER
      ══════════════════════════════════════════ */}
      <footer style={{
        background: "linear-gradient(180deg, #060d1f 0%, #030812 100%)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        color: "#94a3b8",
        fontFamily: "inherit",
      }}>

        {/* ── Top Newsletter Bar ── */}
        <div style={{
          background: "linear-gradient(90deg, rgba(26,111,244,0.12) 0%, rgba(6,182,212,0.08) 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          padding: "28px 48px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: "16px",
        }}>
          <div>
            <p style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#f1f5f9" }}>
              Stay up to date with MeetNova
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
              Product news, updates, and early access announcements.
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              type="email"
              placeholder="Enter your email"
              style={{
                padding: "9px 16px", borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.05)",
                color: "#f1f5f9", fontSize: "13px", outline: "none",
                width: "220px",
              }}
            />
            <button style={{
              padding: "9px 18px", borderRadius: "10px", border: "none",
              background: "linear-gradient(135deg,#1a6ff4,#06b6d4)",
              color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer",
              whiteSpace: "nowrap",
            }}>
              Subscribe
            </button>
          </div>
        </div>

        {/* ── Main Link Columns ── */}
        <div style={{
          maxWidth: "1280px", margin: "0 auto",
          padding: "60px 48px 40px",
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
          gap: "40px",
        }}>

          {/* Brand Column */}
          <div>
              <MeetNovaLogo size="md" variant="dark" linkTo="/" />
            <p style={{ fontSize: "13.5px", lineHeight: 1.7, color: "#64748b", marginBottom: "22px", maxWidth: "240px" }}>
              The all-in-one communication platform for modern teams — encrypted video meetings, notes, whiteboards, phone, and more.
            </p>
            {/* Social Icons */}
            <div style={{ display: "flex", gap: "10px" }}>
              {[
                { title: "Twitter / X", path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.261 5.649zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
                { title: "LinkedIn", path: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z M4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" },
                { title: "GitHub", path: "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" },
                { title: "YouTube", path: "M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" },
              ].map((s) => (
                <a key={s.title} href="#" title={s.title} style={{
                  width: "34px", height: "34px", borderRadius: "8px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#64748b", transition: "all 0.2s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.background="rgba(26,111,244,0.15)"; e.currentTarget.style.color="#60a5fa"; }}
                  onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.05)"; e.currentTarget.style.color="#64748b"; }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
                    <path d={s.path} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Products Column */}
          <div>
            <h4 style={footerHeading}>Products</h4>
            <ul style={footerList}>
              {["Meetings", "Whiteboard", "My Notes", "Phone", "Webinars", "Rooms", "Contact Center", "Productivity Suite"].map(item => (
                <li key={item}><Link to="/login" style={footerLink} onMouseEnter={e => e.target.style.color="#60a5fa"} onMouseLeave={e => e.target.style.color="#64748b"}>{item}</Link></li>
              ))}
            </ul>
          </div>

          {/* Solutions Column */}
          <div>
            <h4 style={footerHeading}>Solutions</h4>
            <ul style={footerList}>
              {[
                { label: "Education Program", to: "/pricing?highlight=student" },
                { label: "Corporate Meetings", to: "/pricing?highlight=corporate" },
                { label: "Telehealth", to: "/pricing?highlight=basic" },
                { label: "Remote Work", to: "/pricing" },
                { label: "Hybrid Teams", to: "/pricing" },
                { label: "Startups", to: "/pricing" },
              ].map(item => (
                <li key={item.label}><Link to={item.to} style={footerLink} onMouseEnter={e => e.target.style.color="#60a5fa"} onMouseLeave={e => e.target.style.color="#64748b"}>{item.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h4 style={footerHeading}>Resources</h4>
            <ul style={footerList}>
              {[
                { label: "Pricing", to: "/pricing" },
                { label: "Sign Up Free", to: "/register" },
                { label: "Sign In", to: "/login" },
                { label: "Contact Sales", to: "/pricing" },
                { label: "Support Center", action: true },
                { label: "Schedule Meeting", to: "/login" },
              ].map(item => (
                <li key={item.label}>
                  {item.action
                    ? <button onClick={() => setSupportOpen(true)} style={{ ...footerLink, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                        onMouseEnter={e => e.target.style.color="#60a5fa"} onMouseLeave={e => e.target.style.color="#64748b"}>
                        {item.label}
                      </button>
                    : <Link to={item.to} style={footerLink} onMouseEnter={e => e.target.style.color="#60a5fa"} onMouseLeave={e => e.target.style.color="#64748b"}>{item.label}</Link>
                  }
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 style={footerHeading}>Company</h4>
            <ul style={footerList}>
              {[
                { label: "About MeetNova", to: "/" },
                { label: "Careers", to: "/" },
                { label: "Blog", to: "/" },
                { label: "Press & Media", to: "/" },
                { label: "Privacy Policy", to: "/" },
                { label: "Terms of Service", to: "/" },
              ].map(item => (
                <li key={item.label}><Link to={item.to} style={footerLink} onMouseEnter={e => e.target.style.color="#60a5fa"} onMouseLeave={e => e.target.style.color="#64748b"}>{item.label}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Trust Badges ── */}
        <div style={{
          maxWidth: "1280px", margin: "0 auto",
          padding: "0 48px 32px",
          display: "flex", flexWrap: "wrap", gap: "12px",
        }}>
          {[
            { icon: "🔒", label: "End-to-End Encrypted" },
            { icon: "✅", label: "SOC 2 Compliant" },
            { icon: "🌍", label: "GDPR Ready" },
            { icon: "⚡", label: "99.9% Uptime SLA" },
          ].map(badge => (
            <div key={badge.label} style={{
              display: "flex", alignItems: "center", gap: "7px",
              padding: "6px 14px", borderRadius: "8px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              fontSize: "12px", color: "#475569",
            }}>
              <span>{badge.icon}</span>
              <span>{badge.label}</span>
            </div>
          ))}
        </div>

        {/* ── Bottom Copyright Bar ── */}
        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          padding: "18px 48px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: "10px",
          maxWidth: "1280px", margin: "0 auto",
        }}>
          <p style={{ margin: 0, fontSize: "12.5px", color: "#334155" }}>
            © {new Date().getFullYear()} MeetNova, Inc. All rights reserved. Built with ❤️ for modern teams.
          </p>
          <div style={{ display: "flex", gap: "20px" }}>
            {["Privacy", "Terms", "Cookies", "Accessibility"].map(l => (
              <Link key={l} to="/" style={{ fontSize: "12px", color: "#334155", textDecoration: "none" }}
                onMouseEnter={e => e.target.style.color="#60a5fa"} onMouseLeave={e => e.target.style.color="#334155"}>
                {l}
              </Link>
            ))}
          </div>
        </div>
      </footer>

      {/* ── Floating Chat Button ── */}
      <button
        onClick={() => setSupportOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition cursor-pointer border-none"
        title="Customer Support"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-[26px] h-[26px]">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      <SupportModal open={supportOpen} onClose={() => setSupportOpen(false)} user={user} />
    </div>
  );
}

const footerHeading = {
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#f1f5f9",
  marginBottom: "16px",
};

const footerList = {
  listStyle: "none",
  padding: 0,
  margin: 0,
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const footerLink = {
  fontSize: "13.5px",
  color: "#64748b",
  textDecoration: "none",
  transition: "color 0.15s",
};

