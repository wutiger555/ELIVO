export interface BadgeProps {
  tone?: 'neutral' | 'accent' | 'warn' | 'danger' | 'info';
  variant?: 'soft' | 'solid' | 'outline';
  /** Leading status dot. */
  dot?: boolean;
  /** Pulse the dot (live states only). */
  pulse?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Badge(props: BadgeProps): JSX.Element;
