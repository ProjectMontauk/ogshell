"use client";

import Navbar from "../../../components/Navbar";
import PageShell from "@/components/ui/PageShell";
import React, { useState, useEffect, useCallback } from "react";
import { useActiveAccount } from "thirdweb/react";
import { ArrowUp } from "@phosphor-icons/react";
import { SkeletonLines } from "../../components/ui/Skeleton";

const API_BASE_URL = "";

interface MarketIdea {
  id: number;
  title: string;
  description: string;
  rules: string;
  netVotes: number;
  walletAddress: string;
  createdAt?: string;
  status: "pending" | "approved" | "rejected";
}

function shortAddress(a: string) {
  return `${a.slice(0, 6)}...${a.slice(-4)}`;
}

export default function MarketIdeasPage() {
  const account = useActiveAccount();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'proposed' | 'submit'>('proposed');
  // State for market ideas
  const [marketIdeas, setMarketIdeas] = useState<MarketIdea[]>([]);
  const [votingIdeaId, setVotingIdeaId] = useState<number | null>(null);
  const [userVotes, setUserVotes] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  
  // Form state for new market idea
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<string | null>(null);

  // Fetch market ideas
  const fetchMarketIdeas = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/market-ideas`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setMarketIdeas(data);
        } else {
          console.error('Market ideas data is not an array:', data);
          setMarketIdeas([]);
        }
      } else {
        console.error('Failed to fetch market ideas:', res.status);
        setMarketIdeas([]);
      }
    } catch (error) {
      console.error('Error fetching market ideas:', error);
      setMarketIdeas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch user's existing votes
  const fetchUserVotes = useCallback(async () => {
    if (!account?.address) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/market-idea-votes?walletAddress=${account.address}`);
      if (res.ok) {
        const userVoteData = await res.json();
        const votedIdeaIds: Set<number> = new Set(userVoteData.map((vote: { ideaId: number }) => Number(vote.ideaId)));
        setUserVotes(votedIdeaIds);
      }
    } catch (error) {
      console.error('Failed to fetch user votes:', error);
    }
  }, [account?.address]);

  // Fetch data on mount
  useEffect(() => {
    fetchMarketIdeas();
  }, [fetchMarketIdeas]);

  useEffect(() => {
    if (account?.address) {
      fetchUserVotes();
    }
  }, [account?.address, fetchUserVotes]);

  // Handle vote toggle
  const handleVote = async (ideaId: number) => {
    if (!account?.address) return;
    
    setVotingIdeaId(ideaId);
    
    const hasVoted = userVotes.has(ideaId);
    
    // Optimistic update
    const optimisticIdeas = marketIdeas.map(idea => {
      if (idea.id === ideaId) {
        return {
          ...idea,
          netVotes: hasVoted ? idea.netVotes - 1 : idea.netVotes + 1
        };
      }
      return idea;
    });
    
    setMarketIdeas(optimisticIdeas);
    
    if (hasVoted) {
      setUserVotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(ideaId);
        return newSet;
      });
    } else {
      setUserVotes(prev => new Set(prev).add(ideaId));
    }
    
    try {
      const voteData = {
        ideaId,
        walletAddress: account.address,
        voteType: 'upvote'
      };
      
      const res = await fetch(`${API_BASE_URL}/api/market-idea-vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(voteData),
      });
      
      if (res.ok) {
        // Refresh data to get accurate vote counts
        await fetchMarketIdeas();
        await fetchUserVotes();
      } else {
        // Revert optimistic update on error
        setMarketIdeas(marketIdeas);
        if (hasVoted) {
          setUserVotes(prev => new Set(prev).add(ideaId));
        } else {
          setUserVotes(prev => {
            const newSet = new Set(prev);
            newSet.delete(ideaId);
            return newSet;
          });
        }
        
        console.error('Vote failed:', res.status);
      }
    } catch (error) {
      // Revert optimistic update on error
      setMarketIdeas(marketIdeas);
      if (hasVoted) {
        setUserVotes(prev => new Set(prev).add(ideaId));
      } else {
        setUserVotes(prev => {
          const newSet = new Set(prev);
          newSet.delete(ideaId);
          return newSet;
        });
      }
      console.error('Vote error:', error);
    } finally {
      setVotingIdeaId(null);
    }
  };

  // Handle form submission
  const handleSubmitIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!account?.address) {
      setSubmitFeedback("Please connect your wallet.");
      setTimeout(() => setSubmitFeedback(null), 3000);
      return;
    }
    
    if (!title.trim()) {
      setSubmitFeedback("Please enter a market title.");
      setTimeout(() => setSubmitFeedback(null), 3000);
      return;
    }
    
    setIsSubmitting(true);
    setSubmitFeedback("Submitting market idea...");
    
    try {
      const ideaData = {
        title: title.trim(),
        description: '', // Empty string since we removed this field
        rules: '', // Empty string since we removed this field
        walletAddress: account.address
      };
      
      console.log('Submitting idea data:', ideaData);
      console.log('API URL:', `${API_BASE_URL}/api/market-ideas`);
      
      const res = await fetch(`${API_BASE_URL}/api/market-ideas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ideaData),
      });
      
      if (res.ok) {
        setSubmitFeedback("Market idea submitted successfully!");
        setTitle('');
        await fetchMarketIdeas(); // Refresh the list
        setTimeout(() => setSubmitFeedback(null), 3000);
      } else {
        console.error('Response status:', res.status);
        console.error('Response headers:', res.headers);
        const errorData = await res.json();
        console.error('API error response:', errorData);
        setSubmitFeedback(errorData.error || "Failed to submit market idea.");
        setTimeout(() => setSubmitFeedback(null), 3000);
      }
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitFeedback("Failed to submit market idea. Please try again.");
      setTimeout(() => setSubmitFeedback(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sort ideas by votes (highest first)
  const sortedIdeas = [...marketIdeas].sort((a, b) => b.netVotes - a.netVotes);

  return (
    <div>
      <Navbar />
      <PageShell
        title="Rules"
        note="Vote for your favorite markets. Each week, the most popular market will be created and propose new questions on the Submit New Idea tab."
      >
        <div>
          <div role="tablist" aria-label="Market ideas" className="tabs">
            <button role="tab" type="button" aria-selected={activeTab === "proposed"} onClick={() => setActiveTab("proposed")} className="tab">
              Proposed Markets
            </button>
            <button role="tab" type="button" aria-selected={activeTab === "submit"} onClick={() => setActiveTab("submit")} className="tab">
              Submit New Idea
            </button>
          </div>

          {activeTab === "submit" && (
            <form onSubmit={handleSubmitIdea} className="mt-6 flex flex-col gap-4" noValidate>
              <h2 className="kicker">Submit New Market Idea</h2>
              <div>
                <label htmlFor="idea-title" className="label">
                  Market Title *
                </label>
                <input
                  id="idea-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Was Atlantis a real place?"
                  className="field"
                />
              </div>
              {submitFeedback && (
                <p role="status" className={`text-small font-semibold ${submitFeedback.includes("success") ? "text-yes" : "text-danger"}`}>
                  {submitFeedback}
                </p>
              )}
              <div>
                <button type="submit" disabled={isSubmitting || !account?.address} className="btn btn-primary btn-lg">
                  {isSubmitting ? "Submitting..." : "Submit Market Idea"}
                </button>
              </div>
            </form>
          )}

          {activeTab === "proposed" && (
            <div className="mt-6">
              <h2 className="kicker">Proposed Markets</h2>
              {loading ? (
                <>
                  <p className="sr-only">Loading market ideas...</p>
                  <SkeletonLines rows={5} className="py-4" />
                </>
              ) : sortedIdeas.length === 0 ? (
                <p className="py-4 text-body text-muted">No market ideas submitted yet.</p>
              ) : (
                <ol className="row-list">
                  {sortedIdeas.map((idea, idx) => {
                    const voted = userVotes.has(idea.id);
                    return (
                      <li key={idea.id} className="row-hover flex gap-3 border-b border-dotted border-rule py-4">
                        <div className="flex w-11 shrink-0 flex-col items-center">
                          <button
                            type="button"
                            onClick={() => handleVote(idea.id)}
                            disabled={votingIdeaId === idea.id}
                            aria-pressed={voted}
                            aria-label={voted ? "Remove vote" : "Upvote"}
                            className={`flex h-8 w-8 items-center justify-center border transition-[background-color,border-color,color,transform] duration-200 ease-out-quart active:scale-95 disabled:opacity-50 ${
                              voted ? "border-ink bg-ink text-ground" : "border-ink bg-transparent text-ink hover:bg-ink hover:text-ground"
                            }`}
                          >
                            <ArrowUp size={15} aria-hidden />
                          </button>
                          <span className="num mt-1.5 text-small font-medium text-ink">{idea.netVotes}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-2">
                            <span className="num shrink-0 pt-1 text-small font-semibold text-muted">#{idx + 1}</span>
                            <div className="min-w-0">
                              <p className="serif text-lead font-semibold leading-snug text-ink">{idea.title}</p>
                              <p className="mt-1 text-small text-muted">
                                Submitted by <span className="num">{shortAddress(idea.walletAddress)}</span> •{" "}
                                {idea.createdAt ? new Date(idea.createdAt).toLocaleDateString() : "Unknown date"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          )}
        </div>
      </PageShell>
    </div>
  );
}
