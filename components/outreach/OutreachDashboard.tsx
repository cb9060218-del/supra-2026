"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
  Send,
  Users,
  MessageSquare,
  BarChart3,
  Calendar,
  Paperclip,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Trash2,
  Edit2,
  Eye,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Briefcase,
  Layers,
  Sparkles,
  Phone,
  Mail,
  RefreshCw,
  Copy,
  Check,
  X,
  Play,
  Share2,
  ShieldCheck,
  Flame,
  ArrowRight,
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  createOutreachSponsorAction,
  updateOutreachSponsorAction,
  updateLeadStatusAction,
  deleteOutreachSponsorAction,
  importFromExistingSponsorsAction,
  createTemplateAction,
  updateTemplateAction,
  deleteTemplateAction,
  createCampaignAction,
  updateCampaignAction,
  deleteCampaignAction,
  logBatchOutreachMessagesAction,
  scheduleFollowupAction,
  toggleFollowupDoneAction,
  deleteFollowupAction,
  createOutreachAttachmentAction,
  deleteOutreachAttachmentAction,
  OutreachSponsorInput,
  TemplateInput,
  CampaignInput,
  FollowupInput,
  AttachmentInput,
  BatchLogItem,
} from "@/app/dashboard/outreach/actions";
import { formatCurrency } from "@/lib/utils";

export interface OutreachSponsor {
  id: string;
  company_name: string;
  contact_person: string;
  phone?: string | null;
  email?: string | null;
  category: string;
  status: "not_contacted" | "contacted" | "replied" | "meeting_scheduled" | "sponsored" | "rejected";
  target_amount?: number;
  secured_amount?: number;
  notes?: string | null;
  city?: string | null;
  state?: string | null;
  last_contacted_at?: string | null;
  created_at: string;
}

export interface OutreachTemplate {
  id: string;
  title: string;
  channel: "whatsapp" | "email" | "multi";
  category: string;
  subject?: string | null;
  body: string;
  created_at: string;
}

export interface OutreachCampaign {
  id: string;
  title: string;
  description?: string | null;
  target_category?: string | null;
  target_sponsorship_goal?: number;
  status: "active" | "draft" | "completed" | "paused";
  created_at: string;
}

export interface OutreachLog {
  id: string;
  sponsor_id: string;
  campaign_id?: string | null;
  template_id?: string | null;
  channel: string;
  message_content: string;
  delivery_status: "queued" | "sent" | "delivered" | "replied" | "failed";
  sent_at: string;
}

export interface OutreachFollowup {
  id: string;
  sponsor_id: string;
  scheduled_date: string;
  scheduled_time?: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  notes: string;
  is_completed: boolean;
  completed_at?: string | null;
  created_at: string;
}

export interface OutreachAttachment {
  id: string;
  title: string;
  doc_type: "Brochure" | "Team Profile" | "Proposal Deck" | "Rate Card" | "Image" | "Other";
  file_name: string;
  file_url: string;
  file_size?: string | null;
  version: string;
  description?: string | null;
  created_at: string;
}

interface OutreachDashboardProps {
  initialSponsors: OutreachSponsor[];
  initialTemplates: OutreachTemplate[];
  initialCampaigns: OutreachCampaign[];
  initialLogs: OutreachLog[];
  initialFollowups: OutreachFollowup[];
  initialAttachments: OutreachAttachment[];
  userRole: string;
}

const CATEGORIES = [
  "Automotive",
  "Manufacturing",
  "Electronics",
  "Software/IT",
  "Logistics",
  "Financial",
  "Local Business",
  "Other",
] as const;

const STATUS_LABELS: Record<string, { label: string; bg: string; text: string; border: string }> = {
  not_contacted: { label: "Not Contacted", bg: "bg-zinc-800/40", text: "text-zinc-400", border: "border-zinc-700" },
  contacted: { label: "Contacted", bg: "bg-blue-950/40", text: "text-blue-400", border: "border-blue-900" },
  replied: { label: "Replied", bg: "bg-purple-950/40", text: "text-purple-400", border: "border-purple-900" },
  meeting_scheduled: { label: "Meeting Scheduled", bg: "bg-amber-950/40", text: "text-amber-400", border: "border-amber-900" },
  sponsored: { label: "Sponsored (Won)", bg: "bg-emerald-950/40", text: "text-emerald-400", border: "border-emerald-900" },
  rejected: { label: "Rejected / Closed", bg: "bg-rose-950/40", text: "text-rose-400", border: "border-rose-900" },
};

export default function OutreachDashboard({
  initialSponsors,
  initialTemplates,
  initialCampaigns,
  initialLogs,
  initialFollowups,
  initialAttachments,
  userRole,
}: OutreachDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    "analytics" | "leads" | "batch" | "templates" | "followups" | "attachments"
  >("analytics");

  const [sponsors, setSponsors] = useState<OutreachSponsor[]>(initialSponsors);
  const [templates, setTemplates] = useState<OutreachTemplate[]>(initialTemplates);
  const [campaigns, setCampaigns] = useState<OutreachCampaign[]>(initialCampaigns);
  const [logs, setLogs] = useState<OutreachLog[]>(initialLogs);
  const [followups, setFollowups] = useState<OutreachFollowup[]>(initialFollowups);
  const [attachments, setAttachments] = useState<OutreachAttachment[]>(initialAttachments);

  const [isPending, startTransition] = useTransition();
  const isWritable = ["super_admin", "admin", "coordinator"].includes(userRole);

  // ----------------------------------------------------
  // LEADS STATE & FILTERS
  // ----------------------------------------------------
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);

  // Lead Form
  const [leadName, setLeadName] = useState("");
  const [leadContact, setLeadContact] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadCategory, setLeadCategory] = useState("Automotive");
  const [leadTargetAmt, setLeadTargetAmt] = useState("");
  const [leadCity, setLeadCity] = useState("");
  const [leadNotes, setLeadNotes] = useState("");

  // ----------------------------------------------------
  // BATCH OUTREACH STATE
  // ----------------------------------------------------
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(
    initialCampaigns[0]?.id || ""
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    initialTemplates[0]?.id || ""
  );
  const [batchChannel, setBatchChannel] = useState<"whatsapp" | "email">("whatsapp");
  const [batchIndex, setBatchIndex] = useState(0);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchStatusMsg, setDispatchStatusMsg] = useState("");

  // ----------------------------------------------------
  // TEMPLATES STATE
  // ----------------------------------------------------
  const [showAddTemplateModal, setShowAddTemplateModal] = useState(false);
  const [tplTitle, setTplTitle] = useState("");
  const [tplChannel, setTplChannel] = useState<"whatsapp" | "email">("whatsapp");
  const [tplCategory, setTplCategory] = useState("Initial Pitch");
  const [tplSubject, setTplSubject] = useState("");
  const [tplBody, setTplBody] = useState("");

  // ----------------------------------------------------
  // FOLLOWUP STATE
  // ----------------------------------------------------
  const [showAddFollowupModal, setShowAddFollowupModal] = useState(false);
  const [fuSponsorId, setFuSponsorId] = useState("");
  const [fuDate, setFuDate] = useState(new Date().toISOString().split("T")[0]);
  const [fuTime, setFuTime] = useState("11:00");
  const [fuPriority, setFuPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [fuNotes, setFuNotes] = useState("");

  // ----------------------------------------------------
  // ATTACHMENT STATE
  // ----------------------------------------------------
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [docTitle, setDocTitle] = useState("");
  const [docType, setDocType] = useState<"Brochure" | "Team Profile" | "Proposal Deck" | "Rate Card" | "Image" | "Other">("Brochure");
  const [docFileName, setDocFileName] = useState("");
  const [docUrl, setDocUrl] = useState("/tracker.html");
  const [docSize, setDocSize] = useState("2.5 MB");
  const [docVersion, setDocVersion] = useState("v1.0");
  const [docDesc, setDocDesc] = useState("");

  // ----------------------------------------------------
  // METRICS & CALCULATIONS
  // ----------------------------------------------------
  const totalLeads = sponsors.length;
  const contactedLeads = sponsors.filter((s) => s.status !== "not_contacted").length;
  const repliedLeads = sponsors.filter((s) => ["replied", "meeting_scheduled", "sponsored"].includes(s.status)).length;
  const meetingsScheduled = sponsors.filter((s) => s.status === "meeting_scheduled").length;
  const sponsoredWon = sponsors.filter((s) => s.status === "sponsored").length;

  const totalSecuredAmount = sponsors.reduce((acc, s) => acc + (s.secured_amount || 0), 0);
  const totalTargetGoal = sponsors.reduce((acc, s) => acc + (s.target_amount || 0), 0);

  const responseRate = contactedLeads > 0 ? Math.round((repliedLeads / contactedLeads) * 100) : 0;
  const conversionRate = totalLeads > 0 ? Math.round((sponsoredWon / totalLeads) * 100) : 0;

  // Pending Follow-ups
  const todayStr = new Date().toISOString().split("T")[0];
  const pendingFollowups = followups.filter((f) => !f.is_completed);
  const overdueFollowups = pendingFollowups.filter((f) => f.scheduled_date < todayStr);
  const todayFollowups = pendingFollowups.filter((f) => f.scheduled_date === todayStr);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return sponsors.filter((s) => {
      if (categoryFilter !== "all" && s.category !== categoryFilter) return false;
      if (statusFilter !== "all" && s.status !== statusFilter) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesComp = s.company_name.toLowerCase().includes(q);
        const matchesPerson = s.contact_person.toLowerCase().includes(q);
        const matchesCity = (s.city || "").toLowerCase().includes(q);
        const matchesNotes = (s.notes || "").toLowerCase().includes(q);
        if (!matchesComp && !matchesPerson && !matchesCity && !matchesNotes) return false;
      }
      return true;
    });
  }, [sponsors, categoryFilter, statusFilter, searchTerm]);

  // Selected template object
  const currentTemplate = useMemo(() => {
    return templates.find((t) => t.id === selectedTemplateId) || templates[0];
  }, [templates, selectedTemplateId]);

  // Compile Dynamic Variables
  const compileTemplate = (templateBody: string, lead: OutreachSponsor) => {
    if (!templateBody) return "";
    return templateBody
      .replace(/{{name}}/g, lead.contact_person || "Sir/Ma'am")
      .replace(/{{company}}/g, lead.company_name)
      .replace(/{{contact_person}}/g, lead.contact_person)
      .replace(/{{team_name}}/g, "SUPRA SAEINDIA Formula Racing")
      .replace(/{{event_name}}/g, "SUPRA SAEINDIA 2026")
      .replace(/{{city}}/g, lead.city || "NCR")
      .replace(/{{phone}}/g, lead.phone || "-");
  };

  // ----------------------------------------------------
  // ACTION HANDLERS
  // ----------------------------------------------------

  // 1. Lead Status Toggle (0ms optimistic)
  const handleStatusChange = (id: string, newStatus: any) => {
    if (!isWritable) return;
    const current = sponsors.find((s) => s.id === id);
    if (!current) return;

    const prevStatus = current.status;
    setSponsors((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status: newStatus,
              last_contacted_at: newStatus === "contacted" ? new Date().toISOString() : s.last_contacted_at,
            }
          : s
      )
    );

    startTransition(async () => {
      const res = await updateLeadStatusAction(id, newStatus);
      if (res?.error) {
        setSponsors((prev) => prev.map((s) => (s.id === id ? { ...s, status: prevStatus } : s)));
        alert("Failed to update status: " + res.error);
      }
    });
  };

  // 2. Add Lead
  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName.trim() || !leadContact.trim()) return;

    const tempId = "temp_" + Date.now();
    const newLead: OutreachSponsor = {
      id: tempId,
      company_name: leadName.trim(),
      contact_person: leadContact.trim(),
      phone: leadPhone.trim() || null,
      email: leadEmail.trim() || null,
      category: leadCategory,
      status: "not_contacted",
      target_amount: parseFloat(leadTargetAmt) || 0,
      secured_amount: 0,
      city: leadCity.trim() || null,
      notes: leadNotes.trim() || null,
      created_at: new Date().toISOString(),
    };

    setSponsors((prev) => [newLead, ...prev]);
    setShowAddLeadModal(false);

    // Reset Form
    setLeadName("");
    setLeadContact("");
    setLeadPhone("");
    setLeadEmail("");
    setLeadTargetAmt("");
    setLeadCity("");
    setLeadNotes("");

    startTransition(async () => {
      const res = await createOutreachSponsorAction({
        company_name: newLead.company_name,
        contact_person: newLead.contact_person,
        phone: newLead.phone || undefined,
        email: newLead.email || undefined,
        category: newLead.category,
        target_amount: newLead.target_amount,
        city: newLead.city || undefined,
        notes: newLead.notes || undefined,
      });

      if (res?.error) {
        setSponsors((prev) => prev.filter((s) => s.id !== tempId));
        alert("Failed to add sponsor lead: " + res.error);
      } else if (res?.data) {
        setSponsors((prev) => prev.map((s) => (s.id === tempId ? res.data : s)));
      }
    });
  };

  // 3. Delete Lead
  const handleDeleteLead = (id: string, name: string) => {
    if (!confirm(`Delete outreach lead for ${name}?`)) return;

    setSponsors((prev) => prev.filter((s) => s.id !== id));
    startTransition(async () => {
      await deleteOutreachSponsorAction(id);
    });
  };

  // 4. Import Existing Sponsors
  const handleImportCRM = () => {
    if (!confirm("Import registered sponsors from Sponsors CRM into Outreach Leads?")) return;

    startTransition(async () => {
      const res = await importFromExistingSponsorsAction();
      if (res?.error) {
        alert("Import failed: " + res.error);
      } else if (res?.message) {
        alert(res.message);
      } else if (res?.count) {
        alert(`Successfully imported ${res.count} sponsors into Outreach Leads!`);
        window.location.reload();
      }
    });
  };

  // 5. Excel Export
  const handleExportExcel = () => {
    const dataToExport = filteredLeads.map((s, idx) => ({
      "Sr No": idx + 1,
      "Company Name": s.company_name,
      "Contact Person": s.contact_person,
      "Phone": s.phone || "-",
      "Email": s.email || "-",
      "Category": s.category,
      "Outreach Status": STATUS_LABELS[s.status]?.label || s.status,
      "Target Amount (Rs)": s.target_amount || 0,
      "Secured Amount (Rs)": s.secured_amount || 0,
      "City": s.city || "-",
      "Last Contacted": s.last_contacted_at ? new Date(s.last_contacted_at).toLocaleString() : "Never",
      "Notes": s.notes || "-",
    }));

    const funnelData = [
      { Stage: "Total Prospects", Count: totalLeads },
      { Stage: "Contacted", Count: contactedLeads },
      { Stage: "Responses Received", Count: repliedLeads },
      { Stage: "Meetings Scheduled", Count: meetingsScheduled },
      { Stage: "Sponsored Deals Closed", Count: sponsoredWon },
      { Stage: "Total Sponsorship Secured (Rs)", Count: totalSecuredAmount },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dataToExport), "Outreach Leads Directory");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(funnelData), "Conversion Funnel & KPIs");

    const dateStr = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `SUPRA_2026_Sponsor_Outreach_Report_${dateStr}.xlsx`);
  };

  // 6. Template Creation
  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tplTitle.trim() || !tplBody.trim()) return;

    const tempId = "tpl_" + Date.now();
    const newTpl: OutreachTemplate = {
      id: tempId,
      title: tplTitle.trim(),
      channel: tplChannel,
      category: tplCategory,
      subject: tplSubject.trim() || null,
      body: tplBody.trim(),
      created_at: new Date().toISOString(),
    };

    setTemplates((prev) => [newTpl, ...prev]);
    setShowAddTemplateModal(false);

    setTplTitle("");
    setTplSubject("");
    setTplBody("");

    startTransition(async () => {
      const res = await createTemplateAction({
        title: newTpl.title,
        channel: newTpl.channel,
        category: newTpl.category,
        subject: newTpl.subject || undefined,
        body: newTpl.body,
      });

      if (res?.data) {
        setTemplates((prev) => prev.map((t) => (t.id === tempId ? res.data : t)));
      }
    });
  };

  // 7. Follow-up Toggle
  const handleToggleFollowup = (id: string, currentVal: boolean) => {
    setFollowups((prev) =>
      prev.map((f) => (f.id === id ? { ...f, is_completed: !currentVal } : f))
    );

    startTransition(async () => {
      await toggleFollowupDoneAction(id, !currentVal);
    });
  };

  // 8. Schedule Follow-up
  const handleScheduleFollowup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fuSponsorId || !fuNotes.trim()) return;

    const tempId = "fu_" + Date.now();
    const newFu: OutreachFollowup = {
      id: tempId,
      sponsor_id: fuSponsorId,
      scheduled_date: fuDate,
      scheduled_time: fuTime,
      priority: fuPriority,
      notes: fuNotes.trim(),
      is_completed: false,
      created_at: new Date().toISOString(),
    };

    setFollowups((prev) => [newFu, ...prev]);
    setShowAddFollowupModal(false);
    setFuNotes("");

    startTransition(async () => {
      const res = await scheduleFollowupAction({
        sponsor_id: newFu.sponsor_id,
        scheduled_date: newFu.scheduled_date,
        scheduled_time: newFu.scheduled_time || undefined,
        priority: newFu.priority,
        notes: newFu.notes,
      });
      if (res?.data) {
        setFollowups((prev) => prev.map((f) => (f.id === tempId ? res.data : f)));
      }
    });
  };

  // 9. Batch Dispatcher (Groups of 5-10 contacts)
  const handleBatchDispatch = async () => {
    if (selectedLeadIds.length === 0) {
      alert("Please select at least one sponsor contact.");
      return;
    }

    if (!currentTemplate) {
      alert("Please select a message template.");
      return;
    }

    setIsDispatching(true);
    setDispatchStatusMsg(`Preparing batch of ${selectedLeadIds.length} personalized messages...`);

    const selectedLeads = sponsors.filter((s) => selectedLeadIds.includes(s.id));
    const logItems: BatchLogItem[] = selectedLeads.map((lead) => ({
      sponsor_id: lead.id,
      campaign_id: selectedCampaignId || undefined,
      template_id: currentTemplate.id,
      channel: batchChannel,
      message_content: compileTemplate(currentTemplate.body, lead),
      delivery_status: "sent",
    }));

    // Update local status optimistically
    setSponsors((prev) =>
      prev.map((s) =>
        selectedLeadIds.includes(s.id)
          ? {
              ...s,
              status: s.status === "not_contacted" ? "contacted" : s.status,
              last_contacted_at: new Date().toISOString(),
            }
          : s
      )
    );

    // Call server action to record logs & update timestamps
    await logBatchOutreachMessagesAction(logItems);

    setIsDispatching(false);
    setDispatchStatusMsg(`✅ Successfully generated & logged outreach for ${selectedLeadIds.length} sponsors!`);
    setTimeout(() => setDispatchStatusMsg(""), 5000);
  };

  // Quick WhatsApp Launcher for individual lead
  const openWhatsAppChat = (lead: OutreachSponsor, templateBody?: string) => {
    const phoneClean = (lead.phone || "").replace(/[^0-9]/g, "");
    const text = encodeURIComponent(
      compileTemplate(templateBody || currentTemplate?.body || "Hello", lead)
    );
    const url = `https://wa.me/${phoneClean.startsWith("91") ? phoneClean : "91" + phoneClean}?text=${text}`;
    window.open(url, "_blank");

    // Optimistically update status
    handleStatusChange(lead.id, "contacted");
  };

  // Quick Mailto Launcher
  const openMailto = (lead: OutreachSponsor, templateBody?: string, subject?: string) => {
    const text = encodeURIComponent(
      compileTemplate(templateBody || currentTemplate?.body || "Hello", lead)
    );
    const sub = encodeURIComponent(subject || currentTemplate?.subject || "Partnership with SUPRA SAEINDIA 2026");
    const url = `mailto:${lead.email || ""}?subject=${sub}&body=${text}`;
    window.open(url, "_blank");

    // Optimistically update status
    handleStatusChange(lead.id, "contacted");
  };

  return (
    <div className="space-y-6">
      {/* Module Title & Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-850 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/10 text-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-400">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                Sponsor Outreach & Bulk Messaging
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                Manage sponsor leads, personalized batch outreach, templates, pitch decks, and follow-ups.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 transition-all shadow-sm"
            title="Download full outreach report in Excel (.xlsx)"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Download Excel</span>
          </button>

          {isWritable && (
            <>
              <button
                onClick={handleImportCRM}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs px-3.5 py-2 transition-all shadow-sm disabled:opacity-50"
                title="Import existing sponsors from Sponsors CRM"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
                <span>Import from CRM</span>
              </button>

              <button
                onClick={() => setShowAddLeadModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-100 dark:text-zinc-950 font-bold text-xs px-4 py-2 transition-all shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Add Prospect</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-zinc-200 dark:border-zinc-850">
        {[
          { id: "analytics", label: "Overview & Funnel", icon: BarChart3 },
          { id: "leads", label: `Sponsor Leads (${sponsors.length})`, icon: Users },
          { id: "batch", label: "Batch Outreach", icon: Send },
          { id: "templates", label: `Message Templates (${templates.length})`, icon: MessageSquare },
          {
            id: "followups",
            label: `Follow-Ups (${pendingFollowups.length})`,
            icon: Calendar,
            badge: overdueFollowups.length > 0 ? `${overdueFollowups.length} Overdue` : undefined,
          },
          { id: "attachments", label: `Pitch Decks (${attachments.length})`, icon: Paperclip },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="rounded-full bg-rose-500 text-white px-1.5 py-0.2 text-[9px] font-black">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: OVERVIEW & FUNNEL ANALYTICS                       */}
      {/* ======================================================== */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          {/* Overdue / Due Today Alerts */}
          {overdueFollowups.length > 0 && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0" />
                <div>
                  <span className="text-xs font-bold text-rose-300 block">
                    {overdueFollowups.length} Overdue Sponsor Follow-ups Require Action!
                  </span>
                  <span className="text-[11px] text-rose-400/80">
                    Sponsors waiting for responses or proposal calls. Check the Follow-ups tab.
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveTab("followups")}
                className="rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-1.5 transition-all"
              >
                View Reminders
              </button>
            </div>
          )}

          {/* Top KPI Deck */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900/20 p-4">
              <span className="text-[10px] text-zinc-500 font-semibold uppercase block">Total Prospects</span>
              <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-1 block">{totalLeads}</span>
            </div>

            <div className="rounded-xl border border-blue-500/20 bg-blue-50/40 dark:bg-blue-950/10 p-4">
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold uppercase block">Contacted</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{contactedLeads}</span>
                <span className="text-xs font-bold text-blue-500">
                  {totalLeads > 0 ? Math.round((contactedLeads / totalLeads) * 100) : 0}%
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-purple-500/20 bg-purple-50/40 dark:bg-purple-950/10 p-4">
              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold uppercase block">Response Rate</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{responseRate}%</span>
                <span className="text-[10px] text-purple-500 font-bold">{repliedLeads} replied</span>
              </div>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-amber-50/40 dark:bg-amber-950/10 p-4">
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold uppercase block">Meetings Set</span>
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 block">{meetingsScheduled}</span>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/10 p-4">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase block">Deals Closed</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{sponsoredWon}</span>
                <span className="text-xs font-bold text-emerald-500">{conversionRate}% conv</span>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/10 p-4">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase block">Secured Amount</span>
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 block truncate">
                {formatCurrency(totalSecuredAmount)}
              </span>
            </div>
          </div>

          {/* Conversion Funnel & Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conversion Funnel */}
            <div className="lg:col-span-2 rounded-2xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900/15 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-indigo-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-200">
                    Sponsor Outreach Conversion Funnel
                  </h3>
                </div>
                <span className="text-[11px] text-zinc-500">Live Funnel Analytics</span>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  {
                    stage: "Total Prospect Database",
                    count: totalLeads,
                    pct: 100,
                    color: "bg-zinc-700",
                    text: "text-zinc-300",
                  },
                  {
                    stage: "Outreach Contacted (Brochure / Pitch Sent)",
                    count: contactedLeads,
                    pct: totalLeads > 0 ? Math.round((contactedLeads / totalLeads) * 100) : 0,
                    color: "bg-blue-600",
                    text: "text-blue-400",
                  },
                  {
                    stage: "Positive Replies & Interest",
                    count: repliedLeads,
                    pct: totalLeads > 0 ? Math.round((repliedLeads / totalLeads) * 100) : 0,
                    color: "bg-purple-600",
                    text: "text-purple-400",
                  },
                  {
                    stage: "Discovery & Proposal Meetings Scheduled",
                    count: meetingsScheduled,
                    pct: totalLeads > 0 ? Math.round((meetingsScheduled / totalLeads) * 100) : 0,
                    color: "bg-amber-500",
                    text: "text-amber-400",
                  },
                  {
                    stage: "Sponsorship Agreements Closed / Paid",
                    count: sponsoredWon,
                    pct: totalLeads > 0 ? Math.round((sponsoredWon / totalLeads) * 100) : 0,
                    color: "bg-emerald-500",
                    text: "text-emerald-400",
                  },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">{item.stage}</span>
                      <div className="flex items-center gap-3">
                        <span className={`font-bold ${item.text}`}>{item.count}</span>
                        <span className="text-zinc-500 text-[11px] w-12 text-right">{item.pct}%</span>
                      </div>
                    </div>
                    <div className="h-2.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} transition-all duration-500 rounded-full`}
                        style={{ width: `${Math.max(item.pct, 4)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Distribution */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900/15 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-200">
                  Lead Categories
                </h3>
              </div>

              <div className="space-y-2.5 pt-1">
                {CATEGORIES.map((cat) => {
                  const catCount = sponsors.filter((s) => s.category === cat).length;
                  const catWon = sponsors.filter((s) => s.category === cat && s.status === "sponsored").length;

                  return (
                    <div
                      key={cat}
                      className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-950/40 p-2.5 text-xs"
                    >
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">{cat}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-500">{catCount} leads</span>
                        {catWon > 0 && (
                          <span className="rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-[9px] font-bold px-1.5 py-0.5">
                            {catWon} won
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: SPONSOR LEADS DIRECTORY                           */}
      {/* ======================================================== */}
      {activeTab === "leads" && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-850 p-3 rounded-xl">
            <div className="flex flex-1 items-center gap-2 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search company, contact person, city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-800 bg-transparent pl-9 pr-4 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-lg border border-zinc-300 dark:border-zinc-800 bg-transparent px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none"
              >
                <option value="all" className="bg-zinc-900">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-zinc-900">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: "all", label: "All Status" },
                { id: "not_contacted", label: "Not Contacted" },
                { id: "contacted", label: "Contacted" },
                { id: "replied", label: "Replied" },
                { id: "meeting_scheduled", label: "Meeting" },
                { id: "sponsored", label: "Sponsored" },
              ].map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => setStatusFilter(chip.id)}
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold border transition-all ${
                    statusFilter === chip.id
                      ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 border-transparent"
                      : "bg-transparent border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Leads Table */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900/10 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-900/60 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                  <tr>
                    <th className="py-3 px-4 w-10 text-center">#</th>
                    <th className="py-3 px-4">Company & Contact</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Contact Details</th>
                    <th className="py-3 px-4">Outreach Status</th>
                    <th className="py-3 px-4">Target / Secured (₹)</th>
                    <th className="py-3 px-4">Last Activity</th>
                    <th className="py-3 px-4 text-center">Quick Pitch</th>
                    {isWritable && <th className="py-3 px-4 w-12 text-center">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-850">
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-zinc-500 italic">
                        No sponsor leads found matching the filters.
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead, idx) => {
                      const st = STATUS_LABELS[lead.status] || STATUS_LABELS.not_contacted;

                      return (
                        <tr
                          key={lead.id}
                          className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors"
                        >
                          <td className="py-3.5 px-4 text-center text-zinc-400 font-mono text-[11px]">
                            {idx + 1}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                              {lead.company_name}
                            </span>
                            <span className="text-[11px] text-zinc-500 block">
                              {lead.contact_person} {lead.city ? `• ${lead.city}` : ""}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="rounded border border-zinc-700 bg-zinc-850 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
                              {lead.category}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-[11px]">
                            {lead.phone && (
                              <span className="text-zinc-400 flex items-center gap-1 block">
                                <Phone className="h-3 w-3 text-zinc-500" /> {lead.phone}
                              </span>
                            )}
                            {lead.email && (
                              <span className="text-zinc-400 flex items-center gap-1 block truncate max-w-xs">
                                <Mail className="h-3 w-3 text-zinc-500" /> {lead.email}
                              </span>
                            )}
                          </td>

                          {/* Status Dropdown */}
                          <td className="py-3.5 px-4">
                            <select
                              value={lead.status}
                              disabled={!isWritable}
                              onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                              className={`rounded-lg border px-2.5 py-1 text-xs font-bold focus:outline-none cursor-pointer ${st.bg} ${st.text} ${st.border}`}
                            >
                              <option value="not_contacted" className="bg-zinc-900 text-zinc-300">Not Contacted</option>
                              <option value="contacted" className="bg-zinc-900 text-blue-400">Contacted</option>
                              <option value="replied" className="bg-zinc-900 text-purple-400">Replied</option>
                              <option value="meeting_scheduled" className="bg-zinc-900 text-amber-400">Meeting Scheduled</option>
                              <option value="sponsored" className="bg-zinc-900 text-emerald-400">Sponsored (Won)</option>
                              <option value="rejected" className="bg-zinc-900 text-rose-400">Rejected</option>
                            </select>
                          </td>

                          <td className="py-3.5 px-4 font-mono text-[11px]">
                            <span className="text-zinc-400 block">{formatCurrency(lead.target_amount || 0)}</span>
                            {lead.secured_amount ? (
                              <span className="text-emerald-400 font-bold block">
                                Won: {formatCurrency(lead.secured_amount)}
                              </span>
                            ) : null}
                          </td>

                          <td className="py-3.5 px-4 text-[10px] text-zinc-500">
                            {lead.last_contacted_at ? new Date(lead.last_contacted_at).toLocaleDateString() : "Never"}
                          </td>

                          {/* Quick Message Triggers */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {lead.phone && (
                                <button
                                  onClick={() => openWhatsAppChat(lead)}
                                  className="p-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 transition-all"
                                  title="Send WhatsApp Pitch Message"
                                >
                                  <MessageSquare className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {lead.email && (
                                <button
                                  onClick={() => openMailto(lead)}
                                  className="p-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 transition-all"
                                  title="Send Email Proposal"
                                >
                                  <Mail className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </td>

                          {isWritable && (
                            <td className="py-3.5 px-4 text-center">
                              <button
                                onClick={() => handleDeleteLead(lead.id, lead.company_name)}
                                className="text-zinc-500 hover:text-rose-400 p-1 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: BATCH OUTREACH & DISPATCHER                       */}
      {/* ======================================================== */}
      {activeTab === "batch" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Step 1 & 2: Campaign & Template Config */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900/15 p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-200 flex items-center gap-2">
                  <Flame className="h-4 w-4 text-amber-500" />
                  <span>1. Select Campaign</span>
                </h3>

                <select
                  value={selectedCampaignId}
                  onChange={(e) => setSelectedCampaignId(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-800 bg-transparent px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                >
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id} className="bg-zinc-900">
                      {c.title} ({c.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900/15 p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-200 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-indigo-400" />
                  <span>2. Select Message Template</span>
                </h3>

                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-800 bg-transparent px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id} className="bg-zinc-900">
                      [{t.channel.toUpperCase()}] {t.title}
                    </option>
                  ))}
                </select>

                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase">Channel:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setBatchChannel("whatsapp")}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-bold border transition-all ${
                        batchChannel === "whatsapp"
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "border-zinc-800 text-zinc-400"
                      }`}
                    >
                      WhatsApp
                    </button>
                    <button
                      onClick={() => setBatchChannel("email")}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-bold border transition-all ${
                        batchChannel === "email"
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "border-zinc-800 text-zinc-400"
                      }`}
                    >
                      Email
                    </button>
                  </div>
                </div>
              </div>

              {/* Dispatch Action Card */}
              <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/10 p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  3. Run Batch Dispatch
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Selected Contacts: <strong>{selectedLeadIds.length}</strong>
                </p>

                {dispatchStatusMsg && (
                  <div className="rounded-lg bg-emerald-950/40 border border-emerald-800 p-2.5 text-xs text-emerald-300">
                    {dispatchStatusMsg}
                  </div>
                )}

                <button
                  onClick={handleBatchDispatch}
                  disabled={isDispatching || selectedLeadIds.length === 0}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 transition-all shadow-md disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  <span>
                    {isDispatching ? "Logging Batch..." : `Dispatch Batch (${selectedLeadIds.length})`}
                  </span>
                </button>
              </div>
            </div>

            {/* Step 3: Select Contacts Table */}
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900/15 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-200">
                      Select Contacts for Batch Outreach
                    </h3>
                    <p className="text-[11px] text-zinc-500">
                      Pick target sponsors. System highlights already contacted leads to prevent duplicates.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setSelectedLeadIds(
                          selectedLeadIds.length === filteredLeads.length
                            ? []
                            : filteredLeads.map((s) => s.id)
                        )
                      }
                      className="text-xs font-bold text-indigo-400 hover:underline"
                    >
                      {selectedLeadIds.length === filteredLeads.length ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto divide-y divide-zinc-200 dark:divide-zinc-850 border border-zinc-200 dark:border-zinc-850 rounded-xl">
                  {filteredLeads.map((lead) => {
                    const isSelected = selectedLeadIds.includes(lead.id);
                    const isAlreadyContacted = lead.status !== "not_contacted";

                    return (
                      <div
                        key={lead.id}
                        onClick={() =>
                          setSelectedLeadIds((prev) =>
                            isSelected ? prev.filter((id) => id !== lead.id) : [...prev, lead.id]
                          )
                        }
                        className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-indigo-950/20"
                            : "hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded border-zinc-700 text-indigo-600 focus:ring-0"
                          />
                          <div>
                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">
                              {lead.company_name}
                            </span>
                            <span className="text-[11px] text-zinc-500">
                              {lead.contact_person} • {lead.category}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isAlreadyContacted ? (
                            <span className="rounded bg-amber-950/40 border border-amber-900/60 text-amber-400 text-[9px] font-bold px-2 py-0.5">
                              Already {STATUS_LABELS[lead.status]?.label}
                            </span>
                          ) : (
                            <span className="rounded bg-emerald-950/40 border border-emerald-900/60 text-emerald-400 text-[9px] font-bold px-2 py-0.5">
                              Fresh Lead
                            </span>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openWhatsAppChat(lead);
                            }}
                            className="p-1 rounded text-zinc-400 hover:text-emerald-400"
                            title="Direct WhatsApp"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Live Message Preview Card */}
                {selectedLeadIds.length > 0 && currentTemplate && (
                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5 text-indigo-400" />
                      <span>
                        Live Personalized Preview for:{" "}
                        <strong>{sponsors.find((s) => s.id === selectedLeadIds[0])?.company_name}</strong>
                      </span>
                    </span>
                    <div className="whitespace-pre-wrap text-xs text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 font-sans">
                      {compileTemplate(
                        currentTemplate.body,
                        sponsors.find((s) => s.id === selectedLeadIds[0])!
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: MESSAGE TEMPLATES BUILDER                         */}
      {/* ======================================================== */}
      {activeTab === "templates" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-200">
                Message & Outreach Templates Library
              </h3>
              <p className="text-[11px] text-zinc-500">
                Create reusable WhatsApp pitches, proposal emails, and follow-up templates with token variables.
              </p>
            </div>

            {isWritable && (
              <button
                onClick={() => setShowAddTemplateModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-100 dark:text-zinc-950 font-bold text-xs px-3.5 py-2 transition-all shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Create Template</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900/15 p-5 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                        tpl.channel === "whatsapp"
                          ? "bg-emerald-950/50 text-emerald-400 border border-emerald-900"
                          : "bg-blue-950/50 text-blue-400 border border-blue-900"
                      }`}
                    >
                      {tpl.channel} • {tpl.category}
                    </span>

                    {isWritable && (
                      <button
                        onClick={() => {
                          if (confirm(`Delete template "${tpl.title}"?`)) {
                            setTemplates((prev) => prev.filter((t) => t.id !== tpl.id));
                            deleteTemplateAction(tpl.id);
                          }
                        }}
                        className="text-zinc-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{tpl.title}</h4>
                  {tpl.subject && (
                    <p className="text-xs text-zinc-400 italic">Subject: {tpl.subject}</p>
                  )}

                  <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-3 text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap max-h-48 overflow-y-auto font-sans leading-relaxed">
                    {tpl.body}
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-850 flex items-center justify-between text-[11px] text-zinc-500">
                  <span>Tokens: <code>{"{{name}}"}</code>, <code>{"{{company}}"}</code></span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(tpl.body);
                      alert("Template text copied to clipboard!");
                    }}
                    className="inline-flex items-center gap-1 text-indigo-400 hover:underline"
                  >
                    <Copy className="h-3 w-3" /> Copy
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: FOLLOW-UP REMINDERS & TIMELINE                    */}
      {/* ======================================================== */}
      {activeTab === "followups" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-200">
                Sponsor Follow-Ups & Communication Schedule
              </h3>
              <p className="text-[11px] text-zinc-500">
                Never lose a sponsor lead. Track callbacks, discovery meetings, and MoU follow-up reminders.
              </p>
            </div>

            {isWritable && (
              <button
                onClick={() => setShowAddFollowupModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-100 dark:text-zinc-950 font-bold text-xs px-3.5 py-2 transition-all shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Schedule Follow-Up</span>
              </button>
            )}
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900/10 overflow-hidden shadow-sm">
            <div className="divide-y divide-zinc-200 dark:divide-zinc-850">
              {followups.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 italic">
                  No scheduled follow-up reminders. Click "Schedule Follow-Up" to create one.
                </div>
              ) : (
                followups.map((fu) => {
                  const sponsor = sponsors.find((s) => s.id === fu.sponsor_id);
                  const isOverdue = !fu.is_completed && fu.scheduled_date < todayStr;
                  const isToday = !fu.is_completed && fu.scheduled_date === todayStr;

                  return (
                    <div
                      key={fu.id}
                      className={`flex items-center justify-between p-4 transition-colors ${
                        fu.is_completed
                          ? "bg-zinc-50/50 dark:bg-zinc-950/20 opacity-60"
                          : isOverdue
                          ? "bg-rose-950/10 border-l-4 border-l-rose-500"
                          : isToday
                          ? "bg-amber-950/10 border-l-4 border-l-amber-500"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleFollowup(fu.id, fu.is_completed)}
                          className={`flex h-6 w-6 items-center justify-center rounded-lg border transition-all ${
                            fu.is_completed
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "border-zinc-700 bg-transparent text-transparent hover:border-zinc-500"
                          }`}
                        >
                          <Check className="h-3.5 w-3.5 stroke-[3px]" />
                        </button>

                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-bold ${
                                fu.is_completed
                                  ? "line-through text-zinc-500"
                                  : "text-zinc-900 dark:text-zinc-100"
                              }`}
                            >
                              {sponsor?.company_name || "Sponsor Lead"}
                            </span>
                            <span
                              className={`rounded px-1.5 py-0.2 text-[9px] font-black uppercase ${
                                fu.priority === "urgent"
                                  ? "bg-rose-950 text-rose-400 border border-rose-800"
                                  : fu.priority === "high"
                                  ? "bg-amber-950 text-amber-400 border border-amber-800"
                                  : "bg-zinc-800 text-zinc-400"
                              }`}
                            >
                              {fu.priority}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-0.5">{fu.notes}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span
                            className={`text-xs font-bold block ${
                              isOverdue
                                ? "text-rose-400"
                                : isToday
                                ? "text-amber-400"
                                : "text-zinc-400"
                            }`}
                          >
                            {fu.scheduled_date} {fu.scheduled_time || ""}
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            {isOverdue ? "Overdue" : isToday ? "Due Today" : "Upcoming"}
                          </span>
                        </div>

                        {sponsor && (
                          <button
                            onClick={() => openWhatsAppChat(sponsor)}
                            className="p-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400"
                            title="WhatsApp Followup"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {isWritable && (
                          <button
                            onClick={() => {
                              setFollowups((prev) => prev.filter((f) => f.id !== fu.id));
                              deleteFollowupAction(fu.id);
                            }}
                            className="text-zinc-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 6: PITCH DECKS & ATTACHMENTS REPOSITORY              */}
      {/* ======================================================== */}
      {activeTab === "attachments" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-200">
                Sponsorship Decks & Documents Repository
              </h3>
              <p className="text-[11px] text-zinc-500">
                Official PDF brochures, rate cards, and team profiles ready to share with prospective sponsors.
              </p>
            </div>

            {isWritable && (
              <button
                onClick={() => setShowAddDocModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-100 dark:text-zinc-950 font-bold text-xs px-3.5 py-2 transition-all shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Upload Document</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {attachments.map((doc) => (
              <div
                key={doc.id}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900/15 p-5 space-y-3 flex flex-col justify-between shadow-sm"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-indigo-950/40 border border-indigo-900 text-indigo-400 px-2 py-0.5 text-[9px] font-black uppercase">
                      {doc.doc_type} • {doc.version}
                    </span>
                    <span className="text-[10px] text-zinc-500">{doc.file_size}</span>
                  </div>

                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{doc.title}</h4>
                  <p className="text-xs text-zinc-500 leading-relaxed">{doc.description || "Official document."}</p>
                </div>

                <div className="pt-3 border-t border-zinc-200 dark:border-zinc-850 flex items-center justify-between">
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs font-bold px-3 py-1.5 transition-all"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download / View</span>
                  </a>

                  {isWritable && (
                    <button
                      onClick={() => {
                        if (confirm(`Delete document "${doc.title}"?`)) {
                          setAttachments((prev) => prev.filter((d) => d.id !== doc.id));
                          deleteOutreachAttachmentAction(doc.id);
                        }
                      }}
                      className="text-zinc-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD LEAD                                          */}
      {/* ======================================================== */}
      {showAddLeadModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setShowAddLeadModal(false)}
        >
          <div
            className="relative max-w-lg w-full bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-400" />
                <span>Add Prospective Sponsor Lead</span>
              </h3>
              <button onClick={() => setShowAddLeadModal(false)} className="text-zinc-400 hover:text-zinc-200">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hero MotoCorp"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-800 bg-transparent px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Contact Person *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mr. Rajesh Kumar"
                    value={leadContact}
                    onChange={(e) => setLeadContact(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-800 bg-transparent px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Phone (for WhatsApp)</label>
                  <input
                    type="text"
                    placeholder="e.g. 98123 45678"
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-800 bg-transparent px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. sponsor@company.com"
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-800 bg-transparent px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Industry Category</label>
                  <select
                    value={leadCategory}
                    onChange={(e) => setLeadCategory(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-800 bg-transparent px-2.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c} className="bg-zinc-900">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Target Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="500000"
                    value={leadTargetAmt}
                    onChange={(e) => setLeadTargetAmt(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-800 bg-transparent px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">City / Region</label>
                  <input
                    type="text"
                    placeholder="e.g. Gurugram"
                    value={leadCity}
                    onChange={(e) => setLeadCity(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-800 bg-transparent px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Notes & Strategy</label>
                <textarea
                  rows={2}
                  placeholder="Notes on pitch strategy or intro source..."
                  value={leadNotes}
                  onChange={(e) => setLeadNotes(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-800 bg-transparent px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddLeadModal(false)}
                  className="rounded-lg border border-zinc-300 dark:border-zinc-800 px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !leadName.trim() || !leadContact.trim()}
                  className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs font-bold transition-all disabled:opacity-50"
                >
                  Add Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD TEMPLATE                                      */}
      {/* ======================================================== */}
      {showAddTemplateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setShowAddTemplateModal(false)}
        >
          <div
            className="relative max-w-lg w-full bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-indigo-400" />
                <span>Create Message Template</span>
              </h3>
              <button onClick={() => setShowAddTemplateModal(false)} className="text-zinc-400 hover:text-zinc-200">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Template Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Stall Invitation (WhatsApp)"
                  value={tplTitle}
                  onChange={(e) => setTplTitle(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-800 bg-transparent px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Channel</label>
                  <select
                    value={tplChannel}
                    onChange={(e) => setTplChannel(e.target.value as any)}
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-800 bg-transparent px-2.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  >
                    <option value="whatsapp" className="bg-zinc-900">WhatsApp</option>
                    <option value="email" className="bg-zinc-900">Email</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Category</label>
                  <select
                    value={tplCategory}
                    onChange={(e) => setTplCategory(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-800 bg-transparent px-2.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  >
                    <option value="Initial Pitch" className="bg-zinc-900">Initial Pitch</option>
                    <option value="Brochure Follow-up" className="bg-zinc-900">Brochure Follow-up</option>
                    <option value="Meeting Request" className="bg-zinc-900">Meeting Request</option>
                    <option value="Sponsorship Deck" className="bg-zinc-900">Sponsorship Deck</option>
                    <option value="Custom" className="bg-zinc-900">Custom</option>
                  </select>
                </div>
              </div>

              {tplChannel === "email" && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Email Subject</label>
                  <input
                    type="text"
                    placeholder="e.g. Partnership Opportunity — SUPRA SAEINDIA 2026"
                    value={tplSubject}
                    onChange={(e) => setTplSubject(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-800 bg-transparent px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Template Message Body *</label>
                  <div className="flex gap-1 text-[10px] text-indigo-400">
                    <button
                      type="button"
                      onClick={() => setTplBody((prev) => prev + " {{name}}")}
                      className="hover:underline"
                    >
                      + {"{{name}}"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTplBody((prev) => prev + " {{company}}")}
                      className="hover:underline"
                    >
                      + {"{{company}}"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTplBody((prev) => prev + " {{event_name}}")}
                      className="hover:underline"
                    >
                      + {"{{event_name}}"}
                    </button>
                  </div>
                </div>

                <textarea
                  required
                  rows={6}
                  placeholder="Dear {{name}}, greetings from {{event_name}}..."
                  value={tplBody}
                  onChange={(e) => setTplBody(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-800 bg-transparent px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none font-sans"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddTemplateModal(false)}
                  className="rounded-lg border border-zinc-300 dark:border-zinc-800 px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!tplTitle.trim() || !tplBody.trim()}
                  className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs font-bold transition-all"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: SCHEDULE FOLLOW-UP                                */}
      {/* ======================================================== */}
      {showAddFollowupModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setShowAddFollowupModal(false)}
        >
          <div
            className="relative max-w-md w-full bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-400" />
                <span>Schedule Sponsor Follow-Up</span>
              </h3>
              <button onClick={() => setShowAddFollowupModal(false)} className="text-zinc-400 hover:text-zinc-200">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleScheduleFollowup} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Select Sponsor *</label>
                <select
                  required
                  value={fuSponsorId}
                  onChange={(e) => setFuSponsorId(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-800 bg-transparent px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                >
                  <option value="" className="bg-zinc-900">-- Choose Sponsor --</option>
                  {sponsors.map((s) => (
                    <option key={s.id} value={s.id} className="bg-zinc-900">
                      {s.company_name} ({s.contact_person})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Follow-Up Date *</label>
                  <input
                    type="date"
                    required
                    value={fuDate}
                    onChange={(e) => setFuDate(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-800 bg-transparent px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Priority</label>
                  <select
                    value={fuPriority}
                    onChange={(e) => setFuPriority(e.target.value as any)}
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-800 bg-transparent px-2.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  >
                    <option value="low" className="bg-zinc-900">Low</option>
                    <option value="medium" className="bg-zinc-900">Medium</option>
                    <option value="high" className="bg-zinc-900">High</option>
                    <option value="urgent" className="bg-zinc-900">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Reminder Notes *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Call VP Marketing to confirm sponsorship package and send MoU draft."
                  value={fuNotes}
                  onChange={(e) => setFuNotes(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-800 bg-transparent px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddFollowupModal(false)}
                  className="rounded-lg border border-zinc-300 dark:border-zinc-800 px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!fuSponsorId || !fuNotes.trim()}
                  className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs font-bold transition-all"
                >
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD ATTACHMENT                                    */}
      {/* ======================================================== */}
      {showAddDocModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setShowAddDocModal(false)}
        >
          <div
            className="relative max-w-md w-full bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-indigo-400" />
                <span>Upload Pitch Document</span>
              </h3>
              <button onClick={() => setShowAddDocModal(false)} className="text-zinc-400 hover:text-zinc-200">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!docTitle.trim()) return;

                const tempId = "doc_" + Date.now();
                const newDoc: OutreachAttachment = {
                  id: tempId,
                  title: docTitle.trim(),
                  doc_type: docType,
                  file_name: docFileName.trim() || `${docTitle.toLowerCase().replace(/ /g, "_")}.pdf`,
                  file_url: docUrl.trim() || "/tracker.html",
                  file_size: docSize.trim() || "2.0 MB",
                  version: docVersion.trim() || "v1.0",
                  description: docDesc.trim() || null,
                  created_at: new Date().toISOString(),
                };

                setAttachments((prev) => [newDoc, ...prev]);
                setShowAddDocModal(false);

                startTransition(async () => {
                  const res = await createOutreachAttachmentAction({
                    title: newDoc.title,
                    doc_type: newDoc.doc_type,
                    file_name: newDoc.file_name,
                    file_url: newDoc.file_url,
                    file_size: newDoc.file_size || undefined,
                    version: newDoc.version,
                    description: newDoc.description || undefined,
                  });
                  if (res?.data) {
                    setAttachments((prev) => prev.map((d) => (d.id === tempId ? res.data : d)));
                  }
                });
              }}
              className="space-y-4"
            >
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUPRA 2026 Platinum Tier Rate Card"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-800 bg-transparent px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Document Type</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as any)}
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-800 bg-transparent px-2.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  >
                    <option value="Brochure" className="bg-zinc-900">Brochure</option>
                    <option value="Proposal Deck" className="bg-zinc-900">Proposal Deck</option>
                    <option value="Rate Card" className="bg-zinc-900">Rate Card</option>
                    <option value="Team Profile" className="bg-zinc-900">Team Profile</option>
                    <option value="Image" className="bg-zinc-900">Image</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Version</label>
                  <input
                    type="text"
                    placeholder="v1.0"
                    value={docVersion}
                    onChange={(e) => setDocVersion(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-800 bg-transparent px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Description</label>
                <textarea
                  rows={2}
                  placeholder="Document contents, target tier, or notes..."
                  value={docDesc}
                  onChange={(e) => setDocDesc(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-800 bg-transparent px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddDocModal(false)}
                  className="rounded-lg border border-zinc-300 dark:border-zinc-800 px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!docTitle.trim()}
                  className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-xs font-bold transition-all"
                >
                  Register Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
