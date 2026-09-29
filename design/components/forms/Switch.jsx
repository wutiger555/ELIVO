import React from 'react';
export function Switch({checked,defaultChecked,onChange,label,disabled,style}){
  const [c,setC]=React.useState(defaultChecked||false);const on=checked??c;
  const [p,setP]=React.useState(false);
  const t=()=>{if(disabled)return;setC(!on);onChange&&onChange(!on)};
  return <label onClick={t} onMouseDown={()=>setP(true)} onMouseUp={()=>setP(false)} onMouseLeave={()=>setP(false)} style={{display:'inline-flex',alignItems:'center',gap:10,cursor:disabled?'not-allowed':'pointer',opacity:disabled?.45:1,...style}}>
    <span style={{position:'relative',width:46,height:28,borderRadius:99,background:on?'var(--accent)':'var(--surface-3)',boxShadow:on?'inset 0 1px 0 rgba(255,255,255,.35)':'inset 0 0 0 1px var(--border-strong)',transition:'background var(--dur-base) var(--ease-out)'}}>
      <span style={{position:'absolute',top:2,left:on?(p?14:20):2,width:p?30:24,height:24,borderRadius:99,background:'#FFFFFF',boxShadow:'0 2px 6px rgba(0,0,0,.3),inset 0 -1px 0 rgba(0,0,0,.06)',transition:'left var(--dur-slow) var(--ease-spring),width var(--dur-base) var(--ease-spring)'}}/>
    </span>
    {label&&<span style={{font:'400 14px/1.3 var(--font-sans)',color:'var(--text-1)'}}>{label}</span>}
  </label>;
}
