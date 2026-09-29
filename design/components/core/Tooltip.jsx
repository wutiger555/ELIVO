import React from 'react';
export function Tooltip({content,side='top',children}){
  const [o,setO]=React.useState(false);
  const pos=side==='bottom'?{top:'calc(100% + 8px)'}:{bottom:'calc(100% + 8px)'};
  return <span style={{position:'relative',display:'inline-flex'}} onMouseEnter={()=>setO(true)} onMouseLeave={()=>setO(false)}>
    {children}
    <span role="tooltip" style={{position:'absolute',left:'50%',...pos,transform:'translateX(-50%) scale('+(o?1:.94)+')',opacity:o?1:0,pointerEvents:'none',whiteSpace:'nowrap',
      padding:'7px 11px',borderRadius:'var(--radius-pill)',background:'var(--glass-fill-strong)',backdropFilter:'var(--glass-blur-heavy)',WebkitBackdropFilter:'var(--glass-blur-heavy)',boxShadow:'var(--glass-shadow)',color:'var(--text-1)',font:'500 12px/1.2 var(--font-sans)',transition:'opacity var(--dur-fast),transform var(--dur-base) var(--ease-spring)',zIndex:50}}>{content}</span>
  </span>;
}
