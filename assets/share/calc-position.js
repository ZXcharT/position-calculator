/* Local RR-input trial. Reuses the incumbent calculator and price/profit equations.
 * Only the active mode/buy-point preset in memory changes; no persistence or history writes.
 */
'use strict';
(() => {
  const $=id=>document.getElementById(id);
  // Keep the incumbent baseline parameters, without exposing the old personality selector.
  if(currentMode!=='courage')setPersonalityMode('courage');
  const oldProfile=$('mode-courage').parentElement;
  oldProfile.style.display='none';oldProfile.setAttribute('aria-hidden','true');
  document.querySelectorAll('#page-position li').forEach(item=>{if(item.textContent.includes('性格模式'))item.lastElementChild.textContent='两个目标盈亏比可在结果区分别调整。';});
  const controls=[{id:'positionBreakevenRR',badge:'breakevenRRBadge',name:'脱离成本区盈亏比',table:BREAKEVEN_RR},{id:'positionTargetRR',badge:'targetRRBadge',name:'目标收益盈亏比',table:MODE_RR}];
  function valid(control){const n=Number(control.input.value);return control.input.value!==''&&Number.isFinite(n)&&n>0&&Number.isFinite(n*10)&&Math.abs(n*10-Math.round(n*10))<1e-7;}
  function sync(reset=false){
    for(const control of controls){
      const n=control.table[currentMode][currentTradeType];
      if(reset)control.input.value=String(n);
      const good=valid(control);control.input.setAttribute('aria-invalid',String(!good));control.card.classList.toggle('position-rr-invalid',!good);control.error.hidden=good;
      $(control.badge).textContent=formatRR(n);
    }
    $('typeRRHint').textContent='对应理想盈亏比'+formatRR(getRRRatio(currentTradeType));
  }
  for(const control of controls){
    const badge=$(control.badge);control.card=badge.closest('.breakeven-card,.target-card-red');
    const editor=document.createElement('label');editor.className='position-rr-editor';editor.title='可调整，最多一位小数；仅在本次页面保留';
    editor.innerHTML='<span class="visually-hidden">'+control.name+'</span><input id="'+control.id+'" type="number" min="0.1" step="0.1" inputmode="decimal" aria-label="'+control.name+'"><span aria-hidden="true">:1</span>';
    badge.classList.add('position-rr-original');badge.setAttribute('aria-hidden','true');badge.before(editor);
    control.input=$(control.id);const error=document.createElement('p');error.id=control.id+'Error';error.className='position-rr-error';error.hidden=true;error.textContent='盈亏比须大于 0，最多保留一位小数。';error.setAttribute('role','status');control.card.append(error);control.error=error;control.input.setAttribute('aria-describedby',error.id);
    control.input.addEventListener('input',()=>{
      if(valid(control)){
        control.table[currentMode][currentTradeType]=Number(control.input.value);
        calculatePosition(); // Incumbent engine, with an explicitly edited RR parameter only.
      }
      sync();
    });
    control.input.addEventListener('blur',()=>sync());
  }
  document.addEventListener('click',event=>{if(event.target.closest('.type-btn'))sync(true);});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>sync(true),{once:true});else sync(true);
})();
