import React, { useState, useEffect, useRef, useCallback } from "react";
import Comment from "./Comment";
import { SkeletonLines } from "./ui/Skeleton";

const API_BASE_URL = "";

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

interface EvidenceCommentsProps {
  evidence: Evidence;
  currentUserAddress?: string;
  onShowSignInModal?: () => void;
}

const EvidenceComments: React.FC<EvidenceCommentsProps> = ({ evidence, currentUserAddress, onShowSignInModal }) => {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchComments = useCallback(async () => {
    if (!evidence) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ evidenceId: evidence.id.toString() });
      if (currentUserAddress) params.append("walletAddress", currentUserAddress);
      const response = await fetch(`${API_BASE_URL}/api/comments?${params}`);
      if (response.ok) setComments(await response.json());
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setIsLoading(false);
    }
  }, [evidence, currentUserAddress]);

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line
  }, [evidence]);

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    if (!currentUserAddress && textarea.value.trim().length > 0) {
      onShowSignInModal?.();
      setNewComment("");
      textarea.value = "";
      if (textareaRef.current) textareaRef.current.style.height = "";
      return;
    }
    setNewComment(textarea.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !evidence || !currentUserAddress) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evidenceId: evidence.id, content: newComment, walletAddress: currentUserAddress }),
      });
      if (response.ok) {
        setNewComment("");
        if (textareaRef.current) textareaRef.current.style.height = "";
        await fetchComments();
      }
    } catch (error) {
      console.error("Failed to submit comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (parentId: number, content: string) => {
    if (!evidence || !currentUserAddress) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evidenceId: evidence.id, parentId, content, walletAddress: currentUserAddress }),
      });
      if (response.ok) await fetchComments();
    } catch (error) {
      console.error("Failed to submit reply:", error);
      throw error;
    }
  };

  const handleVote = async (commentId: number, voteType: "upvote" | "downvote") => {
    if (!currentUserAddress) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/comment-vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, walletAddress: currentUserAddress, voteType }),
      });
      if (response.ok) {
        const updateCommentVotes = (list: CommentData[]): CommentData[] =>
          list.map((comment) => {
            if (comment.id === commentId) {
              const updated = { ...comment };
              if (comment.userVote === voteType) {
                if (voteType === "upvote") updated.upvotes = Math.max(0, comment.upvotes - 1);
                else updated.downvotes = Math.max(0, comment.downvotes - 1);
                updated.userVote = null;
              } else if (comment.userVote && comment.userVote !== voteType) {
                if (voteType === "upvote") {
                  updated.upvotes = comment.upvotes + 1;
                  updated.downvotes = Math.max(0, comment.downvotes - 1);
                } else {
                  updated.downvotes = comment.downvotes + 1;
                  updated.upvotes = Math.max(0, comment.upvotes - 1);
                }
                updated.userVote = voteType;
              } else {
                if (voteType === "upvote") updated.upvotes = comment.upvotes + 1;
                else updated.downvotes = comment.downvotes + 1;
                updated.userVote = voteType;
              }
              return updated;
            }
            return { ...comment, replies: updateCommentVotes(comment.replies) };
          });
        setComments(updateCommentVotes);
      }
    } catch (error) {
      console.error("Failed to vote on comment:", error);
      throw error;
    }
  };

  return (
    <div className="mt-4 flex flex-col gap-6">
      <form onSubmit={handleSubmitComment} className="flex flex-col gap-2">
        <label htmlFor="new-comment" className="sr-only">
          Add a comment
        </label>
        <textarea
          id="new-comment"
          ref={textareaRef}
          value={newComment}
          onChange={handleTextareaInput}
          placeholder="Add a comment..."
          className="field-area min-h-[2.75rem]"
          rows={1}
          disabled={isSubmitting}
        />
        {newComment.trim().length > 0 && (
          <div className="flex justify-end">
            <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-sm">
              {isSubmitting ? "Posting..." : "Post Comment"}
            </button>
          </div>
        )}
      </form>

      {isLoading ? (
        <>
          <p className="sr-only">Loading comments...</p>
          <SkeletonLines rows={3} />
        </>
      ) : comments.length === 0 ? (
        <p className="text-small text-muted">No comments yet. Be the first to comment!</p>
      ) : (
        <div className="flex flex-col">
          {comments.map((comment) => (
            <Comment key={comment.id} comment={comment} evidenceId={evidence.id} currentUserAddress={currentUserAddress} onReply={handleReply} onVote={handleVote} />
          ))}
        </div>
      )}
    </div>
  );
};

export default EvidenceComments;
