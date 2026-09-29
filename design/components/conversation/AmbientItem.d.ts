export interface AmbientItemProps {
  /** doc · number · question · decision · action · person, or any Lucide name. */
  kind?: string;
  label: React.ReactNode;
  /** Right-aligned mono meta (date, timecode, value). */
  meta?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}
export declare function AmbientItem(props: AmbientItemProps): JSX.Element;
