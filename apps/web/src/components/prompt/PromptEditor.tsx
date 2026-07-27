import { useState, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import {
  Save,
  Copy,
  Star,
  Archive,
  Share2,
  Sparkles,
  History,
  Tag,
  Variable,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type PromptData = {
  id?: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  variables: { name: string; defaultValue: string }[];
  isFavorite: boolean;
};

interface PromptEditorProps {
  initial?: Partial<PromptData>;
  onSave?: (data: PromptData) => void;
  onTest?: (content: string) => void;
  onOptimize?: (content: string) => void;
}

const CATEGORIES = [
  "System",
  "Coding",
  "Writing",
  "Marketing",
  "Analysis",
  "RAG",
  "Agents",
  "Other",
];

export function PromptEditor({ initial, onSave, onTest, onOptimize }: PromptEditorProps) {
  const [title, setTitle] = useState(initial?.title ?? "Untitled Prompt");
  const [content, setContent] = useState(initial?.content ?? "");
  const [category, setCategory] = useState(initial?.category ?? "Other");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [variables, setVariables] = useState(initial?.variables ?? []);
  const [isFavorite, setIsFavorite] = useState(initial?.isFavorite ?? false);
  const [showVars, setShowVars] = useState(false);

  const handleSave = useCallback(() => {
    onSave?.({
      title,
      content,
      category,
      tags,
      variables,
      isFavorite,
    });
  }, [title, content, category, tags, variables, isFavorite, onSave]);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagInput("");
    }
  };

  const addVariable = () => {
    setVariables([...variables, { name: `var_${variables.length + 1}`, defaultValue: "" }]);
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 min-w-[200px] rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium outline-none focus:border-primary/50"
          placeholder="Prompt title"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c} className="bg-[#0c0c0e]">
              {c}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          variant={isFavorite ? "default" : "outline"}
          onClick={() => setIsFavorite(!isFavorite)}
        >
          <Star className={cn("h-4 w-4", isFavorite && "fill-current")} />
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowVars(!showVars)}>
          <Variable className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={() => onOptimize?.(content)}>
          <Sparkles className="h-4 w-4" />
          Optimize
        </Button>
        <Button size="sm" variant="outline" onClick={() => onTest?.(content)}>
          <Play className="h-4 w-4" />
          Test
        </Button>
        <Button size="sm" variant="gradient" onClick={handleSave}>
          <Save className="h-4 w-4" />
          Save
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Tag className="h-4 w-4 text-muted-foreground" />
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs text-primary"
          >
            {t}
            <button
              onClick={() => setTags(tags.filter((x) => x !== t))}
              className="hover:text-white"
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
          placeholder="Add tag..."
          className="w-24 rounded bg-transparent text-xs outline-none placeholder:text-muted-foreground"
        />
      </div>

      {showVars && (
        <div className="glass-card space-y-2 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Variables</p>
            <Button size="sm" variant="ghost" onClick={addVariable}>
              + Add
            </Button>
          </div>
          {variables.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Use {"{{variable_name}}"} in your prompt. Add variables here.
            </p>
          )}
          {variables.map((v, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={v.name}
                onChange={(e) => {
                  const next = [...variables];
                  next[i] = { ...v, name: e.target.value };
                  setVariables(next);
                }}
                placeholder="name"
                className="flex-1 rounded border border-white/10 bg-white/5 px-2 py-1.5 text-xs outline-none"
              />
              <input
                value={v.defaultValue}
                onChange={(e) => {
                  const next = [...variables];
                  next[i] = { ...v, defaultValue: e.target.value };
                  setVariables(next);
                }}
                placeholder="default value"
                className="flex-1 rounded border border-white/10 bg-white/5 px-2 py-1.5 text-xs outline-none"
              />
              <button
                onClick={() => setVariables(variables.filter((_, j) => j !== i))}
                className="text-xs text-muted-foreground hover:text-red-400"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="min-h-[400px] flex-1 overflow-hidden rounded-xl border border-white/10">
        <Editor
          height="100%"
          defaultLanguage="markdown"
          theme="vs-dark"
          value={content}
          onChange={(v) => setContent(v ?? "")}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineHeight: 22,
            padding: { top: 16, bottom: 16 },
            wordWrap: "on",
            scrollBeyondLastLine: false,
            renderLineHighlight: "gutter",
            fontFamily: "JetBrains Mono, Menlo, monospace",
          }}
        />
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <History className="h-3.5 w-3.5" />
        <span>Version history available after first save</span>
        <div className="flex-1" />
        <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(content)}>
          <Copy className="h-3.5 w-3.5" />
          Copy
        </Button>
        <Button size="sm" variant="ghost">
          <Share2 className="h-3.5 w-3.5" />
          Share
        </Button>
        <Button size="sm" variant="ghost">
          <Archive className="h-3.5 w-3.5" />
          Archive
        </Button>
      </div>
    </div>
  );
}
