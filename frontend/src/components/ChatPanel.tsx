"use client";

import React, { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CitationItem,
  MessageRecord,
  fetchDealMessages,
  streamChatResponse,
} from "@/lib/chat";
import {
  Send,
  Sparkles,
  Bot,
  User,
  Loader2,
  FileText,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatPanelProps {
  dealId: string;
  onSelectCitation: (citation: CitationItem) => void;
}

const SAMPLE_QUESTIONS = [
  "What are the main financial risks disclosed in the documents?",
  "Summarize the key contract terms and termination clauses.",
  "Are there any pending litigation or compliance liabilities?",
];

// Helper to render text with inline citation chips [1], [2]...
function RenderedMessageContent({
  content,
  citations,
  onSelectCitation,
}: {
  content: string;
  citations: CitationItem[];
  onSelectCitation: (citation: CitationItem) => void;
}) {
  // Regex to split by [1], [2], etc.
  const parts = content.split(/(\[\d+\])/g);

  return (
    <span className="leading-relaxed whitespace-pre-wrap">
      {parts.map((part, i) => {
        const match = part.match(/^\[(\d+)\]$/);
        if (match) {
          const markerNum = parseInt(match[1], 10);
          // Find matching citation by 1-based index or position
          const citation = citations[markerNum - 1] || citations[0];

          return (
            <button
              key={i}
              type="button"
              onClick={() => {
                if (citation) onSelectCitation(citation);
              }}
              title={
                citation
                  ? `Click to view source: ${citation.filename} (Page ${citation.page_number})`
                  : `Source chunk [${markerNum}]`
              }
              className="inline-flex items-center gap-0.5 mx-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 transition-all hover:scale-105 active:scale-95 align-baseline"
            >
              <BookOpen className="h-2.5 w-2.5" />
              <span>[{markerNum}]</span>
            </button>
          );
        }

        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

export function ChatPanel({ dealId, onSelectCitation }: ChatPanelProps) {
  const queryClient = useQueryClient();
  const [question, setQuestion] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [streamingCitations, setStreamingCitations] = useState<CitationItem[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load chat history
  const { data: history, isLoading: isHistoryLoading } = useQuery({
    queryKey: ["chat-messages", dealId],
    queryFn: () => fetchDealMessages(dealId),
    refetchOnWindowFocus: false,
  });

  const messages: MessageRecord[] = history?.items ?? [];

  // Auto-scroll to bottom on message or streaming updates
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const handleSend = async (qText?: string) => {
    const textToSend = qText || question;
    if (!textToSend.trim() || isStreaming) return;

    setQuestion("");
    setErrorMsg(null);
    setStreamingContent("");
    setStreamingCitations([]);
    setIsStreaming(true);

    await streamChatResponse(dealId, textToSend.trim(), {
      onToken: (token) => {
        setStreamingContent((prev) => prev + token);
      },
      onCitations: (citations) => {
        setStreamingCitations(citations);
      },
      onError: (err) => {
        setErrorMsg(err);
        setIsStreaming(false);
      },
      onDone: () => {
        setIsStreaming(false);
        setStreamingContent("");
        setStreamingCitations([]);
        // Refetch chat history to show saved messages
        queryClient.invalidateQueries({ queryKey: ["chat-messages", dealId] });
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background/50">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {isHistoryLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 && !isStreaming ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-6 space-y-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-lg shadow-primary/5">
              <Sparkles className="h-8 w-8" />
            </div>
            <div className="max-w-md space-y-2">
              <h3 className="text-base font-bold text-foreground">
                Ask your Deal Copilot
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Query deal documents with instant, cited answers derived directly from your uploaded materials.
              </p>
            </div>

            {/* Quick Sample Prompts */}
            <div className="w-full max-w-lg space-y-2 pt-4">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Suggested Questions
              </span>
              <div className="grid gap-2">
                {SAMPLE_QUESTIONS.map((sq, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(sq)}
                    className="flex items-center justify-between rounded-xl border border-border/25 bg-card/20 p-3 text-left text-xs text-foreground/90 transition-all hover:bg-primary/10 hover:border-primary/30"
                  >
                    <span>{sq}</span>
                    <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Historical Messages */}
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3 max-w-3xl",
                    isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border text-xs font-bold shadow-sm",
                      isUser
                        ? "bg-primary text-primary-foreground border-primary/50"
                        : "bg-card border-border/30 text-primary"
                    )}
                  >
                    {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>

                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 text-xs leading-relaxed border shadow-sm max-w-xl",
                      isUser
                        ? "bg-primary/90 text-primary-foreground border-primary/40 rounded-tr-none"
                        : "bg-card/70 text-foreground border-border/25 rounded-tl-none backdrop-blur-sm"
                    )}
                  >
                    <RenderedMessageContent
                      content={msg.content}
                      citations={msg.citations}
                      onSelectCitation={onSelectCitation}
                    />

                    {/* Render Citations Chips Badge List below Assistant Message if present */}
                    {!isUser && msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-border/15 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mr-1">
                          Sources:
                        </span>
                        {msg.citations.map((cit, cIdx) => (
                          <button
                            key={cIdx}
                            onClick={() => onSelectCitation(cit)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-muted/40 hover:bg-primary/20 text-muted-foreground hover:text-primary border border-border/30 transition-colors"
                          >
                            <FileText className="h-3 w-3 text-primary" />
                            <span className="truncate max-w-[120px]">{cit.filename}</span>
                            <span className="text-primary font-bold">p.{cit.page_number}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Currently Streaming Assistant Bubble */}
            {isStreaming && (
              <div className="flex gap-3 mr-auto max-w-3xl">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-card border border-border/30 text-primary shadow-sm">
                  <Bot className="h-4 w-4 animate-pulse text-primary" />
                </div>
                <div className="rounded-2xl rounded-tl-none bg-card/70 border border-border/25 px-4 py-3 text-xs text-foreground backdrop-blur-sm shadow-sm max-w-xl">
                  {streamingContent ? (
                    <RenderedMessageContent
                      content={streamingContent}
                      citations={streamingCitations}
                      onSelectCitation={onSelectCitation}
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      <span>Thinking & searching documents...</span>
                    </div>
                  )}
                  <span className="inline-block h-3 w-1.5 ml-1 bg-primary animate-pulse" />
                </div>
              </div>
            )}

            {/* Error Banner */}
            {errorMsg && (
              <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Question Input Footer */}
      <div className="shrink-0 p-4 border-t border-border/15 bg-card/10 backdrop-blur-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-end gap-2 rounded-2xl border border-border/25 bg-card/40 p-2 shadow-sm focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your deal documents (Press Enter to send)..."
            disabled={isStreaming}
            className="flex-1 resize-none bg-transparent px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none max-h-32 min-h-[36px]"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!question.trim() || isStreaming}
            className="h-8 w-8 shrink-0 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
