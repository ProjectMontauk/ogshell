"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useActiveAccount } from "thirdweb/react";
import { ArrowLeft, ArrowUpRight } from "@phosphor-icons/react";
import EvidenceComments from "../../../../components/EvidenceComments";
import Navbar from "../../../../../components/Navbar";
import { SkeletonLines } from "../../../../components/ui/Skeleton";

interface Evidence {
  id: number;
  type: "yes" | "no";
  title: string;
  url?: string;
  description: string;
  netVotes: number;
  walletAddress: string;
  createdAt?: string;
  commentCount: number;
}

// Scroll to and focus the ConnectButton in the Navbar, then open it (main's flow and timings).
// main matched its button by the black background class; the restyled button is matched by
// thirdweb's own data-test attribute as well.
function focusConnectButton() {
  setTimeout(() => {
    const connectButton = document.querySelector(
      '[data-testid="connect-button"], button[class*="bg-black"], [data-test="connect-wallet-button"]'
    ) as HTMLElement;
    if (connectButton) {
      connectButton.scrollIntoView({ behavior: "smooth", block: "center" });
      connectButton.focus();
      // Trigger click after a short delay to ensure it's visible
      setTimeout(() => {
        connectButton.click();
      }, 500);
    }
  }, 100);
}

export default function EvidenceDiscussionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const account = useActiveAccount();

  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSignInModal, setShowSignInModal] = useState(false);

  useEffect(() => {
    const fetchEvidence = async () => {
      try {
        const evidenceId = resolvedParams.id;
        if (!evidenceId) return;
        // Fetch evidence from the new API route
        const response = await fetch(`/api/evidence/discussion/${evidenceId}`);
        if (!response.ok) {
          throw new Error("Evidence not found");
        }

        const evidenceData = await response.json();
        setEvidence(evidenceData);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to load evidence:", err);
        setError("Failed to load evidence");
        setIsLoading(false);
      }
    };

    if (resolvedParams.id) {
      fetchEvidence();
    }
  }, [resolvedParams.id]);

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return url;
    }
  };

  const isPdfUrl = (url: string): boolean => {
    return (
      url.toLowerCase().includes("/uploads/evidence/") ||
      url.toLowerCase().includes("blob.vercel-storage.com") ||
      url.toLowerCase().endsWith(".pdf")
    );
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div>
      <Navbar />
      <div className="container-page pb-24 pt-10 md:pt-14">
        <div className="mx-auto max-w-3xl">
          <button type="button" onClick={() => router.back()} aria-label="Back to Market" className="btn btn-ghost btn-sm touch -ml-2 mb-4">
            <ArrowLeft size={16} aria-hidden />
          </button>

          {isLoading ? (
            <SkeletonLines rows={4} />
          ) : error || !evidence ? (
            <div className="py-10">
              <h1 className="serif text-heading font-bold text-ink">Evidence Not Found</h1>
              <p className="mt-2 text-small text-muted">The evidence you&apos;re looking for doesn&apos;t exist or has been removed.</p>
              <button type="button" onClick={() => router.back()} className="btn btn-primary btn-sm mt-4">
                Go Back
              </button>
            </div>
          ) : (
            <article className="fade-up">
              <div className="flex flex-wrap items-center gap-3 border-b border-ink pb-1.5 text-small">
                <span className={`font-semibold ${evidence.type === "yes" ? "text-yes" : "text-no"}`}>
                  {evidence.type === "yes" ? "YES" : "NO"}
                </span>
                {evidence.createdAt && <span className="text-muted">{formatDate(evidence.createdAt)}</span>}
              </div>
              <h1 className="serif mt-4 text-[clamp(32px,4.6vw,52px)] font-extrabold leading-[1] tracking-[-0.03em] text-ink">{evidence.title}</h1>
              {evidence.description && <p className="serif mt-4 max-w-[65ch] text-lead leading-relaxed text-ink-2">{evidence.description}</p>}

              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-rule py-3 text-small">
                {evidence.url && (
                  <a href={evidence.url} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-1.5 font-medium">
                    View Source ({isPdfUrl(evidence.url) ? "pdf" : getDomain(evidence.url)})
                    <ArrowUpRight size={14} className="text-muted" aria-hidden />
                  </a>
                )}
                <span className="text-muted">
                  <span className="num text-ink">{evidence.netVotes}</span> Net Votes
                </span>
                <span className="text-muted">
                  Submitted by <span className="num">{evidence.walletAddress.slice(0, 6)}...{evidence.walletAddress.slice(-4)}</span>
                </span>
                <span className="text-muted">
                  <span className="num">{evidence.commentCount}</span> comments
                </span>
              </div>

              <section className="mt-16" aria-labelledby="discussion-heading">
                <h2 id="discussion-heading" className="kicker">
                  Discussion
                </h2>
                <EvidenceComments evidence={evidence} currentUserAddress={account?.address} onShowSignInModal={() => setShowSignInModal(true)} />
              </section>
            </article>
          )}
        </div>
      </div>

      {showSignInModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="signin-heading">
          <button type="button" aria-label="Close" onClick={() => setShowSignInModal(false)} className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]" />
          <div className="relative w-full max-w-sm border border-ink bg-ground p-5 shadow-[6px_6px_0_var(--ink)]">
            <h3 id="signin-heading" className="serif text-lead font-bold text-ink">Sign In Required</h3>
            <p className="mt-1.5 text-small text-muted">Please sign in to add a comment</p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setShowSignInModal(false)} className="btn btn-ghost btn-sm">
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setShowSignInModal(false);
                  focusConnectButton();
                }}
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
