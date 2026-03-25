"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Database,
  FileText,
  BrainCog,
  Smile,
  Package,
  ShoppingBag,
  MessageCircle,
  HelpCircle,
  Truck,
  Megaphone,
  Plus,
  Pencil,
  Trash2,
  Upload,
  X,
  Send,
  CloudUpload,
  FileDown,
} from "lucide-react";
import { useTenant } from "@/hooks/use-tenant";
import { useSupabase } from "@/hooks/use-supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import type {
  KnowledgeSource,
  KnowledgeEntry,
  KnowledgeDocument,
  BotInstruction,
  BehaviorRule,
} from "@/types/database";

// ─── Source config ────────────────────────────────────
const SOURCE_META: Record<
  string,
  { label: string; icon: React.ElementType; countLabel: string }
> = {
  products: { label: "პროდუქტები", icon: Package, countLabel: "პროდუქტი" },
  orders: { label: "შეკვეთები", icon: ShoppingBag, countLabel: "შეკვეთა" },
  conversations: {
    label: "საუბრები",
    icon: MessageCircle,
    countLabel: "ჩატი",
  },
  faqs: { label: "FAQ", icon: HelpCircle, countLabel: "კითხვა-პასუხი" },
  delivery_zones: {
    label: "მიწოდების ზონები",
    icon: Truck,
    countLabel: "ზონა",
  },
  ads: {
    label: "რეკლამები",
    icon: Megaphone,
    countLabel: "კამპანია",
  },
};

const DEFAULT_SOURCES: {
  source_type: string;
  is_enabled: boolean;
}[] = [
  { source_type: "products", is_enabled: true },
  { source_type: "orders", is_enabled: true },
  { source_type: "conversations", is_enabled: false },
  { source_type: "faqs", is_enabled: true },
  { source_type: "delivery_zones", is_enabled: true },
  { source_type: "ads", is_enabled: true },
];

const DEFAULT_RULES = [
  "არასოდეს გაამხილო, რომ ბოტი ხარ",
  "ყოველთვის შესთავაზე მსგავსი პროდუქტები",
  "გამოიყენე მხოლოდ ქართული ენა",
];

// ─── Helpers ──────────────────────────────────────────
function sliderLabel(value: number, type: "length" | "emoji" | "sales") {
  if (type === "length") {
    if (value < 33) return "მოკლე";
    if (value < 66) return "საშუალო";
    return "გრძელი";
  }
  if (type === "emoji") {
    if (value < 33) return "არასდროს";
    if (value < 66) return "ზომიერი";
    return "ბევრი";
  }
  // sales
  if (value < 33) return "დაბალი";
  if (value < 66) return "საშუალო";
  return "მაღალი";
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Chat message type ───────────────────────────────
interface ChatMessage {
  role: "user" | "bot";
  content: string;
  sources?: string[];
  time: string;
}

// ─── Page ─────────────────────────────────────────────
export default function AIAssistantPage() {
  const { tenant, setTenant, loading: tenantLoading } = useTenant();
  const supabase = useSupabase();
  const { toast } = useToast();

  // Data state
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [instruction, setInstruction] = useState<BotInstruction | null>(null);
  const [rules, setRules] = useState<BehaviorRule[]>([]);

  // Personality state
  const [botName, setBotName] = useState("");
  const [botTone, setBotTone] = useState<"formal" | "friendly" | "casual">(
    "friendly",
  );
  const [responseLength, setResponseLength] = useState(50);
  const [emojiUsage, setEmojiUsage] = useState(50);
  const [salesAggressiveness, setSalesAggressiveness] = useState(30);
  const [greetingMessage, setGreetingMessage] = useState("");
  const [mainInstruction, setMainInstruction] = useState("");

  // UI state
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [entryDialogOpen, setEntryDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null);
  const [entryTitle, setEntryTitle] = useState("");
  const [entryContent, setEntryContent] = useState("");
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [newRuleText, setNewRuleText] = useState("");
  const [uploading, setUploading] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Load data ─────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!tenant) return;
    const tid = tenant.id;

    try {
      // Queries may fail if migration hasn't been applied yet
      const [srcRes, entRes, docRes, insRes, rulRes] = await Promise.all([
        supabase
          .from("knowledge_sources")
          .select("*")
          .eq("tenant_id", tid)
          .order("source_type"),
        supabase
          .from("knowledge_entries")
          .select("*")
          .eq("tenant_id", tid)
          .order("sort_order"),
        supabase
          .from("knowledge_documents")
          .select("*")
          .eq("tenant_id", tid)
          .order("created_at", { ascending: false }),
        supabase
          .from("bot_instructions")
          .select("*")
          .eq("tenant_id", tid)
          .maybeSingle(),
        supabase
          .from("behavior_rules")
          .select("*")
          .eq("tenant_id", tid)
          .order("sort_order"),
      ]);

      // Seed defaults if empty, or add missing source types for existing tenants
      let knowledgeSources = (srcRes.data as KnowledgeSource[]) || [];
      if (knowledgeSources.length === 0) {
        const seedRows = DEFAULT_SOURCES.map((s) => ({
          tenant_id: tid,
          ...s,
        }));
        const { data: seeded } = await supabase
          .from("knowledge_sources")
          .insert(seedRows)
          .select("*");
        knowledgeSources = (seeded as KnowledgeSource[]) || [];
      } else {
        // Insert any missing source types (e.g. "ads" added after initial setup)
        const existingTypes = new Set<string>(
          knowledgeSources.map((s) => s.source_type),
        );
        const missing = DEFAULT_SOURCES.filter(
          (s) => !existingTypes.has(s.source_type),
        );
        if (missing.length > 0) {
          const { data: inserted } = await supabase
            .from("knowledge_sources")
            .insert(missing.map((s) => ({ tenant_id: tid, ...s })))
            .select("*");
          if (inserted) {
            knowledgeSources = [
              ...knowledgeSources,
              ...(inserted as KnowledgeSource[]),
            ];
          }
        }
      }

      let behaviorRules = (rulRes.data as BehaviorRule[]) || [];
      if (behaviorRules.length === 0) {
        const seedRules = DEFAULT_RULES.map((r, i) => ({
          tenant_id: tid,
          rule_text: r,
          is_enabled: true,
          sort_order: i,
        }));
        const { data: seeded } = await supabase
          .from("behavior_rules")
          .insert(seedRules)
          .select("*");
        behaviorRules = (seeded as BehaviorRule[]) || [];
      }

      let botInstruction = insRes.data as BotInstruction | null;
      if (!botInstruction) {
        const { data: seeded } = await supabase
          .from("bot_instructions")
          .insert({ tenant_id: tid, main_instruction: "" })
          .select("*")
          .single();
        botInstruction = seeded as BotInstruction;
      }

      // Fetch live counts for knowledge sources
      const [prodCount, orderCount, convCount, faqCount, zoneCount, adsCount] =
        await Promise.all([
          supabase
            .from("products")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", tid)
            .eq("is_active", true),
          supabase
            .from("orders")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", tid),
          supabase
            .from("conversations")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", tid),
          supabase
            .from("faqs")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", tid),
          supabase
            .from("delivery_zones")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", tid)
            .eq("is_active", true),
          supabase
            .from("ad_campaigns")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", tid),
        ]);

      const countMap: Record<string, number> = {
        products: prodCount.count ?? 0,
        orders: orderCount.count ?? 0,
        conversations: convCount.count ?? 0,
        faqs: faqCount.count ?? 0,
        delivery_zones: zoneCount.count ?? 0,
        ads: adsCount.count ?? 0,
      };

      // Update synced_count on sources with real data
      const sourcesWithCounts = knowledgeSources.map((s) => ({
        ...s,
        synced_count: countMap[s.source_type] ?? s.synced_count,
      }));

      // Persist counts to DB (fire-and-forget)
      for (const s of sourcesWithCounts) {
        if (
          s.synced_count !==
          knowledgeSources.find((ks) => ks.id === s.id)?.synced_count
        ) {
          supabase
            .from("knowledge_sources")
            .update({ synced_count: s.synced_count })
            .eq("id", s.id)
            .then(() => {});
        }
      }

      setSources(sourcesWithCounts);
      setEntries((entRes.data as KnowledgeEntry[]) || []);
      setDocuments((docRes.data as KnowledgeDocument[]) || []);
      setInstruction(botInstruction);
      setMainInstruction(botInstruction?.main_instruction || "");
      setRules(behaviorRules);

      // Personality from tenant
      setBotName(tenant.bot_persona_name || "ანა");
      setBotTone(tenant.bot_tone || "friendly");
      setResponseLength(tenant.bot_response_length ?? 50);
      setEmojiUsage(tenant.bot_emoji_usage ?? 50);
      setSalesAggressiveness(tenant.bot_sales_aggressiveness ?? 30);
      setGreetingMessage(
        tenant.bot_greeting_message || "გამარჯობა! რით შემიძლია დაგეხმაროთ? 😊",
      );
    } catch (err) {
      console.error("Failed to load AI Assistant data:", err);
      // Still set personality from tenant even if new tables don't exist yet
      setBotName(tenant.bot_persona_name || "ანა");
      setBotTone(tenant.bot_tone || "friendly");
    }

    setPageLoading(false);
  }, [tenant, supabase]);

  useEffect(() => {
    if (tenant) loadData();
  }, [tenant, loadData]);

  // ─── Save all ──────────────────────────────────────
  async function handleSave() {
    if (!tenant) return;
    setSaving(true);

    try {
      await Promise.all([
        // Personality on tenant
        supabase
          .from("tenants")
          .update({
            bot_persona_name: botName,
            bot_tone: botTone,
            bot_response_length: responseLength,
            bot_emoji_usage: emojiUsage,
            bot_sales_aggressiveness: salesAggressiveness,
            bot_greeting_message: greetingMessage,
          })
          .eq("id", tenant.id),
        // Main instruction (upsert to handle case where seed failed)
        instruction
          ? supabase
              .from("bot_instructions")
              .update({
                main_instruction: mainInstruction,
                updated_at: new Date().toISOString(),
              })
              .eq("id", instruction.id)
          : mainInstruction.trim()
            ? supabase
                .from("bot_instructions")
                .upsert({
                  tenant_id: tenant.id,
                  main_instruction: mainInstruction,
                })
                .select("*")
                .single()
                .then(({ data }) => {
                  if (data) setInstruction(data as BotInstruction);
                })
            : Promise.resolve(),
      ]);
      // Update tenant cache with new personality values
      setTenant({
        ...tenant,
        bot_persona_name: botName,
        bot_tone: botTone,
        bot_response_length: responseLength,
        bot_emoji_usage: emojiUsage,
        bot_sales_aggressiveness: salesAggressiveness,
        bot_greeting_message: greetingMessage,
      });
      setLastSaved(new Date());
      toast({
        title: "შენახულია",
        description: "ცვლილებები წარმატებით შეინახა",
      });
    } catch (err) {
      console.error("Save error:", err);
      toast({
        title: "შეცდომა",
        description: "ცვლილებების შენახვა ვერ მოხერხდა",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  // ─── Knowledge Sources toggle ──────────────────────
  async function toggleSource(sourceId: string, enabled: boolean) {
    setSources((prev) =>
      prev.map((s) => (s.id === sourceId ? { ...s, is_enabled: enabled } : s)),
    );
    await supabase
      .from("knowledge_sources")
      .update({ is_enabled: enabled, updated_at: new Date().toISOString() })
      .eq("id", sourceId);
  }

  // ─── Knowledge Entries CRUD ────────────────────────
  function openAddEntry() {
    setEditingEntry(null);
    setEntryTitle("");
    setEntryContent("");
    setEntryDialogOpen(true);
  }

  function openEditEntry(entry: KnowledgeEntry) {
    setEditingEntry(entry);
    setEntryTitle(entry.title);
    setEntryContent(entry.content);
    setEntryDialogOpen(true);
  }

  async function saveEntry() {
    if (!tenant || !entryTitle.trim() || !entryContent.trim()) return;

    if (editingEntry) {
      const { data } = await supabase
        .from("knowledge_entries")
        .update({
          title: entryTitle.trim(),
          content: entryContent.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingEntry.id)
        .select("*")
        .single();
      if (data) {
        setEntries((prev) =>
          prev.map((e) =>
            e.id === editingEntry.id ? (data as KnowledgeEntry) : e,
          ),
        );
      }
    } else {
      const { data } = await supabase
        .from("knowledge_entries")
        .insert({
          tenant_id: tenant.id,
          title: entryTitle.trim(),
          content: entryContent.trim(),
          sort_order: entries.length,
        })
        .select("*")
        .single();
      if (data) {
        setEntries((prev) => [...prev, data as KnowledgeEntry]);
      }
    }
    setEntryDialogOpen(false);
  }

  async function deleteEntry(id: string) {
    await supabase.from("knowledge_entries").delete().eq("id", id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  // ─── Behavior Rules ────────────────────────────────
  async function toggleRule(ruleId: string, enabled: boolean) {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, is_enabled: enabled } : r)),
    );
    await supabase
      .from("behavior_rules")
      .update({ is_enabled: enabled })
      .eq("id", ruleId);
  }

  async function addRule() {
    if (!tenant || !newRuleText.trim()) return;
    const { data } = await supabase
      .from("behavior_rules")
      .insert({
        tenant_id: tenant.id,
        rule_text: newRuleText.trim(),
        sort_order: rules.length,
      })
      .select("*")
      .single();
    if (data) {
      setRules((prev) => [...prev, data as BehaviorRule]);
    }
    setNewRuleText("");
    setRuleDialogOpen(false);
  }

  async function deleteRule(id: string) {
    await supabase.from("behavior_rules").delete().eq("id", id);
    setRules((prev) => prev.filter((r) => r.id !== id));
  }

  // ─── Document Upload ───────────────────────────────
  async function processFile(file: File) {
    if (!tenant) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx", "txt"].includes(ext || "")) {
      toast({
        title: "არასწორი ფორმატი",
        description: "მხოლოდ PDF, DOCX და TXT ფაილები დაშვებულია",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "ფაილი ძალიან დიდია",
        description: "ფაილის ზომა არ უნდა აღემატებოდეს 10MB-ს",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const filePath = `${tenant.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("knowledge-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: doc } = await supabase
        .from("knowledge_documents")
        .insert({
          tenant_id: tenant.id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: ext as "pdf" | "docx" | "txt",
          status: ext === "txt" ? "ready" : "processing",
        })
        .select("*")
        .single();

      if (doc) {
        setDocuments((prev) => [doc as KnowledgeDocument, ...prev]);

        if (ext === "txt") {
          // For TXT files, extract text directly on client
          const text = await file.text();
          await supabase
            .from("knowledge_documents")
            .update({ extracted_text: text, status: "ready" })
            .eq("id", (doc as KnowledgeDocument).id);
          setDocuments((prev) =>
            prev.map((d) =>
              d.id === (doc as KnowledgeDocument).id
                ? { ...d, extracted_text: text, status: "ready" as const }
                : d,
            ),
          );
        } else {
          // For PDF/DOCX, call edge function to extract text
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (supabaseUrl && session?.access_token) {
            fetch(`${supabaseUrl}/functions/v1/process-document`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                document_id: (doc as KnowledgeDocument).id,
              }),
            })
              .then(async (res) => {
                if (res.ok) {
                  // Refresh document status
                  const { data: updated } = await supabase
                    .from("knowledge_documents")
                    .select("*")
                    .eq("id", (doc as KnowledgeDocument).id)
                    .single();
                  if (updated) {
                    setDocuments((prev) =>
                      prev.map((d) =>
                        d.id === updated.id
                          ? (updated as KnowledgeDocument)
                          : d,
                      ),
                    );
                  }
                } else {
                  // Mark as error in UI
                  setDocuments((prev) =>
                    prev.map((d) =>
                      d.id === (doc as KnowledgeDocument).id
                        ? { ...d, status: "error" as const }
                        : d,
                    ),
                  );
                }
              })
              .catch(() => {
                setDocuments((prev) =>
                  prev.map((d) =>
                    d.id === (doc as KnowledgeDocument).id
                      ? { ...d, status: "error" as const }
                      : d,
                  ),
                );
              });
          }
        }
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast({
        title: "ატვირთვის შეცდომა",
        description: "ფაილის ატვირთვა ვერ მოხერხდა",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  async function deleteDocument(doc: KnowledgeDocument) {
    await supabase.storage.from("knowledge-documents").remove([doc.file_path]);
    await supabase.from("knowledge_documents").delete().eq("id", doc.id);
    setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
  }

  // ─── Test Chat ─────────────────────────────────────
  async function sendTestMessage() {
    if (!chatInput.trim() || !tenant || chatSending) return;
    const msg = chatInput.trim();
    setChatInput("");

    const now = new Date().toLocaleTimeString("ka-GE", {
      hour: "2-digit",
      minute: "2-digit",
    });

    setChatMessages((prev) => [
      ...prev,
      { role: "user", content: msg, time: now },
    ]);
    setChatSending(true);

    try {
      // Build conversation history for multi-turn context
      const history = chatMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const res = await fetch("/api/ai-assistant/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          tenant_id: tenant.id,
          history,
        }),
      });
      const data = await res.json();
      const botTime = new Date().toLocaleTimeString("ka-GE", {
        hour: "2-digit",
        minute: "2-digit",
      });
      setChatMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: data.response || data.error || "შეცდომა მოხდა",
          sources: data.sources_used || [],
          time: botTime,
        },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: "ტესტის შეცდომა — სერვერთან კავშირი ვერ მოხერხდა",
          time: new Date().toLocaleTimeString("ka-GE", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } finally {
      setChatSending(false);
    }
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // ─── Stats ─────────────────────────────────────────
  const totalWords =
    entries.reduce(
      (sum, e) =>
        sum + e.content.split(/\s+/).length + e.title.split(/\s+/).length,
      0,
    ) +
    documents.reduce(
      (sum, d) => sum + (d.extracted_text?.split(/\s+/).length || 0),
      0,
    ) +
    mainInstruction.split(/\s+/).filter(Boolean).length;

  const productCount =
    sources.find((s) => s.source_type === "products")?.synced_count || 0;
  const faqCount =
    sources.find((s) => s.source_type === "faqs")?.synced_count || 0;

  // ─── Loading state ─────────────────────────────────
  if (tenantLoading || pageLoading) {
    return (
      <div className="flex flex-col gap-8">
        <div>
          <Skeleton className="mb-2 h-10 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-10">
          <div className="flex flex-col gap-8 lg:col-span-6">
            <Skeleton className="h-96 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
          <div className="flex flex-col gap-8 lg:col-span-4">
            <Skeleton className="h-[520px] rounded-xl" />
            <Skeleton className="h-56 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────
  return (
    <div className="flex flex-col gap-8 pb-28">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-on-surface lg:text-4xl">
          AI ასისტენტი
        </h1>
        <p className="mt-1 text-on-surface-variant lg:text-lg">
          გააძლიერე შენი ბოტი დამატებითი ცოდნით და პიროვნებით
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-10">
        {/* ═══ Left Column ═══ */}
        <div className="flex flex-col gap-8 lg:col-span-6">
          {/* ── Card 1: Knowledge Base ── */}
          <Card className="rounded-xl">
            <CardContent className="p-6 lg:p-8">
              <div className="mb-8 flex items-center gap-3">
                <Database className="h-7 w-7 text-primary" />
                <h3 className="text-xl font-bold text-on-surface lg:text-2xl">
                  ცოდნის ბაზა
                </h3>
              </div>

              {/* Knowledge Sources */}
              <div className="space-y-6">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  ცოდნის წყაროები
                </h4>
                <div className="space-y-3">
                  {sources.map((source) => {
                    const meta = SOURCE_META[source.source_type];
                    if (!meta) return null;
                    const Icon = meta.icon;
                    return (
                      <div
                        key={source.id}
                        className="flex items-center justify-between rounded-lg bg-surface-container-low p-4 transition-all hover:bg-surface-container-high"
                      >
                        <div className="flex items-center gap-4">
                          <Icon className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-sm font-bold">{meta.label}</p>
                            <p className="text-xs text-on-surface-variant">
                              {source.synced_count} {meta.countLabel}{" "}
                              სინქრონიზებულია
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={source.is_enabled}
                          onCheckedChange={(checked) =>
                            toggleSource(source.id, checked)
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Knowledge */}
              <div className="mt-10 space-y-4">
                <div className="flex items-end justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    სპეციალური ცოდნა
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:text-primary"
                    onClick={openAddEntry}
                  >
                    <Plus className="mr-1 h-4 w-4" /> ცოდნის დამატება
                  </Button>
                </div>
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded-lg border border-slate-100 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-slate-400" />
                        <span className="text-sm font-medium">
                          {entry.title}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-primary"
                          onClick={() => openEditEntry(entry)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-red-500"
                          onClick={() => deleteEntry(entry.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {entries.length === 0 && (
                    <p className="py-4 text-center text-sm text-on-surface-variant">
                      ჯერ არ დაგიმატებიათ სპეციალური ცოდნა
                    </p>
                  )}
                </div>
              </div>

              {/* Document Upload */}
              <div className="mt-10">
                <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                  დოკუმენტები
                </h4>
                <div
                  className="group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-indigo-100 bg-indigo-50/30 p-8 transition-all hover:border-indigo-300"
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  <CloudUpload className="h-10 w-10 text-indigo-400 transition-transform group-hover:scale-110" />
                  <p className="text-sm font-semibold text-indigo-900">
                    {uploading
                      ? "იტვირთება..."
                      : "ატვირთეთ ფაილები ან ჩააგდეთ აქ"}
                  </p>
                  <p className="text-xs text-indigo-400">
                    PDF, DOCX, TXT (Max 10MB)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </div>
                {documents.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between rounded-lg bg-surface-container-low p-2 px-3 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <FileDown
                            className={`h-4 w-4 ${doc.file_type === "pdf" ? "text-red-500" : "text-blue-500"}`}
                          />
                          <span className="font-medium">{doc.file_name}</span>
                          <span className="text-slate-400">
                            ({formatFileSize(doc.file_size)})
                          </span>
                          {doc.status === "processing" && (
                            <span className="text-amber-500 text-xs animate-pulse">
                              დამუშავებაში...
                            </span>
                          )}
                          {doc.status === "error" && (
                            <span className="text-red-500 text-xs">
                              შეცდომა
                            </span>
                          )}
                          {doc.status === "ready" && (
                            <span className="text-emerald-500 text-xs">
                              მზადაა
                            </span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-slate-400 hover:text-red-500"
                          onClick={() => deleteDocument(doc)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ── Card 2: Instructions ── */}
          <Card className="rounded-xl">
            <CardContent className="p-6 lg:p-8">
              <div className="mb-8 flex items-center gap-3">
                <BrainCog className="h-7 w-7 text-primary" />
                <h3 className="text-xl font-bold text-on-surface lg:text-2xl">
                  ინსტრუქციები
                </h3>
              </div>

              <div className="space-y-6">
                <div>
                  <Label className="mb-3 block text-xs font-bold uppercase tracking-widest text-slate-400">
                    მთავარი ინსტრუქცია
                  </Label>
                  <Textarea
                    rows={6}
                    value={mainInstruction}
                    onChange={(e) => setMainInstruction(e.target.value)}
                    placeholder="აღწერე როგორ უნდა მოიქცეს ასისტენტი..."
                    className="border-none bg-surface-container-low focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-end justify-between">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      ქცევის წესები
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-primary"
                      onClick={() => setRuleDialogOpen(true)}
                    >
                      <Plus className="mr-1 h-4 w-4" /> წესის დამატება
                    </Button>
                  </div>
                  <div className="flex flex-col gap-3">
                    {rules.map((rule) => (
                      <div
                        key={rule.id}
                        className="group flex items-center justify-between"
                      >
                        <label className="flex cursor-pointer items-center gap-3">
                          <input
                            type="checkbox"
                            checked={rule.is_enabled}
                            onChange={(e) =>
                              toggleRule(rule.id, e.target.checked)
                            }
                            className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary"
                          />
                          <span
                            className={`text-sm font-medium transition-colors group-hover:text-primary ${!rule.is_enabled ? "text-slate-400 line-through" : ""}`}
                          >
                            {rule.rule_text}
                          </span>
                        </label>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-slate-300 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                          onClick={() => deleteRule(rule.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Card 3: Personality ── */}
          <Card className="rounded-xl">
            <CardContent className="p-6 lg:p-8">
              <div className="mb-8 flex items-center gap-3">
                <Smile className="h-7 w-7 text-primary" />
                <h3 className="text-xl font-bold text-on-surface lg:text-2xl">
                  პიროვნება
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
                {/* Left: Name + Tone */}
                <div className="space-y-8">
                  <div>
                    <Label className="mb-3 block text-xs font-bold uppercase tracking-widest text-slate-400">
                      ბოტის სახელი
                    </Label>
                    <Input
                      value={botName}
                      onChange={(e) => setBotName(e.target.value)}
                      className="border-none bg-surface-container-low font-bold focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  </div>
                  <div>
                    <Label className="mb-4 block text-xs font-bold uppercase tracking-widest text-slate-400">
                      ტონი
                    </Label>
                    <div className="space-y-2">
                      {(
                        [
                          { value: "formal", label: "ოფიციალური" },
                          { value: "friendly", label: "მეგობრული" },
                          { value: "casual", label: "თავისუფალი" },
                        ] as const
                      ).map((opt) => (
                        <label
                          key={opt.value}
                          className={`flex cursor-pointer items-center rounded-xl border p-3 transition-colors ${
                            botTone === opt.value
                              ? "border-2 border-primary bg-indigo-50"
                              : "border-slate-100 hover:bg-indigo-50"
                          }`}
                          onClick={() => setBotTone(opt.value)}
                        >
                          <div
                            className={`mr-3 h-4 w-4 rounded-full border-2 transition-all ${
                              botTone === opt.value
                                ? "border-primary bg-primary"
                                : "border-slate-200"
                            }`}
                          />
                          <span
                            className={`text-sm font-semibold ${
                              botTone === opt.value
                                ? "font-bold text-primary"
                                : "text-slate-600"
                            }`}
                          >
                            {opt.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Sliders */}
                <div className="space-y-8">
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">
                        პასუხის სიგრძე
                      </Label>
                      <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-primary">
                        {sliderLabel(responseLength, "length")}
                      </span>
                    </div>
                    <Slider
                      value={[responseLength]}
                      onValueChange={([v]) => setResponseLength(v)}
                      max={100}
                      step={1}
                    />
                  </div>
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">
                        Emoji-ების გამოყენება
                      </Label>
                      <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-primary">
                        {sliderLabel(emojiUsage, "emoji")}
                      </span>
                    </div>
                    <Slider
                      value={[emojiUsage]}
                      onValueChange={([v]) => setEmojiUsage(v)}
                      max={100}
                      step={1}
                    />
                  </div>
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-400">
                        გაყიდვების აგრესიულობა
                      </Label>
                      <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-primary">
                        {sliderLabel(salesAggressiveness, "sales")}
                      </span>
                    </div>
                    <Slider
                      value={[salesAggressiveness]}
                      onValueChange={([v]) => setSalesAggressiveness(v)}
                      max={100}
                      step={1}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-10">
                <Label className="mb-3 block text-xs font-bold uppercase tracking-widest text-slate-400">
                  მისალმების ტექსტი
                </Label>
                <Textarea
                  rows={3}
                  value={greetingMessage}
                  onChange={(e) => setGreetingMessage(e.target.value)}
                  className="border-none bg-surface-container-low font-medium focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ═══ Right Column ═══ */}
        <div className="flex flex-col gap-8 lg:sticky lg:top-24 lg:col-span-4 lg:h-fit">
          {/* Test Chat */}
          <Card className="overflow-hidden rounded-xl border-indigo-50 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-100 bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 animate-pulse rounded-full bg-emerald-500" />
                <h3 className="font-bold text-on-surface">ტესტირება</h3>
              </div>
              {chatMessages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mr-2 h-7 text-[10px] text-slate-400 hover:text-red-500"
                  onClick={() => setChatMessages([])}
                >
                  გასუფთავება
                </Button>
              )}
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                LIVE PREVIEW
              </span>
            </div>

            <div className="flex h-[450px] flex-col gap-4 overflow-y-auto bg-[#fdfdff] p-6">
              {chatMessages.length === 0 && (
                <p className="py-12 text-center text-sm text-slate-400">
                  დაწერე შეტყობინება ბოტის ტესტირებისთვის
                </p>
              )}
              {chatMessages.map((msg, i) =>
                msg.role === "user" ? (
                  <div key={i} className="flex flex-col items-end gap-1">
                    <div className="max-w-[85%] rounded-2xl rounded-tr-none bg-primary p-3 px-4 text-sm text-white">
                      {msg.content}
                    </div>
                    <span className="mr-1 text-[10px] font-medium text-slate-400">
                      {msg.time}
                    </span>
                  </div>
                ) : (
                  <div key={i} className="flex flex-col items-start gap-1">
                    <div className="mb-1 flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100">
                        <BrainCog className="h-3.5 w-3.5 text-indigo-600" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                        {botName || "ანა"}
                      </span>
                    </div>
                    <div className="max-w-[85%] rounded-2xl rounded-tl-none border-l-4 border-[#5c00ca] bg-[rgba(79,70,229,0.05)] p-4 text-sm leading-relaxed text-indigo-950 shadow-sm backdrop-blur-sm">
                      {msg.content}
                    </div>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {msg.sources.map((s, j) => (
                          <span
                            key={j}
                            className="rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                    <span className="ml-1 text-[10px] font-medium text-slate-400">
                      {msg.time}
                    </span>
                  </div>
                ),
              )}
              {chatSending && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-primary" />
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-primary"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-primary"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="flex gap-2 border-t border-slate-100 bg-white p-4">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendTestMessage()}
                placeholder="დასვით კითხვა..."
                className="flex-1 border-none bg-surface-container-low focus-visible:ring-0"
                disabled={chatSending}
              />
              <Button
                size="icon"
                className="h-10 w-10 rounded-xl"
                onClick={sendTestMessage}
                disabled={chatSending || !chatInput.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          {/* Knowledge Stats */}
          <div className="group relative overflow-hidden rounded-xl bg-indigo-600 p-6 text-white shadow-xl">
            <div className="absolute -bottom-4 -right-4 opacity-10 transition-transform duration-700 group-hover:scale-110">
              <Database className="h-36 w-36" />
            </div>
            <h4 className="mb-6 text-xs font-bold uppercase tracking-widest text-indigo-200">
              ცოდნის სტატისტიკა
            </h4>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">სულ ცოდნა</span>
                <span className="text-lg font-bold">
                  ~{totalWords.toLocaleString()} სიტყვა
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-indigo-900/30">
                <div
                  className="h-full rounded-full bg-secondary-container transition-all"
                  style={{
                    width: `${Math.min(100, (totalWords / 20000) * 100)}%`,
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="rounded-lg bg-white/10 p-3 backdrop-blur-sm">
                  <p className="text-[10px] font-bold uppercase text-indigo-200">
                    პროდუქტი
                  </p>
                  <p className="text-xl font-bold">{productCount}</p>
                </div>
                <div className="rounded-lg bg-white/10 p-3 backdrop-blur-sm">
                  <p className="text-[10px] font-bold uppercase text-indigo-200">
                    კითხვა-პასუხი
                  </p>
                  <p className="text-xl font-bold">{faqCount}</p>
                </div>
                <div className="rounded-lg bg-white/10 p-3 backdrop-blur-sm">
                  <p className="text-[10px] font-bold uppercase text-indigo-200">
                    დოკუმენტი
                  </p>
                  <p className="text-xl font-bold">{documents.length}</p>
                </div>
                <div className="rounded-lg bg-white/10 p-3 backdrop-blur-sm">
                  <p className="text-[10px] font-bold uppercase text-indigo-200">
                    ჩანაწერი
                  </p>
                  <p className="text-xl font-bold">{entries.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Bottom Bar ═══ */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 flex h-20 items-center justify-between border-t border-slate-100 bg-white/90 px-4 backdrop-blur-md md:left-64 md:px-6 lg:px-10">
        <div className="flex items-center gap-2 text-slate-400">
          <Upload className="h-4 w-4" />
          <span className="text-xs font-medium italic">
            {lastSaved
              ? `ბოლო შენახვა: ${lastSaved.toLocaleTimeString("ka-GE", { hour: "2-digit", minute: "2-digit" })}`
              : "ჯერ არ შენახულა"}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => loadData()}
            className="font-bold text-slate-500"
          >
            გაუქმება
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-gradient-to-r from-primary to-[#7531e6] px-8 font-bold shadow-lg shadow-indigo-200 transition-all hover:scale-105 active:scale-95"
          >
            {saving ? "შენახვა..." : "შენახვა"}
          </Button>
        </div>
      </footer>

      {/* ═══ Entry Dialog ═══ */}
      <Dialog open={entryDialogOpen} onOpenChange={setEntryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? "ცოდნის რედაქტირება" : "ახალი ცოდნა"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>სათაური</Label>
              <Input
                value={entryTitle}
                onChange={(e) => setEntryTitle(e.target.value)}
                placeholder="მაგ. გარანტიის პირობები"
              />
            </div>
            <div>
              <Label>შინაარსი</Label>
              <Textarea
                rows={6}
                value={entryContent}
                onChange={(e) => setEntryContent(e.target.value)}
                placeholder="აღწერეთ დეტალურად..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setEntryDialogOpen(false)}
              >
                გაუქმება
              </Button>
              <Button
                onClick={saveEntry}
                disabled={!entryTitle.trim() || !entryContent.trim()}
              >
                შენახვა
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ Rule Dialog ═══ */}
      <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ახალი წესი</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>წესის ტექსტი</Label>
              <Input
                value={newRuleText}
                onChange={(e) => setNewRuleText(e.target.value)}
                placeholder="მაგ. არასოდეს შესთავაზო ფასდაკლება"
                onKeyDown={(e) => e.key === "Enter" && addRule()}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setRuleDialogOpen(false)}
              >
                გაუქმება
              </Button>
              <Button onClick={addRule} disabled={!newRuleText.trim()}>
                დამატება
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
