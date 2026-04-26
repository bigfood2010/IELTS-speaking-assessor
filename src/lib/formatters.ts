import { VIETNAMESE_REGEX } from './constants';

function normalizeSentenceSpacing(text: string): string {
  return text
    .replace(/([.!?])(?=\p{L})/gu, '$1 ')
    .replace(/\s+([.!?])/g, '$1')
    .replace(/[ \t]{2,}/g, ' ');
}

export function formatProceduralText(text: string) {
  if (!text) return text;

  let cleaned = text.replace(/\(?https?:\/\/[^\s\)]+\)?/gi, '');
  cleaned = cleaned.replace(/[✦➤▪•◈▷➢]/g, '').replace(/\s*=\s*/g, '\n');
  cleaned = cleaned.replace(/\b(Source|Resource|Nguồn|Nguồn tham khảo):\s*[^/\n\(\)]*/gi, '');
  cleaned = cleaned.replace(/\(\s*\)/g, '');
  cleaned = cleaned.replace(/^\s*\/\s*/gm, '');

  cleaned = normalizeSentenceSpacing(cleaned);

  const strings = cleaned.split(/[\n/]/).map(s => s.trim()).filter(Boolean);
  let finalLines: string[] = [];

  strings.forEach(str => {
    const sentences = str.split(/([.!?])\s*/).filter(Boolean);
    let currentLine = "";
    
    for (let i = 0; i < sentences.length; i++) {
        const part = sentences[i];
        if (part === '.' || part === '!' || part === '?') {
            currentLine += part;
            continue;
        }
        
        const isPartVN = VIETNAMESE_REGEX.test(part);
        const isCurrentVN = currentLine ? VIETNAMESE_REGEX.test(currentLine) : isPartVN;
        
        if (currentLine && isPartVN !== isCurrentVN) {
            finalLines.push(currentLine.trim());
            currentLine = part;
        } else {
            currentLine += (currentLine ? ' ' : '') + part;
        }
    }
    if (currentLine) finalLines.push(currentLine.trim());
  });

  return finalLines.join('\n').replace(/\n{3,}/g, '\n\n');
}

export function extractSource(text: string): string | null {
  const match = text.match(/\b(Source|Resource):\s*([^/\n\.\(]+)/i);
  if (!match) return null;
  
  let source = match[2].trim();
  source = source.split(/\s(for|to|on|about)\s/i)[0];
  
  return source.trim() || null;
}
