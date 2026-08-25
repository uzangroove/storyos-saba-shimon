(() => {
  const firebaseConfig = {
    apiKey: 'AIzaSyDUPvkornyuWarT0CBOnueiYCSr54wVTPE',
    authDomain: 'saba-ganim-arava.firebaseapp.com',
    projectId: 'saba-ganim-arava',
    storageBucket: 'saba-ganim-arava.firebasestorage.app',
    messagingSenderId: '296324474712',
    appId: '1:296324474712:web:41deb7e8285a7928ef672d'
  };

  const state = { app:null, auth:null, storage:null, user:null, modules:null };
  let readyResolve, readyReject;
  const ready = new Promise((res, rej) => { readyResolve = res; readyReject = rej; });

  function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

  async function boot(){
    try {
      const appMod = await import('https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js');
      const authMod = await import('https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js');
      const storageMod = await import('https://www.gstatic.com/firebasejs/12.2.1/firebase-storage.js');
      state.modules = { appMod, authMod, storageMod };
      state.app = appMod.getApps().length ? appMod.getApp() : appMod.initializeApp(firebaseConfig);
      state.auth = authMod.getAuth(state.app);
      try { await authMod.setPersistence(state.auth, authMod.browserLocalPersistence); } catch(_) {}
      state.storage = storageMod.getStorage(state.app);
      authMod.onAuthStateChanged(state.auth, user => { state.user = user || null; window.dispatchEvent(new CustomEvent('storyos-firebase-auth',{detail:{user:state.user}})); });
      readyResolve(api);
    } catch (err) { readyReject(err); }
  }

  async function ensureReady(){ await ready; return api; }
  async function currentUser(){ await ready; return state.auth.currentUser || state.user || null; }
  async function tokenInfo(){ const user=await currentUser(); if(!user)return null; const r=await state.modules.authMod.getIdTokenResult(user,true); return {uid:user.uid,email:user.email,claims:r.claims}; }
  async function signOut(){ await ready; await state.modules.authMod.signOut(state.auth); }

  function closeLogin(){ document.getElementById('storyosFirebaseLogin')?.remove(); }
  async function signIn(email,password){ await ready; const cred=await state.modules.authMod.signInWithEmailAndPassword(state.auth,email,password); state.user=cred.user; return cred.user; }

  async function signInWithPrompt(){
    await ready;
    const existing=await currentUser(); if(existing)return existing;
    closeLogin();
    return new Promise((resolve,reject)=>{
      const modal=document.createElement('div');modal.id='storyosFirebaseLogin';modal.style.cssText='position:fixed;inset:0;z-index:2147483646;background:rgba(20,28,45,.62);display:grid;place-items:center;padding:18px';
      modal.innerHTML=`<div style="width:min(430px,94vw);background:#fff;border-radius:22px;padding:22px;box-shadow:0 24px 70px rgba(0,0,0,.3);font-family:Arial,\"Noto Sans Hebrew\",sans-serif;color:#1d2940" dir="rtl"><h2 style="margin:0 0 6px">התחברות למדיה של StoryOS</h2><p style="margin:0 0 16px;color:#6c7485">התחבר עם משתמש Firebase קיים. הסיסמה נשלחת ישירות ל-Firebase ואינה נשמרת בקוד.</p><form id="storyosFirebaseLoginForm" style="display:grid;gap:10px"><label style="font-weight:700">דוא״ל<input name="email" type="email" autocomplete="username" required style="width:100%;margin-top:5px;padding:11px;border:1px solid #d7d1c7;border-radius:11px"></label><label style="font-weight:700">סיסמה<input name="password" type="password" autocomplete="current-password" required style="width:100%;margin-top:5px;padding:11px;border:1px solid #d7d1c7;border-radius:11px"></label><div id="storyosFirebaseLoginError" style="color:#a33;min-height:18px"></div><div style="display:flex;gap:8px"><button type="submit" style="flex:1;border:0;border-radius:11px;padding:11px;background:#6c50e0;color:#fff;font-weight:700">התחבר</button><button type="button" data-cancel style="border:1px solid #d7d1c7;border-radius:11px;padding:11px;background:#fff">ביטול</button></div></form></div>`;
      document.body.appendChild(modal);
      const form=modal.querySelector('#storyosFirebaseLoginForm'),err=modal.querySelector('#storyosFirebaseLoginError');
      modal.querySelector('[data-cancel]').onclick=()=>{closeLogin();reject(new Error('ההתחברות בוטלה'));};
      form.onsubmit=async e=>{e.preventDefault();const data=new FormData(form),email=String(data.get('email')||'').trim(),password=String(data.get('password')||'');err.textContent='מתחבר…';try{const user=await signIn(email,password);closeLogin();resolve(user);}catch(ex){err.textContent='ההתחברות נכשלה: '+(ex.code||ex.message||ex);}};
    });
  }

  async function listFiles(prefix=''){
    await ready; if(!await currentUser())await signInWithPrompt();
    const { ref, listAll, getMetadata } = state.modules.storageMod;
    const root=ref(state.storage,prefix); const out=[];
    async function walk(r){ const page=await listAll(r); for(const item of page.items){ let meta=null; try{meta=await getMetadata(item)}catch(_){} out.push({name:item.fullPath,fullPath:item.fullPath,metadata:meta,ref:item}); } for(const folder of page.prefixes)await walk(folder); }
    await walk(root); return out;
  }

  async function getUrl(pathOrRef){ await ready; if(!await currentUser())await signInWithPrompt(); const r=typeof pathOrRef==='string'?state.modules.storageMod.ref(state.storage,pathOrRef):pathOrRef; return state.modules.storageMod.getDownloadURL(r); }
  async function upload(path,file,metadata={}){ await ready; if(!await currentUser())await signInWithPrompt(); const r=state.modules.storageMod.ref(state.storage,path); const snap=await state.modules.storageMod.uploadBytes(r,file,metadata); return {snapshot:snap,url:await state.modules.storageMod.getDownloadURL(snap.ref)}; }

  const api={version:'22.8.1',config:{...firebaseConfig,apiKey:'[client-configured]'},ready:ensureReady,currentUser,tokenInfo,signIn,signInWithPrompt,signOut,listFiles,getUrl,upload};
  window.StoryOSFirebase=api;
  boot();
})();
