import React from 'react';
export function TranscriptLine({speaker,self,time,text,partial,highlight,linked,style}){
  let content=text;
  if(highlight&&typeof text==='string'&&text.includes(highlight)){const [a,...b]=text.split(highlight);content=<>{a}<mark style={{background:'var(--accent-soft)',color:'var(--text-1)',borderRadius:3,padding:'0 2px',boxShadow:'inset 0 -1px 0 var(--accent)'}}>{highlight}</mark>{b.join(highlight)}</>;}
  return <div style={{display:'grid',gridTemplateColumns:'56px 1fr',gap:14,padding:'10px 0',opacity:partial?.6:1,...style}}>
    <div style={{display:'flex',flexDirection:'column',gap:4,paddingTop:3}}>
      <span style={{font:'500 12px/1 var(--font-sans)',color:self?'var(--accent-text)':'var(--text-2)'}}>{speaker}</span>
      {time&&<span style={{font:'400 10.5px/1 var(--font-mono)',color:'var(--text-4)'}}>{time}</span>}
    </div>
    <div style={{font:'400 16px/1.7 var(--font-sans)',color:'var(--text-1)',textWrap:'pretty',position:'relative'}}>
      {content}{partial&&<span style={{display:'inline-block',width:2,height:'1em',marginLeft:2,verticalAlign:'-2px',background:'var(--accent)',animation:'elivo-caret 1s steps(1) infinite'}}/>}
      {linked&&<span style={{marginLeft:8,font:'500 10.5px/1 var(--font-mono)',color:'var(--accent-text)',letterSpacing:'.06em'}}>↗ LINKED</span>}
    </div>
  </div>;
}
