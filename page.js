/* Presentation only. Calculations, mode defaults and local-history keys stay incumbent. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => motionPreference.matches;
  const panels = ['position', 'pit', 'protect'];
  const fields = {
    accountBalance: '账户总资金（元）', entryPrice: '开仓价格（元）', stopPrice: '止损价格（元）',
    stopPercent: '止损幅度（%）', riskSlider: '单笔风险比例', tradeHistorySelect: '最近开仓记录',
    pitTopPrice: '坑口价格（元）', pitBottomPrice: '坑底价格（元）', pitCurrentPrice: '当前价格（元）',
    protectEntryPrice: '买入价格（元）', protectStopPrice: '止损价格（元）', protectHighPrice: '最高价格（元）',
    customRRSlider: '自定义预期盈亏比', retracePercent: '利润回撤比例（%）'
  };
  for (const [id, name] of Object.entries(fields)) {
    const input = $(id);
    input.setAttribute('aria-label', name);
    if (input.type === 'number') input.setAttribute('inputmode', 'decimal');
    const label = input.closest('.input-group')?.querySelector('label') || input.parentElement.parentElement.querySelector(':scope > label');
    if (label && !label.htmlFor) label.htmlFor = id;
  }
  for (const id of ['plannedRiskAmount', 'actualRiskAmount']) {
    $(id).closest('.text-lg').classList.add('risk-amount');
  }
  for (const id of ['positionValue', 'breakevenPrice', 'pitTargetPrice', 'retracePrice']) {
    $(id).parentElement.classList.add('price-amount');
  }
  document.querySelector('.workflow-tabs-bar').setAttribute('role', 'tablist');
  document.querySelector('.workflow-tabs-bar').setAttribute('aria-label', '计算模式');
  for (const name of panels) {
    const panel = $('page-' + name), tab = $('tab-' + name);
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panel.id);
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    const error = document.createElement('p');
    error.id = name + '-input-error'; error.className = 'calc-error hidden';
    error.setAttribute('role', 'status');
    panel.querySelector('.space-y-4 > .glass-panel > h2').after(error);
  }
  const budgetNotice = document.createElement('div');
  budgetNotice.id = 'budgetNotice';
  budgetNotice.className = 'budget-notice hidden';
  budgetNotice.setAttribute('role', 'status');
  budgetNotice.innerHTML = '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.3 4.2 2.5 18a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z"/></svg><div><strong id="budgetNoticeTitle">超出风险预算</strong><p id="budgetRiskText"></p><p id="budgetCapitalText"></p></div>';
  $('resultsContainer').querySelector(':scope > .grid').after(budgetNotice);
  function value(id) { return Number.parseFloat($(id).value); }
  const money = amount => '¥' + amount.toLocaleString('zh-CN', {minimumFractionDigits:0, maximumFractionDigits:2});
  function syncBudgetNotice() {
    const panel = $('page-position');
    const valid = !panel.classList.contains('calc-empty') && !panel.classList.contains('calc-invalid');
    const resultNumber = id => Number.parseFloat($(id).textContent.replaceAll(',', ''));
    const budget = resultNumber('plannedRiskAmount'), actual = resultNumber('actualRiskAmount');
    const capital = resultNumber('positionValue'), balance = value('accountBalance');
    const overRisk = valid && Math.round(actual * 100) > Math.round(budget * 100);
    const overCapital = valid && Math.round(capital * 100) > Math.round(balance * 100);
    budgetNotice.classList.toggle('hidden', !overRisk && !overCapital);
    $('budgetRiskText').hidden = !overRisk;
    $('budgetCapitalText').hidden = !overCapital;
    $('budgetNoticeTitle').textContent = overRisk && overCapital ? '风险与资金均超限' : overRisk ? '超出风险预算' : '超出账户资金';
    $('budgetRiskText').textContent = overRisk ? `${resultNumber('positionShares') === 100 ? '最少100股：' : ''}风险 ${money(actual)}，超预算 ${money(actual - budget)}。` : '';
    $('budgetCapitalText').textContent = overCapital ? `仓位 ${money(capital)}，资金缺口 ${money(capital - balance)}。` : '';
    $('actualRiskAmount').closest('.result-card').toggleAttribute('data-budget-exceeded', overRisk);
    $('positionValue').closest('.result-card').toggleAttribute('data-budget-exceeded', overCapital);
  }
  function state(name, ids, error, errorFields = []) {
    const panel = $('page-' + name);
    const complete = ids.every(id => Number.isFinite(value(id)) && value(id) > 0);
    panel.classList.toggle('calc-invalid', !!error);
    panel.classList.toggle('calc-empty', !error && !complete);
    const message = $(name + '-input-error');
    message.textContent = error || '';
    message.classList.toggle('hidden', !error);
    for (const id of ids) {
      const invalid = errorFields.includes(id);
      $(id).setAttribute('aria-invalid', String(invalid));
      if (invalid) $(id).setAttribute('aria-describedby', message.id);
      else $(id).removeAttribute('aria-describedby');
    }
  }
  function sync() {
    const historySelect = $('tradeHistorySelect');
    historySelect.disabled = historySelect.options.length < 2;
    historySelect.title = historySelect.disabled ? '暂无记录；填写有效的开仓价与止损价后自动保存' : '选择记录以恢复开仓与止损价格';
    let entry = value('entryPrice');
    const stopId = $('stopPercentWrapper').classList.contains('hidden') ? 'stopPrice' : 'stopPercent';
    const stop = stopId === 'stopPrice' ? value(stopId) : entry * (1 - value(stopId) / 100);
    const invalidPosition = Number.isFinite(entry) && Number.isFinite(stop) && (entry <= 0 || stop <= 0 || stop >= entry);
    const invalidBalance = Number.isFinite(value('accountBalance')) && value('accountBalance') <= 0;
    state('position', ['accountBalance', 'entryPrice', stopId], invalidBalance ? '账户总资金须大于 0，请检查输入。' : invalidPosition ? '止损价格须大于 0 且低于开仓价格，请检查开仓与止损条件。' : '', invalidBalance ? ['accountBalance'] : invalidPosition ? ['entryPrice', stopId] : []);
    syncBudgetNotice();
    const pitIds = ['pitTopPrice', 'pitBottomPrice', 'pitCurrentPrice'];
    const pitNonPositive = pitIds.filter(id => Number.isFinite(value(id)) && value(id) <= 0);
    const invalidPit = Number.isFinite(value('pitTopPrice')) && Number.isFinite(value('pitBottomPrice')) && value('pitBottomPrice') >= value('pitTopPrice');
    state('pit', pitIds, pitNonPositive.length ? '价格须大于 0，请检查输入。' : invalidPit ? '坑底价格须低于坑口价格，请检查输入。' : '', pitNonPositive.length ? pitNonPositive : invalidPit ? pitIds.slice(0, 2) : []);
    const protectIds = ['protectEntryPrice', 'protectStopPrice', 'protectHighPrice'];
    const protectNonPositive = protectIds.filter(id => Number.isFinite(value(id)) && value(id) <= 0);
    const invalidProtect = Number.isFinite(value('protectEntryPrice')) && Number.isFinite(value('protectStopPrice')) && value('protectStopPrice') >= value('protectEntryPrice');
    const retrace = value('retracePercent');
    const badRetrace = !Number.isFinite(retrace) || retrace < 10 || retrace > 80;
    state('protect', [...protectIds, 'retracePercent'], protectNonPositive.length ? '价格须大于 0，请检查输入。' : invalidProtect ? '止损价格须低于买入价格，请检查输入。' : badRetrace ? '利润回撤比例须在 10%—80% 之间。' : '', protectNonPositive.length ? protectNonPositive : invalidProtect ? protectIds.slice(0, 2) : badRetrace ? ['retracePercent'] : []);
    for (const name of panels) {
      const tab = $('tab-' + name), selected = tab.classList.contains('active');
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    }
    document.querySelectorAll('.personality-btn,.type-btn,.mode-btn,.rr-btn').forEach(button => button.setAttribute('aria-pressed', String(button.classList.contains('active'))));
    for (const id of ['pitProfitPercent', 'maxProfit', 'lockedProfit']) {
      const el = $(id), n = Number.parseFloat(el.textContent);
      el.parentElement.dataset.direction = !Number.isFinite(n) || n === 0 ? 'neutral' : n > 0 ? 'positive' : 'negative';
      el.parentElement.setAttribute('data-signed', '');
    }
  }
  let panelAnimation;
  document.addEventListener('input', sync);
  document.addEventListener('change', sync);
  document.addEventListener('click', event => {
    sync();
    if (event.target.closest('.tab-btn')) {
      panelAnimation?.cancel();
      if (!reduced()) panelAnimation = document.querySelector('.page-container.active').animate([{opacity:.55},{opacity:1}], {duration:140,easing:'ease-out'});
    }
  });
  document.querySelector('.workflow-tabs-bar').addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const current = panels.findIndex(name => $('tab-' + name) === document.activeElement);
    if (current < 0) return;
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (current + (event.key === 'ArrowRight' ? 1 : 2)) % 3;
    $('tab-' + panels[next]).click(); $('tab-' + panels[next]).focus();
  });
  let transition;
  motionPreference.addEventListener('change', () => {
    if (reduced()) { panelAnimation?.cancel(); transition?.skipTransition(); }
  });
  let desiredTheme = document.documentElement.dataset.theme;
  function applyTheme() {
    document.documentElement.dataset.theme = desiredTheme;
    document.documentElement.style.colorScheme = desiredTheme;
    try { localStorage.setItem('onechart-theme', desiredTheme); } catch (_) { /* preference is optional */ }
    const dark = desiredTheme === 'dark', button = document.querySelector('.theme-toggle');
    button.setAttribute('aria-pressed', String(dark));
    button.setAttribute('aria-label', dark ? '切换到日间模式' : '切换到夜间模式');
    button.title = dark ? '切换到日间模式' : '切换到夜间模式';
    button.querySelector('.theme-label').textContent = dark ? '日间' : '夜间';
    document.querySelector('meta[name=theme-color]').content = dark ? '#171d23' : '#f7f7f7';
  }
  window.toggleOneChartTheme = () => {
    desiredTheme = desiredTheme === 'dark' ? 'light' : 'dark';
    window.OneChartThemeMemory.remember(desiredTheme);
    transition?.skipTransition();
    document.documentElement.classList.add('theme-changing');
    if (!reduced() && document.startViewTransition && document.visibilityState === 'visible') {
      const active = document.startViewTransition(applyTheme); transition = active;
      active.finished.finally(() => { if (transition === active) { transition = null; document.documentElement.classList.remove('theme-changing'); } });
    } else { applyTheme(); document.documentElement.classList.remove('theme-changing'); }
  };
  addEventListener('onechart-shared-theme-change', event => {
    desiredTheme = event.detail.theme;
    transition?.skipTransition();
    applyTheme();
  });
  applyTheme();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', sync, {once:true}); else sync();
})();
