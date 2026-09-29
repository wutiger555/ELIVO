export interface IconButtonProps {
  icon: string;
  /** Accessible label; also shown as native title. */
  label: string;
  variant?: 'ghost' | 'secondary' | 'active';
  size?: 'sm' | 'md' | 'lg';
  /** Toggled-on state (Signal tint). */
  active?: boolean;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
}
export declare function IconButton(props: IconButtonProps): JSX.Element;
