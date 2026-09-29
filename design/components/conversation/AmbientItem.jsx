import React from 'react';
import { Icon } from '../core/Icon.jsx';
const K={doc:'file-text',number:'hash',question:'circle-help',decision:'milestone',action:'square-check',person:'user-round'};
export function AmbientItem({kind='doc',label,meta,onClick,style}){
  const [h,setH]=React.useState(false);
  return <div onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{display:'flex',alignItems:'center',gap:10,minHeight:38,padding:'7px 12px',margin:'0 -12px',borderRadius:'var(--radius-sm)',
    background:h&&onClick?'var(--surface-hover)':'transparent',cursor:onClick?'pointer':'default',transition:'background var(--dur-fast)',...style}}>
    <Icon name={K[kind]||kind} size={14} color="var(--text-3)"/>
    <span style={{flex:1,minWidth:0,font:'400 13px/1.4 var(--font-sans)',color:h?'var(--text-1)':'var(--text-2)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{label}</span>
    {meta&&<span style={{flex:'none',font:'500 11px/1 var(--font-mono)',color:'var(--text-4)'}}>{meta}</span>}
  </div>;
}
