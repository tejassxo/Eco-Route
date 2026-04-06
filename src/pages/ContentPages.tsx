import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

const PageLayout: React.FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({ title, subtitle, children }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".page-header", 
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
      );
      gsap.fromTo(".page-content > *", 
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power2.out", delay: 0.2 }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#fafafa] pt-24 pb-12 px-6 font-sans text-gray-900">
      <div className="max-w-4xl mx-auto">
        <div className="page-header mb-12 border-b border-gray-200 pb-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">{title}</h1>
          <p className="text-xl text-gray-500">{subtitle}</p>
        </div>
        <div className="page-content prose prose-lg prose-gray max-w-none">
          {children}
        </div>
      </div>
    </div>
  );
};

export const CareersPage = () => (
  <PageLayout title="Careers" subtitle="Join us in building the future of digital verification.">
    <h2>Open Positions</h2>
    <div className="space-y-6 mt-8">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-shadow hover:shadow-md">
        <h3 className="text-xl font-semibold m-0">Senior Frontend Engineer</h3>
        <p className="text-gray-500 mt-1 mb-4">Remote • Full-time</p>
        <p>We are looking for an expert in React, Next.js, and GSAP to craft premium user experiences.</p>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-shadow hover:shadow-md">
        <h3 className="text-xl font-semibold m-0">Security Specialist</h3>
        <p className="text-gray-500 mt-1 mb-4">New York / Remote • Full-time</p>
        <p>Help us ensure our digital certificates are tamper-proof and our infrastructure is impenetrable.</p>
      </div>
    </div>
    <h2 className="mt-12">Our Culture</h2>
    <p>We believe in minimalism, high performance, and spacial awareness—not just in our UI, but in how we work. We give you the space to do your best work.</p>
  </PageLayout>
);

export const BlogPage = () => (
  <PageLayout title="Blog" subtitle="Insights, updates, and thoughts from our team.">
    <div className="space-y-8">
      <article className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <p className="text-sm text-blue-600 font-semibold mb-2">April 6, 2026</p>
        <h2 className="text-2xl font-bold mt-0 mb-3">The Future of Digital Certificates</h2>
        <p className="text-gray-600">How cryptographic verification is changing the way we trust digital documents, and why Apple-level aesthetics matter in enterprise software.</p>
      </article>
      <article className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <p className="text-sm text-blue-600 font-semibold mb-2">March 15, 2026</p>
        <h2 className="text-2xl font-bold mt-0 mb-3">Securing Firebase Authentication</h2>
        <p className="text-gray-600">A deep dive into implementing robust rate limiting, OTP verification, and strict Firestore security rules.</p>
      </article>
    </div>
  </PageLayout>
);

export const TermsPage = () => (
  <PageLayout title="Terms of Service" subtitle="Please read these terms carefully before using our platform.">
    <h3>1. Acceptance of Terms</h3>
    <p>By accessing and using this platform, you accept and agree to be bound by the terms and provision of this agreement.</p>
    <h3>2. Use License</h3>
    <p>Permission is granted to temporarily download one copy of the materials (information or software) on our website for personal, non-commercial transitory viewing only.</p>
    <h3>3. Disclaimer</h3>
    <p>The materials on our website are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
  </PageLayout>
);

export const PrivacyPage = () => (
  <PageLayout title="Privacy Policy" subtitle="How we collect, use, and protect your data.">
    <h3>Data Collection</h3>
    <p>We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us.</p>
    <h3>Data Security</h3>
    <p>We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction. All sensitive data is encrypted at rest and in transit.</p>
    <h3>Audit Logs</h3>
    <p>For security and compliance purposes, we maintain detailed audit logs of authentication events and critical system actions.</p>
  </PageLayout>
);

export const CookiesPage = () => (
  <PageLayout title="Cookie Policy" subtitle="Understanding how we use cookies.">
    <h3>What are cookies?</h3>
    <p>Cookies are small pieces of text sent by your web browser by a website you visit. A cookie file is stored in your web browser and allows the Service or a third-party to recognize you and make your next visit easier and the Service more useful to you.</p>
    <h3>How we use cookies</h3>
    <p>When you use and access the Service, we may place a number of cookies files in your web browser. We use cookies for the following purposes: to enable certain functions of the Service, to provide analytics, to store your preferences, and to enable advertisements delivery.</p>
  </PageLayout>
);

export const FeaturesPage = () => (
  <PageLayout title="Features" subtitle="Everything you need to issue and verify certificates.">
    <div className="grid md:grid-cols-2 gap-6 mt-8">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-semibold m-0">Instant Issuance</h3>
        <p className="text-gray-500 mt-2">Generate thousands of certificates in seconds with our high-performance builder.</p>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-semibold m-0">Cryptographic Verification</h3>
        <p className="text-gray-500 mt-2">Every certificate is mathematically verifiable and tamper-proof.</p>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-semibold m-0">Audit Trails</h3>
        <p className="text-gray-500 mt-2">Comprehensive logging of all issuance and verification events.</p>
      </div>
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-semibold m-0">Custom Branding</h3>
        <p className="text-gray-500 mt-2">Design certificates that perfectly match your organization's visual identity.</p>
      </div>
    </div>
  </PageLayout>
);

export const BuilderPage = () => (
  <PageLayout title="Certificate Builder" subtitle="Design beautiful, secure certificates.">
    <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center mt-8">
      <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold m-0">Builder Interface</h2>
      <p className="text-gray-500 mt-2 max-w-md mx-auto">Design and customize your eco-friendly certificates here.</p>
    </div>
  </PageLayout>
);

export const VerificationPage = () => (
  <PageLayout title="Verify Certificate" subtitle="Check the authenticity of any issued certificate.">
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mt-8 max-w-2xl mx-auto">
      <div className="flex gap-4">
        <input 
          type="text" 
          placeholder="Enter Certificate ID (e.g., CERT-12345)" 
          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
        />
        <button className="px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors">
          Verify
        </button>
      </div>
      <p className="text-sm text-gray-400 mt-4 text-center">Verification is instant and cryptographically secure.</p>
    </div>
  </PageLayout>
);
