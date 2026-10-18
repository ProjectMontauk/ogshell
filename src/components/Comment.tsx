import React, { useState } from "react";
import { Collapse } from "./ui/Collapse";
import { ArrowDown, ArrowUp } from "@phosphor-icons/react";

interface CommentData {
  id: number;
  content: string;
  walletAddress: string;
  createdAt: string;
  upvotes: number;
  downvotes: number;
  userVote?: string | null;
  replies: CommentData[];
}

interface CommentProps {
  comment: CommentData;
  evidenceId: number;
  currentUserAddress?: string;
  onReply: (parentId: number, content: string) => void;
  onVote: (commentId: number, voteType: "upvote" | "downvote") => void;
  depth?: number;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  if (diffInHours < 1) return "just now";
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString();
}

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const voteBtn = "flex h-6 w-6 items-center justify-center rounded-control transition-colors duration-200 disabled:opacity-50";

const Comment: React.FC<CommentProps> = ({ comment, evidenceId, currentUserAddress, onReply, onVote, depth = 0 }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !currentUserAddress) return;
    setIsSubmitting(true);
    try {
      await onReply(comment.id, replyContent);
      setReplyContent("");
      setShowReplyForm(false);
    } catch (error) {
      console.error("Failed to submit reply:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (voteType: "upvote" | "downvote") => {
    if (!currentUserAddress || isVoting) return;
    setIsVoting(true);
    try {
      await onVote(comment.id, voteType);
    } catch (error) {
      console.error("Failed to vote:", error);
    } finally {
      setIsVoting(false);
    }
  };

  const netVotes = comment.upvotes - comment.downvotes;

  return (
    <div className={depth > 0 ? "ml-4 border-l border-rule pl-4 md:ml-10" : "border-b border-dotted border-rule py-4"}>
      <div className="flex items-start gap-3">
        <div className="flex shrink-0 flex-col items-center">
          <button
            type="button"
            onClick={() => handleVote("upvote")}
            disabled={isVoting || !currentUserAddress}
            aria-pressed={comment.userVote === "upvote"}
            aria-label="Upvote"
            className={`${voteBtn} ${comment.userVote === "upvote" ? "bg-yes-soft text-yes" : "text-muted hover:bg-ground-2 hover:text-ink"}`}
          >
            <ArrowUp size={14} weight="bold" aria-hidden />
          </button>
          <span className="num my-0.5 text-small font-medium text-ink">{netVotes}</span>
          <button
            type="button"
            onClick={() => handleVote("downvote")}
            disabled={isVoting || !currentUserAddress}
            aria-pressed={comment.userVote === "downvote"}
            aria-label="Downvote"
            className={`${voteBtn} ${comment.userVote === "downvote" ? "bg-no-soft text-no" : "text-muted hover:bg-ground-2 hover:text-ink"}`}
          >
            <ArrowDown size={14} weight="bold" aria-hidden />
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2 text-small">
            <span className="num font-medium text-ink-2">{shortenAddress(comment.walletAddress)}</span>
            <span className="text-muted">{formatDate(comment.createdAt)}</span>
          </div>
          <p className="serif mt-1 whitespace-pre-wrap text-lead leading-relaxed text-ink">{comment.content}</p>
          {currentUserAddress && (
            <button type="button" onClick={() => setShowReplyForm(!showReplyForm)} aria-expanded={showReplyForm} className="mt-1.5 text-small font-medium text-muted transition-colors hover:text-ink">
              Reply
            </button>
          )}

          <Collapse open={showReplyForm}>
            <form onSubmit={handleSubmitReply} className="flex flex-col gap-2 pt-2">
              <label htmlFor={`reply-${comment.id}`} className="sr-only">
                Reply
              </label>
              <textarea
                id={`reply-${comment.id}`}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="field-area min-h-[4rem] text-small"
                rows={3}
                disabled={isSubmitting}
              />
              <div className="flex gap-2">
                <button type="submit" disabled={!replyContent.trim() || isSubmitting} className="btn btn-primary btn-sm">
                  {isSubmitting ? "Posting..." : "Post Reply"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReplyForm(false);
                    setReplyContent("");
                  }}
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </Collapse>

          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 flex flex-col gap-4">
              {comment.replies.map((reply) => (
                <Comment key={reply.id} comment={reply} evidenceId={evidenceId} currentUserAddress={currentUserAddress} onReply={onReply} onVote={onVote} depth={depth + 1} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Comment;
