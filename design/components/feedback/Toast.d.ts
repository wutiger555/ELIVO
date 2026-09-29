export interface ToastProps {
  tone?: 'neutral' | 'success' | 'warn' | 'danger';
  title: React.ReactNode;
  body?: React.ReactNode;
  /** Optional inline action (e.g. a small ghost Button). */
  action?: React.ReactNode;
  onClose?: () => void;
  style?: React.CSSProperties;
}
export declare function Toast(props: ToastProps): JSX.Element;
