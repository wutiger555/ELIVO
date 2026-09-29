import React from 'react';
import { Icon } from './Icon.jsx';
const SIZES={sm:{h:'var(--control-h-sm)',px:14,fs:13,ic:14,gap:6},md:{h:'var(--control-h-md)',px:18,fs:14,ic:16,gap:8},lg:{h:'var(--control-h-lg)',px:24,fs:16,ic:18,gap:8}};
export function Button({variant='secondary',size='md',icon,iconRight,disabled,fullWidth,onClick,children,type='button',style}){
  const [h,setH]=React.useState(false);const [p,setP]=React.useState(false);
  const s=SIZES[size]||SIZES.md;
  const glass={backdropFilter:'var(--glass-blur)',WebkitBackdropFilter:'var(--glass-blur)'};
  const V={
    primary:{background:h?'var(--accent-hover)':'var(--accent)',color:'var(--accent-fg)',boxShadow:'inset 0 1px 0 rgba(255,255,255,.45),0 6px 20px -6px var(--accent-ring)'},
    secondary:{...glass,background:h?'var(--surface-hover)':'var(--glass-fill)',color:'var(--text-1)',boxShadow:'var(--glass-edge)'},
    ghost:{background:h?'var(--surface-hover)':'transparent',color:h?'var(--text-1)':'var(--text-2)'},
    danger:{...glass,background:h?'var(--danger-soft)':'var(--glass-fill-thin)',color:'var(--danger)',boxShadow:'inset 0 0 0 1px var(--danger-soft)'},
  }[variant]||{};
  return <button type={type} disabled={disabled} onClick={onClick}
    onMouseEnter={()=>setH(true)} onMouseLeave={()=>{setH(false);setP(false)}} onMouseDown={()=>setP(true)} onMouseUp={()=>setP(false)}
    style={{display:'inline-flex',alignItems:'center',justifyContent:'center',gap:s.gap,height:s.h,padding:'0 '+s.px+'px',width:fullWidth?'100%':undefined,
      font:'500 '+s.fs+'px/1 var(--font-sans)',letterSpacing:'-0.01em',whiteSpace:'nowrap',borderRadius:'var(--radius-pill)',border:0,
      cursor:disabled?'not-allowed':'pointer',opacity:disabled?.4:1,transform:p&&!disabled?'scale(.96)':'none',
      transition:'background var(--dur-fast) var(--ease-out),color var(--dur-fast),transform var(--dur-base) var(--ease-spring)',outline:'none',...V,...style}}>
    {icon&&<Icon name={icon} size={s.ic}/>}{children}{iconRight&&<Icon name={iconRight} size={s.ic}/>}
  </button>;
}
