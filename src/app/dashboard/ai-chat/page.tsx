"use client";

import {
  memo,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Sparkles,
  Send,
  Plus,
  History,
  Database,
  Copy,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ChevronRight,
  X,
  Search,
  Trash2,
  TrendingUp,
  FileEdit,
  Package,
  Mail,
  Calculator,
  SearchCheck,
  Paperclip,
  Loader2,
  Check,
  ExternalLink,
  Square,
  RotateCcw,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { useSupabase } from "@/hooks/use-supabase";
import { useTenant } from "@/hooks/use-tenant";
import { cn } from "@/lib/utils";
import { useWebSearchQuota } from "@/hooks/use-web-search-quota";
import type { AiChatSession } from "@/types/database";

// ─── Suggestion Chips ───────────────────────────────────────────

const SUGGESTIONS = [
  {
    icon: TrendingUp,
    title: "ბიზნეს ანალიტიკა",
    text: "გაანალიზე გაყიდვები ბოლო 30 დღეში",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: FileEdit,
    title: "Facebook პოსტის შექმნა",
    text: "დამიწერე Facebook პოსტი ახალი კოლექციისთვის",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: Package,
    title: "პროდუქტების ანალიზი",
    text: "რომელი პროდუქტი გაიყიდა ყველაზე მეტად?",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    icon: Mail,
    title: "სარეკლამო კონტენტი",
    text: "შექმენი სარეკლამო ტექსტი ახალი აქციისთვის",
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    icon: Calculator,
    title: "ფინანსური გამოთვლები",
    text: "გამოთვალე ამ თვის შემოსავალი და მოგება",
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
  {
    icon: SearchCheck,
    title: "ბაზრის კვლევა",
    text: "რა ტრენდებია ჩემს ინდუსტრიაში?",
    color: "text-teal-600",
    bg: "bg-teal-50",
  },
];

// ─── Memoized Markdown ──────────────────────────────────────────

const REMARK_PLUGINS = [remarkGfm];

function CodeBlockWrapper({
  children,
  ...props
}: React.HTMLAttributes<HTMLPreElement>) {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  const handleCopy = () => {
    const text = preRef.current?.textContent || "";
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="group/code relative">
      <pre ref={preRef} {...props}>
        {children}
      </pre>
      <button
        onClick={handleCopy}
        className="absolute right-2 top-2 rounded-md bg-surface-container-highest/80 p-1.5 text-on-surface-variant/60 opacity-0 transition-all hover:text-on-surface-variant group-hover/code:opacity-100"
        title="კოდის კოპირება"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-500" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}

const MARKDOWN_COMPONENTS = {
  a: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  ),
  pre: CodeBlockWrapper,
};

const MarkdownContent = memo(function MarkdownContent({
  content,
}: {
  content: string;
}) {
  return (
    <ReactMarkdown
      remarkPlugins={REMARK_PLUGINS}
      components={MARKDOWN_COMPONENTS}
    >
      {content}
    </ReactMarkdown>
  );
});

const PROSE_CLASSES =
  "prose prose-sm max-w-none dark:prose-invert prose-headings:text-on-surface prose-p:text-on-surface prose-strong:text-on-surface prose-li:text-on-surface prose-a:text-primary prose-a:underline prose-blockquote:border-primary/30 prose-blockquote:text-on-surface-variant prose-th:text-on-surface prose-td:text-on-surface prose-code:rounded prose-code:bg-surface-container-high prose-code:px-1 prose-code:py-0.5 prose-code:text-xs prose-pre:bg-surface-container-high prose-pre:text-on-surface prose-table:text-sm [&_table]:overflow-x-auto [&_table]:block";

// ─── Types ──────────────────────────────────────────────────────

interface WebSource {
  type: "web";
  title: string;
  url: string;
}

interface DataSource {
  type: string;
  label: string;
  count: number;
}

type MessageSource = DataSource | WebSource;

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources: MessageSource[];
  created_at: string;
  isStreaming?: boolean;
  isError?: boolean;
  used_web_search?: boolean;
}

interface SourceCount {
  type: string;
  label: string;
  count: number;
}

// ─── Date Grouping Helper ───────────────────────────────────────

function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const dayMs = 86400000;

  // Same day
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  if (isToday) return "დღეს";

  // Yesterday
  const yesterday = new Date(now.getTime() - dayMs);
  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  )
    return "გუშინ";

  // This week (within 7 days)
  if (diff < 7 * dayMs) return "ამ კვირაში";

  return "ძველი";
}

function groupSessions(
  sessions: AiChatSession[],
): Record<string, AiChatSession[]> {
  const groups: Record<string, AiChatSession[]> = {};
  const order = ["დღეს", "გუშინ", "ამ კვირაში", "ძველი"];

  for (const session of sessions) {
    const group = getDateGroup(session.created_at);
    if (!groups[group]) groups[group] = [];
    groups[group].push(session);
  }

  // Return in order
  const ordered: Record<string, AiChatSession[]> = {};
  for (const key of order) {
    if (groups[key]) ordered[key] = groups[key];
  }
  return ordered;
}

// ─── Main Component ─────────────────────────────────────────────

export default function AiChatPage() {
  return (
    <Suspense fallback={null}>
      <AiChatContent />
    </Suspense>
  );
}

function AiChatContent() {
  const supabase = useSupabase();
  const { tenant, loading: tenantLoading } = useTenant();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  // Web search state
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [expandedWebSources, setExpandedWebSources] = useState<string | null>(
    null,
  );
  const webSearchQuota = useWebSearchQuota(tenant?.id);

  // UI state
  const [showHistory, setShowHistory] = useState(false);
  const [showSources, setShowSources] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showKnowledgeDropdown, setShowKnowledgeDropdown] = useState(false);
  const [dataSources, setDataSources] = useState<SourceCount[]>([]);
  const [isNearBottom, setIsNearBottom] = useState(true);

  // History state
  const [sessions, setSessions] = useState<AiChatSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [sessionPreviews, setSessionPreviews] = useState<
    Record<string, string>
  >({});

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const knowledgeRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const prefillHandled = useRef(false);

  // Cleanup streaming on unmount, auto-focus input
  useEffect(() => {
    // Delay focus to avoid conflict with page transitions
    const timer = setTimeout(() => textareaRef.current?.focus(), 300);
    return () => {
      clearTimeout(timer);
      abortControllerRef.current?.abort();
    };
  }, []);

  // ─── Load data sources count ────────────────────────────────

  useEffect(() => {
    if (!tenant) return;

    async function loadSourceCounts() {
      const [products, orders, conversations, zones, faqs, entries, docs] =
        await Promise.all([
          supabase
            .from("products")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", tenant!.id)
            .eq("is_active", true),
          supabase
            .from("orders")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", tenant!.id),
          supabase
            .from("conversations")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", tenant!.id),
          supabase
            .from("delivery_zones")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", tenant!.id)
            .eq("is_active", true),
          supabase
            .from("faqs")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", tenant!.id),
          supabase
            .from("knowledge_entries")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", tenant!.id)
            .eq("is_active", true),
          supabase
            .from("knowledge_documents")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", tenant!.id)
            .eq("status", "ready"),
        ]);

      setDataSources([
        {
          type: "products",
          label: "პროდუქტები",
          count: products.count || 0,
        },
        { type: "orders", label: "შეკვეთები", count: orders.count || 0 },
        {
          type: "conversations",
          label: "საუბრები",
          count: conversations.count || 0,
        },
        { type: "zones", label: "მიწოდების ზონები", count: zones.count || 0 },
        { type: "faqs", label: "FAQ", count: faqs.count || 0 },
        {
          type: "knowledge",
          label: "ცოდნის ბაზა",
          count: entries.count || 0,
        },
        {
          type: "documents",
          label: "დოკუმენტები",
          count: docs.count || 0,
        },
      ]);
    }

    loadSourceCounts();
  }, [tenant, supabase]);

  // ─── Load sessions ──────────────────────────────────────────

  const loadSessions = useCallback(async () => {
    if (!tenant) return;
    setSessionsLoading(true);
    const { data } = await supabase
      .from("ai_chat_sessions")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("updated_at", { ascending: false });

    if (data) {
      setSessions(data as AiChatSession[]);

      // Load first message preview for recent sessions in a single batch query
      const sessionIds = data.slice(0, 30).map((s) => s.id);
      if (sessionIds.length > 0) {
        const { data: allMsgs } = await supabase
          .from("ai_chat_messages")
          .select("session_id, content")
          .in("session_id", sessionIds)
          .eq("role", "user")
          .order("created_at", { ascending: true });

        const previews: Record<string, string> = {};
        if (allMsgs) {
          for (const msg of allMsgs) {
            // Only keep the first user message per session
            if (!previews[msg.session_id]) {
              previews[msg.session_id] =
                msg.content.length > 80
                  ? msg.content.slice(0, 80) + "..."
                  : msg.content;
            }
          }
        }
        setSessionPreviews(previews);
      }
    }
    setSessionsLoading(false);
  }, [tenant, supabase]);

  useEffect(() => {
    if (tenant) loadSessions();
  }, [tenant, loadSessions]);

  // ─── Load session messages ──────────────────────────────────

  const loadSessionMessages = useCallback(
    async (sessionId: string) => {
      const { data } = await supabase
        .from("ai_chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (data) {
        setMessages(
          data.map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
            sources: (m.sources as ChatMessage["sources"]) || [],
            created_at: m.created_at,
            used_web_search: !!m.used_web_search,
          })),
        );
        setActiveSessionId(sessionId);
        setIsNearBottom(true);
        // Scroll to bottom after messages render
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
        }, 50);
      }
    },
    [supabase],
  );

  // ─── Auto-scroll ───────────────────────────────────────────

  useEffect(() => {
    if (isNearBottom) {
      // Use instant scroll during streaming to avoid jank from rapid updates
      messagesEndRef.current?.scrollIntoView({
        behavior: isStreaming ? "auto" : "smooth",
      });
    }
  }, [messages, isNearBottom, isStreaming]);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    setIsNearBottom(scrollHeight - scrollTop - clientHeight < 100);
  }, []);

  // ─── Close panels on outside click / Escape ──────────────────

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        knowledgeRef.current &&
        !knowledgeRef.current.contains(e.target as Node)
      ) {
        setShowKnowledgeDropdown(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      // Close one panel at a time, topmost first
      if (showHistory) {
        setShowHistory(false);
      } else if (showKnowledgeDropdown) {
        setShowKnowledgeDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showHistory, showKnowledgeDropdown]);

  // ─── Send message ──────────────────────────────────────────

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || !tenant || isStreaming) return;

      if (content.length > 10000) {
        toast({
          title: "შეტყობინება ძალიან გრძელია",
          description: "მაქსიმუმ 10,000 სიმბოლო",
          variant: "destructive",
        });
        return;
      }

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: content.trim(),
        sources: [],
        created_at: new Date().toISOString(),
      };

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        sources: [],
        created_at: new Date().toISOString(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setInput("");
      setIsStreaming(true);
      setIsNearBottom(true);

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      try {
        // Abort any previous in-flight request
        abortControllerRef.current?.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const response = await fetch("/api/ai-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content.trim(),
            session_id: activeSessionId,
            tenant_id: tenant.id,
            webSearchEnabled,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("API request failed");
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const data = JSON.parse(line.slice(6));

              // Handle quota warning
              if (data.type === "quota_warning") {
                toast({
                  title: "ვებ ძიება",
                  description: data.message,
                  variant: "destructive",
                });
                continue;
              }

              if (data.text) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsg.id
                      ? { ...m, content: m.content + data.text }
                      : m,
                  ),
                );
              }

              if (data.done) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsg.id
                      ? {
                          ...m,
                          isStreaming: false,
                          sources: data.sources || [],
                          isError: !!data.error,
                          used_web_search: !!data.used_web_search,
                        }
                      : m,
                  ),
                );

                // Refetch quota after web search usage
                if (data.used_web_search) {
                  webSearchQuota.refetch();
                }

                // Show toast for mid-stream errors
                if (data.error) {
                  toast({
                    title: "შეცდომა",
                    description: "AI ასისტენტთან კავშირი შეწყდა",
                    variant: "destructive",
                  });
                }

                if (data.session_id && !activeSessionId) {
                  setActiveSessionId(data.session_id);
                  // Refresh sessions list
                  loadSessions();
                }
              }
            } catch {
              // Skip malformed lines
            }
          }
        }
      } catch (error) {
        // Don't show error for intentional aborts
        if (error instanceof DOMException && error.name === "AbortError")
          return;

        console.error("Chat error:", error);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? {
                  ...m,
                  content: "ბოდიში, შეფერხება მოხდა. გთხოვთ სცადოთ თავიდან.",
                  isStreaming: false,
                  isError: true,
                }
              : m,
          ),
        );
        toast({
          title: "შეცდომა",
          description: "AI ასისტენტთან კავშირი ვერ მოხერხდა",
          variant: "destructive",
        });
      } finally {
        setIsStreaming(false);
        textareaRef.current?.focus();
      }
    },
    [
      tenant,
      isStreaming,
      activeSessionId,
      toast,
      loadSessions,
      webSearchEnabled,
      webSearchQuota,
    ],
  );

  // ─── Handle ?prefill= from ads recommendations ────────────
  useEffect(() => {
    if (prefillHandled.current || !tenant || tenantLoading) return;
    const prefill = searchParams.get("prefill");
    if (!prefill) return;
    prefillHandled.current = true;
    // Clear the URL param without full navigation
    router.replace("/dashboard/ai-chat");
    // Auto-send the prefilled message
    sendMessage(prefill);
  }, [searchParams, tenant, tenantLoading, sendMessage, router]);

  // ─── Stop generation ────────────────────────────────────────

  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
    // Mark streaming message as complete
    setMessages((prev) =>
      prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m)),
    );
    textareaRef.current?.focus();
  }, []);

  // ─── New chat ───────────────────────────────────────────────

  const startNewChat = useCallback(() => {
    abortControllerRef.current?.abort();
    setMessages([]);
    setActiveSessionId(null);
    setShowHistory(false);
    setInput("");
    setIsStreaming(false);
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

  // ─── Delete session ─────────────────────────────────────────

  const deleteSession = useCallback(
    async (sessionId: string) => {
      const confirmed = window.confirm("ნამდვილად გსურთ ამ საუბრის წაშლა?");
      if (!confirmed) return;

      const { error } = await supabase
        .from("ai_chat_sessions")
        .delete()
        .eq("id", sessionId);

      if (error) {
        toast({
          title: "შეცდომა",
          description: "სესიის წაშლა ვერ მოხერხდა",
          variant: "destructive",
        });
        return;
      }

      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        startNewChat();
      }
    },
    [supabase, activeSessionId, startNewChat, toast],
  );

  // ─── Copy message ──────────────────────────────────────────

  const copyMessage = useCallback(
    async (msgId: string, content: string) => {
      try {
        await navigator.clipboard.writeText(content);
        setCopiedId(msgId);
        setTimeout(() => setCopiedId(null), 2000);
      } catch {
        toast({
          title: "შეცდომა",
          description: "კოპირება ვერ მოხერხდა",
          variant: "destructive",
        });
      }
    },
    [toast],
  );

  // ─── Retry failed message ─────────────────────────────────

  const retryMessage = useCallback(
    (errorMsgId: string) => {
      if (isStreaming) return;

      // Find the user message right before this error
      const errorIdx = messages.findIndex((m) => m.id === errorMsgId);
      if (errorIdx < 1) return;

      const userMsg = messages[errorIdx - 1];
      if (userMsg.role !== "user") return;

      // Remove both the user message and the error response, then re-send
      setMessages((prev) =>
        prev.filter((m) => m.id !== errorMsgId && m.id !== userMsg.id),
      );

      // Use setTimeout to let state update before re-sending
      setTimeout(() => sendMessage(userMsg.content), 0);
    },
    [messages, isStreaming, sendMessage],
  );

  // ─── Handle input ──────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  // ─── Filtered sessions ─────────────────────────────────────

  const filteredSessions = historySearch
    ? sessions.filter(
        (s) =>
          s.title.toLowerCase().includes(historySearch.toLowerCase()) ||
          (sessionPreviews[s.id] || "")
            .toLowerCase()
            .includes(historySearch.toLowerCase()),
      )
    : sessions;

  const groupedSessions = groupSessions(filteredSessions);

  // ─── Loading state ─────────────────────────────────────────

  if (tenantLoading) {
    return (
      <div className="-m-6 flex h-[calc(100vh-4rem)] flex-col">
        <div className="flex items-center justify-between border-b border-outline-variant/20 px-6 py-3">
          <Skeleton className="h-8 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <Skeleton className="h-64 w-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!tenant) return null;

  const isEmpty = messages.length === 0;

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div className="relative -m-6 flex h-[calc(100vh-4rem)] flex-col">
      {/* ─── Top Bar ──────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-outline-variant/20 px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-on-surface">
            <Sparkles className="h-[18px] w-[18px] text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-tight text-on-surface sm:text-base">
              AI ჩატი
            </h1>
            <p className="text-[11px] text-on-surface-variant">
              შენი ბიზნეს ასისტენტი
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* New Chat */}
          <Button
            variant="outline"
            size="sm"
            onClick={startNewChat}
            className="gap-1.5 border-outline-variant/30 text-on-surface-variant"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">ახალი საუბარი</span>
          </Button>

          {/* Knowledge Base Pill */}
          <div className="relative" ref={knowledgeRef}>
            <button
              onClick={() => setShowKnowledgeDropdown(!showKnowledgeDropdown)}
              className="flex items-center gap-1.5 rounded-full border border-outline-variant/30 px-3 py-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container-low"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="hidden sm:inline">ცოდნის ბაზა ჩართულია</span>
              <Database className="h-3.5 w-3.5 sm:hidden" />
            </button>

            {showKnowledgeDropdown && (
              <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-3 shadow-ambient">
                <p className="mb-2 text-xs font-semibold text-on-surface">
                  აქტიური მონაცემები
                </p>
                <div className="space-y-1.5">
                  {dataSources.map((source) => (
                    <div
                      key={source.type}
                      className={cn(
                        "flex items-center justify-between rounded-lg px-2 py-1.5 text-sm",
                        source.count === 0 && "opacity-40",
                      )}
                    >
                      <span className="text-on-surface-variant">
                        {source.label}
                      </span>
                      <span className="font-medium text-on-surface">
                        {source.count}
                      </span>
                    </div>
                  ))}
                </div>
                <a
                  href="/dashboard/ai-assistant"
                  className="mt-3 flex items-center gap-1 border-t border-outline-variant/20 pt-2 text-xs font-medium text-primary hover:underline"
                >
                  პარამეტრების მართვა
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>

          {/* History */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setHistorySearch("");
              setShowHistory(true);
              loadSessions();
            }}
            className="gap-1.5 border-outline-variant/30 text-on-surface-variant"
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">ისტორია</span>
          </Button>
        </div>
      </div>

      {/* ─── Main Chat Area ───────────────────────────────── */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        role="log"
        aria-label="AI ჩატის შეტყობინებები"
        className="flex-1 overflow-y-auto"
      >
        {isEmpty ? (
          /* ─── Empty State ─────────────────────────────── */
          <div className="flex h-full flex-col items-center justify-center px-4 py-12">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-on-surface">
              <Sparkles className="h-9 w-9 text-white" />
            </div>
            <h2 className="mb-2 text-center text-xl font-semibold text-on-surface sm:text-2xl">
              გამარჯობა, {tenant.business_name}!{" "}
              <span className="inline-block">&#x1F44B;</span>
            </h2>
            <p className="mb-8 max-w-md text-center text-sm leading-relaxed text-on-surface-variant sm:text-base">
              მე ვარ შენი AI ბიზნეს ასისტენტი. შეგიძლია დამისვა ნებისმიერი
              კითხვა, კონტენტის შექმნა და ბიზნეს გადაწყვეტილებების მიღებაში
              დახმარება.
            </p>

            <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s.text)}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border border-outline-variant/20 p-4 text-left transition-all hover:shadow-ambient-sm",
                    "bg-white/70 backdrop-blur-xl hover:border-primary/20",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      s.bg,
                    )}
                  >
                    <s.icon className={cn("h-[18px] w-[18px]", s.color)} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-on-surface">
                      {s.title}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-on-surface-variant">
                      {s.text}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* ─── Messages ────────────────────────────────── */
          <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "group/msg flex gap-3",
                  msg.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                {/* AI Avatar */}
                {msg.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-on-surface">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                )}

                <div className="max-w-[75%] sm:max-w-[65%]">
                  {/* Message Bubble */}
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3",
                      msg.role === "user"
                        ? "bg-primary text-white"
                        : msg.isError
                          ? "bg-destructive/5 border border-destructive/20 text-on-surface"
                          : "bg-surface-container-low text-on-surface",
                    )}
                  >
                    {msg.role === "assistant" ? (
                      <div className={PROSE_CLASSES}>
                        {msg.content &&
                          (msg.isStreaming ? (
                            <ReactMarkdown
                              remarkPlugins={REMARK_PLUGINS}
                              components={MARKDOWN_COMPONENTS}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          ) : (
                            <MarkdownContent content={msg.content} />
                          ))}
                        {msg.isStreaming && !msg.content && (
                          <div className="flex items-center gap-1 py-1">
                            <div className="h-2 w-2 animate-bounce rounded-full bg-on-surface-variant/50 [animation-delay:0ms]" />
                            <div className="h-2 w-2 animate-bounce rounded-full bg-on-surface-variant/50 [animation-delay:150ms]" />
                            <div className="h-2 w-2 animate-bounce rounded-full bg-on-surface-variant/50 [animation-delay:300ms]" />
                          </div>
                        )}
                        {msg.isStreaming && msg.content && (
                          <span className="inline-block h-4 w-0.5 animate-pulse bg-primary" />
                        )}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                        {msg.content}
                      </p>
                    )}
                  </div>

                  {/* Timestamp on hover */}
                  {!msg.isStreaming && (
                    <p
                      className={cn(
                        "mt-1 text-[10px] text-on-surface-variant/0 transition-colors group-hover/msg:text-on-surface-variant/40",
                        msg.role === "user" ? "text-right" : "text-left",
                      )}
                    >
                      {new Date(msg.created_at).toLocaleTimeString("ka-GE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}

                  {/* Action Buttons (AI messages only) */}
                  {msg.role === "assistant" &&
                    !msg.isStreaming &&
                    msg.content && (
                      <div className="mt-1.5 flex items-center gap-1">
                        {msg.isError ? (
                          <button
                            onClick={() => retryMessage(msg.id)}
                            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            თავიდან ცდა
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => copyMessage(msg.id, msg.content)}
                              className="rounded-md p-1.5 text-on-surface-variant/50 transition-colors hover:bg-surface-container-high hover:text-on-surface-variant"
                              title="კოპირება"
                            >
                              {copiedId === msg.id ? (
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              className="rounded-md p-1.5 text-on-surface-variant/50 transition-colors hover:bg-surface-container-high hover:text-on-surface-variant"
                              title="კარგი პასუხი"
                            >
                              <ThumbsUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              className="rounded-md p-1.5 text-on-surface-variant/50 transition-colors hover:bg-surface-container-high hover:text-on-surface-variant"
                              title="ცუდი პასუხი"
                            >
                              <ThumbsDown className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}

                        {/* Web Search Badge */}
                        {msg.used_web_search && (
                          <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                            <Globe className="h-2.5 w-2.5" />
                            ვებ
                          </span>
                        )}

                        {/* Sources Tag (data sources) */}
                        {msg.sources &&
                          msg.sources.filter((s) => s.type !== "web").length >
                            0 && (
                            <button
                              onClick={() =>
                                setShowSources(
                                  showSources === msg.id ? null : msg.id,
                                )
                              }
                              className={cn(
                                "ml-1 flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                                showSources === msg.id
                                  ? "bg-primary/10 text-primary"
                                  : "bg-surface-container-high text-on-surface-variant hover:bg-primary/10 hover:text-primary",
                              )}
                            >
                              <Database className="h-3 w-3" />
                              წყაროები
                            </button>
                          )}
                      </div>
                    )}

                  {/* Expanded Data Sources */}
                  {showSources === msg.id &&
                    msg.sources &&
                    msg.sources.filter((s) => s.type !== "web").length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {msg.sources
                          .filter((s): s is DataSource => s.type !== "web")
                          .map((source, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 rounded-full bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary"
                            >
                              {source.label}
                              <span className="text-primary/60">
                                ({source.count})
                              </span>
                            </span>
                          ))}
                      </div>
                    )}

                  {/* Collapsible Web Sources */}
                  {msg.sources &&
                    msg.sources.filter((s) => s.type === "web").length > 0 && (
                      <div className="mt-2">
                        <button
                          onClick={() =>
                            setExpandedWebSources(
                              expandedWebSources === msg.id ? null : msg.id,
                            )
                          }
                          className="flex items-center gap-1 text-xs font-medium text-on-surface-variant/70 transition-colors hover:text-on-surface-variant"
                        >
                          {expandedWebSources === msg.id ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5" />
                          )}
                          <Globe className="h-3 w-3" />
                          წყაროები (
                          {msg.sources.filter((s) => s.type === "web").length})
                        </button>
                        {expandedWebSources === msg.id && (
                          <div className="mt-1.5 space-y-1 rounded-lg bg-surface-container-low p-2">
                            {msg.sources
                              .filter((s): s is WebSource => s.type === "web")
                              .map((source, i) => (
                                <a
                                  key={i}
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-primary transition-colors hover:bg-primary/5"
                                >
                                  <ExternalLink className="h-3 w-3 shrink-0" />
                                  <span className="truncate">
                                    {source.title}
                                  </span>
                                </a>
                              ))}
                          </div>
                        )}
                      </div>
                    )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ─── Scroll to Bottom Pill ─────────────────────────── */}
      {!isNearBottom && messages.length > 0 && (
        <div className="absolute bottom-28 left-1/2 z-10 -translate-x-1/2">
          <button
            onClick={() => {
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
              setIsNearBottom(true);
            }}
            className="flex items-center gap-1 rounded-full bg-surface-container-lowest px-3 py-1.5 text-xs font-medium text-on-surface-variant shadow-ambient-sm transition-all hover:shadow-ambient"
          >
            <ChevronDown className="h-3.5 w-3.5" />
            ახალი შეტყობინება
          </button>
        </div>
      )}

      {/* ─── Input Area ───────────────────────────────────── */}
      <div className="border-t border-outline-variant/20 bg-surface-container-lowest px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-end gap-2 rounded-2xl border border-outline-variant/30 bg-surface-container-low px-3 py-2 transition-colors focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20">
            <button
              disabled
              className="mb-1 shrink-0 rounded-lg p-1.5 text-on-surface-variant/30 cursor-not-allowed"
              title="ფაილის მიმაგრება (მალე)"
            >
              <Paperclip className="h-5 w-5" />
            </button>

            <button
              onClick={() => setWebSearchEnabled((prev) => !prev)}
              disabled={webSearchQuota.isDisabled || webSearchQuota.isExhausted}
              className={cn(
                "mb-1 shrink-0 rounded-lg p-1.5 transition-colors",
                webSearchEnabled
                  ? "bg-primary/10 text-primary"
                  : "text-on-surface-variant/50 hover:text-on-surface-variant",
                (webSearchQuota.isDisabled || webSearchQuota.isExhausted) &&
                  "cursor-not-allowed opacity-40",
              )}
              title={
                webSearchQuota.isDisabled
                  ? "ვებ ძიება არ არის ხელმისაწვდომი თქვენს გეგმაზე"
                  : webSearchQuota.isExhausted
                    ? "თვიური ლიმიტი ამოიწურა"
                    : webSearchEnabled
                      ? "ვებ ძიება ჩართულია"
                      : "ვებ ძიების ჩართვა"
              }
            >
              <Globe className="h-5 w-5" />
            </button>

            <Textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="შეგიძლია მეკითხო რა შეკითხვაც გინდა..."
              rows={1}
              className="min-h-[36px] max-h-[160px] flex-1 resize-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
            />

            {isStreaming ? (
              <Button
                size="icon"
                onClick={stopGeneration}
                aria-label="გენერაციის შეჩერება"
                className="mb-0.5 h-8 w-8 shrink-0 rounded-xl bg-destructive hover:bg-destructive/90"
                title="გენერაციის შეჩერება"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
              </Button>
            ) : (
              <Button
                size="icon"
                onClick={() => sendMessage(input)}
                disabled={!input.trim()}
                aria-label="შეტყობინების გაგზავნა"
                className="mb-0.5 h-8 w-8 shrink-0 rounded-xl bg-gradient-cta hover:bg-gradient-cta-hover disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="mt-2 flex items-center justify-center gap-3">
            <p className="text-[11px] text-on-surface-variant/50">
              AI ასისტენტს აქვს წვდომა შენს პროდუქტებზე, შეკვეთებზე და ცოდნის
              ბაზაზე
            </p>
            {!webSearchQuota.isLoading &&
              !webSearchQuota.isDisabled &&
              !webSearchQuota.isUnlimited && (
                <span
                  className={cn(
                    "text-[11px] font-medium",
                    webSearchQuota.usage / webSearchQuota.limit >= 0.8
                      ? "text-destructive"
                      : "text-on-surface-variant/50",
                  )}
                >
                  {webSearchQuota.usage}/{webSearchQuota.limit} ძებნა
                </span>
              )}
          </div>
        </div>
      </div>

      {/* ─── History Panel ─────────────────────────────────── */}
      {showHistory && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:bg-transparent md:backdrop-blur-none"
            onClick={() => setShowHistory(false)}
          />

          {/* Panel */}
          <div
            className="fixed bottom-0 right-0 top-0 z-50 flex w-full flex-col border-l border-outline-variant/20 bg-surface-container-lowest shadow-ambient-lg md:w-[380px]"
            style={{ animation: "slideInRight 0.2s ease-out" }}
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between border-b border-outline-variant/20 px-4 py-3">
              <h2 className="text-base font-semibold text-on-surface">
                ისტორია
              </h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={startNewChat}
                  className="rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-high"
                  title="ახალი საუბარი"
                >
                  <Plus className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setShowHistory(false)}
                  className="rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-high"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="border-b border-outline-variant/20 px-4 py-2">
              <div className="flex items-center gap-2 rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-1.5">
                <Search className="h-4 w-4 text-on-surface-variant/50" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="ძიება..."
                  autoFocus
                  className="flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant/40"
                />
                {historySearch && (
                  <button
                    onClick={() => setHistorySearch("")}
                    className="text-on-surface-variant/40 hover:text-on-surface-variant"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto">
              {sessionsLoading ? (
                <div className="space-y-3 p-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <History className="mb-3 h-10 w-10 text-on-surface-variant/30" />
                  <p className="text-sm text-on-surface-variant">
                    {historySearch
                      ? "საუბარი ვერ მოიძებნა"
                      : "ჯერ საუბრები არ გაქვთ"}
                  </p>
                </div>
              ) : (
                <div className="p-2">
                  {Object.entries(groupedSessions).map(
                    ([group, sessionsInGroup]) => (
                      <div key={group} className="mb-4">
                        <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant/50">
                          {group}
                        </p>
                        {sessionsInGroup.map((session) => (
                          <div
                            key={session.id}
                            className={cn(
                              "group flex items-start gap-2 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-container-low cursor-pointer",
                              activeSessionId === session.id &&
                                "bg-primary/5 border border-primary/10",
                            )}
                            onClick={() => {
                              loadSessionMessages(session.id);
                              setShowHistory(false);
                            }}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="truncate text-sm font-medium text-on-surface">
                                {session.title}
                              </p>
                              {sessionPreviews[session.id] && (
                                <p className="mt-0.5 truncate text-xs text-on-surface-variant/60">
                                  {sessionPreviews[session.id]}
                                </p>
                              )}
                              <p className="mt-0.5 text-[11px] text-on-surface-variant/40">
                                {new Date(
                                  session.created_at,
                                ).toLocaleDateString("ka-GE", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteSession(session.id);
                              }}
                              className="mt-0.5 shrink-0 rounded-md p-1 text-on-surface-variant/30 opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                              title="წაშლა"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
