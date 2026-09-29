/**
 * @startingPoint section="Conversation" subtitle="Promoted & ambient insight cards with source" viewport="700x420"
 */
export interface ContextCardProps {
  type?: 'decision_conflict' | 'number_drift' | 'previous_decision' | 'related_document' | 'open_question' | 'unowned_action' | 'anaphora';
  /** promoted = Signal ring + action row; ambient = quiet, no actions. */
  level?: 'ambient' | 'promoted';
  /** ≤ 12 CJK chars; states a fact, never a judgement. */
  title: React.ReactNode;
  /** ≤ 2 lines. */
  body?: React.ReactNode;
  /** Required in practice — every card cites its source. */
  source?: { label: string; time?: string };
  /** Surfaced-at timecode. */
  time?: string;
  pinned?: boolean;
  onOpenSource?: () => void;
  onPin?: () => void;
  onDismiss?: () => void;
  onWhy?: () => void;
  style?: React.CSSProperties;
}
export declare function ContextCard(props: ContextCardProps): JSX.Element;
