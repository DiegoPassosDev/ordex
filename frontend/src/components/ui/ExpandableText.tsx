"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export function ExpandableText({ text, maxLen = 40 }: { text: string; maxLen?: number }) {
  const [expanded, setExpanded] = useState(false);

  if (text.length <= maxLen) {
    return <>{text}</>;
  }

  return (
    <span>
      <span>{expanded ? text : text.slice(0, maxLen).trimEnd() + "…"}</span>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="inline-flex items-center gap-0.5 ml-1 text-orange-400 hover:text-orange-300 text-xs font-medium"
      >
        {expanded ? (
          <>menos <ChevronUp className="w-3 h-3" /></>
        ) : (
          <>mais <ChevronDown className="w-3 h-3" /></>
        )}
      </button>
    </span>
  );
}
