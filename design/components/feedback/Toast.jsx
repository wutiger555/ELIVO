import React from 'react';
import { Icon } from '../core/Icon.jsx';
const T={neutral:['info','var(--text-2)'],success:['circle-check','var(--accent-text)'],warn:['triangle-alert','var(--warn)'],danger:['circle-x','var(--danger)']};
export function Toast({tone='neutral',title,body,action,onClose,style}){
  const [ic,c]=T[tone]||T.neutral;
  return <div role="status" style={{display:'flex',gap:12,alignItems:'center',width:360,maxWidth:'100%',padding:'12px 16px 12px 14px',borderRadius:'var(--radius-lg)',background:'var(--glass-fill-strong)',backdropFilter:'var(--glass-blur-heavy)',WebkitBackdropFilter:'var(--glass-blur-heavy)',boxShadow:'var(--shadow-overlay)',animation:'elivo-surface var(--dur-slow) var(--ease-out)',...style}}>
    <span style={{flex:'none',width:30,height:30,borderRadius:99,display:'inline-flex',alignItems:'center',justifyContent:'center',background:'var(--surface-hover)',boxShadow:'inset 0 1px 0 rgba(255,255,255,.12)'}}><Icon name={ic} size={16} color={c}/></span>
    <div style={{flex:1,minWidth:0}}>
      <div style={{font:'500 13.5px/1.4 var(--font-sans)',color:'var(--text-1)'}}>{title}</div>
      {body&&<div style={{marginTop:1,font:'400 12.5px/1.5 var(--font-sans)',color:'var(--text-3)'}}>{body}</div>}
    </div>
    {action}
    {onClose&&<span role="button" aria-label="關閉" onClick={onClose} style={{cursor:'pointer',color:'var(--text-3)',display:'inline-flex'}}><Icon name="x" size={14}/></span>}
  </div>;
}
