import { useState } from "react";
import { Link } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import "./LandingPage.css";

const features = [
  {
    number: "01",
    title: "Vehicle detection",
    description:
      "Identify and monitor vehicles in camera streams with computer-vision models.",
    icon: "target",
  },
  {
    number: "02",
    title: "Incident awareness",
    description:
      "Bring potential road incidents into a centralized monitoring workflow for review.",
    icon: "alert",
  },
  {
    number: "03",
    title: "Traffic analytics",
    description:
      "Understand vehicle activity and congestion patterns across monitored locations.",
    icon: "chart",
  },
  {
    number: "04",
    title: "Emergency monitoring",
    description:
      "Support operators with emergency-vehicle visibility and response information.",
    icon: "pulse",
  },
];

const workflow = [
  {
    number: "01",
    title: "Connect cameras",
    description: "Bring supported traffic-camera streams into one monitoring workspace.",
  },
  {
    number: "02",
    title: "Analyze with AI",
    description: "Computer-vision models process frames and surface relevant detections.",
  },
  {
    number: "03",
    title: "Review and respond",
    description: "Authorized teams review events, alerts and traffic information.",
  },
];

function FeatureIcon({ type }) {
  if (type === "target") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M22 12h-3M12 22v-3M2 12h3" />
      </svg>
    );
  }

  if (type === "alert") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3 22 20H2L12 3Z" />
        <path d="M12 9v5M12 17h.01" />
      </svg>
    );
  }

  if (type === "chart") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 19V5M4 19h17" />
        <path d="m7 15 4-4 3 2 6-7" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 12h4l3-7 4 14 3-7h4" />
    </svg>
  );
}

function ProductPreview() {
  return (
    <div className="tml-product-card" aria-label="Illustrative TrafficMind AI platform preview">
      <div className="tml-product-topbar">
        <div className="tml-product-brand">
          <span className="tml-product-brand-mark">T</span>
          <span>TRAFFICMIND <b>AI</b></span>
        </div>
        <span className="tml-preview-label">ILLUSTRATIVE PREVIEW</span>
      </div>

      <div className="tml-product-body">
        <div className="tml-product-sidebar" aria-hidden="true">
          <span className="tml-sidebar-item tml-sidebar-active" />
          <span className="tml-sidebar-item" />
          <span className="tml-sidebar-item" />
          <span className="tml-sidebar-item" />
        </div>

        <div className="tml-product-content">
          <div className="tml-product-heading">
            <div>
              <span className="tml-overline">MONITORING OVERVIEW</span>
              <h3>Traffic intelligence</h3>
            </div>
            <span className="tml-demo-status"><i /> Preview</span>
          </div>

          <div className="tml-preview-stats">
            <div className="tml-stat-box">
              <span>Camera streams</span>
              <strong>Connected</strong>
              <small>Illustrative status</small>
            </div>
            <div className="tml-stat-box">
              <span>AI analysis</span>
              <strong>Active</strong>
              <small>Illustrative status</small>
            </div>
          </div>

          <div className="tml-camera-preview">
            <div className="tml-camera-topline">
              <span>CAMERA VIEW · SAMPLE</span>
              <span className="tml-camera-live"><i /> SIMULATED</span>
            </div>
            <div className="tml-road-scene" aria-hidden="true">
              <div className="tml-road-horizon" />
              <div className="tml-road-surface">
                <span className="tml-road-dash tml-dash-one" />
                <span className="tml-road-dash tml-dash-two" />
                <span className="tml-road-dash tml-dash-three" />
              </div>
              <div className="tml-car tml-car-one"><span /></div>
              <div className="tml-car tml-car-two"><span /></div>
              <div className="tml-detection-box tml-box-one"><small>Vehicle</small></div>
              <div className="tml-detection-box tml-box-two"><small>Vehicle</small></div>
            </div>
          </div>

          <div className="tml-preview-footer">
            <span><i className="tml-dot-blue" /> Computer vision</span>
            <span><i className="tml-dot-green" /> Centralized monitoring</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <main className="tml-landing">
      <header className="tml-header">
        <div className="tml-container tml-nav-wrap">
          <Link to="/" className="tml-brand" onClick={closeMenu} aria-label="TrafficMind AI home">
            <span className="tml-brand-symbol">T</span>
            <span>TrafficMind <b>AI</b></span>
          </Link>

          <button
            className="tml-menu-toggle"
            type="button"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
          </button>

          <nav className={`tml-nav ${menuOpen ? "tml-nav-open" : ""}`} aria-label="Main navigation">
            <a href="#platform" onClick={closeMenu}>Platform</a>
            <a href="#capabilities" onClick={closeMenu}>Capabilities</a>
            <a href="#workflow" onClick={closeMenu}>How it works</a>
            <a href="#about" onClick={closeMenu}>About</a>
            <div className="tml-mobile-actions">
              <ThemeToggle />
              <Link to="/login" className="tml-mobile-login" onClick={closeMenu}>Log in</Link>
              <Link to="/register" className="tml-button tml-button-primary" onClick={closeMenu}>Get started</Link>
            </div>
          </nav>

          <div className="tml-nav-actions">
            <ThemeToggle />
            <Link to="/login" className="tml-login-link">Log in</Link>
            <Link to="/register" className="tml-button tml-button-primary">Get started</Link>
          </div>
        </div>
      </header>

      <section className="tml-hero" id="platform">
        <div className="tml-container tml-hero-grid">
          <div className="tml-hero-copy">
            <div className="tml-kicker"><span /> AI-POWERED TRAFFIC MONITORING</div>
            <h1>Clearer traffic insights. <span>Safer roads.</span></h1>
            <p>
              TrafficMind AI brings camera monitoring, computer vision and traffic
              intelligence together in one workspace for informed decisions.
            </p>
            <div className="tml-hero-actions">
              <Link to="/login" className="tml-button tml-button-primary">Explore the platform <span>→</span></Link>
              <a href="#capabilities" className="tml-text-button">Discover capabilities <span>↓</span></a>
            </div>
            <div className="tml-hero-note">
              <span className="tml-note-line" />
              Built for intelligent monitoring and operational awareness.
            </div>
          </div>

          <div className="tml-hero-visual">
            <ProductPreview />
            <div className="tml-visual-caption">
              <span className="tml-caption-mark">i</span>
              <span>Conceptual interface preview — not live camera data.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="tml-capabilities tml-section" id="capabilities">
        <div className="tml-container">
          <div className="tml-section-intro">
            <div>
              <span className="tml-section-label">CAPABILITIES</span>
              <h2>One platform. <span>Connected capabilities.</span></h2>
            </div>
            <p>
              Core tools to help operators monitor traffic conditions, identify
              events and understand what is happening across the road network.
            </p>
          </div>

          <div className="tml-feature-grid">
            {features.map((feature) => (
              <article className="tml-feature" key={feature.number}>
                <div className="tml-feature-heading">
                  <span className="tml-feature-icon"><FeatureIcon type={feature.icon} /></span>
                  <span className="tml-feature-number">{feature.number}</span>
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="tml-workflow tml-section" id="workflow">
        <div className="tml-container">
          <div className="tml-section-intro tml-workflow-intro">
            <div>
              <span className="tml-section-label">HOW IT WORKS</span>
              <h2>From camera to <span>clearer decisions.</span></h2>
            </div>
            <p>A straightforward workflow that connects visual data with useful operational context.</p>
          </div>

          <div className="tml-workflow-grid">
            {workflow.map((step) => (
              <article className="tml-workflow-step" key={step.number}>
                <span className="tml-step-number">{step.number}</span>
                <div className="tml-step-rule" />
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="tml-about tml-section" id="about">
        <div className="tml-container tml-about-inner">
          <div>
            <span className="tml-section-label">ABOUT TRAFFICMIND AI</span>
            <h2>Designed to make traffic information <span>more useful.</span></h2>
          </div>
          <div className="tml-about-copy">
            <p>
              TrafficMind AI is an intelligent traffic monitoring platform that
              combines computer vision, camera feeds and traffic analytics in a
              centralized environment.
            </p>
            <p>
              It is designed to support traffic operators with clearer visibility
              into road activity, potential incidents and emergency-related events.
            </p>
            <Link to="/login" className="tml-inline-link">Access the platform <span>→</span></Link>
          </div>
        </div>
      </section>

      <section className="tml-cta-section">
        <div className="tml-container tml-cta-inner">
          <div>
            <span className="tml-section-label">TRAFFIC INTELLIGENCE, CONNECTED</span>
            <h2>Make every view <span>more meaningful.</span></h2>
            <p>Explore the TrafficMind AI monitoring environment.</p>
          </div>
          <Link to="/login" className="tml-button tml-button-light">Enter the platform <span>→</span></Link>
        </div>
      </section>

      <footer className="tml-footer">
        <div className="tml-container tml-footer-inner">
          <Link to="/" className="tml-brand tml-footer-brand">
            <span className="tml-brand-symbol">T</span>
            <span>TrafficMind <b>AI</b></span>
          </Link>
          <span className="tml-footer-copy">Intelligent traffic monitoring for smarter mobility.</span>
          <div className="tml-footer-links">
            <a href="#platform">Home</a>
            <a href="#capabilities">Capabilities</a>
            <Link to="/login">Log in</Link>
          </div>
          <span className="tml-copyright">© {new Date().getFullYear()} TrafficMind AI</span>
        </div>
      </footer>
    </main>
  );
}

export default LandingPage;
