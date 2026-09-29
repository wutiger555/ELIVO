import React from 'react';
import { Icon } from '../core/Icon.jsx';
export function Input({label,placeholder,value,defaultValue,onChange,icon,hint,error,size='md',mono,type='text',disabled,style}){
  const [f,setF]=React.useState(false);
  const h={sm:'var(--control-h-sm)',md:'var(--control-h-md)',lg:'var(--control-h-lg)'}[size];
  return <label style={{display:'flex',flexDirection:'column',gap:7,...style}}>
    {label&&<span style={{font:'500 12.5px/1 var(--font-sans)',color:'var(--text-2)',paddingLeft:4}}>{label}</span>}
    <span style={{display:'flex',alignItems:'center',gap:8,height:h,padding:'0 14px',borderRadius:'var(--radius-sm)',background:'var(--glass-fill)',backdropFilter:'var(--glass-blur)',WebkitBackdropFilter:'var(--glass-blur)',opacity:disabled?.5:1,
      boxShadow:error?'inset 0 0 0 1px var(--danger)':f?'inset 0 1px 0 rgba(255,255,255,.18),0 0 0 1px var(--accent-ring),0 0 0 4px var(--accent-soft)':'var(--glass-edge)',transition:'box-shadow var(--dur-base) var(--ease-out)'}}>
      {icon&&<Icon name={icon} size={15} color="var(--text-3)"/>}
      <input type={type} disabled={disabled} placeholder={placeholder} value={value} defaultValue={defaultValue} onChange={onChange} onFocus={()=>setF(true)} onBlur={()=>setF(false)}
        style={{flex:1,minWidth:0,border:0,outline:0,background:'transparent',color:'var(--text-1)',font:(mono?'400 13px/1 var(--font-mono)':'400 14px/1 var(--font-sans)')}}/>
    </span>
    {(hint||error)&&<span style={{font:'400 12px/1.4 var(--font-sans)',color:error?'var(--danger)':'var(--text-3)',paddingLeft:4}}>{error||hint}</span>}
  </label>;
}
