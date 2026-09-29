export interface TagProps {
  icon?: string;
  selected?: boolean;
  onClick?: () => void;
  /** Shows a remove ✕ affordance. */
  onRemove?: () => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Tag(props: TagProps): JSX.Element;
