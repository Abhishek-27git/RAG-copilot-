import { api } from "./api";

export interface CitationItem {
  document_id: string;
  page_number: number;
  chunk_index: number;
  source_text: string;
  filename: string;
}


export interface MessageRecord {
  id: string;
  deal_id: string;
  role: "user" | "assistant";
  content: string;
  citations: CitationItem[];
  created_at: string;
}

export interface PaginatedMessages {
  items: MessageRecord[];
  total: number;
  page: number;
  page_size: number;
}

export async function fetchDealMessages(
  dealId: string,
  page: number = 1,
  pageSize: number = 50
): Promise<PaginatedMessages> {
  return api.get(`/deals/${dealId}/messages?page=${page}&page_size=${pageSize}`);
}

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onCitations: (citations: CitationItem[]) => void;
  onError: (error: string) => void;
  onDone: () => void;
}

export async function streamChatResponse(
  dealId: string,
  question: string,
  callbacks: StreamCallbacks
): Promise<void> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/deals/${dealId}/chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
        credentials: "include",
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ detail: "Chat request failed" }));
      callbacks.onError(errData.detail || `Server error ${response.status}`);
      return;
    }

    if (!response.body) {
      callbacks.onError("No response body received from server");
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete line in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;

        const jsonStr = trimmed.replace(/^data:\s*/, "");
        if (!jsonStr) continue;

        try {
          const parsed = JSON.parse(jsonStr);

          if (parsed.type === "token" && parsed.content) {
            callbacks.onToken(parsed.content);
          } else if (parsed.type === "citations" && Array.isArray(parsed.citations)) {
            callbacks.onCitations(parsed.citations);
          } else if (parsed.type === "done") {
            callbacks.onDone();
          }
        } catch {
          // Ignore JSON parse errors for non-JSON SSE lines
        }
      }
    }

    callbacks.onDone();
  } catch (err: any) {
    callbacks.onError(err?.message || "Network error occurred");
  }
}
