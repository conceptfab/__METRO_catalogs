import type { ReactNode } from 'react';

const QX_TOKEN_REGEX = /\bQX\b/gi;
const LINEBREAK_REGEX = /\\n|\/n|\n/g;

function renderLine(line: string, lineIndex: number): ReactNode[] {
  const matches = line.match(QX_TOKEN_REGEX);
  const parts = line.split(QX_TOKEN_REGEX);

  return parts.flatMap((part, index) => [
    part,
    matches && index < matches.length ? (
      <span key={`qx-${lineIndex}-${index}`} className="qx-word">
        {matches[index].toUpperCase()}
      </span>
    ) : null,
  ]);
}

interface QxTextProps {
  text: string;
}

export function QxText({ text }: QxTextProps): ReactNode {
  const lines = text.split(LINEBREAK_REGEX);

  return lines.flatMap((line, lineIndex) => {
    const lineNodes = renderLine(line, lineIndex);
    return lineIndex < lines.length - 1
      ? [...lineNodes, <br key={`br-${lineIndex}`} />]
      : lineNodes;
  });
}
