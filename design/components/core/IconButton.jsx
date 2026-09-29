import React from 'react';
import { Icon } from './Icon.jsx';
export function IconButton({icon,label,variant='ghost',size='md',active,disabled,onClick,style}){
  const [h,setH]=React.useState(false);const [p,setP]=React.useState(false);
  const d={sm:30,md:38,lg:50}[size]||38;const ic={sm:14,md:17,lg:20}[size]||17;
  const on=active||variant==='active';const glass=variant==='secondary'||on;
  return <button type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>{setH(false);setP(false)}} onMouseDown={()=>setP(true)} onMouseUp={()=>setP(false)}
    style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:d,height:d,padding:0,border:0,borderRadius:'var(--radius-pill)',cursor:disabled?'not-allowed':'pointer',opacity:disabled?.4:1,
      backdropFilter:glass?'var(--glass-blur)':undefined,WebkitBackdropFilter:glass?'var(--glass-blur)':undefined,boxShadow:on?'inset 0 1px 0 rgba(255,255,255,.2),0 0 0 1px var(--accent-ring)':glass?'var(--glass-edge)':'none',
      background:on?'var(--accent-soft)':h?'var(--surface-hover)':glass?'var(--glass-fill)':'transparent',
      color:on?'var(--accent-text)':h?'var(--text-1)':'var(--text-2)',transform:p?'scale(.92)':'none',transition:'background var(--dur-fast),color var(--dur-fast),transform var(--dur-base) var(--ease-spring)',...style}}>
    <Icon name={icon} size={ic}/>
  </button>;
}
