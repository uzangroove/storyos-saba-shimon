(() => {
  const id='v2219HomeStyleFix';
  if(document.getElementById(id)) return;
  const s=document.createElement('style');
  s.id=id;
  s.textContent=`
    #v2218Home .v2218-wrap{
      width:min(1380px,95vw);
      padding:18px 18px 24px;
    }
    #v2218Home .v2218-brand{margin-bottom:14px}
    #v2218Home .v2218-logo{width:min(145px,28vw);height:min(145px,28vw);max-height:145px}
    #v2218Home .v2218-brand h1{margin:5px 0 2px}

    #v2218Home .v2218-grid{
      grid-template-columns:repeat(3,minmax(0,1fr));
      gap:16px;
    }
    #v2218Home .v2218-tile{
      min-height:214px;
      padding:13px 14px 12px;
      border-radius:23px;
      gap:8px;
      background:rgba(255,255,255,.78);
      border:1px solid rgba(207,198,186,.72);
      box-shadow:0 8px 20px rgba(45,50,65,.065);
    }
    #v2218Home .v2218-tile:hover{
      transform:translateY(-3px);
      box-shadow:0 13px 27px rgba(45,50,65,.11);
    }
    #v2218Home .v2218-iconbox{
      width:100%;
      height:158px;
      display:flex;
      align-items:center;
      justify-content:center;
      background:transparent!important;
      border:0!important;
      box-shadow:none!important;
      padding:0;
      overflow:visible;
    }
    #v2218Home .v2218-icon{
      width:auto!important;
      height:auto!important;
      max-width:92%!important;
      max-height:154px!important;
      object-fit:contain!important;
      background:transparent!important;
      border:0!important;
      border-radius:0!important;
      box-shadow:none!important;
      padding:0!important;
      margin:0!important;
      display:block;
    }
    #v2218Home .v2218-title{
      margin:0;
      min-height:34px;
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:clamp(1.03rem,1.45vw,1.30rem);
      line-height:1.18;
    }
    #v2218Home .v2218-footer{margin-top:11px}

    @media(max-width:900px){
      #v2218Home .v2218-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
      #v2218Home .v2218-tile{min-height:188px;padding:11px}
      #v2218Home .v2218-iconbox{height:132px}
      #v2218Home .v2218-icon{max-height:128px!important;max-width:94%!important}
    }
    @media(max-width:560px){
      #v2218Home .v2218-wrap{padding:12px 10px 18px}
      #v2218Home .v2218-brand{margin-bottom:9px}
      #v2218Home .v2218-logo{max-height:94px;width:min(94px,24vw);height:min(94px,24vw)}
      #v2218Home .v2218-grid{gap:9px}
      #v2218Home .v2218-tile{min-height:154px;border-radius:17px;padding:8px;gap:6px}
      #v2218Home .v2218-iconbox{height:108px}
      #v2218Home .v2218-icon{max-height:104px!important;max-width:96%!important}
      #v2218Home .v2218-title{font-size:.92rem;min-height:28px}
    }
  `;
  document.head.appendChild(s);
})();
