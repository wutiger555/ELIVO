const {Button:BButton,Tag:BTag,AmbientItem:BAmb,Card:BCard,SourceChip:BSrc,Badge:BBadge,Icon:BIcon}=window.ELIVODesignSystem_a6632d;
function BriefScreen({onStart}){
  return <MacShell title={<span style={{font:'400 13px/1 var(--font-sans)',color:'var(--text-2)'}}>會前簡報</span>} right={<BButton size="sm" variant="ghost" icon="settings-2">設定</BButton>}>
    <div style={{flex:1,overflow:'auto',backgroundImage:'var(--grid-dot)',backgroundSize:'var(--grid-dot-size)'}}>
      <div style={{maxWidth:880,margin:'0 auto',padding:'48px 32px'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}><BBadge tone="accent" dot pulse>10 分鐘後開始</BBadge><span style={{font:'400 12px/1 var(--font-mono)',color:'var(--text-3)'}}>14:00 – 15:00 · Google Meet</span></div>
        <div style={{font:'500 36px/1.2 var(--font-sans)',letterSpacing:'-0.025em'}}>Acme｜API Migration Weekly</div>
        <div style={{display:'flex',gap:8,marginTop:16}}><BTag icon="building-2" selected>Acme</BTag><BTag icon="folder">API Migration</BTag><BTag icon="users">4 位與會者</BTag></div>
        <div style={{display:'grid',gridTemplateColumns:'1.3fr 1fr',gap:20,marginTop:36}}>
          <div>
            <SectionLabel right={<span style={{font:'400 11px/1 var(--font-mono)',color:'var(--text-4)'}}>8/12 週會</span>}>上次決策</SectionLabel>
            <BCard padding={18}>
              {[['採用方案 B，Gateway 分階段切換','00:31:05'],['第一階段先切 20% 流量','00:34:40'],['p95 目標壓到 500ms 以下','00:41:12']].map(([t,c],i)=><div key={i} style={{display:'flex',gap:12,padding:'10px 0',borderTop:i?'1px solid var(--border)':'none'}}><BIcon name="milestone" size={15} color="var(--accent-text)" style={{marginTop:3}}/><div style={{flex:1}}><div style={{font:'400 14.5px/1.5 var(--font-sans)'}}>{t}</div><BSrc label="8/12 週會" time={c} onClick={()=>{}} style={{marginTop:4}}/></div></div>)}
            </BCard>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:24}}>
            <div><SectionLabel>未完成待辦</SectionLabel><BAmb kind="action" label="Rollback 流程文件" meta="Kevin · 8/19"/><BAmb kind="action" label="壓測報告更新" meta="未指定"/></div>
            <div><SectionLabel>上次提到的數字</SectionLabel><BAmb kind="number" label="Benchmark p95" meta="820ms"/><BAmb kind="number" label="預算上限" meta="NT$1.2M"/></div>
            <div><SectionLabel>未決問題</SectionLabel><BAmb kind="question" label="Rollback 誰負責？" meta="8/12"/></div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:12,marginTop:40,paddingTop:24,borderTop:'1px solid var(--border)'}}>
          <BButton variant="primary" size="lg" icon="play" onClick={onStart}>開始會議</BButton>
          <span style={{font:'400 13px/1.5 var(--font-sans)',color:'var(--text-3)'}}>開始時會自動把告知文字貼到會議聊天室。</span>
        </div>
      </div>
    </div>
  </MacShell>;
}
window.BriefScreen=BriefScreen;
