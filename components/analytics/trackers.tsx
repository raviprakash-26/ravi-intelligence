"use client";

import * as React from "react";
import Script from "next/script";

const CONSENT_KEY = "ravi-intelligence-cookie-consent";

export function Trackers() {
  const [consentGranted, setConsentGranted] = React.useState(false);

  const checkConsent = React.useCallback(() => {
    if (typeof window !== "undefined") {
      const consent = localStorage.getItem(CONSENT_KEY);
      setConsentGranted(consent === "accepted");
    }
  }, []);

  React.useEffect(() => {
    checkConsent();
    window.addEventListener("cookie-consent-choice", checkConsent);
    return () => window.removeEventListener("cookie-consent-choice", checkConsent);
  }, [checkConsent]);

  if (!consentGranted) return null;

  return (
    <>
      {/* 1. Google Analytics 4 Script placeholder */}
      <Script
        strategy="afterInteractive"
        src="https://www.googletagmanager.com/gtag/js?id=G-GA4MEASUREMENTID"
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-GA4MEASUREMENTID', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />

      {/* 2. Microsoft Clarity Script placeholder */}
      <Script
        id="microsoft-clarity"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window,document,"clarity","script","clarityprojectid");
          `,
        }}
      />

      {/* 3. Plausible Analytics Script placeholder */}
      <Script
        strategy="afterInteractive"
        data-domain="ravi-intelligence.com"
        src="https://plausible.io/js/script.js"
      />
    </>
  );
}
