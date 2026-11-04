// ==========================================================================
// 🚀 PHASE 1: Tiptap CodeBlock Node Setup
// ==========================================================================
"use client";

import { FormEvent, useState, useRef, ChangeEvent, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import CodeBlock from "@tiptap/extension-code-block";
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Quote, Code, Image as ImageIcon, Save, Layers, Sparkles, FileText, CheckCircle2 } from "lucide-react";

interface PostData {
  id: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  body: string;
  content_type: "review" | "article";
  category: string;
  status: "draft" | "published";
  slug: string | null;
}

function createSlug(title: string) {
  return `${title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${crypto.randomUUID().slice(0, 8)}`;
}

export default function WritePostForm({ authorId, initialPost }: { authorId: string; initialPost?: PostData }) {
  const router = useRouter();
  const supabase = createClient();
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const savedPostIdRef = useRef(initialPost?.id ?? null);
  const savedSlugRef = useRef(initialPost?.slug ?? null);
  const savedTitleRef = useRef(initialPost?.title.trim() ?? "");
  const saveInFlightRef = useRef(false);
  const draftRevisionRef = useRef(0);
  
  const [title, setTitle] = useState(initialPost?.title || "");
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt || "");
  const [coverImageUrl, setCoverImageUrl] = useState(initialPost?.cover_image_url || "");
  const [articleCategory, setArticleCategory] = useState(initialPost?.category || "saas");
  const [contentType, setContentType] = useState<"review" | "article">(initialPost?.content_type || "article");
  const [status, setStatus] = useState<"draft" | "published">(initialPost?.status || "draft");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: {},
        orderedList: {},
        blockquote: {},
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "Write your technical masterpiece..." }),
      Image.configure({ HTMLAttributes: { class: "rounded-xl border border-text-muted/15 my-6 max-w-full mx-auto block shadow-md" } }),
      CodeBlock.configure({ HTMLAttributes: { class: "rounded-xl border border-text-muted/20 bg-background p-4 font-mono text-sm text-emerald-400 overflow-x-auto my-6 block relative select-text whitespace-pre" } }),
    ],
    content: initialPost?.body || "",
    immediatelyRender: false,
    onUpdate: () => {
      draftRevisionRef.current += 1;
      setIsDirty(true);
      setSaveStatus("");
    }
  });

  const buildPostPayload = useCallback((nextStatus: "draft" | "published") => {
    if (!editor) throw new Error("Editor not ready.");
    const currentTitle = title.trim();
    const activeSlug = currentTitle !== savedTitleRef.current ? createSlug(currentTitle) : savedSlugRef.current;
    
    return {
      author_id: authorId,
      title: currentTitle,
      slug: activeSlug ?? createSlug(currentTitle),
      excerpt: excerpt.trim() || null,
      cover_image_url: coverImageUrl || null,
      body: editor.getHTML(),
      content_type: contentType,
      category: articleCategory,
      status: nextStatus,
      published_at: nextStatus === "published" ? new Date().toISOString() : null,
    };
  }, [authorId, contentType, coverImageUrl, editor, excerpt, articleCategory, title]);
  const handleCoverUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editor) return;

    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setMessage("Invalid format. Please use JPEG, PNG, WebP, or GIF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage("File size limit exceeded. Headline images must be under 5 MB.");
      return;
    }

    setIsSaving(true);
    const fileExtension = file.type.split("/")[1].replace("jpeg", "jpg");
    const filePath = `${authorId}/${crypto.randomUUID()}.${fileExtension}`;
    
    try {
      const { error } = await supabase.storage.from("post-images").upload(filePath, file, { cacheControl: "31536000" });
      if (error) throw error;

      const { data } = supabase.storage.from("post-images").getPublicUrl(filePath);
      setCoverImageUrl(data.publicUrl);
      setIsDirty(true);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Storage bucket dispatch error.");
    } finally {
      setIsSaving(false);
    }
  };

  const executeSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editor || isSaving || saveInFlightRef.current) return;

    saveInFlightRef.current = true;
    setIsSaving(true);
    setMessage("");

    try {
      const payload = buildPostPayload(status);
      const result = savedPostIdRef.current
        ? await supabase.from("posts").update(payload).eq("id", savedPostIdRef.current).select("id, slug").single()
        : await supabase.from("posts").insert(payload).select("id, slug").single();

      if (result.error) {
        setMessage(result.error.message);
        return;
      }

      savedPostIdRef.current = result.data.id;
      savedSlugRef.current = result.data.slug;
      savedTitleRef.current = payload.title;
      setSavedAt(new Date());
      setIsDirty(false);
      
      router.refresh();
      router.push("/profile");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Persistence pipeline connection error.");
    } finally {
      saveInFlightRef.current = false;
      setIsSaving(false);
    }
  };
  const executeAutosave = useCallback(async () => {
    if (!editor || !title.trim() || status !== "draft" || saveInFlightRef.current) return;

    saveInFlightRef.current = true;
    setSaveStatus("Autosaving draft framework...");

    try {
      const payload = buildPostPayload("draft");
      const result = savedPostIdRef.current
        ? await supabase.from("posts").update(payload).eq("id", savedPostIdRef.current).select("id, slug").single()
        : await supabase.from("posts").insert(payload).select("id, slug").single();

      if (!result.error) {
        savedPostIdRef.current = result.data.id;
        savedSlugRef.current = result.data.slug;
        savedTitleRef.current = payload.title;
        setSavedAt(new Date());
        setIsDirty(false);
        setSaveStatus("All platform changes saved.");
      }
    } catch {
      setSaveStatus("Autosave pipeline offline.");
    } finally {
      saveInFlightRef.current = false;
    }
  }, [editor, title, status, buildPostPayload, supabase]);

  useEffect(() => {
    if (!isDirty || status !== "draft" || !title.trim()) return;
    const saveTimer = setTimeout(() => void executeAutosave(), 2000);
    return () => clearTimeout(saveTimer);
  }, [isDirty, status, title, executeAutosave]);

  return (
    <form onSubmit={executeSubmit} className="mt-8 space-y-6 text-left">
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label htmlFor="post-title" className="text-xs font-bold uppercase tracking-wider text-text-muted">Article Headline</label>
          <input id="post-title" required value={title} onChange={(e) => { setTitle(e.target.value); setIsDirty(true); }} placeholder="Enter a title for your article" className="mt-2 w-full rounded-xl border border-text-muted/20 bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent" />
        </div>
        <div>
          <label htmlFor="article-category" className="text-xs font-bold uppercase tracking-wider text-text-muted">Category</label>
          <select id="article-category" value={articleCategory} onChange={(e) => { setArticleCategory(e.target.value); setIsDirty(true); }} className="mt-2 w-full rounded-xl border border-text-muted/20 bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent">
            <option value="saas">SaaS & Architecture</option>
            <option value="ai">AI & Automation</option>
            <option value="devops">DevOps & Infosec</option>
            <option value="design">Design Systems</option>
            <option value="general">General / Other</option>
          </select>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label htmlFor="post-excerpt" className="text-xs font-bold uppercase tracking-wider text-text-muted">Brief Summary</label>
          <textarea id="post-excerpt" value={excerpt} onChange={(e) => { setExcerpt(e.target.value); setIsDirty(true); }} placeholder="A crisp overview for search indexing..." rows={2} className="mt-2 w-full resize-none rounded-xl border border-text-muted/20 bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent" />
        </div>
        <div>
          <label htmlFor="content-type" className="text-xs font-bold uppercase tracking-wider text-text-muted">Content Module Type</label>
          <select id="content-type" value={contentType} onChange={(e) => { setContentType(e.target.value as "review" | "article"); setIsDirty(true); }} className="mt-2 w-full rounded-xl border border-text-muted/20 bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent">
            <option value="article">Technical Article</option>
            <option value="review">System Architecture Review</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Headline Cover Image</label>
        <div className="mt-2 flex items-center gap-4">
          <button type="button" onClick={() => coverImageInputRef.current?.click()} className="rounded-xl border border-text-muted/25 bg-background px-4 py-2.5 text-xs font-bold transition-all hover:border-accent hover:text-accent">Choose Asset</button>
          <input ref={coverImageInputRef} type="file" accept="image/*" onChange={handleCoverUpload} className="sr-only" />
          {coverImageUrl && <span className="text-xs text-emerald-400">Asset linked successfully</span>}
        </div>
      </div>

      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Editorial Body</label>
        {editor && (
          <div className="mt-2 overflow-hidden rounded-xl border border-text-muted/20 bg-background">
            <div className="flex flex-wrap items-center gap-1 bg-surface p-2 border-b border-text-muted/10 text-text-muted">
              <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`p-1.5 rounded transition-colors ${editor.isActive("bold") ? "bg-accent text-slate-950" : "hover:bg-background"}`}><Bold size={16} /></button>
              <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-1.5 rounded transition-colors ${editor.isActive("italic") ? "bg-accent text-slate-950" : "hover:bg-background"}`}><Italic size={16} /></button>
              <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`p-1.5 rounded transition-colors ${editor.isActive("underline") ? "bg-accent text-slate-950" : "hover:bg-background"}`}><UnderlineIcon size={16} /></button>
              <div className="h-4 w-px bg-text-muted/20 mx-1" />
              <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-1.5 rounded transition-colors ${editor.isActive("bulletList") ? "bg-accent text-slate-950" : "hover:bg-background"}`}><List size={16} /></button>
              <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-1.5 rounded transition-colors ${editor.isActive("orderedList") ? "bg-accent text-slate-950" : "hover:bg-background"}`}><ListOrdered size={16} /></button>
              <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`p-1.5 rounded transition-colors ${editor.isActive("blockquote") ? "bg-accent text-slate-950" : "hover:bg-background"}`}><Quote size={16} /></button>
              <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={`p-1.5 rounded transition-colors ml-auto ${editor.isActive("codeBlock") ? "bg-accent text-slate-950" : "hover:bg-background text-emerald-400"}`}><Code size={16} /></button>
            </div>
            <EditorContent editor={editor} className="prose prose-invert max-w-none min-h-[300px] p-4 text-foreground outline-none focus:outline-none" />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-text-muted/15 bg-background/50 p-4">
        <div className="flex items-center gap-3">
          <label htmlFor="post-status" className="text-xs font-bold uppercase tracking-wider text-text-muted">Deployment Status</label>
          <select id="post-status" value={status} onChange={(e) => { setStatus(e.target.value as "draft" | "published"); setIsDirty(true); }} className="rounded-lg border border-text-muted/20 bg-surface px-3 py-1.5 text-xs text-foreground outline-none">
            <option value="draft">Private Draft</option>
            <option value="published">Live Article</option>
          </select>
        </div>
        {saveStatus && <span className="text-xs font-semibold text-accent flex items-center gap-1.5"><Layers size={12} className="animate-spin" /> {saveStatus}</span>}
        {!saveStatus && savedAt && <span className="text-xs text-text-muted flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-400" /> Synced at {savedAt.toLocaleTimeString()}</span>}
      </div>

      {message && <p className="text-xs font-semibold text-rose-500 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">{message}</p>}
      
      <button type="submit" disabled={isSaving} className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-slate-950 transition-all hover:bg-yellow-300 disabled:opacity-50 cursor-pointer shadow-md shadow-accent/10">
        <Save size={16} />
        {status === "published" ? "Publish Live Deployment" : "Save Changes"}
      </button>
    </form>
  );
}
