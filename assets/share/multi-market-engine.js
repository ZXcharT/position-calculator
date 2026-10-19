/* Pure local estimate for positive-price linear products. No account, network or storage access. */
(function(root){
  'use strict';
  function calculate(p){
    const fail=message=>({status:'invalid',message});
    const num=key=>p[key]===''||p[key]==null?NaN:Number(p[key]);
    const optional=key=>p[key]===''||p[key]==null?0:Number(p[key]);
    const type=p.type,side=p.side,sign=side==='long'?1:-1;
    if(!['crypto','futures','stocks'].includes(type)||!['long','short'].includes(side))return fail('请选择产品类别和交易方向。');
    const equity=num('equity'),available=num('available'),riskPct=num('riskPct'),entry=num('entry'),stop=num('stop');
    if(![equity,available,riskPct,entry,stop].every(Number.isFinite)||equity<=0||available<0||riskPct<=0||riskPct>100||entry<=0||stop<=0)return fail('请填写有效的账户权益、可用资金、风险比例和正数价格。');
    if(sign*(entry-stop)<=0)return fail(side==='long'?'做多止损价须低于开仓价。':'做空止损价须高于开仓价。');
    const priceStep=optional('priceStep');
    const aligned=price=>!priceStep||Math.abs(price/priceStep-Math.round(price/priceStep))<1e-7;
    if(!Number.isFinite(priceStep)||priceStep<0)return fail('价格步长须为正数或留空。');
    if(priceStep&&(!aligned(entry)||!aligned(stop)))return fail('开仓价或止损价不符合所填价格步长。');
    const multiplier=type==='stocks'?1:num('multiplier'),step=num('step'),minQty=num('minQty'),minNotional=optional('minNotional');
    if(![multiplier,step,minQty,minNotional].every(Number.isFinite)||multiplier<=0||step<=0||minQty<=0||minNotional<0)return fail('请核对合约乘数、数量步长和最小下单量。');
    if(type==='futures'&&(step%1!==0||minQty%1!==0))return fail('本试版期货按整数张交易，步长和最小张数须为整数。');
    const [coefficient,exponent='0']=String(step).toLowerCase().split('e');
    const decimals=Math.max(0,(coefficient.split('.')[1]||'').length-Number(exponent));
    if(decimals>12)return fail('数量步长超出本试版支持的精度。');
    if(['rr1','rr2'].some(key=>!Number.isFinite(num(key))||num(key)<=0||!Number.isFinite(num(key)*10)||Math.abs(num(key)*10-Math.round(num(key)*10))>1e-7))return fail('目标盈亏比须为正数，最多保留一位小数。');
    const leverage=num('leverage'),marginPerUnit=num('marginPerUnit'),marginPct=num('marginPct');
    let unitMargin;
    if(type==='crypto'){
      if(!Number.isFinite(leverage)||leverage<1)return fail('杠杆倍数须至少为1；平台是否允许该倍数需自行核对。');
      unitMargin=entry*multiplier/leverage;
    }else if(type==='futures'){
      if(!Number.isFinite(marginPerUnit)||marginPerUnit<=0)return fail('请填写券商要求的每张初始保证金。');
      unitMargin=marginPerUnit;
    }else{
      if(!Number.isFinite(marginPct)||marginPct<=0)return fail('请填写券商实际资金占用比例。');
      unitMargin=entry*marginPct/100;
    }
    if(!['rate','unit'].includes(p.feeMode))return fail('请选择费用计价方式。');
    const feeEntry=optional('feeEntry'),feeExit=optional('feeExit'),slippage=optional('slippage'),carry=optional('carry');
    if(![feeEntry,feeExit,slippage,carry].every(Number.isFinite)||[feeEntry,feeExit,slippage,carry].some(n=>n<0))return fail('费用、预计止损滑点和持仓成本须为非负数。');
    const effectiveStop=stop-sign*slippage;
    if(effectiveStop<=0)return fail('计入滑点后的止损价格不在本试版支持的正价格范围内。');
    const fee=(price,rate)=>p.feeMode==='rate'?multiplier*price*rate/100:rate;
    const openFee=fee(entry,feeEntry),closeStopFee=fee(effectiveStop,feeExit);
    const unitRisk=Math.abs(entry-effectiveStop)*multiplier+openFee+closeStopFee;
    const unitFunds=unitMargin+openFee+closeStopFee;
    const budget=equity*riskPct/100;
    if(![unitRisk,unitMargin,unitFunds,budget].every(Number.isFinite)||unitRisk<=0||unitMargin<=0)return fail('参数超出可计算范围，请降低金额或检查合约规格。');
    const riskLimit=Math.max(0,(budget-carry)/unitRisk),fundsLimit=Math.max(0,(available-carry)/unitFunds),raw=Math.min(riskLimit,fundsLimit);
    if(!Number.isFinite(raw)||raw/step>Number.MAX_SAFE_INTEGER)return fail('数量超出本试版的安全计算精度。');
    let quantity=Number((Math.floor(raw/step+1e-10)*step).toFixed(decimals));
    // Never round up beyond either budget, including floating-point boundary cases.
    while(quantity>0&&(quantity*unitRisk+carry>budget||quantity*unitFunds+carry>available))quantity=Math.max(0,Number((quantity-step).toFixed(decimals)));
    const notional=quantity*entry*multiplier;
    if(!Number.isFinite(notional))return fail('名义仓位超出本试版的可计算范围。');
    const common={type,side,equity,available,budget,riskLimit,fundsLimit,unitRisk,unitMargin,entry,stop,effectiveStop,multiplier,step,quantityPrecision:decimals,notes:[]};
    if(['feeEntry','feeExit','slippage','carry'].some(key=>p[key]===''||p[key]==null))common.notes.push('未填的费用、滑点或持仓成本按0估算；结果未覆盖相应成本。');
    if(!priceStep)common.notes.push('未填价格步长，未校验价位是否可用于实际下单。');
    common.notes.push('止损按假定成交价估算，不是实际亏损上限；跳空、滑点和强平可能改变结果。');
    if(quantity<=0||quantity<minQty||notional<minNotional)return {...common,status:'no-trade',quantity:0,message:budget<=carry?'预计持仓成本已用尽单笔风险预算。':available<=carry?'本笔可用资金不足以承担保证金及费用。':'当前风险或资金约束下，数量不满足最小下单要求；不强行凑单。',goals:[]};
    const margin=quantity*unitMargin,tradeFees=quantity*(openFee+closeStopFee),fundsReserved=margin+tradeFees+carry,risk=quantity*unitRisk+carry;
    const goals=[];
    for(const key of ['rr1','rr2']){
      const rr=num(key);if(!Number.isFinite(rr)||rr<=0)return fail('两个目标盈亏比均须为正数。');
      const price=entry+sign*rr*Math.abs(entry-stop);
      if(!Number.isFinite(price)||price<=0){goals.push({rr,reachable:false,message:type==='futures'?'目标超出本试版的正价格范围。':'该价差盈亏比对应非正数目标价，不能作为有效目标。'});continue;}
      const gross=quantity*multiplier*sign*(price-entry),fees=quantity*(openFee+fee(price,feeExit)),net=gross-fees-carry;
      if(![gross,fees,net].every(Number.isFinite))return fail('目标收益超出可计算范围。');
      goals.push({rr,price,reachable:true,priceAligned:aligned(price),gross,fees,net,netRR:net/risk,accountReturn:net/equity*100});
    }
    let liquidation=type==='stocks'&&side==='short'?'未接账户，未核验券源、借券成本变化及券商实际限制。':'未接账户，未核验券商维持保证金及实际下单限制。',liquidationWarning=false;
    if(type==='crypto'){
      const lp=optional('liquidation');
      if(!Number.isFinite(lp)||lp<0)return fail('平台强平参考价须为正数或留空。');
      if(!['isolated','cross'].includes(p.marginMode))liquidation='账户保证金模式未确认，强平风险未核验。';
      else if(p.marginMode==='cross')liquidation='全仓强平受账户其他仓位影响；本次未核验完整账户风险。';
      else if(!lp)liquidation='未填写平台强平参考价，强平风险未核验。';
      else if(p.stopBasis!=='mark')liquidation='止损与强平的触发价格基准不同，不能仅比较这两个价位判断安全。';
      else if(sign*(stop-lp)<=0){liquidation='警告：按所填标记价格，可能在止损触发前达到强平价。';liquidationWarning=true;}
      else liquidation='按所填标记价格，止损价位先于强平参考价；未验证平台数据、实际执行和价格缓冲。';
    }
    return {...common,status:'ready',quantity,notional,margin,tradeFees,carry,fundsReserved,risk,riskPercent:risk/equity*100,exposure:notional/equity,limiting:riskLimit<=fundsLimit?'单笔风险预算':'可用资金约束',goals,liquidation,liquidationWarning};
  }
  if(typeof module==='object'&&module.exports)module.exports={calculate};
  else root.OneChartMultiMarket={calculate};
})(typeof window!=='undefined'?window:globalThis);
