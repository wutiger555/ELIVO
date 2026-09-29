export interface InputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Leading Lucide icon (e.g. "search"). */
  icon?: string;
  hint?: string;
  /** Error message; turns border red. */
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Monospace value (IDs, numbers, timecodes). */
  mono?: boolean;
  type?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}
export declare function Input(props: InputProps): JSX.Element;
