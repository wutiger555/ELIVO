import React from 'react';
import { Icon } from '../core/Icon.jsx';
export function Checkbox({checked,defaultChecked,onChange,label,description,disabled,style}){
  const [c,setC]=React.useState(defaultChecked||false);const on=checked??c;
  const t=()=>{if(disabled)return;setC(!on);onChange&&onChange(!on)};
  return <label onClick={t} style={{display:'flex',gap:12,alignItems:'flex-start',cursor:disabled?'not-allowed':'pointer',opacity:disabled?.45:1,...style}}>
    <span style={{flex:'none',width:22,height:22,borderRadius:99,display:'inline-flex',alignItems:'center',justifyContent:'center',
      boxShadow:on?'inset 0 1px 0 rgba(255,255,255,.45),0 4px 12px -4px var(--accent-ring)':'inset 0 0 0 1.5px var(--border-strong)',background:on?'var(--accent)':'var(--glass-fill-thin)',color:'var(--accent-fg)',
      transform:on?'scale(1)':'scale(.94)',transition:'background var(--dur-fast),transform var(--dur-base) var(--ease-spring)'}}>
      {on&&<Icon name="check" size={13}/>}</span>
    {(label||description)&&<span style={{display:'flex',flexDirection:'column',gap:2,paddingTop:1}}>
      {label&&<span style={{font:'400 14.5px/1.4 var(--font-sans)',color:'var(--text-1)'}}>{label}</span>}
      {description&&<span style={{font:'400 12.5px/1.5 var(--font-sans)',color:'var(--text-3)'}}>{description}</span>}
    </span>}
  </label>;
}
