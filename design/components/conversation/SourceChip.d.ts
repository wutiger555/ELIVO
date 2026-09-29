export interface SourceChipProps {
  /** Source name: meeting, document or utterance. */
  label: React.ReactNode;
  /** Timecode like "00:31:05" (mono). */
  time?: string;
  icon?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}
export declare function SourceChip(props: SourceChipProps): JSX.Element;
