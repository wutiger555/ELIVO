const {Icon:ShIcon}=window.ELIVODesignSystem_a6632d;
function MacShell({title,right,children}){
  return <div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',background:'var(--bg-ambient),var(--bg)',borderRadius:22,overflow:'hidden',boxShadow:'inset 0 0 0 1px var(--border-strong),0 40px 100px -20px rgba(0,0,0,.7)'}}>
    <div style={{height:56,flex:'none',display:'flex',alignItems:'center',gap:14,padding:'0 12px 0 18px',borderBottom:'1px solid var(--border)',background:'var(--glass-fill-thin)',backdropFilter:'var(--glass-blur)',WebkitBackdropFilter:'var(--glass-blur)'}}>
      <div style={{display:'flex',gap:8}}>{['#FF5F57','#FEBC2E','#28C840'].map(c=><span key={c} style={{width:12,height:12,borderRadius:99,background:c,opacity:.9}}/>)}</div>
      <div style={{display:'flex',alignItems:'center',gap:10,marginLeft:8}}><span style={{font:'600 13px/1 var(--font-sans)',letterSpacing:'.04em'}}>ELIVO</span><span style={{width:1,height:14,background:'var(--border-strong)'}}/>{title}</div>
      <span style={{flex:1}}/>{right}
    </div>
    <div style={{flex:1,minHeight:0,display:'flex'}}>{children}</div>
  </div>;
}
function SectionLabel({children,right}){return <div style={{display:'flex',alignItems:'center',gap:8,height:20,marginBottom:12}}><span style={{font:'var(--type-label)',letterSpacing:'var(--tracking-label)',textTransform:'uppercase',color:'var(--text-3)'}}>{children}</span><span style={{flex:1,height:1,background:'var(--border)'}}/>{right}</div>}
Object.assign(window,{MacShell,SectionLabel});
