/* One workspace, three parameter sets, no persistence, account access or provider requests. */
'use strict';
(() => {
  const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const meta={crypto:{name:'加密',currency:'USDT',unit:'交易单位',multiplier:'每交易单位包含的币数',hint:'按币数量下单时填1；按合约张数下单时填写平台合约面值。数量步长、最小数量须按平台填写。'},futures:{name:'期货',currency:'USD',unit:'张',multiplier:'每点价值（$ / 张）',hint:'使用正价格线性期货；每点价值、每张初始保证金按实际合约及券商填写，不从自选杠杆反推。'},stocks:{name:'美股',currency:'USD',unit:'股',multiplier:'每股乘数',hint:'按券商允许值填写整股或碎股步长。资金占用比例须使用券商实际口径，不把卖空所得重复当作可用资金。'}};
  const defaults=type=>({side:'long',equity:'',available:'',riskPct:'2',entry:'',stop:'',rr1:'1',rr2:'3',multiplier:type==='futures'?'':'1',step:type==='crypto'?'':'1',minQty:type==='crypto'?'':'1',minNotional:'',priceStep:'',leverage:'',marginPerUnit:'',marginPct:'',feeMode:type==='crypto'?'rate':'unit',feeEntry:'',feeExit:'',slippage:'',carry:'',marginMode:'unknown',stopBasis:'unknown',liquidation:''});
  const demos={crypto:{equity:'10000',available:'5000',riskPct:'2',entry:'100',stop:'98',multiplier:'1',step:'0.001',minQty:'0.001',minNotional:'5',priceStep:'0.01',leverage:'5',marginMode:'isolated',stopBasis:'mark',feeMode:'rate',feeEntry:'0.04',feeExit:'0.06',slippage:'0.1',carry:'0'},futures:{equity:'20000',available:'8000',riskPct:'2',entry:'5000',stop:'4980',multiplier:'5',step:'1',minQty:'1',minNotional:'0',priceStep:'0.25',marginPerUnit:'1500',feeMode:'unit',feeEntry:'1.2',feeExit:'1.2',slippage:'0.25',carry:'0'},stocks:{equity:'10000',available:'6000',riskPct:'2',entry:'100',stop:'95',multiplier:'1',step:'1',minQty:'1',minNotional:'0',priceStep:'0.01',marginPct:'100',feeMode:'unit',feeEntry:'0.005',feeExit:'0.005',slippage:'0.05',carry:'0'}};
  const field=(key,name,options={})=>`<label class="mm-field ${options.wide?'wide':''}" data-mm-field="${key}"><span>${name}</span>${options.choices?`<select id="mm-${key}">${options.choices.map(([value,label])=>`<option value="${value}">${label}</option>`).join('')}</select>`:`${options.money?'<div class="mm-money-input">':''}<input id="mm-${key}" type="number" step="any" inputmode="decimal">${options.money?'<b class="mm-input-currency">USDT</b></div>':''}`}</label>`;
  const root=document.createElement('section');root.id='multi-market-workspace';root.hidden=true;
  root.innerHTML=`<div class="mm-head"><div class="mm-category" role="group" aria-label="产品类别">${Object.entries(meta).map(([key,m])=>`<button type="button" data-mm-type="${key}" aria-pressed="${key==='crypto'}">${m.name}</button>`).join('')}</div><button type="button" id="mm-demo" class="mm-demo">填入本类演示参数</button></div>
  <p class="mm-currency-note">参数仅本页保留，刷新清空；三类草稿分开保存，不自动换算币种。当前全部金额以 <strong id="mm-currency-name">USDT</strong> 为单位。</p><p id="mm-demo-note" class="mm-demo-note" hidden>当前含演示参数：不是实时行情、实际保证金或平台费率，请逐项核对。</p>
  <div class="mm-workspace"><form id="mm-form" class="mm-form"><h2>交易与风险参数</h2>
  <div class="mm-fields mm-budget-fields">${field('equity','账户总资金',{money:true})}<div class="mm-budget-field"><span id="mm-budget-label">单笔风险金额</span><output id="mm-risk-budget" aria-labelledby="mm-budget-label" class="risk-amount">0</output></div>${field('side','交易方向',{choices:[['long','做多'],['short','做空']]})}</div>
  <section class="mm-risk-panel" aria-label="单笔风险预算"><div class="mm-risk-heading"><div><label for="mm-riskPct">单笔风险：<output id="mm-risk-value" for="mm-riskPct">2.00%</output></label><a href="https://simu.onechart.top/" target="_blank" rel="noopener noreferrer" title="打开概率模拟；本模式暂不自动应用A股买点建议">前往概率模拟</a></div><span id="mm-risk-level" class="risk-level-tag risk-moderate" title="仅按预算比例分档，不代表杠杆或强平安全">稳健</span></div><input id="mm-riskPct" type="range" min="0.1" max="5" step="0.05" value="2" aria-label="单笔风险比例" aria-describedby="mm-budget-basis"><div class="mm-risk-ticks" aria-hidden="true">${[0.1,0.5,1,1.5,2,3,4,5].map(v=>`<span style="left:${(v-0.1)/4.9*100}%">${v}</span>`).join('')}</div></section>
  <p id="mm-budget-basis" class="mm-help mm-budget-help">总资金按账户净值填；单笔风险金额 = 总资金 × 风险比例，不随杠杆改变。</p>
  <div class="mm-fields mm-price-fields">${field('entry','开仓价格')}${field('stop','止损触发价')}${field('rr1','第一目标 · 价差RR')}${field('rr2','第二目标 · 价差RR')}
  </div><details open><summary>数量规格与资金约束</summary><div class="mm-fields">
  ${field('available','本笔可用资金',{money:true})}${field('multiplier','<span id="mm-multiplier-label">每交易单位包含的币数</span>')}${field('step','数量步长')}${field('minQty','最小下单量')}${field('minNotional','最小名义金额（可选）')}${field('priceStep','价格步长（可选）')}${field('leverage','杠杆倍数')}${field('marginPerUnit','每张初始保证金（$）')}${field('marginPct','实际资金占用比例（%）')}
  </div><p id="mm-spec-help" class="mm-help"></p></details>
  <details><summary>费用、滑点与持仓成本</summary><div class="mm-fields">
  ${field('feeMode','费用计价方式',{wide:true,choices:[['rate','按成交金额费率（%）'],['unit','按每交易单位金额']]})}${field('feeEntry','开仓费率 / 单位费')}${field('feeExit','平仓费率 / 单位费')}${field('slippage','止损滑点（价格单位）')}${field('carry','预计持仓成本（总金额）')}
  </div><p class="mm-help">金额费用与账户使用同一币种。持仓成本可含资金费、借券费或融资利息；不使用尚未取得的收入扩大风险预算。未填成本按0估算并明确提示。</p></details>
  <details id="mm-liquidation-details"><summary>强平参考校验（不保证执行）</summary><div class="mm-fields">
  ${field('marginMode','账户保证金模式',{choices:[['unknown','未确认'],['isolated','逐仓'],['cross','全仓']]})}${field('stopBasis','止损触发基准',{choices:[['unknown','未确认'],['mark','标记价格'],['last','最新成交价 / 其他']]})}${field('liquidation','平台强平参考价（可选）',{wide:true})}
  </div><p class="mm-help">强平价须从平台取得。全仓还受其他仓位及抵押资产影响，本工具不模拟完整账户强平。</p></details>
  </form><div id="mm-result" class="mm-result" aria-label="多市场计算结果" aria-live="polite"></div></div>
  <p class="mm-limit">多空开仓测算：仅正价格线性产品，不覆盖期权、币本位反向或负价合约。不接账户、不核验真实下单权限；永久预设尚未接入；出坑与回撤保护维持原流程。</p>`;
  const opening=$('page-position'),nativeOpening=opening.querySelector(':scope>.grid');opening.append(root);
  const nativeHeading=$('mode-courage').parentElement.parentElement;
  const multiHeading=document.createElement('div');multiHeading.className='mm-form-heading';
  const multiTitle=root.querySelector('.mm-form>h2');multiTitle.textContent='交易参数';multiTitle.before(multiHeading);multiHeading.append(multiTitle);
  // Category and currency belong to the parameter column, below the shared opening-mode switch.
  multiHeading.after(root.querySelector('.mm-head'),root.querySelector('.mm-currency-note'),$('mm-demo-note'));
  const mode=document.createElement('div');mode.className='mm-mode';mode.setAttribute('role','group');mode.setAttribute('aria-label','开仓计算模式');mode.innerHTML='<button type="button" data-mm-mode="ashare" aria-pressed="true">A股</button><button type="button" data-mm-mode="multi" aria-pressed="false">多空杠杆</button>';
  let type='crypto',drafts={},demoFlags={},openingMode='ashare',settled=null;
  const keys=Object.keys(defaults(type));
  const read=()=>Object.fromEntries(keys.map(key=>[key,$('mm-'+key).value]));
  function load(values){for(const key of keys)$('mm-'+key).value=values[key]??'';}
  const fmt=(n,digits=2)=>Number.isFinite(n)?n.toLocaleString('zh-CN',{maximumFractionDigits:digits,minimumFractionDigits:digits}):'—';
  const amount=n=>meta[type].currency==='USD'?'$'+fmt(n):fmt(n)+' USDT';
  const signedAmount=n=>(n>0?'+':n<0?'−':'')+amount(Math.abs(n));
  const unitHTML=value=>{const text=String(value);return text.endsWith(' USDT')?esc(text.slice(0,-5))+' <small class="mm-money-unit">USDT</small>':esc(text);};
  const price=n=>Number.isFinite(n)?n.toLocaleString('zh-CN',{maximumSignificantDigits:12}):'—';
  const signed=n=>(n>0?'+':n<0?'−':'')+fmt(Math.abs(n));
  const direction=n=>n>0?'mm-gain':n<0?'mm-loss':'';
  function showFields(){
    for(const key of ['multiplier','leverage','marginPerUnit','marginPct'])root.querySelector(`[data-mm-field=${key}]`).hidden=key==='multiplier'?type==='stocks':key==='leverage'?type!=='crypto':key==='marginPerUnit'?type!=='futures':type!=='stocks';
    root.querySelectorAll('.mm-input-currency').forEach(el=>{el.textContent=meta[type].currency==='USD'?'$':'USDT';el.parentElement.dataset.unit=meta[type].currency;});$('mm-currency-name').textContent=meta[type].currency==='USD'?'$':meta[type].currency;$('mm-multiplier-label').textContent=meta[type].multiplier;$('mm-spec-help').textContent=meta[type].hint;$('mm-liquidation-details').hidden=type!=='crypto';$('mm-demo-note').hidden=!demoFlags[type];
    root.querySelectorAll('[data-mm-type]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mmType===type)));
  }
  function syncRiskBudget(){
    const equity=Number($('mm-equity').value),pct=Number($('mm-riskPct').value);
    const budget=Number.isFinite(equity)&&equity>0&&Number.isFinite(pct)?equity*pct/100:0;
    const display=fmt(budget,Math.abs(budget)>=10000?0:2),dollars=meta[type].currency==='USD';
    $('mm-risk-budget').innerHTML=(dollars?'<small>$</small>':'')+'<span style="font-size:'+(display.length>12?16:display.length>8?20:24)+'px">'+esc(display)+'</span>'+(dollars?'':' <small style="font-size:'+(display.length>8?8:10)+'px">USDT</small>');
    $('mm-risk-budget').title='单笔风险预算 '+amount(budget)+'（仅显示四舍五入，计算使用原值）';
    $('mm-risk-value').textContent=fmt(pct)+'%';
    const index=pct<=1?0:pct<=2?1:pct<=3?2:pct<=4?3:4;
    $('mm-risk-level').textContent=['保守','稳健','积极','重仓','激进'][index];
    $('mm-risk-level').className='risk-level-tag '+['risk-conservative','risk-moderate','risk-aggressive','risk-heavy','risk-extreme'][index];
    $('mm-riskPct').setAttribute('aria-valuetext',fmt(pct)+'%，单笔风险金额 '+fmt(budget)+' '+meta[type].currency);
  }
  function render(){
    syncRiskBudget();
    for(const [key,name] of [['feeEntry','开仓'],['feeExit','平仓']])root.querySelector(`[data-mm-field=${key}]>span`).textContent=$('mm-feeMode').value==='rate'?name+'费率（%）':name+'费（'+(meta[type].currency==='USD'?'$':'USDT')+'/'+meta[type].unit+'）';
    const params=read(),result=OneChartMultiMarket.calculate({type,...params});settled={type,params,result,demo:!!demoFlags[type],meta:meta[type]};const host=$('mm-result');host.dataset.status=result.status;
    if(result.status!=='ready'){
      host.innerHTML='<h2>计算结果</h2><p class="mm-status '+(result.status==='no-trade'?'is-alert':'')+'">'+esc(result.message)+'</p>'+(result.budget!=null?'<p class="mm-help">当前单笔风险预算 '+esc(amount(result.budget))+'；数量不足时不会强行扩大风险。</p>':'');return;
    }
    const m=(name,value,note='',cls='')=>`<div><dt>${name}</dt><dd class="${cls}">${value}</dd>${note?'<small>'+note+'</small>':''}</div>`;
    const metrics=m('建议数量',fmt(result.quantity,result.quantityPrecision)+' '+meta[type].unit,'已按数量步长向下取整')+m('名义仓位',unitHTML(amount(result.notional)),'账户名义敞口 '+fmt(result.exposure)+' 倍')+m('初始保证金 / 资金占用',unitHTML(amount(result.margin)),'不等同于名义仓位')+m('预计止损损失',unitHTML(amount(result.risk)),'占账户 '+fmt(result.riskPercent)+'% · 含已填费用','mm-risk');
    const bars=(name,value,maximum,cls)=>`<div><div class="mm-bar-caption"><span>${name}</span><span>${fmt(value/maximum*100)}%</span></div><div class="mm-bar ${cls}"><span style="width:${Math.max(0,Math.min(100,value/maximum*100))}%"></span></div></div>`;
    const goals=result.goals.map((g,i)=>`<section><h3>第${i?'二':'一'}目标 · 价差 ${fmt(g.rr,1)}R</h3>${g.reachable?`<dl><dt>理论目标价</dt><dd>${price(g.price)}</dd>${g.priceAligned?'':'<dd><small class="mm-help">目标不符合所填价格步长，未自动调整。</small></dd>'}<dt>预计净收益</dt><dd class="${direction(g.net)}">${unitHTML(signedAmount(g.net))}</dd><dt>含成本净盈亏比 / 账户收益</dt><dd class="${direction(g.net)}">${fmt(g.netRR)}R / ${signed(g.accountReturn)}%</dd></dl>`:`<p class="mm-help">${esc(g.message)}</p>`}</section>`).join('');
    const priceColor=value=>value>result.entry?'var(--oc-red)':value<result.entry?'var(--oc-green)':'var(--oc-ink)';
    const points=[{name:'止损',price:result.stop,color:priceColor(result.stop)},{name:'开仓',price:result.entry,color:'var(--oc-ink)'},...result.goals.map((g,i)=>g.reachable?{name:'目标'+(i+1),price:g.price,color:priceColor(g.price)}:null).filter(Boolean)];
    const lo=Math.min(...points.map(p=>p.price)),hi=Math.max(...points.map(p=>p.price)),px=value=>20+(value-lo)/(hi-lo||1)*560;
    const scale='<div class="mm-price"><p>价格位置 · 等比例示意，非时间走势</p><svg viewBox="0 0 600 72" role="img" aria-label="'+esc(points.map(p=>p.name+' '+price(p.price)).join('，'))+'"><line x1="20" y1="36" x2="580" y2="36" stroke="var(--oc-line-strong)"/>'+points.map(p=>`<circle cx="${px(p.price)}" cy="36" r="4" fill="${p.color}"><title>${p.name} ${price(p.price)}</title></circle>`).join('')+'</svg><div class="mm-price-legend">'+points.map(p=>`<span><i style="background:${p.color}"></i>${p.name} ${price(p.price)}</span>`).join('')+'</div></div>';
    host.innerHTML='<h2>计算结果</h2><p class="mm-status '+(result.liquidationWarning?'is-alert':'')+'">约束来源：'+esc(result.limiting)+'。'+esc(result.liquidation)+'</p><dl class="mm-metrics">'+metrics+'</dl><div class="mm-bars">'+bars('止损损失 / 单笔风险预算',result.risk,result.budget,'risk')+bars('资金预留 / 本笔可用资金',result.fundsReserved,result.available,'')+'</div><p class="mm-help">资金预留 '+esc(amount(result.fundsReserved))+'，含已填开平仓费及预计持仓成本。保证金与费用均为估算，不替代平台冻结金额。</p><div class="mm-goals">'+goals+'</div>'+scale+'<ul class="mm-notes">'+result.notes.map(note=>'<li>'+esc(note)+'</li>').join('')+'</ul>';
  }
  function selectType(next){drafts[type]=read();type=next;load(drafts[type]||defaults(type));showFields();render();syncCurrencyUnits();}
  root.querySelectorAll('[data-mm-type]').forEach(button=>button.addEventListener('click',()=>selectType(button.dataset.mmType)));
  for(const event of ['input','change'])$('mm-form').addEventListener(event,eventObject=>{if(type==='stocks'&&eventObject.type==='change'&&eventObject.target.id==='mm-side')$('mm-marginPct').value='';drafts[type]=read();if(!settled||settled.type!==type||JSON.stringify(drafts[type])!==JSON.stringify(settled.params))render();});
  $('mm-form').addEventListener('submit',event=>{event.preventDefault();render();});
  $('mm-demo').addEventListener('click',()=>{
    const hasValues=['equity','available','entry','stop'].some(key=>$('mm-'+key).value!=='');
    if(hasValues&&!confirm('将替换当前类别的输入，不影响A股或其他类别。是否填入演示参数？'))return;
    load({...defaults(type),...demos[type]});demoFlags[type]=true;drafts[type]=read();showFields();render();
  });
  window.OneChartMultiMarketView={capture(){
    if(!settled||settled.result.status==='invalid')throw Error('请先填写有效参数，得到当前多空计算结果后再截图。');
    if(settled.type!==type||JSON.stringify(read())!==JSON.stringify(settled.params))throw Error('参数与当前结果不一致，请完成当前计算后再截图。');
    return structuredClone(settled);
  }};
  function syncCurrencyUnits(){
    const unit=openingMode==='multi'?meta[type].currency:'CNY',symbol=unit==='CNY'?'¥':unit==='USD'?'$':'USDT',changed=document.body.dataset.calcUnit!==unit;
    document.body.dataset.calcUnit=unit;
    for(const id of ['page-pit','page-protect']){
      const page=$(id),walker=document.createTreeWalker(page,NodeFilter.SHOW_TEXT),nodes=[];let node;
      while((node=walker.nextNode()))if(node.data.includes('¥')&&!node.parentElement.closest('svg'))nodes.push(node);
      for(const text of nodes){const parts=text.data.split('¥'),fragment=document.createDocumentFragment();parts.forEach((part,i)=>{if(i){const mark=document.createElement('span');mark.dataset.calcUnitMark='';fragment.append(mark);}fragment.append(document.createTextNode(part));});text.replaceWith(fragment);}
      page.querySelectorAll('[data-calc-unit-mark]').forEach(mark=>{mark.textContent=symbol;mark.style.fontSize=unit==='USDT'?'10px':'';});
      page.querySelectorAll('input[aria-label]').forEach(input=>{const name=input.getAttribute('aria-label');if(name.includes('元')&&!input.dataset.baseCurrencyLabel)input.dataset.baseCurrencyLabel=name;if(input.dataset.baseCurrencyLabel)input.setAttribute('aria-label',input.dataset.baseCurrencyLabel.replace(/元/g,unit==='CNY'?'元':symbol));});
    }
    if(changed)document.dispatchEvent(new Event('onechart:currencychange'));
  }
  function syncOpeningMode(){
    const multi=openingMode==='multi',active=opening.classList.contains('active'),heading=multi?multiHeading:nativeHeading;
    if(mode.parentElement!==heading)heading.append(mode);
    nativeOpening.classList.toggle('mm-hidden',multi);root.hidden=!multi;mode.dataset.mode=openingMode;
    document.body.dataset.calcMarketMode=multi&&active?'multi':'ashare';
    mode.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mmMode===openingMode)));
    syncCurrencyUnits();
    const share=document.querySelector('[data-share-global]');if(share){share.disabled=false;share.title='截图分享';}
  }
  function setMode(value){openingMode=value;syncOpeningMode();if(value==='multi')render();}
  mode.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{setMode(button.dataset.mmMode);button.focus({preventScroll:true});}));
  mode.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const value=['ArrowLeft','Home'].includes(event.key)?'ashare':'multi';setMode(value);mode.querySelector('[data-mm-mode='+value+']').focus({preventScroll:true});});
  document.addEventListener('click',event=>{if(event.target.closest('.tab-btn'))syncOpeningMode();});
  load(defaults(type));showFields();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setMode(openingMode),{once:true});else setMode(openingMode);
})();
