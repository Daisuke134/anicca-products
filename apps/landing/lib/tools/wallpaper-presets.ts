export type AffirmationTheme =
  | 'nightAnxiety'
  | 'selfWorth'
  | 'overthinking'
  | 'burnout'
  | 'kindness'
  | 'newDay'
  | 'lettingGo'
  | 'sleep';

export type AffirmationPreset = {
  id: string;
  theme: AffirmationTheme;
  themeLabel: string;
  text: string;
};

export const AFFIRMATION_THEMES: { id: AffirmationTheme; label: string }[] = [
  { id: 'nightAnxiety', label: '寝る前の不安' },
  { id: 'selfWorth', label: '自己肯定感' },
  { id: 'overthinking', label: '考えすぎ' },
  { id: 'burnout', label: '燃え尽き' },
  { id: 'kindness', label: '自分にやさしく' },
  { id: 'newDay', label: '新しい一日' },
  { id: 'lettingGo', label: '手放す' },
  { id: 'sleep', label: '眠り' },
];

export const AFFIRMATION_PRESETS: AffirmationPreset[] = [
  { id: 'na1', theme: 'nightAnxiety', themeLabel: '寝る前の不安', text: '今日はここまでで十分' },
  { id: 'na2', theme: 'nightAnxiety', themeLabel: '寝る前の不安', text: 'この気持ちも、いつか過ぎていく' },
  { id: 'na3', theme: 'nightAnxiety', themeLabel: '寝る前の不安', text: 'いまは休む番だよ' },
  { id: 'sw1', theme: 'selfWorth', themeLabel: '自己肯定感', text: 'わたしは、わたしの味方でいる' },
  { id: 'sw2', theme: 'selfWorth', themeLabel: '自己肯定感', text: '不完全でも、ここにいていい' },
  { id: 'sw3', theme: 'selfWorth', themeLabel: '自己肯定感', text: 'わたしのペースで進んでいい' },
  { id: 'ot1', theme: 'overthinking', themeLabel: '考えすぎ', text: '答えは、いま出さなくていい' },
  { id: 'ot2', theme: 'overthinking', themeLabel: '考えすぎ', text: '思考は雲。空はわたし' },
  { id: 'ot3', theme: 'overthinking', themeLabel: '考えすぎ', text: 'いま感じていることだけでいい' },
  { id: 'bo1', theme: 'burnout', themeLabel: '燃え尽き', text: '休むことも前に進むこと' },
  { id: 'bo2', theme: 'burnout', themeLabel: '燃え尽き', text: 'がんばりすぎなくていい' },
  { id: 'bo3', theme: 'burnout', themeLabel: '燃え尽き', text: 'エネルギーは、あとから戻る' },
  { id: 'ki1', theme: 'kindness', themeLabel: '自分にやさしく', text: '自分にやさしくしていい' },
  { id: 'ki2', theme: 'kindness', themeLabel: '自分にやさしく', text: '小さな一歩も、ほんとうの一歩' },
  { id: 'ki3', theme: 'kindness', themeLabel: '自分にやさしく', text: '今日のわたしを責めない' },
  { id: 'nd1', theme: 'newDay', themeLabel: '新しい一日', text: '新しい朝が、また来る' },
  { id: 'nd2', theme: 'newDay', themeLabel: '新しい一日', text: 'ひとつできれば、それでいい' },
  { id: 'nd3', theme: 'newDay', themeLabel: '新しい一日', text: '今日は今日だけを生きる' },
  { id: 'lg1', theme: 'lettingGo', themeLabel: '手放す', text: '握らなくていいものがある' },
  { id: 'lg2', theme: 'lettingGo', themeLabel: '手放す', text: '流れに任せても大丈夫' },
  { id: 'lg3', theme: 'lettingGo', themeLabel: '手放す', text: '終わらなくていい物語もある' },
  { id: 'sl1', theme: 'sleep', themeLabel: '眠り', text: '目を閉じるだけでいい' },
  { id: 'sl2', theme: 'sleep', themeLabel: '眠り', text: '体はもう、休みたがっている' },
  { id: 'sl3', theme: 'sleep', themeLabel: '眠り', text: '朝まで、何もしなくていい' },
];

export type TextColor = 'white' | 'navy';

export type BgPreset = {
  id: string;
  label: string;
  /** CSS for preview thumb / phone preview */
  css: string;
  /** Canvas fill: linear | radial | solid */
  kind: 'linear' | 'radial' | 'solid';
  colors: string[];
  angleDeg?: number;
  textColor: TextColor;
};

export const BG_PRESETS: BgPreset[] = [
  {
    id: 'dusk',
    label: '黄昏',
    kind: 'linear',
    colors: ['#2b1f3a', '#6b4c6e', '#c9a07a'],
    angleDeg: 160,
    css: 'linear-gradient(160deg, #2b1f3a, #6b4c6e, #c9a07a)',
    textColor: 'white',
  },
  {
    id: 'mist',
    label: '霧',
    kind: 'linear',
    colors: ['#dfe6ea', '#b8c5ce', '#8a9aa8'],
    angleDeg: 180,
    css: 'linear-gradient(180deg, #dfe6ea, #b8c5ce, #8a9aa8)',
    textColor: 'navy',
  },
  {
    id: 'ocean',
    label: '海',
    kind: 'linear',
    colors: ['#0b1c2c', '#1a4a6b', '#3d7ea6'],
    angleDeg: 200,
    css: 'linear-gradient(200deg, #0b1c2c, #1a4a6b, #3d7ea6)',
    textColor: 'white',
  },
  {
    id: 'sakura',
    label: '桜',
    kind: 'radial',
    colors: ['#fff5f7', '#f3c6d0', '#d49aa8'],
    css: 'radial-gradient(circle at 50% 30%, #fff5f7, #f3c6d0 55%, #d49aa8)',
    textColor: 'navy',
  },
  {
    id: 'forest',
    label: '森',
    kind: 'linear',
    colors: ['#12201a', '#2a4a38', '#5a7a5c'],
    angleDeg: 145,
    css: 'linear-gradient(145deg, #12201a, #2a4a38, #5a7a5c)',
    textColor: 'white',
  },
  {
    id: 'gold',
    label: '金',
    kind: 'linear',
    colors: ['#3a2e1a', '#8a6b2f', '#d4b46a'],
    angleDeg: 135,
    css: 'linear-gradient(135deg, #3a2e1a, #8a6b2f, #d4b46a)',
    textColor: 'white',
  },
  {
    id: 'ink',
    label: '墨',
    kind: 'radial',
    colors: ['#1a1a1c', '#2c2c30', '#4a4a50'],
    css: 'radial-gradient(circle at 40% 40%, #4a4a50, #2c2c30 50%, #1a1a1c)',
    textColor: 'white',
  },
  {
    id: 'sky',
    label: '空',
    kind: 'linear',
    colors: ['#9ec5e8', '#c9dff2', '#eef5fb'],
    angleDeg: 180,
    css: 'linear-gradient(180deg, #9ec5e8, #c9dff2, #eef5fb)',
    textColor: 'navy',
  },
  {
    id: 'solid-cream',
    label: '単色・白',
    kind: 'solid',
    colors: ['#f3efe6'],
    css: '#f3efe6',
    textColor: 'navy',
  },
  {
    id: 'solid-navy',
    label: '単色・紺',
    kind: 'solid',
    colors: ['#1a2233'],
    css: '#1a2233',
    textColor: 'white',
  },
];

export const TEXT_COLORS: Record<TextColor, string> = {
  white: '#f7f7f5',
  navy: '#1a2233',
};

/** Characters that must not start a line (kinsoku). */
const KINSOKU_START = new Set('、。．，）)」』】》〉!?！？:;：；'.split(''));

/**
 * Wrap Japanese text for wallpaper: ~12 fullwidth chars/line, max 4 lines, kinsoku.
 */
export function wrapAffirmationText(text: string, maxChars = 12, maxLines = 4): string[] {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];
  const chars = [...cleaned];
  const lines: string[] = [];
  let buf = '';

  const flush = () => {
    if (buf) {
      lines.push(buf);
      buf = '';
    }
  };

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (buf.length >= maxChars) {
      // If next char is kinsoku-start, keep it on this line when possible
      if (KINSOKU_START.has(ch) && buf.length < maxChars + 2) {
        buf += ch;
        continue;
      }
      flush();
      if (lines.length >= maxLines) break;
      // Don't start a new line with kinsoku — pull last char down if needed
      if (KINSOKU_START.has(ch) && lines.length > 0) {
        const prev = lines[lines.length - 1];
        if (prev.length > 1) {
          lines[lines.length - 1] = prev.slice(0, -1);
          buf = prev.slice(-1) + ch;
          continue;
        }
      }
    }
    if (lines.length >= maxLines) break;
    buf += ch;
  }
  if (lines.length < maxLines) flush();

  // If overflow remains, append ellipsis on last line
  if (chars.join('').length > lines.join('').length) {
    const last = lines[lines.length - 1] ?? '';
    lines[lines.length - 1] = last.slice(0, Math.max(0, maxChars - 1)) + '…';
  }
  return lines.slice(0, maxLines);
}
