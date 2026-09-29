import React from 'react';
export function RecIndicator({state='rec',time,style}){
  const S={rec:['REC','var(--rec)',true],paused:['PAUSED','var(--text-3)',false],ephemeral:['EPHEMERAL','var(--accent-text)',true]}[state]||[];
  return <span style={{display:'inline-flex',alignItems:'center',gap:8,height:28,padding:'0 12px',borderRadius:'var(--radius-pill)',background:'var(--glass-fill)',backdropFilter:'var(--glass-blur)',WebkitBackdropFilter:'var(--glass-blur)',boxShadow:'var(--glass-edge)',font:'500 11px/1 var(--font-mono)',letterSpacing:'var(--tracking-label)',color:'var(--text-1)',...style}}>
    <span style={{width:7,height:7,borderRadius:99,background:S[1],boxShadow:S[2]?'0 0 10px '+S[1]:'none',animation:S[2]?'elivo-pulse 1.6s var(--ease-in-out) infinite':undefined}}/>
    <span style={{color:S[1]}}>{S[0]}</span>
    {time&&<span style={{color:'var(--text-2)',letterSpacing:0}}>{time}</span>}
  </span>;
}
