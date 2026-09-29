export interface RecIndicatorProps {
  /** Always-visible capture state — cannot be hidden (trust requirement). */
  state?: 'rec' | 'paused' | 'ephemeral';
  /** Elapsed timecode "00:23:41". */
  time?: string;
  style?: React.CSSProperties;
}
export declare function RecIndicator(props: RecIndicatorProps): JSX.Element;
