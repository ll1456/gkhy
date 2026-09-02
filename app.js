/* 亳州考公·创业情报站 v7 · 登录注册体系/第一版元提醒样式/层级时间排序/外部信源接入 */
(function(){
'use strict';
var D = window.APP_DATA;
if(!D || !D.items){ document.body.insertAdjacentHTML('afterbegin','<div style="background:#D20202;color:#fff;padding:10px 14px;font-size:13px">数据加载失败，请刷新重试</div>'); return; }
var CH = D.channels, ITEMS = D.items;
var GRPS = ['考公赛道','学习强国频道','创业赛道'];
var REGION_ORDER = {'国家':0,'全国':0,'安徽':1,'亳州':2};
var REGION_LABEL = {'国家':'🇨🇳 国家级','全国':'🇨🇳 国家级','安徽':'🏛️ 安徽省级','亳州':'📍 亳州市·县区'};
var state = { grp:'考公赛道', ch:'kaokao', src:'全部', sub:null };
var extItems = [];   // 外部接入信源的动态条目

/* ---------- 存储探测（受限环境降级） ---------- */
var lsOK = true, mem = {};
try{ localStorage.setItem('__t','1'); localStorage.removeItem('__t'); }catch(e){ lsOK = false; }
function lsGet(k){ if(!lsOK) return (k in mem)?mem[k]:null; try{ return localStorage.getItem(k); }catch(e){ return (k in mem)?mem[k]:null; } }
function lsSet(k,v){ if(!lsOK){ mem[k]=v; return; } try{ localStorage.setItem(k,v); }catch(e){ mem[k]=v; } }
var subs = [];
try{ subs = JSON.parse(lsGet('bz_subs')||'[]'); }catch(e){ subs = []; }
function saveSubs(){ lsSet('bz_subs', JSON.stringify(subs)); }
function users(){ try{ return JSON.parse(lsGet('bz_users')||'{}'); }catch(e){ return {}; } }

/* ---------- 会话 ---------- */
var auth = null;
try{ auth = JSON.parse(lsGet('bz_auth')||'null'); }catch(e){}

/* ---------- 账号类型识别 ---------- */
function acctType(u){
  if(/^1[3-9]\d{9}$/.test(u)) return '手机号';
  if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u)) return '邮箱';
  if(/^[\w\u4e00-\u9fa5]{2,20}$/.test(u)) return '用户名';
  return null;
}

/* ---------- 登录卡（页内嵌，登录/注册分Tab） ---------- */
function showLoginCard(){
  var root = document.getElementById('list');
  var sc = document.getElementById('srccards');
  if(sc) sc.style.display='none';
  var sf = document.getElementById('srcfilter');
  if(sf) sf.style.display='none';
  document.getElementById('cnt').textContent = '请先登录';
  document.getElementById('tabs2').innerHTML = '';
  root.innerHTML =
  '<div class="login-inline">'+
  '<div class="lg-logo">学</div>'+
  '<div class="lg-tabs"><button id="lg_tab_login" class="on">登 录</button><button id="lg_tab_reg">注 册</button></div>'+
  '<input id="lg_user" placeholder="手机号 / 邮箱 / 用户名">'+
  '<input id="lg_pass" type="password" placeholder="密码（≥6位）">'+
  '<input id="lg_pass2" type="password" placeholder="确认密码（仅注册需要）" style="display:none">'+
  '<div id="lg_tip" class="lg-tip"></div>'+
  '<button id="lg_go" class="lg-pri">登 录</button>'+
  '<button id="lg_guest" class="lg-ghost">🔍 先逛逛（游客模式）</button>'+
  '<div class="lg-third"><span>其他方式</span>'+
    '<button id="lg_wx" title="需备案域名+开放平台资质">微信</button>'+
    '<button id="lg_qq" title="需QQ互联审核">QQ</button></div>'+
  '<div class="lg-foot">未注册账号将自动创建 · 数据仅存本机浏览器</div>'+
  '</div>';
  var mode = 'login';
  var tip = document.getElementById('lg_tip');
  function setMode(m){
    mode = m;
    document.getElementById('lg_tab_login').className = (m==='login'?'on':'');
    document.getElementById('lg_tab_reg').className = (m==='reg'?'on':'');
    document.getElementById('lg_pass2').style.display = (m==='reg'?'block':'none');
    document.getElementById('lg_go').textContent = (m==='reg'?'注 册':'登 录');
    tip.textContent = '';
  }
  document.getElementById('lg_tab_login').onclick = function(){ setMode('login'); };
  document.getElementById('lg_tab_reg').onclick = function(){ setMode('reg'); };
  document.getElementById('lg_user').oninput = function(){
    var v = this.value.trim(); var t = acctType(v);
    this.style.borderColor = (v && !t) ? '#B00000' : '#EAEAEA';
  };
  document.getElementById('lg_go').onclick = function(){
    var u = document.getElementById('lg_user').value.trim();
    var p = document.getElementById('lg_pass').value;
    var t = acctType(u);
    if(!u){ tip.textContent = '请输入账号（支持手机号/邮箱/用户名）'; return; }
    if(!t){ tip.textContent = '账号格式：11位手机号 / 含@邮箱 / 2-20位用户名'; return; }
    if(p.length < 6){ tip.textContent = '密码至少6位'; return; }
    var db = users();
    if(mode === 'reg'){
      var p2 = document.getElementById('lg_pass2').value;
      if(p !== p2){ tip.textContent = '两次密码不一致'; return; }
      if(db[u]){ tip.textContent = '该账号已注册，请切换到「登录」'; return; }
      db[u] = p; lsSet('bz_users', JSON.stringify(db));
      lsSet('bz_auth', JSON.stringify({user:u, type:t, ts:Date.now()}));
      enter();
    } else {
      if(!db[u]){ tip.textContent = '账号不存在，请点上方「注册」'; return; }
      if(db[u] !== p){ tip.textContent = '密码错误，请重试'; return; }
      lsSet('bz_auth', JSON.stringify({user:u, ts:Date.now()}));
      enter();
    }
  };
  document.getElementById('lg_pass').addEventListener('keydown', function(e){ if(e.key==='Enter') document.getElementById('lg_go').click(); });
  document.getElementById('lg_guest').onclick = function(){
    lsSet('bz_auth', JSON.stringify({user:'游客', ts:Date.now()}));
    enter();
  };
  var thirdMsg = '微信/QQ 一键登录需要：备案域名 + 微信开放平台认证（300元/年）或 QQ互联审核。\n当前版本请用 手机号/邮箱 注册，部署后端后可开通。';
  document.getElementById('lg_wx').onclick = function(){ alert(thirdMsg); };
  document.getElementById('lg_qq').onclick = function(){ alert(thirdMsg); };
}
function enter(){
  auth = JSON.parse(lsGet('bz_auth')||'null') || {user:'游客'};
  var sc = document.getElementById('srccards'); if(sc) sc.style.display='';
  document.getElementById('hello').textContent = '欢迎，' + auth.user + ' · 三层信源 · 双赛道';
  renderAll();
}
/* 真实退出登录 */
function logout(){
  lsSet('bz_auth','');
  auth = null;
  document.getElementById('hello').textContent = '未登录';
  state.grp='考公赛道'; state.ch='kaokao'; state.src='全部'; state.sub=null;
  showLoginCard();
}

/* ---------- 工具 ---------- */
function esc(s){ return String(s||'').replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function chById(id){ for(var i=0;i<CH.length;i++) if(CH[i].id===id) return CH[i]; return null; }
function channelsOfGroup(g){ if(g==='我的订阅') return []; return CH.filter(function(c){ return c.group===g; }); }
function regionRank(r){ return REGION_ORDER.hasOwnProperty(r) ? REGION_ORDER[r] : 1; }
function byTime(a,b){ var ta=Date.parse((a.dt||'')+'T12:00'), tb=Date.parse((b.dt||'')+'T12:00'); return (tb||0)-(ta||0); }
function byTier(a,b){
  var d = regionRank(a.r)-regionRank(b.r);
  if(d) return d;
  return byTime(a,b);   /* 层级内按时间顺序 */
}
function daysLeft(dl){ if(!dl) return null; var t=new Date(dl.replace(' ','T'))-new Date(); return isNaN(t)?null:t; }

/* ---------- 元提醒（第一版渲染样式） ---------- */
function metaHtml(it){
  var m = it.m || {};
  var exam = m.kn ? '<div class="ditem__x"><span class="exam">申论考点</span>'+esc(m.kn)+'</div>' : '';
  var mat  = m.ma ? '<div class="ditem__ma"><span class="mat">素材</span>'+esc(m.ma)+'</div>' : '';
  var biz  = m.bz ? '<div class="ditem__bz"><span class="biz">创业商机</span>'+esc(m.bz)+'</div>' : '';
  var inner = exam+mat+biz;
  return inner ? '<details class="meta"><summary>💡 考公·创业 元提醒</summary>'+inner+'</details>' : '';
}

/* ---------- 条目渲染 ---------- */
function itemHtml(it){
  var rc = it.r==='亳州'?'bz':(it.r==='安徽'?'ah':'nation');
  var dd = (it.dt||'').slice(5);
  var img = (state.img!==false && it.img) ? '<div class="thumb-wrap"><img class="thumb" src="'+esc(it.img)+'" loading="lazy" onerror="this.parentNode.style.display=\'none\'"></div>' : '';
  var vd = it.vd ? '<span class="vtag">▶ 视频</span>' : '';
  var st = it.st ? '<span class="src-tag" style="background:#C77800">★重点</span>' : '';
  var dl = '';
  if(it.dl){
    var t = daysLeft(it.dl);
    if(t===null) dl='';
    else if(t<=0) dl='<span class="dl dl--past">已截止</span>';
    else{
      var hrs=Math.ceil(t/36e5), days=Math.floor(hrs/24);
      var label = days>0 ? days+'天'+(hrs%24)+'小时' : hrs+'小时';
      dl = hrs<=48 ? '<span class="dl dl--hot">⏰ '+label+'后截止</span>'
                   : '<span class="dl">⏰ '+Math.ceil(hrs/24)+'天后截止</span>';
    }
  }
  return '<div class="news__item'+(img?' v-img':'')+'">'+
    '<a class="news__t" href="'+esc(it.u)+'" target="_blank" rel="noopener">'+esc(it.t)+vd+'</a>'+
    '<div class="news__meta"><span class="d">'+esc(dd)+'</span><span>'+esc(it.s)+'</span>'+
    '<span class="badge-r badge-r--'+rc+'">'+esc(it.r)+'</span>'+st+dl+'</div>'+
    img+(it.sm?'<div class="news__sum">'+esc(it.sm)+'</div>':'')+metaHtml(it)+'</div>';
}

/* ---------- 列表（三层排序：国家→安徽→亳州，层级内时间序） ---------- */
function itemsOfChannel(){
  if(state.grp==='我的订阅'){
    var names = {}; subs.forEach(function(s){ names[s.name]=1; });
    var own = ITEMS.filter(function(it){
      if(names[it.s]) return true;
      for(var k in names){ if(k.length>=2 && (it.s.indexOf(k)>=0 || k.indexOf(it.s)>=0)) return true; }
      return false;
    });
    var ext = extItems;
    return own.concat(ext).sort(byTime);
  }
  var c = chById(state.ch); if(!c) return [];
  var base = ITEMS.filter(function(it){
    if(!it.ch || it.ch.indexOf(state.ch)<0) return false;
    if(state.src!=='全部' && it.s!==state.src) return false;
    if(state.sub && state.sub!=='全部'){
      var blob = (it.t||'')+(it.sm||'')+(it.m&&it.m.kn||'');
      if(blob.indexOf(state.sub)<0) return false;
    }
    return true;
  });
  return base.sort(byTier);
}
function renderList(){
  if(!auth) return;
  var arr = itemsOfChannel();
  var root = document.getElementById('list');
  document.getElementById('empty').hidden = arr.length>0;
  document.getElementById('cnt').textContent = '共 '+arr.length+' 条 · '+(state.grp==='我的订阅'?'我的订阅':state.grp+' / '+(chById(state.ch)||{}).name);
  var html='', lastRegion=-1;
  arr.forEach(function(it){
    var rk=regionRank(it.r);
    if(rk!==lastRegion){ lastRegion=rk; html += '<div class="region-sep">'+(REGION_LABEL[it.r]||REGION_LABEL['国家'])+'</div>'; }
    html += itemHtml(it);
  });
  root.innerHTML = html;
}

/* ---------- 其他渲染（保持） ---------- */
function renderGroups(){
  var groups = GRPS.concat(['我的订阅']);
  document.getElementById('tabs1').innerHTML = groups.map(function(g){
    return '<div class="grp'+(state.grp===g?' on':'')+'" data-g="'+esc(g)+'">'+esc(g)+'</div>';
  }).join('');
  Array.prototype.forEach.call(document.querySelectorAll('#tabs1 .grp'), function(el){
    el.onclick = function(){
      state.grp = el.getAttribute('data-g');
      var cs = channelsOfGroup(state.grp);
      state.ch = cs.length ? cs[0].id : null;
      state.src='全部'; state.sub=null;
      renderAll();
    };
  });
}
function renderChannels(){
  var t2 = document.getElementById('tabs2'), sb = document.getElementById('subs');
  if(state.grp==='我的订阅'){
    t2.innerHTML='<div class="ch-tab on">⭐ 我的订阅</div>';
    sb.hidden=false;
    sb.innerHTML = '<button class="addsrc" id="btnAdd">＋ 添加订阅信源</button>';
    document.getElementById('btnAdd').onclick = openModal;
    return;
  }
  sb.hidden = true;
  var cs = channelsOfGroup(state.grp);
  if(!cs.length){ t2.innerHTML=''; return; }
  t2.innerHTML = cs.map(function(c){
    var n = ITEMS.filter(function(it){ return it.ch && it.ch.indexOf(c.id)>=0; }).length;
    return '<div class="ch-tab'+(state.ch===c.id?' on':'')+'" data-c="'+c.id+'">'+c.ico+' '+esc(c.name)+(n?' <b>'+n+'</b>':'')+'</div>';
  }).join('');
  Array.prototype.forEach.call(t2.querySelectorAll('.ch-tab'), function(el){
    el.onclick = function(){
      state.ch = el.getAttribute('data-c');
      state.src='全部'; state.sub=null;
      renderChannels(); renderSrcFilter(); renderSrcCards(); renderList();
    };
  });
  var c = chById(state.ch);
  if(c && c.subs && c.subs.length){
    sb.hidden = false;
    sb.innerHTML = ['全部'].concat(c.subs).map(function(s){
      return '<button class="sub-tab'+(state.sub===s||(s==='全部'&&state.sub===null)?' on':'')+'" data-sub="'+esc(s)+'">'+esc(s)+'</button>';
    }).join('');
    Array.prototype.forEach.call(sb.querySelectorAll('.sub-tab'), function(el){
      el.onclick = function(){
        var v = el.getAttribute('data-sub');
        state.sub = (v==='全部') ? null : v;
        renderChannels(); renderList();
      };
    });
  } else { sb.hidden = true; }
}
function renderSrcFilter(){
  var el = document.getElementById('srcfilter');
  var c = chById(state.ch);
  if(!c){ el.innerHTML=''; el.style.display='none'; return; }
  el.style.display='flex';
  el.innerHTML = '<span class="sf-label">信源</span>' + ['全部'].concat(c.sources.map(function(s){return s.name;})).map(function(n){
    return '<span class="sf-chip'+(state.src===n?' on':'')+'" data-s="'+esc(n)+'">'+esc(n)+'</span>';
  }).join('');
  Array.prototype.forEach.call(el.querySelectorAll('.sf-chip'), function(chip){
    chip.onclick = function(){ state.src = chip.getAttribute('data-s'); renderSrcFilter(); renderSrcCards(); renderList(); };
  });
}
function renderSrcCards(){
  var el = document.getElementById('srccards');
  var stat = {};
  ITEMS.forEach(function(it){ stat[it.s]=(stat[it.s]||0)+1; });
  if(state.grp==='我的订阅'){
    el.innerHTML = subs.length ? subs.map(function(s,i){
      return '<div class="src-card" data-i="'+i+'"><span class="src-card__r badge-r--bz">'+esc(s.region||'亳州')+'</span><b>'+esc(s.name)+'</b>'+
        (s.url&&s.url.indexOf('http')===0?'<em class="ext-fetch" data-u="'+esc(s.url)+'">⚡抓取该站</em>':'')+
        '<i>'+(s.url&&s.url.indexOf('http')===0?'接入外部站·点⚡自动抓取':'公众号搜索词')+'</i></div>';
    }).join('') : '<div class="no-result">暂无订阅，点上方「＋ 添加订阅信源」</div>';
    Array.prototype.forEach.call(el.querySelectorAll('.ext-fetch'), function(b){
      b.onclick = function(e){ e.preventDefault(); fetchExternal(b.getAttribute('data-u')); };
    });
    return;
  }
  var c = chById(state.ch);
  if(!c){ el.innerHTML=''; return; }
  el.innerHTML = c.sources.map(function(s){
    var rcls = s.region==='亳州'?'bz':(s.region==='安徽'?'ah':'nation');
    var n = stat[s.name]||0;
    var tag = n===0 ? '<u>待激活</u>' : '';
    return '<a class="src-card" href="'+esc(s.url)+'" target="_blank" rel="noopener">'+
      '<span class="src-card__r badge-r--'+rcls+'">'+esc(s.region)+'</span><b>'+esc(s.name)+'</b>'+tag+
      (s.type?'<em>'+esc(s.type)+'</em>':'')+'<i>'+esc(s.note||'')+'</i></a>';
  }).join('');
}

/* ---------- 外部信源接入（r.jina.ai 代理抓取，失败回退 allorigins） ---------- */
function fetchExternal(url){
  var root = document.getElementById('list');
  root.insertAdjacentHTML('afterbegin','<div id="extload" style="padding:14px;color:#8A8A8A;font-size:13px">⏳ 正在抓取 '+esc(url.slice(0,40))+' …（约10秒）</div>');
  var proxy1 = 'https://r.jina.ai/'+url;
  var proxy2 = 'https://api.allorigins.win/raw?url='+encodeURIComponent(url);
  fetch(proxy1).then(function(r){ return r.ok ? r.text() : Promise.reject(); })
  .catch(function(){ return fetch(proxy2).then(function(r){ return r.text(); }); })
  .then(function(txt){
    var el = document.getElementById('extload'); if(el) el.remove();
    var items = [];
    /* markdown 链接解析（jina返回） */
    var re = /\[([^\[\]]{8,80})\]\((https?:\/\/[^\)]+)\)/g, m;
    while((m = re.exec(txt)) && items.length<10){
      var t = m[1].trim(), u = m[2];
      if(t.indexOf('http')===0 || /跳转|首页|登录|备案/.test(t)) continue;
      items.push({t:t, u:u});
    }
    /* HTML 兜底解析 */
    if(!items.length && txt.indexOf('<')===0){
      var re2 = /<a[^>]+href="(https?:\/\/[^"]+)"[^>]*>([^<]{10,70})<\/a>/g;
      while((m = re2.exec(txt)) && items.length<10){
        if(/beian|javascript|登录|首页/.test(m[2])) continue;
        items.push({t:m[2].trim(), u:m[1]});
      }
    }
    if(!items.length){ alert('该站暂无解析到文章链接（可能反爬或为动态页），已保留信源卡片，每日云端任务会继续尝试'); return; }
    var exist = {};
    var srcName = (subs.find(function(s){ return s.url===url; })||{}).name || '外部接入';
    items.forEach(function(x){
      if(exist[x.u]) return; exist[x.u]=1;
      extItems.push({t:x.t, u:x.u, dt:new Date().toISOString().slice(0,10),
        r:(subs.find(function(s){return s.url===url;})||{}).region||'亳州',
        s:srcName, m:{}});
    });
    renderList();
  }).catch(function(){
    var el = document.getElementById('extload'); if(el) el.remove();
    alert('抓取失败：目标站反爬或网络受限。已保留信源，每日云端任务会继续尝试。');
  });
}

/* ---------- 弹窗（增强：外部网址自动接入） ---------- */
function openModal(){
  document.getElementById('modal').hidden=false;
  document.getElementById('f_name').value='';
  document.getElementById('f_url').value='';
  document.getElementById('f_region').value='';
  document.getElementById('f_hint').textContent = '粘贴任意新闻/政府网站网址（https://…）→ 保存后点该信源卡「⚡抓取该站」即可拉取最新内容';
}
document.getElementById('f_cancel').onclick = function(){ document.getElementById('modal').hidden=true; };
document.getElementById('f_save').onclick = function(){
  var n=document.getElementById('f_name').value.trim();
  var u=document.getElementById('f_url').value.trim()||'#';
  var r=document.getElementById('f_region').value.trim()||'亳州';
  if(!n){ alert('请填写信源名称'); return; }
  subs.push({name:n, url:u, region:r, note:u.indexOf('http')===0?'外部接入站':'公众号搜索词'});
  saveSubs();
  document.getElementById('modal').hidden=true;
  renderSrcCards(); renderList();
};

/* ---------- 渲染入口 ---------- */
function renderAll(){
  subs = [];
  try{ subs = JSON.parse(lsGet('bz_subs')||'[]'); }catch(e){}
  var m = document.getElementById('meta');
  if(m && !m.dataset.done){
    var ns = 0; CH.forEach(function(c){ ns += (c.sources||[]).length; });
    m.innerHTML = '生成 ' + (D.generated_at||'') + '<br>' + ITEMS.length + ' 条 · ' + CH.length + ' 频道 · ' + ns + ' 源';
    m.dataset.done = '1';
  }
  var cs = channelsOfGroup(state.grp);
  var cur = chById(state.ch);
  if(state.grp!=='我的订阅' && (!cur || cs.indexOf(cur)<0)){ state.ch = cs.length?cs[0].id:null; state.src='全部'; state.sub=null; }
  renderGroups(); renderChannels(); renderSrcFilter(); renderSrcCards(); renderList();
}
document.getElementById('showImg').onchange = function(){ renderList(); };
document.getElementById('logout').onclick = function(e){ e.preventDefault(); if(confirm('退出当前账号？')) logout(); };
document.querySelector('.bottomnav').addEventListener('click', function(e){
  var b = e.target.closest('button'); if(!b) return;
  Array.prototype.forEach.call(this.querySelectorAll('button'), function(x){ x.classList.remove('on'); });
  b.classList.add('on');
  var act = b.getAttribute('data-act');
  if(act==='home' || act==='kaokao'){ state.grp='考公赛道'; }
  else if(act==='channels'){ state.grp='学习强国频道'; }
  else if(act==='chuangye'){ state.grp='创业赛道'; }
  else if(act==='mine'){ state.grp='我的订阅'; }
  var cs = channelsOfGroup(state.grp);
  state.ch = cs.length ? cs[0].id : null;
  state.src='全部'; state.sub=null;
  renderAll(); window.scrollTo({top:0, behavior:'smooth'});
});
var bt = document.getElementById('backtop');
window.addEventListener('scroll', function(){ bt.style.display = window.scrollY>600 ? 'flex' : 'none'; });
bt.onclick = function(){ window.scrollTo({top:0, behavior:'smooth'}); };

try{ auth ? enter() : showLoginCard(); }
catch(err){
  document.getElementById('list').innerHTML = '<div style="padding:24px;color:#B00000;font-size:14px">页面渲染异常：'+esc(err.message)+'，请刷新</div>';
}
})();
