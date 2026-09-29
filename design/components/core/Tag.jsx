import React from 'react';
import { Icon } from './Icon.jsx';
export function Tag({icon,selected,onClick,onRemove,children,style}){
  const [h,setH]=React.useState(false);
  return <span onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{display:'inline-flex',alignItems:'center',gap:6,height:30,padding:onRemove?'0 5px 0 12px':'0 12px',borderRadius:'var(--radius-pill)',
    font:'400 13px/1 var(--font-sans)',cursor:onClick?'pointer':'default',backdropFilter:'var(--glass-blur)',WebkitBackdropFilter:'var(--glass-blur)',
    boxShadow:selected?'inset 0 1px 0 rgba(255,255,255,.18),0 0 0 1px var(--accent-ring)':'var(--glass-edge)',
    background:selected?'var(--accent-soft)':h&&onClick?'var(--surface-hover)':'var(--glass-fill)',color:selected?'var(--accent-text)':'var(--text-2)',transition:'background var(--dur-fast)',...style}}>
    {icon&&<Icon name={icon} size={14}/>}{children}
    {onRemove&&<span role="button" aria-label="移除" onClick={e=>{e.stopPropagation();onRemove()}} style={{display:'inline-flex',width:20,height:20,alignItems:'center',justifyContent:'center',borderRadius:99,cursor:'pointer',color:'var(--text-3)',background:'var(--surface-hover)'}}><Icon name="x" size={11}/></span>}
  </span>;
}
