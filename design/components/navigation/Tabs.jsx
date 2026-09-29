import React from 'react';
export function Tabs({items=[],value,defaultValue,onChange,style}){
  const [v,setV]=React.useState(defaultValue??items[0]?.id);const cur=value??v;
  return <div role="tablist" style={{display:'inline-flex',gap:2,padding:4,borderRadius:'var(--radius-pill)',background:'var(--glass-fill)',backdropFilter:'var(--glass-blur-heavy)',WebkitBackdropFilter:'var(--glass-blur-heavy)',boxShadow:'var(--glass-shadow)',...style}}>
    {items.map(it=>{const on=it.id===cur;return <button key={it.id} role="tab" aria-selected={on} type="button" onClick={()=>{setV(it.id);onChange&&onChange(it.id)}}
      style={{display:'inline-flex',alignItems:'center',gap:7,height:34,padding:'0 16px',border:0,borderRadius:'var(--radius-pill)',cursor:'pointer',
        background:on?'var(--surface-press)':'transparent',boxShadow:on?'inset 0 1px 0 rgba(255,255,255,.16)':'none',
        font:'500 13.5px/1 var(--font-sans)',color:on?'var(--accent-text)':'var(--text-2)',transition:'background var(--dur-base) var(--ease-out),color var(--dur-fast)'}}>
      {it.label}{it.count!=null&&<span style={{font:'500 11px/1 var(--font-mono)',color:on?'var(--accent-text)':'var(--text-4)',opacity:.85}}>{it.count}</span>}
    </button>})}
  </div>;
}
