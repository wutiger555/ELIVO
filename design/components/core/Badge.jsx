import React from 'react';
const T={neutral:['var(--glass-fill)','var(--text-2)','var(--border-strong)'],accent:['var(--accent-soft)','var(--accent-text)','var(--accent-ring)'],warn:['var(--warn-soft)','var(--warn)','var(--warn-soft)'],danger:['var(--danger-soft)','var(--danger)','var(--danger-soft)'],info:['var(--info-soft)','var(--info)','var(--info-soft)']};
export function Badge({tone='neutral',variant='soft',dot,pulse,children,style}){
  const [bg,fg,bd]=T[tone]||T.neutral;
  return <span style={{display:'inline-flex',alignItems:'center',gap:6,height:22,padding:'0 9px',borderRadius:'var(--radius-pill)',font:'500 10.5px/1 var(--font-mono)',letterSpacing:'var(--tracking-label)',textTransform:'uppercase',whiteSpace:'nowrap',
    background:variant==='outline'?'transparent':variant==='solid'?fg:bg,color:variant==='solid'?'var(--bg)':fg,boxShadow:variant==='outline'?'inset 0 0 0 1px '+bd:'inset 0 1px 0 rgba(255,255,255,.08)',...style}}>
    {dot&&<span style={{width:6,height:6,borderRadius:99,background:variant==='solid'?'var(--bg)':fg,boxShadow:variant==='solid'?'none':'0 0 8px '+fg,animation:pulse?'elivo-pulse 1.6s var(--ease-in-out) infinite':undefined}}/>}{children}
  </span>;
}
