"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Save, Eye, Edit2, Play, Info, AlertTriangle, HelpCircle, Code, Plus, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CmsEditorProps {
  type: "article" | "resource" | "prompt";
  initialData?: any;
}

export function CmsEditor({ type, initialData }: CmsEditorProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<"edit" | "preview">("edit");
  const [saving, setSaving] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState("");

  // Common Fields
  const [title, setTitle] = React.useState(initialData?.title || "");
  const [slug, setSlug] = React.useState(initialData?.slug || "");
  const [excerpt, setExcerpt] = React.useState(initialData?.description || initialData?.excerpt || "");
  const [coverImage, setCoverImage] = React.useState(initialData?.coverImage || initialData?.cover || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800");
  const [category, setCategory] = React.useState(initialData?.category || "Excel");
  const [tags, setTags] = React.useState(initialData?.tags?.join(", ") || "");
  const [difficulty, setDifficulty] = React.useState(initialData?.difficulty || "Beginner");
  const [free, setFree] = React.useState(initialData?.free !== false);
  const [price, setPrice] = React.useState(initialData?.price || 0);
  const [content, setContent] = React.useState(initialData?.content || "");

  // Article Specific Fields
  const [readingTime, setReadingTime] = React.useState(initialData?.readingTime || 5);
  const [featured, setFeatured] = React.useState(initialData?.featured || false);
  const [editorPick, setEditorPick] = React.useState(initialData?.editorPick || false);

  // Resource Specific Fields
  const [fileType, setFileType] = React.useState(initialData?.fileType || "XLSX");
  const [fileSize, setFileSize] = React.useState(initialData?.fileSize || "1.2 MB");
  const [version, setVersion] = React.useState(initialData?.version || "1.0.0");
  const [previewImages, setPreviewImages] = React.useState(initialData?.previewImages?.join(", ") || "");

  // Prompt Specific Fields
  const [platform, setPlatform] = React.useState(initialData?.platform || "ChatGPT");
  const [promptTemplate, setPromptTemplate] = React.useState(initialData?.prompt || "");
  const [promptVars, setPromptVars] = React.useState<{ name: string; placeholder: string }[]>(
    initialData?.variables || []
  );

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Auto-generate slug on title change
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!initialData) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
      );
    }
  };

  // Insert markdown helpers at cursor position
  const handleInsertHelper = (markup: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const startIdx = textarea.selectionStart;
    const endIdx = textarea.selectionEnd;
    const text = textarea.value;

    const before = text.substring(0, startIdx);
    const after = text.substring(endIdx, text.length);

    setContent(before + markup + after);

    // Re-focus and set cursor index
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = startIdx + markup.length;
    }, 50);
  };

  // Autosave setup
  React.useEffect(() => {
    const draftKey = `ravi-intel-draft-${type}-${slug || "new"}`;
    const timer = setInterval(() => {
      if (title.trim()) {
        const draftPayload = {
          title,
          slug,
          excerpt,
          coverImage,
          category,
          tags: tags.split(",").map((t: string) => t.trim()),
          difficulty,
          free,
          price,
          content,
          readingTime,
          featured,
          editorPick,
          fileType,
          fileSize,
          version,
          previewImages: previewImages.split(",").map((i: string) => i.trim()),
          platform,
          promptTemplate,
          variables: promptVars,
        };
        localStorage.setItem(draftKey, JSON.stringify(draftPayload));
        setSaveStatus("Draft autosaved in browser.");
        setTimeout(() => setSaveStatus(""), 2000);
      }
    }, 8000);

    return () => clearInterval(timer);
  }, [
    title,
    slug,
    excerpt,
    coverImage,
    category,
    tags,
    difficulty,
    free,
    price,
    content,
    readingTime,
    featured,
    editorPick,
    fileType,
    fileSize,
    version,
    previewImages,
    platform,
    promptTemplate,
    promptVars,
  ]);

  // Prompt variables builder
  const handleAddVar = () => {
    setPromptVars((prev) => [...prev, { name: "", placeholder: "" }]);
  };

  const handleRemoveVar = (idx: number) => {
    setPromptVars((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleVarChange = (idx: number, field: "name" | "placeholder", val: string) => {
    setPromptVars((prev) =>
      prev.map((v, i) => (i === idx ? { ...v, [field]: val } : v))
    );
  };

  // Submit save payload to Next API route
  const handleSave = async () => {
    setSaving(true);
    setSaveStatus("Publishing changes...");

    const frontmatter: Record<string, any> = {
      title,
      slug,
      excerpt,
      cover: coverImage,
      category,
      tags: tags.split(",").map((t: string) => t.trim()).filter(Boolean),
      author: "Ravi Prakash",
      publishedAt: initialData?.publishedAt || new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
      difficulty,
      free,
      price: Number(price),
    };

    if (type === "article") {
      frontmatter.readingTime = Number(readingTime);
      frontmatter.featured = featured;
      frontmatter.editorPick = editorPick;
    } else if (type === "resource") {
      frontmatter.fileType = fileType;
      frontmatter.fileSize = fileSize;
      frontmatter.version = version;
      frontmatter.previewImages = previewImages.split(",").map((i: string) => i.trim()).filter(Boolean);
      frontmatter.downloadsCount = initialData?.downloadsCount || 100;
    } else if (type === "prompt") {
      frontmatter.platform = platform;
      frontmatter.prompt = promptTemplate;
      frontmatter.variables = promptVars.filter((v) => v.name.trim() !== "");
    }

    try {
      const res = await fetch("/api/admin/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, slug, frontmatter, content }),
      });

      if (res.ok) {
        const data = await res.json();
        setSaveStatus(data.message);
        // Clear local storage draft after successful publish
        localStorage.removeItem(`ravi-intel-draft-${type}-${slug || "new"}`);
        setTimeout(() => {
          setSaveStatus("");
          router.push(`/admin/${type}s`);
        }, 1500);
      } else {
        const err = await res.json();
        setSaveStatus(`Error: ${err.error}`);
      }
    } catch (e: any) {
      setSaveStatus(`Network Exception: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Simple regex preview compiler
  const compilePreviewHtml = (raw: string) => {
    let html = raw;
    // Replace callouts
    html = html.replace(/<Info title="([^"]+)">([\s\S]*?)<\/Info>/g, '<div class="p-4 border-l-4 border-blue-500 bg-blue-50/10 rounded-xl my-4"><strong class="text-blue-500">$1</strong><p class="mt-1">$2</p></div>');
    html = html.replace(/<Tip title="([^"]+)">([\s\S]*?)<\/Tip>/g, '<div class="p-4 border-l-4 border-emerald-500 bg-emerald-50/10 rounded-xl my-4"><strong class="text-emerald-500">$1</strong><p class="mt-1">$2</p></div>');
    html = html.replace(/<Warning title="([^"]+)">([\s\S]*?)<\/Warning>/g, '<div class="p-4 border-l-4 border-amber-500 bg-amber-50/10 rounded-xl my-4"><strong class="text-amber-500">$1</strong><p class="mt-1">$2</p></div>');
    // Basic Markdown Headings
    html = html.replace(/^### (.*$)/gim, '<h4 class="text-base font-bold mt-4">$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3 class="text-lg font-black mt-6">$1</h3>');
    html = html.replace(/^# (.*$)/gim, '<h2 class="text-xl font-black mt-8">$1</h2>');
    // Paragraph wraps
    html = html.split("\n\n").map((p) => p.trim() && !p.startsWith("<div") && !p.startsWith("<h") ? `<p class="my-2">${p}</p>` : p).join("\n");
    return html;
  };

  return (
    <div className="space-y-6 select-none bg-zinc-950 p-6 rounded-2xl border border-zinc-800 text-zinc-100">
      
      {/* CMS Edit Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/admin/${type}s`)}
            className="h-8 w-8 rounded-full border border-zinc-800 hover:bg-zinc-900 flex items-center justify-center cursor-pointer transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-lg font-black tracking-wider uppercase">
              {initialData ? `Edit ${type}` : `Create New ${type}`}
            </h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-none">CMS Editor Drawer</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saveStatus && <span className="text-[10px] text-zinc-400 font-bold animate-pulse pr-2">{saveStatus}</span>}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="h-9 font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white cursor-pointer flex items-center gap-1.5 px-4 shadow-lg shadow-blue-500/10"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? "Publishing..." : "Publish Post"}</span>
          </Button>
        </div>
      </header>

      {/* Editor Tabs bar */}
      <div className="flex border-b border-zinc-800">
        <button
          onClick={() => setActiveTab("edit")}
          className={cn(
            "px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all",
            activeTab === "edit" ? "border-blue-500 text-zinc-100" : "border-transparent text-zinc-500 hover:text-zinc-350"
          )}
        >
          <span className="flex items-center gap-1"><Edit2 className="h-3.5 w-3.5" /> Form Content</span>
        </button>
        <button
          onClick={() => setActiveTab("preview")}
          className={cn(
            "px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all",
            activeTab === "preview" ? "border-blue-500 text-zinc-100" : "border-transparent text-zinc-500 hover:text-zinc-350"
          )}
        >
          <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> Compiles Preview</span>
        </button>
      </div>

      {activeTab === "edit" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Metadata Parameters Column */}
          <div className="lg:col-span-4 space-y-5 bg-zinc-900/50 p-5 rounded-xl border border-zinc-800">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400 border-b border-zinc-800 pb-2 mb-3">SEO & Metadata Parameters</h3>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Document Title</label>
              <input
                type="text"
                required
                placeholder="Title text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full h-9 px-3 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Document Slug (url-key)</label>
              <input
                type="text"
                required
                placeholder="slug-path-format"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full h-9 px-3 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Meta Excerpt / Description</label>
              <textarea
                rows={2}
                placeholder="Quick meta summary"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-9 px-3 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none cursor-pointer"
                >
                  <option value="Excel">Excel</option>
                  <option value="SQL">SQL</option>
                  <option value="Power BI">Power BI</option>
                  <option value="Python">Python</option>
                  <option value="AI">AI</option>
                  <option value="Finance">Finance</option>
                  <option value="SEO">SEO</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full h-9 px-3 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none cursor-pointer"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Tags (comma separated)</label>
              <input
                type="text"
                placeholder="tag1, tag2, tag3"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full h-9 px-3 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-zinc-800 pt-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">License type</label>
                <select
                  value={free ? "true" : "false"}
                  onChange={(e) => setFree(e.target.value === "true")}
                  className="w-full h-9 px-3 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none cursor-pointer"
                >
                  <option value="true">Free Access</option>
                  <option value="false">Paid Premium</option>
                </select>
              </div>

              {!free && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Asset Price ($)</label>
                  <input
                    type="number"
                    placeholder="29.00"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full h-9 px-3 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Type Specific forms */}
            {type === "article" && (
              <div className="space-y-4 border-t border-zinc-800 pt-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Reading Time (mins)</label>
                  <input
                    type="number"
                    value={readingTime}
                    onChange={(e) => setReadingTime(Number(e.target.value))}
                    className="w-full h-9 px-3 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200"
                  />
                </div>
                <div className="flex items-center gap-4 select-none pt-1">
                  <label className="flex items-center gap-1.5 text-xs text-zinc-400 font-bold uppercase cursor-pointer">
                    <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
                    <span>Featured Hero</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-zinc-400 font-bold uppercase cursor-pointer">
                    <input type="checkbox" checked={editorPick} onChange={(e) => setEditorPick(e.target.checked)} />
                    <span>Editor Pick</span>
                  </label>
                </div>
              </div>
            )}

            {type === "resource" && (
              <div className="space-y-4 border-t border-zinc-800 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">File Format</label>
                    <input
                      type="text"
                      placeholder="XLSX, PBIX"
                      value={fileType}
                      onChange={(e) => setFileType(e.target.value)}
                      className="w-full h-9 px-3 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">File Size</label>
                    <input
                      type="text"
                      placeholder="e.g. 2.4 MB"
                      value={fileSize}
                      onChange={(e) => setFileSize(e.target.value)}
                      className="w-full h-9 px-3 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Release Version</label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="w-full h-9 px-3 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200"
                  />
                </div>
              </div>
            )}

            {type === "prompt" && (
              <div className="space-y-4 border-t border-zinc-800 pt-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">AI Engine platform</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full h-9 px-3 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none cursor-pointer"
                  >
                    <option value="ChatGPT">ChatGPT</option>
                    <option value="Claude">Claude</option>
                    <option value="Gemini">Gemini</option>
                    <option value="Midjourney">Midjourney</option>
                    <option value="Copilot">GitHub Copilot</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Code Editor Column */}
          <div className="lg:col-span-8 space-y-5">
            {type === "prompt" && (
              <Card className="p-5 bg-zinc-900/40 border border-zinc-800 space-y-4 select-none">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400">Prompt Variables Builder</h4>
                  <Button
                    onClick={handleAddVar}
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px] font-bold bg-zinc-950 border-zinc-800 text-blue-400 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" /> Add Variable
                  </Button>
                </div>

                {promptVars.length === 0 ? (
                  <p className="text-[10px] text-zinc-500 text-center py-4 font-bold uppercase">No variables added yet.</p>
                ) : (
                  <div className="space-y-3">
                    {promptVars.map((v, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <input
                          type="text"
                          placeholder="variableName"
                          value={v.name}
                          onChange={(e) => handleVarChange(idx, "name", e.target.value)}
                          className="flex-1 h-9 px-3 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200"
                        />
                        <input
                          type="text"
                          placeholder="Placeholder description"
                          value={v.placeholder}
                          onChange={(e) => handleVarChange(idx, "placeholder", e.target.value)}
                          className="flex-2 h-9 px-3 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200"
                        />
                        <button
                          onClick={() => handleRemoveVar(idx)}
                          className="h-9 w-9 rounded-lg border border-zinc-800 hover:bg-zinc-900 flex items-center justify-center cursor-pointer text-red-400 shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-1.5 border-t border-zinc-800 pt-4">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Base Prompt String (include [variableName] tags)</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="You are an expert... build [componentName]"
                    value={promptTemplate}
                    onChange={(e) => setPromptTemplate(e.target.value)}
                    className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </Card>
            )}

            {/* Markdown Body Text Editor */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400">MDX Description Content</h4>
                
                {/* Formatting bar shortcuts */}
                <div className="flex items-center gap-1.5 select-none">
                  <button
                    onClick={() => handleInsertHelper('<Info title="Info title">\n  text\n</Info>\n')}
                    className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-[10px] font-bold text-blue-400 cursor-pointer flex items-center gap-1"
                  >
                    <Info className="h-3 w-3" /> Info
                  </button>
                  <button
                    onClick={() => handleInsertHelper('<Warning title="Warning title">\n  text\n</Warning>\n')}
                    className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-[10px] font-bold text-amber-450 cursor-pointer flex items-center gap-1"
                  >
                    <AlertTriangle className="h-3 w-3" /> Warning
                  </button>
                  <button
                    onClick={() => handleInsertHelper('```sql filename="query.sql"\nSELECT * FROM table;\n```\n')}
                    className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-[10px] font-bold text-zinc-400 cursor-pointer flex items-center gap-1"
                  >
                    <Code className="h-3 w-3" /> Code
                  </button>
                </div>
              </div>

              <textarea
                ref={textareaRef}
                rows={16}
                required
                placeholder="Compose detailed guides in MDX format..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-4 bg-zinc-950 border border-zinc-850 rounded-xl text-xs sm:text-sm font-mono leading-relaxed text-zinc-350 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

        </div>
      ) : (
        /* Compiled View Preview panel */
        <Card className="p-6 bg-zinc-900/20 border border-zinc-800 max-w-3xl mx-auto space-y-6">
          <div className="border-b border-zinc-800 pb-3 select-none flex justify-between items-center">
            <h3 className="font-extrabold text-sm uppercase tracking-widest text-zinc-450">Staged Preview</h3>
            <span className="text-[9px] font-bold text-zinc-500 border border-zinc-800 px-2 py-0.5 rounded">Markdown sandbox preview</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-2xl sm:text-3.5xl font-black text-zinc-100 tracking-tight leading-tight select-text">
              {title || "Untitled Post Title"}
            </h1>
            
            {excerpt && (
              <p className="text-sm sm:text-base text-zinc-450 leading-relaxed font-semibold italic border-l-2 border-zinc-750 pl-3">
                {excerpt}
              </p>
            )}

            <div className="prose prose-invert max-w-none text-zinc-350 select-text leading-relaxed text-sm sm:text-base space-y-4 pt-4 border-t border-zinc-850">
              <div dangerouslySetInnerHTML={{ __html: compilePreviewHtml(content) }} />
            </div>
          </div>
        </Card>
      )}

    </div>
  );
}
