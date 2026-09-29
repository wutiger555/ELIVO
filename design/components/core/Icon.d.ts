/** Lucide glyph rendered as a currentColor mask. */
export interface IconProps {
  /** Lucide icon name, kebab-case (e.g. "file-text", "git-compare"). */
  name: string;
  /** Pixel size. Default 16. */
  size?: number;
  color?: string;
  title?: string;
  style?: React.CSSProperties;
}
export declare function Icon(props: IconProps): JSX.Element;
