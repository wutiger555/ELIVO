import React from 'react';
export function SegmentedControl({options=[],value,defaultValue,onChange,size='md',style}){
  const norm=options.map(o=>typeof o==='string'?{value:o,label:o}:o);
  const [v,setV]=React.useState(defaultValue??norm[0]?.value);const cur=value??v;
  const idx=Math.max(0,norm.findIndex(o=>o.value===cur));const h=size==='sm'?30:36;const n=norm.length||1;
  return <div role="radiogroup" style={{position:'relative',display:'inline-grid',gridTemplateColumns:'repeat('+n+',1fr)',padding:3,borderRadius:'var(--radius-pill)',
    background:'var(--glass-fill-thin)',backdropFilter:'var(--glass-blur)',WebkitBackdropFilter:'var(--glass-blur)',boxShadow:'var(--glass-edge)',...style}}>
    <span style={{position:'absolute',top:3,bottom:3,left:'calc(3px + (100% - 6px) / '+n+' * '+idx+')',width:'calc((100% - 6px) / '+n+')',borderRadius:'var(--radius-pill)',background:'var(--glass-fill)',boxShadow:'var(--glass-thumb)',transition:'left var(--dur-slow) var(--ease-spring)'}}/>
    {norm.map(o=>{const on=o.value===cur;return <button key={o.value} type="button" role="radio" aria-checked={on} onClick={()=>{setV(o.value);onChange&&onChange(o.value)}}
      style={{position:'relative',height:h-6,padding:'0 14px',border:0,borderRadius:'var(--radius-pill)',cursor:'pointer',font:'500 '+(size==='sm'?12:13)+'px/1 var(--font-sans)',
        background:'transparent',color:on?'var(--text-1)':'var(--text-3)',transition:'color var(--dur-fast)'}}>{o.label}</button>})}
  </div>;
}
