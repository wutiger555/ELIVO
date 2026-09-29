export interface CardProps {
  /** default = liquid glass; raised = denser glass + shadow; promoted = Ion ring + glow (one per view). */
  variant?: 'default' | 'raised' | 'outline' | 'promoted';
  /** Inner padding in px. Default 20. */
  padding?: number | string;
  onClick?: () => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Card(props: CardProps): JSX.Element;
