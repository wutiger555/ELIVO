import React from 'react';
import { Icon } from '../core/Icon.jsx';
import { Badge } from '../core/Badge.jsx';
import { Button } from '../core/Button.jsx';
import { SourceChip } from './SourceChip.jsx';
export const CARD_TYPES={
  decision_conflict:{label:'Decision conflict',icon:'git-compare',tone:'warn'},
  number_drift:{label:'Number drift',icon:'trending-up',tone:'warn'},
  previous_decision:{label:'Previous decision',icon:'milestone',tone:'neutral'},
  related_document:{label:'Related document',icon:'file-text',tone:'info'},
  open_question:{label:'Open question',icon:'circle-help',tone:'neutral'},
  unowned_action:{label:'Unowned action',icon:'user-x',tone:'neutral'},
  anaphora:{label:'Reference',icon:'link-2',tone:'neutral'},
};
export function ContextCard({type='previous_decision',level='ambient',title,body,source,time,pinned,onOpenSource,onPin,onDismiss,onWhy,style}){
  const t=CARD_TYPES[type]||CARD_TYPES.previous_decision;const promoted=level==='promoted';
  return <div style={{position:'relative',padding:18,borderRadius:'var(--radius-lg)',background:promoted?'var(--glass-fill-strong)':'var(--glass-fill)',backdropFilter:'var(--glass-blur)',WebkitBackdropFilter:'var(--glass-blur)',
    boxShadow:promoted?'var(--glow-signal)':'var(--glass-edge)',animation:'elivo-surface var(--dur-surface) var(--ease-out)',...style}}>
    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
      <Badge tone={t.tone}><Icon name={t.icon} size={11}/>{t.label}</Badge>
      <span style={{flex:1}}/>
      {pinned&&<Icon name="pin" size={12} color="var(--accent-text)"/>}
      {time&&<span style={{font:'500 11px/1 var(--font-mono)',color:'var(--text-4)'}}>{time}</span>}
    </div>
    <div style={{font:'500 15px/1.45 var(--font-sans)',color:'var(--text-1)',letterSpacing:'-0.005em',textWrap:'pretty'}}>{title}</div>
    {body&&<div style={{marginTop:4,font:'400 13.5px/1.65 var(--font-sans)',color:'var(--text-2)',textWrap:'pretty'}}>{body}</div>}
    {source&&<div style={{marginTop:12}}><SourceChip label={source.label} time={source.time} onClick={onOpenSource}/></div>}
    {promoted&&(onOpenSource||onPin||onDismiss)&&<div style={{display:'flex',gap:6,marginTop:14,paddingTop:14,borderTop:'1px solid var(--border)'}}>
      {onOpenSource&&<Button size="sm" icon="scan-search" onClick={onOpenSource}>看依據</Button>}
      {onPin&&<Button size="sm" variant="ghost" icon="pin" onClick={onPin}>{pinned?'已 Pin':'Pin'}</Button>}
      <span style={{flex:1}}/>
      {onWhy&&<Button size="sm" variant="ghost" onClick={onWhy}>為什麼？</Button>}
      {onDismiss&&<Button size="sm" variant="ghost" onClick={onDismiss}>略過</Button>}
    </div>}
  </div>;
}
