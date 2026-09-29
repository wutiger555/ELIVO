import React from 'react';
import { Icon } from '../core/Icon.jsx';
export function SourceChip({label,time,icon='corner-down-right',onClick,style}){
  const [h,setH]=React.useState(false);
  return <span onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{display:'inline-flex',alignItems:'center',gap:6,minWidth:0,font:'400 12px/1.3 var(--font-sans)',color:h?'var(--text-1)':'var(--text-3)',cursor:onClick?'pointer':'default',transition:'color var(--dur-fast)',...style}}>
    <Icon name={icon} size={12}/>
    <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{label}</span>
    {time&&<span style={{font:'500 11px/1 var(--font-mono)',color:h?'var(--accent-text)':'var(--text-4)'}}>{time}</span>}
    {onClick&&<Icon name="arrow-up-right" size={12} style={{opacity:h?1:.5}}/>}
  </span>;
}
