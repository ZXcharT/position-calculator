/* Presentation-only local trial: partial-input geometry uses the incumbent price equations.
 * Complete protection activation and protection/retained-profit values come from the native result.
 * No engine replacement, synthetic history, storage access, network or time-series claims.
 */
'use strict';
(() => {
  const $=id=>document.getElementById(id);
  const number=id=>$(id).value.trim()===''?null:Number($(id).value);
  const valid=n=>Number.isFinite(n)&&n>0;
  const money=n=>{const v=n.toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2}),unit=document.body.dataset.calcUnit;return unit==='USDT'?v+' USDT':(unit==='USD'?'$':'¥')+v;};
  const pct=n=>Number.isFinite(n)?Math.abs(n).toFixed(2)+'%':'—';
  const escape=text=>String(text).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const panels={};
  function colors(){const s=getComputedStyle(document.documentElement);return Object.fromEntries(['ink','text','muted','line','red','green','accent','warm'].map(name=>[name,s.getPropertyValue('--oc-'+name).trim()]));}
  function stat(name,value,tone=''){return {name,value,tone};}
  function pit(){
    const top=number('pitTopPrice'),bottom=number('pitBottomPrice'),current=number('pitCurrentPrice');
    if([top,bottom,current].some(n=>n!==null&&!valid(n)) || (top!==null&&bottom!==null&&bottom>=top))return {invalid:true,caption:'请修正价格参数后查看示意图。'};
    const points=[];if(top!==null)points.push({id:'top',name:'坑口',value:top,x:.10,color:'warm'});if(bottom!==null)points.push({id:'bottom',name:'坑底',value:bottom,x:.43,color:'green'});
    const target=top!==null&&bottom!==null?top*2-bottom:null;
    if(target!==null&&!valid(target))return {invalid:true,caption:'目标价格超出可显示范围，请检查输入。'};
    if(target!==null)points.push({id:'target',name:'出坑目标',value:target,x:.94,color:'red',dashed:true});
    if(current!==null)points.push({id:'current',name:'当前价',value:current,x:.69,color:'accent'});
    const stats=[];let caption=target===null?'填入坑口与坑底，确定经验目标价。':'目标价已确定；再填当前价，查看与目标的距离。';let band=null;
    if(target!==null)stats.push(stat('出坑目标价',money(target),'gain'));
    if(target!==null&&current!==null){
      const delta=target-current,relative=delta/current*100;
      if(delta>0){stats.push(stat('距目标还需上涨','+'+pct(relative),'gain'));caption='';}
      else if(delta<0){stats.push(stat('当前价高出目标',money(-delta),'gain'));stats.push(stat('回落至目标的幅度','−'+pct(relative),'loss'));caption='';}
      else{stats.push(stat('当前价已到目标','0.00%'));caption='';}
      band={from:current,to:target,color:delta>=0?'red':'green',x:.66,width:.28};
    }
    return {points,stats,caption,band,segments:top!==null&&bottom!==null?[{from:'top',to:'bottom',color:'green'},{from:'bottom',to:'target',color:'red',dashed:true}]:[],note:'经验价格关系示意，横向位置不是时间，不代表未来走势。'};
  }
  function protect(){
    const entry=number('protectEntryPrice'),stop=number('protectStopPrice'),high=number('protectHighPrice'),rr=number('protectRR'),retrace=number('retracePercent');
    if([entry,stop,high].some(n=>n!==null&&!valid(n)) || (entry!==null&&stop!==null&&stop>=entry) || !valid(rr) || !valid(retrace)||retrace<10||retrace>80)return {invalid:true,caption:'请检查价格关系与利润回撤比例（10%—80%）。'};
    const points=[],stats=[],segments=[],bands=[];
    if(entry!==null)points.push({id:'entry',name:'买入价',value:entry,x:.10,color:'ink'});
    if(stop!==null)points.push({id:'stop',name:'初始止损',value:stop,x:.10,color:'green',dashed:true});
    const target=entry!==null&&stop!==null?entry+(entry-stop)*rr:null;
    if(target!==null&&!valid(target))return {invalid:true,caption:'目标价格超出可显示范围，请检查输入。'};
    if(target!==null)points.push({id:'target',name:'目标收益价',value:target,x:.94,color:'red',dashed:true});
    if(high!==null)points.push({id:'high',name:'最高价',value:high,x:.58,color:'warm'});
    if(entry!==null&&high!==null)segments.push({from:'entry',to:'high',color:high>=entry?'red':'green'});
    if(entry!==null&&target!==null&&high===null)segments.push({from:'entry',to:'target',color:'red',dashed:true});
    let caption='填入买入价与止损价，确定目标收益价；再填最高价，判断是否达到保护条件。';
    if(target!==null)stats.push(stat('目标收益价 · '+rr+':1',money(target),'gain'));
    if(target!==null&&high!==null){
      // Reuse the original rounded-RR threshold, rather than inventing a different activation rule.
      const active=$('protectEmptyState').classList.contains('hidden')&&!$('retraceResultBox').classList.contains('hidden');
      if(active){
        const protection=Number($('retracePrice').textContent),locked=Number($('lockedProfit').textContent);
        if(!valid(protection))return {invalid:true,caption:'保护结果尚未就绪，请检查参数。'};
        points.push({id:'protection',name:'回撤保护价',value:protection,x:.94,color:'accent'});segments.push({from:'high',to:'protection',color:'green',dashed:true});
        bands.push({from:entry,to:protection,color:'red',x:.12,width:.43},{from:protection,to:high,color:'green',x:.58,width:.36});
        stats.push(stat('回撤保护价',money(protection)),stat('保护价对应浮盈',(locked>0?'+':locked<0?'−':'')+pct(locked),locked>0?'gain':locked<0?'loss':''));
        caption='允许回吐浮盈的 '+retrace+'%，不是股价跌幅。';
      }else{
        const missing=Math.max(0,target-high);stats.push(stat('距目标收益价',money(missing),missing>0?'gain':''));
        caption='尚未达到目标收益，不启用回撤保护价。'+(missing>0?'最高价还需上涨 '+pct(missing/high*100)+' 才到目标价。':'是否达标沿用现有盈亏比精度。');
      }
    }
    return {points,stats,caption,segments,bands,note:'回撤比例针对浮盈；仅为价格关系示意，不代表行情或实际止盈指令。'};
  }
  function svg(model,width,c){
    const height=340,left=24,right=width-24,plotWidth=right-left,top=54,bottom=height-54;
    // Stop remains in the input panel; once entry is known it need not compete with profit landmarks.
    const landmarks=model.points.filter(point=>point.id!=='stop'||!model.points.some(p=>p.id==='entry'));
    const values=landmarks.map(p=>p.value),low=Math.min(...values),high=Math.max(...values),span=Math.max(high-low,Math.abs(high)*.08,.01),min=low-span*.12,max=high+span*.12;
    const y=value=>top+(max-value)/(max-min)*(bottom-top),x=f=>left+f*plotWidth;
    const points=landmarks.map(point=>({...point,px:x(point.x),py:y(point.value)}));
    const byId=Object.fromEntries(points.map(point=>[point.id,point]));
    const curves=(model.segments||[]).map(segment=>{const a=byId[segment.from],b=byId[segment.to];if(!a||!b)return null;const dx=b.px-a.px;return {...segment,a,b,c1:{px:a.px+dx*.45,py:a.py},c2:{px:b.px-dx*.45,py:b.py}};}).filter(Boolean);
    const at=(curve,t)=>{const u=1-t;return {px:u*u*u*curve.a.px+3*u*u*t*curve.c1.px+3*u*t*t*curve.c2.px+t*t*t*curve.b.px,py:u*u*u*curve.a.py+3*u*u*t*curve.c1.py+3*u*t*t*curve.c2.py+t*t*t*curve.b.py};};
    const rebound=curves.find(curve=>curve.from==='bottom'&&curve.to==='target'),current=byId.current;
    if(rebound&&current&&current.value>=rebound.a.value&&current.value<=rebound.b.value){
      // Place current price on the schematic rebound without changing its price-height mapping.
      let lo=0,hi=1;for(let i=0;i<24;i++){const mid=(lo+hi)/2;if(at(rebound,mid).py>current.py)lo=mid;else hi=mid;}current.px=at(rebound,(lo+hi)/2).px;
    }
    let body='';
    for(const curve of curves)body+=`<path data-price-curve="${curve.from}-${curve.to}" d="M${curve.a.px},${curve.a.py} C${curve.c1.px},${curve.c1.py} ${curve.c2.px},${curve.c2.py} ${curve.b.px},${curve.b.py}" fill="none" stroke="${c[curve.color]}" stroke-width="2.5" stroke-linecap="round" ${curve.dashed?'stroke-dasharray="5 6"':''}/>`;
    if(byId.target){const p=byId.target;body+=`<line x1="${Math.max(left,p.px-42)}" y1="${p.py}" x2="${Math.min(right,p.px+12)}" y2="${p.py}" stroke="${c.muted}" stroke-opacity=".45" stroke-dasharray="3 5"/>`;}
    const samples=curves.flatMap(curve=>Array.from({length:25},(_,i)=>at(curve,i/24)));
    const used=[],priority=['current','protection','high','target','entry','bottom','top','stop'];
    const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
    const overlap=(a,b)=>Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
    const inside=(p,b,pad=3)=>p.px>b.x-pad&&p.px<b.x+b.w+pad&&p.py>b.y-pad&&p.py<b.y+b.h+pad;
    const gain=(model.stats||[]).find(item=>item.name==='保护价对应浮盈');
    if(byId.entry&&byId.protection&&gain){
      const a=byId.entry,b=byId.protection,bx=x(.72),ya=Math.min(a.py,b.py),yb=Math.max(a.py,b.py),w=Math.max(gain.name.length*11,gain.value.length*7.6)+8,h=34;
      const yy=clamp((ya+yb)/2-h/2+(yb-ya>90?14:0),12,height-h-12);
      const choices=[bx-w-14,bx+14].map(xx=>({x:clamp(xx,12,width-w-12),y:yy,w,h}));
      choices.sort((a,b)=>samples.filter(p=>inside(p,a,3)).length-samples.filter(p=>inside(p,b,3)).length);
      const box=choices[0];used.push(box);
      const color=gain.tone==='gain'?c.red:gain.tone==='loss'?c.green:c.ink;
      body+=`<path data-price-range="protected-profit" d="M${bx-5},${ya} H${bx} V${yb} H${bx-5}" fill="none" stroke="${color}" stroke-opacity=".5" stroke-width="1.2"/>`;
      body+=`<g data-price-annotation="protected-profit"><text x="${box.x}" y="${box.y+11}" font-size="11" fill="${c.muted}">${gain.name}</text><text x="${box.x}" y="${box.y+29}" font-size="13" font-weight="500" fill="${color}">${escape(gain.value)}</text></g>`;
    }
    for(const point of [...points].sort((a,b)=>priority.indexOf(a.id)-priority.indexOf(b.id))){
      const w=Math.max(point.name.length*11,money(point.value).length*7.6)+8,h=34;
      const above=[point.px-w/2,point.py-50],below=[point.px-w/2,point.py+16];
      const preferBelow=['current','protection','entry','bottom','stop'].includes(point.id);
      const candidates=[...(preferBelow?[below,above]:[above,below]),[point.px+14,point.py-16],[point.px-w-14,point.py-16],[point.px+12,point.py-50],[point.px-w-12,point.py+16]];
      for(const xx of [12,width-w-12,width/2-w/2])for(const yy of [12,height-h-12,point.py-86,point.py+54])candidates.push([xx,yy]);
      let chosen=null,best=Infinity;
      for(const [xx,yy] of candidates){
        const box={x:clamp(xx,12,width-w-12),y:clamp(yy,12,height-h-12),w,h};
        const collision=used.reduce((sum,other)=>sum+overlap({...box,x:box.x-4,y:box.y-4,w:w+8,h:h+8},other),0);
        const score=collision*1000+points.filter(p=>inside(p,box,5)).length*2000+samples.filter(p=>inside(p,box,2)).length*120+Math.hypot(point.px-(box.x+w/2),point.py-(box.y+h/2));
        if(score<best){best=score;chosen=box;}
      }
      used.push(chosen);
      const color=['current','protection'].includes(point.id)?c.accent:c.ink;
      const endX=clamp(point.px,chosen.x,chosen.x+w),endY=clamp(point.py,chosen.y,chosen.y+h);
      if(Math.hypot(endX-point.px,endY-point.py)>12)body+=`<path d="M${point.px},${point.py} L${endX},${endY}" fill="none" stroke="${c.line}" stroke-width="1"/>`;
      body+=`<circle data-price-point="${point.id}" cx="${point.px}" cy="${point.py}" r="${point.id==='current'||point.id==='protection'?4.5:3}" fill="${color}"/>`;
      body+=`<g data-price-role="${point.id}"><text x="${chosen.x}" y="${chosen.y+11}" font-size="11" fill="${c.muted}">${point.name}</text><text x="${chosen.x}" y="${chosen.y+29}" font-size="13" font-weight="500" fill="${color}">${unitSVG(money(point.value))}</text></g>`;
    }
    const description=points.map(point=>point.name+' '+money(point.value)).join('，');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escape(description)}" font-family="-apple-system,BlinkMacSystemFont,PingFang SC,sans-serif">${body}</svg>`;
  }
  const unitHTML=value=>{const text=String(value);return text.endsWith(' USDT')?escape(text.slice(0,-5))+' <small class="price-money-unit">USDT</small>':escape(text);};
  const unitSVG=value=>{const text=String(value);return text.endsWith(' USDT')?escape(text.slice(0,-5))+' <tspan font-size="8" font-weight="400" opacity=".8">USDT</tspan>':escape(text);};
  function render(flow){
    const panel=panels[flow];if(!panel)return;
    const model=flow==='pit'?pit():protect();const c=colors();
    panel.summary.innerHTML=(model.stats||[]).map(item=>`<div><dt>${escape(item.name)}</dt><dd class="${item.tone?'is-'+item.tone:''}">${unitHTML(item.value)}</dd></div>`).join('');
    panel.caption.textContent=model.caption||'';panel.caption.parentElement.hidden=!model.caption;
    if(model.invalid||!model.points.length){panel.plot.innerHTML='<div class="price-diagram-empty">'+(model.invalid?'请修正参数后查看价格关系':'填写价格，示意图将逐步出现')+'</div>';panel.root.dataset.stage=model.invalid?'invalid':'empty';}
    else {panel.plot.innerHTML=svg(model,Math.max(300,Math.round(panel.plot.getBoundingClientRect().width)),c);panel.root.dataset.stage='ready';}
  }
  function mount(flow){
    const host=$('page-'+flow);host.classList.add('diagram-workflow');
    const root=document.createElement('section');root.id=flow+'-price-diagram';root.className='price-diagram';root.setAttribute('aria-label',flow==='pit'?'出坑价格关系示意':'利润回撤保护示意');
    root.innerHTML='<dl class="price-diagram-summary" aria-live="polite"></dl><div class="price-diagram-plot"></div>';
    host.querySelector('.space-y-4>.glass-panel>h2').after(root);
    const grid=host.firstElementChild,parameters=grid.firstElementChild,results=grid.lastElementChild;
    const tips=[...results.children].find(node=>node.querySelector('h3'));
    tips.className='price-diagram-tips';
    const list=tips.querySelector('ul');list.className='';
    list.innerHTML='<li><p class="price-diagram-caption"></p></li>'+(flow==='pit'?'<li>距目标的涨跌幅以当前价为基准。</li>':'')+'<li>曲线仅示意价格关系，不代表实际走势。</li>';
    parameters.append(tips);
    panels[flow]={root,summary:root.querySelector('dl'),plot:root.querySelector('.price-diagram-plot'),caption:tips.querySelector('.price-diagram-caption')};
  }
  let pending=false;
  const schedule=()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;for(const flow of ['pit','protect'])if($('page-'+flow).classList.contains('active'))render(flow);});};
  document.addEventListener('onechart:currencychange',schedule);
  mount('pit');mount('protect');
  for(const type of ['input','change','click'])document.addEventListener(type,schedule);
  new ResizeObserver(schedule).observe(document.querySelector('.oc-shell'));
  new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  schedule();
})();
