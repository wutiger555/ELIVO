import React from 'react';
import { Icon } from '../core/Icon.jsx';
export function Select({label,options=[],value,defaultValue,onChange,size='md',disabled,style}){
  const h={sm:'var(--control-h-sm)',md:'var(--control-h-md)',lg:'var(--control-h-lg)'}[size];
  return <label style={{display:'flex',flexDirection:'column',gap:7,...style}}>
    {label&&<span style={{font:'500 12.5px/1 var(--font-sans)',color:'var(--text-2)',paddingLeft:4}}>{label}</span>}
    <span style={{position:'relative',display:'flex'}}>
      <select disabled={disabled} value={value} defaultValue={defaultValue} onChange={onChange} style={{appearance:'none',WebkitAppearance:'none',width:'100%',height:h,padding:'0 36px 0 14px',borderRadius:'var(--radius-sm)',
        background:'var(--glass-fill)',backdropFilter:'var(--glass-blur)',WebkitBackdropFilter:'var(--glass-blur)',boxShadow:'var(--glass-edge)',color:'var(--text-1)',border:0,font:'400 14px/1 var(--font-sans)',outline:'none',cursor:'pointer',opacity:disabled?.5:1}}>
        {options.map(o=>typeof o==='string'?<option key={o} value={o}>{o}</option>:<option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <Icon name="chevrons-up-down" size={14} color="var(--text-3)" style={{position:'absolute',right:13,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
    </span>
  </label>;
}
