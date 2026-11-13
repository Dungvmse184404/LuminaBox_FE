import type { ReactNode } from "react";

const BULLET = /^\s*[-*•]\s+/;
const NUMBERED = /^\s*\d+[.)]\s+/;

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? <strong key={index}>{part.slice(2, -2)}</strong> : part,
  );
}

export function ChatText({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let items: string[] = [];

  const flush = () => {
    if (items.length === 0) return;
    blocks.push(
      <ul key={`list-${blocks.length}`} className="my-1 list-disc space-y-0.5 pl-5">
        {items.map((item, index) => (
          <li key={index}>{inline(item)}</li>
        ))}
      </ul>,
    );
    items = [];
  };

  for (const line of text.split("\n")) {
    if (BULLET.test(line) || NUMBERED.test(line)) {
      items.push(line.replace(BULLET, "").replace(NUMBERED, ""));
      continue;
    }
    flush();
    if (line.trim()) blocks.push(<p key={`p-${blocks.length}`}>{inline(line)}</p>);
  }
  flush();

  return <div className="space-y-1 break-words">{blocks}</div>;
}
