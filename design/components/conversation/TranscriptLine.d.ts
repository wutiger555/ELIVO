export interface TranscriptLineProps {
  /** Speaker label: 「我」, 「對方」, 「說話者 A」 (no voiceprint names). */
  speaker: string;
  /** True for the device owner (Signal-coloured label). */
  self?: boolean;
  time?: string;
  text: string;
  /** Streaming partial: dimmed with blinking caret. */
  partial?: boolean;
  /** Substring to mark as the trigger for a surfaced card. */
  highlight?: string;
  /** Show "↗ LINKED" marker. */
  linked?: boolean;
  style?: React.CSSProperties;
}
export declare function TranscriptLine(props: TranscriptLineProps): JSX.Element;
