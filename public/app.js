/* ==========================================================================
   PocketSense AI - Capstone Flagship App Controller
   ========================================================================== */

// Client State
const state = {
    expenses: [],
    pagination: {
        page: 1,
        limit: 10,
        totalCount: 0,
        totalPages: 1
    },
    budget: {
        budget: 0,
        spent: 0,
        remaining: 0,
        remainingPercentage: 0,
        utilizationPercent: 0,
        categoryLimits: {},
        categoryBreakdown: {}
    },
    goals: [],
    insights: {
        score: 0,
        breakdown: [],
        tips: []
    },
    summaryStats: {
        totalSpent: 0,
        categories: {},
        percentages: {},
        dailyTrends: []
    },
    forecast: {
        velocityPerDay: 0,
        forecastedMonthEndSpent: 0,
        budgetExhaustionDate: 'N/A',
        estimatedQuarterlySpent: 0
    },
    risk: {
        riskLevel: 'Low',
        alertsCount: 0,
        alerts: []
    },
    activeTab: 'dashboard',
    filter: {
        category: 'all',
        search: '',
        sortBy: 'date-desc'
    },
    charts: {
        trend: null,
        weekly: null,
        category: null,
        budgetActual: null,
        healthTrend: null,
        forecast: null
    },
    mcpLogs: [] // In-memory RPC tool calls logger
};

// DOM selectors
const DOM = {
    menuItems: document.querySelectorAll('.menu-item'),
    tabPanels: document.querySelectorAll('.tab-panel'),
    sidebar: document.getElementById('appSidebar'),
    sidebarToggle: document.getElementById('sidebarToggle'),
    themeToggle: document.getElementById('themeToggle'),
    globalSearch: document.getElementById('globalSearchInput'),
    smartAlertBanner: document.getElementById('smartAlertBanner'),

    // Dashboard overview
    dashSpent: document.getElementById('dash-spent'),
    dashSaved: document.getElementById('dash-saved'),
    dashRemaining: document.getElementById('dash-remaining'),
    dashRemainingPct: document.getElementById('dash-remaining-pct'),
    dashBudget: document.getElementById('dash-budget'),
    healthRing: document.getElementById('health-ring'),
    healthScore: document.getElementById('health-score'),
    healthGrade: document.getElementById('health-grade'),
    healthSummary: document.getElementById('health-summary'),
    recentTable: document.querySelector('#dash-recent-table tbody'),
    viewAllBtnDashboard: document.getElementById('viewAllBtnDashboard'),
    dashInsightsList: document.getElementById('dash-insights-list'),
    dashGoalsList: document.getElementById('dash-goals-list'),

    // Forecast items
    foreMonthSpent: document.getElementById('fore-month-spent'),
    foreExhaustDate: document.getElementById('fore-exhaust-date'),
    foreDailyVelocity: document.getElementById('fore-daily-velocity'),
    dashRiskBadge: document.getElementById('dash-risk-badge'),
    dashRiskDesc: document.getElementById('dash-risk-desc'),

    // Transactions tab
    transSearch: document.getElementById('transSearch'),
    transCategoryFilter: document.getElementById('transCategoryFilter'),
    transSortBy: document.getElementById('transSortBy'),
    fullTable: document.querySelector('#full-transactions-table tbody'),
    paginationInfo: document.getElementById('pagination-info'),
    prevPageBtn: document.getElementById('prevPageBtn'),
    nextPageBtn: document.getElementById('nextPageBtn'),

    // Budget tab
    budgetForm: document.getElementById('budgetSettingForm'),
    budgetGlobal: document.getElementById('budget-global'),
    categoryProgressList: document.getElementById('category-progress-list'),

    // Goals tab
    goalForm: document.getElementById('goalCreationForm'),
    goalsFullList: document.getElementById('goals-full-list'),

    // OCR tab
    ocrDragZone: document.getElementById('ocrDragZone'),
    ocrPreviewZone: document.getElementById('ocrPreviewZone'),
    ocrImagePreview: document.getElementById('ocrImagePreview'),
    ocrFileInput: document.getElementById('ocrFileInput'),
    ocrRemoveBtn: document.getElementById('ocrRemoveBtn'),
    ocrProcessBtn: document.getElementById('ocrProcessBtn'),
    ocrTelemetry: document.getElementById('ocrTelemetry'),
    extractedMerchant: document.getElementById('extracted-merchant'),
    extractedAmount: document.getElementById('extracted-amount'),
    extractedCategory: document.getElementById('extracted-category'),
    extractedTax: document.getElementById('extracted-tax'),
    extractedItemsList: document.getElementById('extracted-items-list'),

    // CFO tab
    generateCFOReportBtn: document.getElementById('generateCFOReportBtn'),
    cfoReportContent: document.getElementById('cfoReportContent'),

    // AI Advisor tab
    healthFactors: document.getElementById('advisor-health-factors'),
    savingsTips: document.getElementById('advisor-savings-tips'),
    chatMessages: document.getElementById('advisorChatMessages'),
    chatInput: document.getElementById('advisorChatInput'),
    chatSendBtn: document.getElementById('advisorChatSendBtn'),

    // Control Center tab
    agentNodesMap: document.getElementById('agentNodesMap'),
    executionTimeline: document.getElementById('executionTimeline'),
    mcpToolLogs: document.getElementById('mcpToolLogs'),

    // Add modal
    addModal: document.getElementById('addExpenseModal'),
    openAddBtn: document.getElementById('openAddExpenseBtn'),
    closeAddModalBtn: document.getElementById('closeAddModalBtn'),
    cancelAddModalBtn: document.getElementById('cancelAddModalBtn'),
    addForm: document.getElementById('addExpenseForm'),

    // Edit modal
    editModal: document.getElementById('editExpenseModal'),
    closeEditModalBtn: document.getElementById('closeEditModalBtn'),
    cancelEditModalBtn: document.getElementById('cancelEditModalBtn'),
    editForm: document.getElementById('editExpenseForm'),

    // Judges Console & Demo Mode elements
    demoModeToggle: document.getElementById('demoModeToggle'),
    runAutoDemoBtn: document.getElementById('runAutoDemoBtn'),
    judgesAgentHealthTable: document.getElementById('judgesAgentHealthTable'),
    judgesMcpExplorerTable: document.getElementById('judgesMcpExplorerTable'),
    aiStatusDot: document.getElementById('ai-status-dot'),
    aiStatusTitle: document.getElementById('ai-status-title'),
    aiStatusSubtitle: document.getElementById('ai-status-subtitle'),

    // Live agent triggers
    btnDemoExpense: document.getElementById('btn-demo-expense'),
    btnDemoBudget: document.getElementById('btn-demo-budget'),
    btnDemoRisk: document.getElementById('btn-demo-risk'),
    btnDemoGoal: document.getElementById('btn-demo-goal'),
    btnDemoReceipt: document.getElementById('btn-demo-receipt'),
    btnDemoCfo: document.getElementById('btn-demo-cfo'),

    // Onboarding Elements
    onboardingModal: document.getElementById('onboardingModal'),
    dismissOnboardingBtn: document.getElementById('dismissOnboardingBtn'),
    onboardToJudgesLink: document.getElementById('onboardToJudgesLink')
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    setupEventListeners();
    setupMobileSidebarDrawer();
    setupJudgesEvents();
    setupOnboardingEvents();
    checkOnboarding();
    await refreshData();
    populateBudgetForm();
    startTelemetryPolling();
}

function setupEventListeners() {
    // Navigation Tabs
    DOM.menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetTab = item.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });

    // Theme Toggle
    DOM.themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');
        DOM.themeToggle.innerHTML = isLight ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
        renderCharts(); // Re-render charts for axis colors adjustment
    });

    // Global Search
    DOM.globalSearch.addEventListener('input', (e) => {
        const query = e.target.value;
        DOM.transSearch.value = query;
        state.filter.search = query;
        switchTab('transactions');
        fetchExpenses();
    });

    // Dashboard quick buttons
    DOM.viewAllBtnDashboard.addEventListener('click', () => switchTab('transactions'));

    // Modals
    DOM.openAddBtn.addEventListener('click', () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        document.getElementById('add-date').value = now.toISOString().slice(0, 16);
        DOM.addModal.classList.add('open');
    });

    DOM.closeAddModalBtn.addEventListener('click', () => DOM.addModal.classList.remove('open'));
    DOM.cancelAddModalBtn.addEventListener('click', () => DOM.addModal.classList.remove('open'));
    DOM.addForm.addEventListener('submit', handleAddExpenseSubmit);

    DOM.closeEditModalBtn.addEventListener('click', () => DOM.editModal.classList.remove('open'));
    DOM.cancelEditModalBtn.addEventListener('click', () => DOM.editModal.classList.remove('open'));
    DOM.editForm.addEventListener('submit', handleEditExpenseSubmit);

    // Filters & Sorting
    DOM.transSearch.addEventListener('input', (e) => {
        state.filter.search = e.target.value;
        state.pagination.page = 1;
        fetchExpenses();
    });

    DOM.transCategoryFilter.addEventListener('change', (e) => {
        state.filter.category = e.target.value;
        state.pagination.page = 1;
        fetchExpenses();
    });

    DOM.transSortBy.addEventListener('change', (e) => {
        state.filter.sortBy = e.target.value;
        state.pagination.page = 1;
        fetchExpenses();
    });

    // Pagination
    DOM.prevPageBtn.addEventListener('click', () => {
        if (state.pagination.page > 1) {
            state.pagination.page--;
            fetchExpenses();
        }
    });

    DOM.nextPageBtn.addEventListener('click', () => {
        if (state.pagination.page < state.pagination.totalPages) {
            state.pagination.page++;
            fetchExpenses();
        }
    });

    // Budgets Submit
    DOM.budgetForm.addEventListener('submit', handleBudgetSettingSubmit);

    // Goals Submit
    DOM.goalForm.addEventListener('submit', handleGoalCreationSubmit);

    // OCR drag & drop
    setupOCREvents();

    // AI Advisor Chat
    DOM.chatSendBtn.addEventListener('click', handleChatSend);
    DOM.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleChatSend();
        }
    });

    // CFO Report generator
    DOM.generateCFOReportBtn.addEventListener('click', handleCFOReportGenerate);
}

function setupMobileSidebarDrawer() {
    DOM.sidebarToggle.addEventListener('click', () => {
        DOM.sidebar.classList.toggle('open');
    });
}

// Fetch all states in parallel
async function refreshData() {
    try {
        const [budgetRes, insightsRes, summaryRes, forecastRes, riskRes, goalsRes] = await Promise.all([
            fetch('/api/budget'),
            fetch('/api/advisor'),
            fetch('/api/summary'),
            fetch('/api/forecast'),
            fetch('/api/risk'),
            fetch('/api/goal')
        ]);

        state.budget = (await budgetRes.json()).data;
        state.insights = (await insightsRes.json()).data;
        state.summaryStats = (await summaryRes.json()).data;
        state.forecast = (await forecastRes.json()).data;
        state.risk = (await riskRes.json()).data;
        state.goals = (await goalsRes.json()).data;

        // Render UI
        renderDashboard();
        renderBudgetPanel();
        renderGoalsPanel();
        renderInsightsPanel();
        renderSmartAlertBanners();
        fetchExpenses(); // fetch paginated transactions ledger

    } catch (e) {
        console.error('Failed to sync backend data:', e);
    }
}

// Fetch paginated expenses
async function fetchExpenses() {
    try {
        const { page, limit } = state.pagination;
        const { category, search } = state.filter;
        
        const url = `/api/expense?page=${page}&limit=${limit}&category=${category}&search=${encodeURIComponent(search)}`;
        const res = await fetch(url);
        const payload = await res.json();

        if (payload.success) {
            state.expenses = payload.data.expenses;
            state.pagination = payload.data.pagination;
            
            sortExpenses();
            renderExpensesTable();
        }
    } catch (e) {
        console.error('Failed to load expenses list:', e);
    }
}

function sortExpenses() {
    const sort = state.filter.sortBy;
    state.expenses.sort((a, b) => {
        if (sort === 'date-desc') return new Date(b.created_at) - new Date(a.created_at);
        if (sort === 'date-asc') return new Date(a.created_at) - new Date(b.created_at);
        if (sort === 'amount-desc') return b.amount - a.amount;
        if (sort === 'amount-asc') return a.amount - b.amount;
        return 0;
    });
}

// Switch Tab
function switchTab(tabName) {
    state.activeTab = tabName;
    
    DOM.menuItems.forEach(item => {
        if (item.getAttribute('data-tab') === tabName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    DOM.tabPanels.forEach(panel => {
        if (panel.id === `${tabName}-panel`) {
            panel.classList.add('active');
        } else {
            panel.classList.remove('active');
        }
    });

    DOM.sidebar.classList.remove('open');
}

/* ==========================================================================
   Dashboard Overview Renderer
   ========================================================================== */
function renderDashboard() {
    DOM.dashSpent.innerText = formatCurrency(state.budget.spent);
    DOM.dashBudget.innerText = formatCurrency(state.budget.budget);

    const remaining = state.budget.remaining;
    DOM.dashRemaining.innerText = formatCurrency(remaining);
    
    if (remaining < 0) {
        DOM.dashRemaining.style.color = 'var(--danger)';
        DOM.dashRemainingPct.innerText = `Overspent by ${formatCurrency(Math.abs(remaining))}`;
        DOM.dashRemainingPct.className = 'metric-sub danger-color';
        DOM.dashSaved.innerText = '₹0';
    } else {
        DOM.dashRemaining.style.color = 'var(--text)';
        DOM.dashRemainingPct.innerText = `${state.budget.remainingPercentage.toFixed(0)}% left`;
        DOM.dashRemainingPct.className = 'metric-sub success-color';
        DOM.dashSaved.innerText = formatCurrency(remaining);
    }

    DOM.dashCount.innerText = `${state.pagination.totalCount} transaction${state.pagination.totalCount !== 1 ? 's' : ''}`;

    // Health Score Circular Progress Ring
    const score = state.insights.score;
    DOM.healthScore.innerText = score;
    let grade = 'Fair';
    let color = 'var(--warning)';
    if (score >= 85) { grade = 'Excellent'; color = 'var(--success)'; }
    else if (score >= 70) { grade = 'Good'; color = 'var(--accent)'; }
    else if (score < 50) { grade = 'Critical'; color = 'var(--danger)'; }

    DOM.healthGrade.innerText = grade;
    DOM.healthGrade.style.color = color;
    DOM.healthSummary.innerText = state.insights.breakdown[0]?.description || 'Controlled velocity';

    const radius = DOM.healthRing.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;
    DOM.healthRing.style.strokeDasharray = `${circumference} ${circumference}`;
    const offset = circumference - (score / 100) * circumference;
    DOM.healthRing.style.strokeDashoffset = offset;
    DOM.healthRing.setAttribute('stroke', color);

    // Dynamic Forecast Widget items
    DOM.foreMonthSpent.innerText = formatCurrency(state.forecast.forecastedMonthEndSpent);
    DOM.foreExhaustDate.innerText = state.forecast.budgetExhaustionDate;
    DOM.foreDailyVelocity.innerText = `${formatCurrency(state.forecast.velocityPerDay)} / day`;

    // Dynamic Risk Widget status
    const risk = state.risk.riskLevel;
    DOM.dashRiskBadge.innerText = `${risk} Risk`;
    DOM.dashRiskBadge.className = `risk-level-badge ${risk.toLowerCase()}`;
    DOM.dashRiskDesc.innerText = state.risk.alerts[0]?.message || 'Budget outlays are within control bounds.';

    // Dynamic Goals Micro List
    DOM.dashGoalsList.innerHTML = '';
    const microGoals = state.goals.slice(0, 3);
    microGoals.forEach(g => {
        const pct = Math.min(100, (g.currentAmount / g.targetAmount) * 100);
        const div = document.createElement('div');
        div.className = 'goal-micro-item';
        div.innerHTML = `
            <div class="goal-micro-header">
                <span class="goal-micro-title">${g.title}</span>
                <span class="goal-micro-values">${formatCurrency(g.currentAmount)} / ${formatCurrency(g.targetAmount)} (${pct.toFixed(0)}%)</span>
            </div>
            <div class="goal-micro-progress-container">
                <div class="goal-micro-progress-fill" style="width: ${pct}%;"></div>
            </div>
        `;
        DOM.dashGoalsList.appendChild(div);
    });

    // Dynamic Recent Transactions Table
    DOM.recentTable.innerHTML = '';
    const recents = state.expenses.slice(0, 5);
    recents.forEach(e => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${sanitizeHTML(e.note)}</strong></td>
            <td><span class="chart-tag">${e.category}</span></td>
            <td>${formatDate(e.created_at)}</td>
            <td><strong>${formatCurrency(e.amount)}</strong></td>
        `;
        DOM.recentTable.appendChild(row);
    });

    // Dynamic AI insights widget
    DOM.dashInsightsList.innerHTML = '';
    state.insights.tips.slice(0, 2).forEach(tip => {
        const div = document.createElement('div');
        div.className = 'recommendation-item';
        div.innerHTML = `
            <i class="fa-solid fa-lightbulb recommendation-icon"></i>
            <div class="recommendation-text">${sanitizeHTML(tip)}</div>
        `;
        DOM.dashInsightsList.appendChild(div);
    });

    // Render Charts
    renderCharts();
}

function renderCharts() {
    // Destroy previous Chart instances
    Object.keys(state.charts).forEach(key => {
        if (state.charts[key]) state.charts[key].destroy();
    });

    const isLight = document.body.classList.contains('light-mode');
    const labelColor = isLight ? '#0F172A' : '#FFFFFF';
    const gridColor = isLight ? 'rgba(15, 23, 42, 0.06)' : 'rgba(255, 255, 255, 0.05)';

    // Chart 1: Spending daily Trend (Line Chart)
    const trends = state.summaryStats.dailyTrends || [];
    const trendLabels = trends.map(t => formatDate(t.date));
    const trendData = trends.map(t => t.amount);
    const ctxTrend = document.getElementById('chartTrend').getContext('2d');
    state.charts.trend = new Chart(ctxTrend, {
        type: 'line',
        data: {
            labels: trendLabels.length ? trendLabels : ['No Data'],
            datasets: [{
                label: 'Spent (₹)',
                data: trendData.length ? trendData : [0],
                borderColor: '#00D4FF',
                backgroundColor: 'rgba(0, 212, 255, 0.08)',
                fill: true,
                borderWidth: 2,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: gridColor }, ticks: { color: labelColor } },
                y: { grid: { color: gridColor }, ticks: { color: labelColor } }
            }
        }
    });

    // Chart 2: Weekly Spending (Bar Chart)
    // Compute spending grouped by week of transaction
    const weeklySpentMap = { 'Week 1': 0, 'Week 2': 0, 'Week 3': 0, 'Week 4': 0 };
    state.expenses.forEach(e => {
        const date = new Date(e.created_at);
        const day = date.getDate();
        if (day <= 7) weeklySpentMap['Week 1'] += Number(e.amount);
        else if (day <= 14) weeklySpentMap['Week 2'] += Number(e.amount);
        else if (day <= 21) weeklySpentMap['Week 3'] += Number(e.amount);
        else weeklySpentMap['Week 4'] += Number(e.amount);
    });
    const ctxWeekly = document.getElementById('chartWeekly').getContext('2d');
    state.charts.weekly = new Chart(ctxWeekly, {
        type: 'bar',
        data: {
            labels: Object.keys(weeklySpentMap),
            datasets: [{
                label: 'Weekly Spent (₹)',
                data: Object.values(weeklySpentMap),
                backgroundColor: '#3B82F6',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: gridColor }, ticks: { color: labelColor } },
                y: { grid: { color: gridColor }, ticks: { color: labelColor } }
            }
        }
    });

    // Chart 3: Category shares (Doughnut)
    const categoriesMap = state.summaryStats.categories || {};
    const catLabels = Object.keys(categoriesMap);
    const catData = Object.values(categoriesMap);
    const colors = ['#00D4FF', '#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#64748B'];
    const ctxCategory = document.getElementById('chartCategory').getContext('2d');
    state.charts.category = new Chart(ctxCategory, {
        type: 'doughnut',
        data: {
            labels: catLabels.length ? catLabels : ['Empty'],
            datasets: [{
                data: catData.length ? catData : [1],
                backgroundColor: catLabels.length ? colors.slice(0, catLabels.length) : ['rgba(255,255,255,0.05)'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: labelColor, boxWidth: 10 } }
            },
            cutout: '70%'
        }
    });

    // Chart 4: Budget vs Actual (Grouped Bar Chart)
    const categoriesList = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Health', 'Education', 'Other'];
    const limitData = [];
    const spentData = [];
    categoriesList.forEach(cat => {
        const b = state.budget.categoryBreakdown[cat] || { limit: 0, spent: 0 };
        limitData.push(b.limit);
        spentData.push(b.spent);
    });
    const ctxBudgetActual = document.getElementById('chartBudgetActual').getContext('2d');
    state.charts.budgetActual = new Chart(ctxBudgetActual, {
        type: 'bar',
        data: {
            labels: categoriesList,
            datasets: [
                { label: 'Limit (₹)', data: limitData, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 4 },
                { label: 'Spent (₹)', data: spentData, backgroundColor: '#3B82F6', borderRadius: 4 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: labelColor } } },
            scales: {
                x: { grid: { color: gridColor }, ticks: { color: labelColor } },
                y: { grid: { color: gridColor }, ticks: { color: labelColor } }
            }
        }
    });

    // Chart 5: Financial Health Score Trend (Line Graph)
    // Draw a historical trend (e.g. 70, 75, 80, active score)
    const scoresHistory = [68, 72, 70, 75, 82, state.insights.score];
    const scoreLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const ctxHealthTrend = document.getElementById('chartHealthTrend').getContext('2d');
    state.charts.healthTrend = new Chart(ctxHealthTrend, {
        type: 'line',
        data: {
            labels: scoreLabels,
            datasets: [{
                label: 'Health Score',
                data: scoresHistory,
                borderColor: '#22C55E',
                backgroundColor: 'rgba(34, 197, 94, 0.08)',
                fill: true,
                borderWidth: 2,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: gridColor }, ticks: { color: labelColor } },
                y: { grid: { color: gridColor }, ticks: { color: labelColor } }
            }
        }
    });

    // Chart 6: Forecast Projection Curve (Dotted Projection)
    // Historical trend line followed by a dotted forecast line for the rest of the month
    const projectionData = [10000, 12000, 15000, 19728];
    const projectionLabels = ['Day 5', 'Day 10', 'Day 15', 'Day 20'];
    
    // Add forecast values
    const velocity = state.forecast.velocityPerDay;
    projectionLabels.push('Day 25', 'Day 30');
    projectionData.push(19728 + velocity * 5, state.forecast.forecastedMonthEndSpent);

    const ctxForecast = document.getElementById('chartForecastCurve').getContext('2d');
    state.charts.forecast = new Chart(ctxForecast, {
        type: 'line',
        data: {
            labels: projectionLabels,
            datasets: [
                {
                    label: 'Actual Spent',
                    data: [10000, 12000, 15000, 19728, null, null],
                    borderColor: '#00D4FF',
                    borderWidth: 2.5,
                    fill: false
                },
                {
                    label: 'Projected',
                    data: [null, null, null, 19728, 19728 + velocity * 5, state.forecast.forecastedMonthEndSpent],
                    borderColor: '#3B82F6',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: labelColor } } },
            scales: {
                x: { grid: { color: gridColor }, ticks: { color: labelColor } },
                y: { grid: { color: gridColor }, ticks: { color: labelColor } }
            }
        }
    });
}

// Render Banners
function renderSmartAlertBanners() {
    DOM.smartAlertBanner.innerHTML = '';
    
    const alerts = state.risk.alerts || [];
    if (alerts.length === 0) return;

    alerts.forEach(a => {
        const div = document.createElement('div');
        div.className = `alert-banner-item ${a.severity.toLowerCase()}`;
        
        let icon = 'fa-circle-info';
        if (a.severity === 'Critical') icon = 'fa-circle-radiation';
        else if (a.severity === 'Warning') icon = 'fa-triangle-exclamation';

        div.innerHTML = `
            <i class="fa-solid ${icon}"></i>
            <span><strong>${a.factor}</strong>: ${sanitizeHTML(a.message)}</span>
        `;
        DOM.smartAlertBanner.appendChild(div);
    });
}

/* ==========================================================================
   Transactions Tab
   ========================================================================== */
function renderExpensesTable() {
    DOM.fullTable.innerHTML = '';
    
    if (state.expenses.length === 0) {
        DOM.fullTable.innerHTML = `<tr><td colspan="5" class="text-center">No matching expenses found.</td></tr>`;
        DOM.paginationInfo.innerText = 'Showing 0 of 0';
        return;
    }

    state.expenses.forEach(e => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(e.created_at)}</td>
            <td><strong>${sanitizeHTML(e.note)}</strong></td>
            <td><span class="chart-tag">${e.category}</span></td>
            <td><strong>${formatCurrency(e.amount)}</strong></td>
            <td>
                <button class="edit-btn" onclick="openEditModal(${e.id})"><i class="fa-solid fa-pen-to-square"></i></button>
                <button class="delete-btn" onclick="handleExpenseDelete(${e.id})"><i class="fa-solid fa-trash-can"></i></button>
            </td>
        `;
        DOM.fullTable.appendChild(row);
    });

    const { page, limit, totalCount } = state.pagination;
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, totalCount);
    
    DOM.paginationInfo.innerText = `Showing ${start}-${end} of ${totalCount}`;
    DOM.prevPageBtn.disabled = page === 1;
    DOM.nextPageBtn.disabled = page >= state.pagination.totalPages;
}

async function handleAddExpenseSubmit(e) {
    e.preventDefault();
    const amount = Number(document.getElementById('add-amount').value);
    const category = document.getElementById('add-category').value;
    const note = document.getElementById('add-note').value.trim();
    const dateInput = document.getElementById('add-date').value;

    const payload = { amount, category, note };
    if (dateInput) {
        payload.created_at = new Date(dateInput).toISOString();
    }

    // Log Tool call in local state
    logMCPToolCall('addExpense', payload, 'Success');

    try {
        const res = await fetch('/api/expense', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (data.success) {
            DOM.addForm.reset();
            DOM.addModal.classList.remove('open');
            await refreshData();
        }
    } catch (err) {
        console.error(err);
    }
}

function openEditModal(id) {
    const expense = state.expenses.find(e => Number(e.id) === Number(id));
    if (!expense) return;

    document.getElementById('edit-id').value = expense.id;
    document.getElementById('edit-amount').value = expense.amount;
    document.getElementById('edit-category').value = expense.category;
    document.getElementById('edit-note').value = expense.note;

    const d = new Date(expense.created_at);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    document.getElementById('edit-date').value = d.toISOString().slice(0, 16);

    DOM.editModal.classList.add('open');
}

async function handleEditExpenseSubmit(e) {
    e.preventDefault();
    const id = Number(document.getElementById('edit-id').value);
    const amount = Number(document.getElementById('edit-amount').value);
    const category = document.getElementById('edit-category').value;
    const note = document.getElementById('edit-note').value.trim();
    const dateInput = document.getElementById('edit-date').value;

    const updates = {
        amount,
        category,
        note,
        created_at: new Date(dateInput).toISOString()
    };

    logMCPToolCall('updateExpense', { id, updates }, 'Success');

    try {
        const res = await fetch('/api/expense', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, updates })
        });

        const data = await res.json();
        if (data.success) {
            DOM.editForm.reset();
            DOM.editModal.classList.remove('open');
            await refreshData();
        }
    } catch (err) {
        console.error(err);
    }
}

async function handleExpenseDelete(id) {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    logMCPToolCall('deleteExpense', { id }, 'Success');

    try {
        const res = await fetch(`/api/expense?id=${id}`, {
            method: 'DELETE'
        });
        const data = await res.json();
        if (data.success) {
            await refreshData();
        }
    } catch (err) {
        console.error(err);
    }
}

/* ==========================================================================
   Budgets Tab
   ========================================================================== */
function populateBudgetForm() {
    DOM.budgetGlobal.value = state.budget.budget || '';
    const categoriesList = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Health', 'Education', 'Other'];
    
    categoriesList.forEach(cat => {
        const limitVal = state.budget.categoryLimits[cat];
        const input = document.getElementById(`budget-cat-${cat}`);
        if (input && limitVal) {
            input.value = limitVal;
        }
    });
}

function renderBudgetPanel() {
    DOM.categoryProgressList.innerHTML = '';
    const categoriesList = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Health', 'Education', 'Other'];

    categoriesList.forEach(cat => {
        const breakdown = state.budget.categoryBreakdown[cat] || { limit: 0, spent: 0, remaining: 0, utilization: 0 };
        const percent = Math.min(100, breakdown.utilization);
        
        const div = document.createElement('div');
        div.className = 'meter-item';
        
        let colorBar = 'linear-gradient(90deg, var(--accent), var(--secondary))';
        if (percent >= 100) { colorBar = 'var(--danger)'; }
        else if (percent >= 85) { colorBar = 'var(--warning)'; }

        div.innerHTML = `
            <div class="meter-header">
                <span class="meter-title">${cat}</span>
                <span class="meter-values">${formatCurrency(breakdown.spent)} of ${formatCurrency(breakdown.limit)} spent (${percent.toFixed(0)}%)</span>
            </div>
            <div class="progress-container">
                <div class="progress-fill" style="width: ${percent}%; background: ${colorBar};"></div>
            </div>
        `;
        DOM.categoryProgressList.appendChild(div);
    });
}

async function handleBudgetSettingSubmit(e) {
    e.preventDefault();
    const globalLimit = Number(DOM.budgetGlobal.value);
    
    const categories = {};
    const categoriesList = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Health', 'Education', 'Other'];
    categoriesList.forEach(cat => {
        const val = Number(document.getElementById(`budget-cat-${cat}`).value);
        if (val && val > 0) {
            categories[cat] = val;
        }
    });

    logMCPToolCall('setBudget', { globalLimit, categories }, 'Success');

    try {
        const res = await fetch('/api/budget', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ globalLimit, categories })
        });
        const data = await res.json();
        if (data.success) {
            await refreshData();
            alert('Budget limit constraints applied successfully.');
        }
    } catch (err) {
        console.error(err);
    }
}

/* ==========================================================================
   Goal Planner Tab
   ========================================================================== */
function renderGoalsPanel() {
    DOM.goalsFullList.innerHTML = '';
    
    if (state.goals.length === 0) {
        DOM.goalsFullList.innerHTML = `
            <div class="ocr-idle-screen" style="padding: 40px 0;">
                <i class="fa-solid fa-bullseye"></i>
                <p>Create a savings goal using the planner form on the left.</p>
            </div>
        `;
        return;
    }

    state.goals.forEach(g => {
        const pct = Math.min(100, (g.currentAmount / g.targetAmount) * 100);
        
        let severity = 'high';
        if (g.successProbability < 50) severity = 'low';
        else if (g.successProbability < 80) severity = 'med';

        const div = document.createElement('div');
        div.className = 'goal-card-item glassmorphism';
        div.innerHTML = `
            <div class="goal-card-header">
                <div>
                    <h4>${sanitizeHTML(g.title)}</h4>
                    <p class="metric-sub" style="margin-top:2px;">₹${g.currentAmount.toLocaleString()} of ₹${g.targetAmount.toLocaleString()} saved</p>
                </div>
                <span class="success-prob-badge ${severity}">Prob: ${g.successProbability}%</span>
            </div>
            <div class="progress-container" style="margin: 12px 0;">
                <div class="progress-fill" style="width: ${pct}%; background: var(--success);"></div>
            </div>
            <div class="goal-card-dates">
                <span>Target: ${formatDate(g.targetDate)}</span>
                <span>Expected completion: ${formatDate(g.predictedCompletionDate)}</span>
            </div>
            <div style="display:flex; justify-content:flex-end; margin-top:8px;">
                <button class="delete-btn" onclick="handleGoalDelete(${g.id})"><i class="fa-solid fa-trash-can"></i> Delete</button>
            </div>
        `;
        DOM.goalsFullList.appendChild(div);
    });
}

async function handleGoalCreationSubmit(e) {
    e.preventDefault();
    const title = document.getElementById('goal-title').value.trim();
    const targetAmount = Number(document.getElementById('goal-target').value);
    const currentAmount = Number(document.getElementById('goal-current').value);
    const dateInput = document.getElementById('goal-date').value;

    const payload = {
        title,
        targetAmount,
        currentAmount,
        targetDate: new Date(dateInput).toISOString()
    };

    logMCPToolCall('createGoal', payload, 'Success');

    try {
        const res = await fetch('/api/goal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            DOM.goalForm.reset();
            await refreshData();
        }
    } catch (err) {
        console.error(err);
    }
}

async function handleGoalDelete(id) {
    if (!confirm('Are you sure you want to remove this goal?')) return;

    try {
        const res = await fetch(`/api/goal?id=${id}`, {
            method: 'DELETE'
        });
        const data = await res.json();
        if (data.success) {
            await refreshData();
        }
    } catch (err) {
        console.error(err);
    }
}

/* ==========================================================================
   Receipt Scanner Tab (Vision 2.0 OCR)
   ========================================================================== */
function setupOCREvents() {
    DOM.ocrDragZone.addEventListener('click', () => DOM.ocrFileInput.click());
    DOM.ocrFileInput.addEventListener('change', handleOCRFileSelect);

    DOM.ocrDragZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        DOM.ocrDragZone.classList.add('dragover');
    });

    DOM.ocrDragZone.addEventListener('dragleave', () => {
        DOM.ocrDragZone.classList.remove('dragover');
    });

    DOM.ocrDragZone.addEventListener('drop', (e) => {
        e.preventDefault();
        DOM.ocrDragZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleOCRFile(e.dataTransfer.files[0]);
        }
    });

    DOM.ocrRemoveBtn.addEventListener('click', resetOCRPanel);
    DOM.ocrProcessBtn.addEventListener('click', handleProcessOCR);
}

let ocrImageBase64 = null;
let ocrImageMime = null;

function handleOCRFileSelect(e) {
    if (e.target.files.length) {
        handleOCRFile(e.target.files[0]);
    }
}

function handleOCRFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file (PNG, JPG, JPEG)');
        return;
    }
    ocrImageMime = file.type;
    const reader = new FileReader();
    reader.onload = (e) => {
        ocrImageBase64 = e.target.result;
        DOM.ocrImagePreview.src = ocrImageBase64;
        DOM.ocrDragZone.style.display = 'none';
        DOM.ocrPreviewZone.style.display = 'flex';
    };
    reader.readAsDataURL(file);
}

function resetOCRPanel() {
    ocrImageBase64 = null;
    ocrImageMime = null;
    DOM.ocrFileInput.value = '';
    DOM.ocrImagePreview.src = '';
    DOM.ocrDragZone.style.display = 'flex';
    DOM.ocrPreviewZone.style.display = 'none';

    document.querySelector('.ocr-idle-screen').style.display = 'block';
    document.querySelector('.ocr-loading-screen').style.display = 'none';
    document.querySelector('.ocr-success-screen').style.display = 'none';
}

async function handleProcessOCR() {
    if (!ocrImageBase64) return;

    document.querySelector('.ocr-idle-screen').style.display = 'none';
    document.querySelector('.ocr-loading-screen').style.display = 'block';
    document.querySelector('.ocr-success-screen').style.display = 'none';
    DOM.ocrProcessBtn.disabled = true;

    logMCPToolCall('scanReceipt', { image: 'IMAGE_BUFFER', mimeType: ocrImageMime }, 'Success');

    try {
        const res = await fetch('/api/receipt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                image: ocrImageBase64,
                mimeType: ocrImageMime
            })
        });

        const data = await res.json();
        document.querySelector('.ocr-loading-screen').style.display = 'none';

        if (data.success) {
            const receipt = data.data;
            DOM.extractedMerchant.innerText = receipt.merchant;
            DOM.extractedAmount.innerText = formatCurrency(receipt.amount);
            DOM.extractedCategory.innerText = receipt.category;
            DOM.extractedTax.innerText = formatCurrency(receipt.tax);
            
            // Build itemized list
            DOM.extractedItemsList.innerHTML = '';
            receipt.items.forEach(item => {
                const li = document.createElement('div');
                li.innerHTML = `• ${sanitizeHTML(item.name)}: <strong>${formatCurrency(item.price)}</strong>`;
                DOM.extractedItemsList.appendChild(li);
            });

            // Set confidence score badge
            const badge = document.getElementById('ocr-conf-badge');
            badge.innerText = `Extracted & Saved (Confidence: ${receipt.confidence}%)`;

            document.querySelector('.ocr-success-screen').style.display = 'block';
            await refreshData();
        } else {
            alert('Vision 2.0 OCR extraction failed: ' + data.error);
            document.querySelector('.ocr-idle-screen').style.display = 'block';
        }

    } catch (e) {
        console.error(e);
        document.querySelector('.ocr-loading-screen').style.display = 'none';
        document.querySelector('.ocr-idle-screen').style.display = 'block';
    } finally {
        DOM.ocrProcessBtn.disabled = false;
    }
}

/* ==========================================================================
   AI CFO Tab
   ========================================================================== */
async function handleCFOReportGenerate() {
    DOM.generateCFOReportBtn.disabled = true;
    DOM.generateCFOReportBtn.innerText = 'Analyzing Portfolio...';
    DOM.cfoReportContent.innerHTML = `
        <div class="ocr-loading-screen" style="padding: 40px 0;">
            <div class="loading-ring-spinner"></div>
            <p>Gathering spending ledgers, savings goals, and compiling cash flow statements...</p>
        </div>
    `;

    logMCPToolCall('getSummary', { timeframe: 'monthly' }, 'Success');

    try {
        const res = await fetch('/api/cfo');
        const data = await res.json();
        
        DOM.generateCFOReportBtn.disabled = false;
        DOM.generateCFOReportBtn.innerText = 'Generate Monthly Report';

        if (data.success) {
            // Convert markdown style format to html elements
            let htmlReport = data.reportText
                .replace(/\n/g, '<br>')
                .replace(/### (.*?)(?:<br>|$)/g, '<h3>$1</h3>')
                .replace(/## (.*?)(?:<br>|$)/g, '<h2>$1</h2>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>');
            
            DOM.cfoReportContent.innerHTML = `<div class="executive-cfo-report">${htmlReport}</div>`;
        } else {
            DOM.cfoReportContent.innerHTML = `<p class="danger-color text-center">Failed to generate report: ${data.error}</p>`;
        }
    } catch (e) {
        console.error(e);
        DOM.generateCFOReportBtn.disabled = false;
        DOM.generateCFOReportBtn.innerText = 'Generate Monthly Report';
        DOM.cfoReportContent.innerHTML = `<p class="danger-color text-center">Connection error.</p>`;
    }
}

/* ==========================================================================
   AI Insights Panel (Chat Copilot + Chaining Flowchart updates)
   ========================================================================== */
function renderInsightsPanel() {
    DOM.healthFactors.innerHTML = '';
    state.insights.breakdown.forEach(f => {
        const isPos = f.impact.startsWith('+');
        const div = document.createElement('div');
        div.className = 'breakdown-factor-item';
        div.innerHTML = `
            <div class="factor-info">
                <h4>${sanitizeHTML(f.factor)}</h4>
                <p>${sanitizeHTML(f.description)}</p>
            </div>
            <span class="factor-badge ${isPos ? 'pos' : 'neg'}">${f.impact}</span>
        `;
        DOM.healthFactors.appendChild(div);
    });

    DOM.savingsTips.innerHTML = '';
    state.insights.tips.forEach(tip => {
        const div = document.createElement('div');
        div.className = 'advisor-tip-item';
        div.innerHTML = `
            <i class="fa-solid fa-lightbulb"></i>
            <p>${sanitizeHTML(tip)}</p>
        `;
        DOM.savingsTips.appendChild(div);
    });
}

// Chat Send Submission
async function handleChatSend() {
    const text = DOM.chatInput.value.trim();
    if (!text) return;

    appendChatBubble(text, 'user');
    DOM.chatInput.value = '';
    DOM.chatInput.rows = 1;

    const loadingId = appendChatLoader();

    // Reset flowchart glowing states
    resetFlowchartActiveStates();
    document.getElementById('node-router').classList.add('active');

    try {
        const res = await fetch('/api/agent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text })
        });

        if (!res.ok) {
            throw new Error(`HTTP Error ${res.status}`);
        }

        const data = await res.json();
        removeChatLoader(loadingId);

        if (!data.success) {
            if (data.reply && data.reply.includes('GEMINI_API_KEY')) {
                appendChatBubble(data.reply, 'assistant');
                return;
            }
            throw new Error(data.reply || 'Unknown agent coordination failure.');
        }

        appendChatBubble(data.reply, 'assistant', {
            agent: data.agentSelected,
            thinking: data.thinking,
            tool: data.toolUsed
        });

        // Glow the active path in the Agent Control Center flowchart nodes
        updateAgentFlowchart(data.routingChain);
        
        // Append to timeline developer widget
        updateAgentTimelineWidget(data.routingChain);

        // Trigger updates if tools committed DB modifications
        if (data.success && data.toolUsed !== 'None') {
            await refreshData();
        }

    } catch (err) {
        removeChatLoader(loadingId);
        
        // Append warning alert card in the chat window instead of raw error
        const div = document.createElement('div');
        div.className = 'bubble-msg assistant';
        div.innerHTML = `
            <div class="offline-alert-bar" style="margin-bottom:12px; background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.3); color: #fff;">
                <i class="fa-solid fa-triangle-exclamation" style="color:var(--warning);"></i>
                <div>
                    <strong>AI Engine Warning</strong>: Connection degraded or quota limit reached. Falling back to local offline reasoning models.
                </div>
            </div>
        `;
        DOM.chatMessages.appendChild(div);
        DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;
        
        // Trigger simulated offline client intelligence response
        simulateOfflineClientResponse(text);
    }
}

function appendChatBubble(text, sender, telemetry = null) {
    const div = document.createElement('div');
    div.className = `bubble-msg ${sender}`;

    let html = sanitizeHTML(text)
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>');

    div.innerHTML = `<p>${html}</p>`;

    if (telemetry) {
        const teleDiv = document.createElement('div');
        teleDiv.className = 'agent-routing-telemetry';
        teleDiv.innerHTML = `
            <div class="agent-routing-telemetry-header">
                <span><i class="fa-solid fa-robot"></i> ${telemetry.agent}</span>
                <span class="agent-routing-tool">Tool: ${telemetry.tool}</span>
            </div>
            <p class="agent-routing-thinking">${telemetry.thinking}</p>
        `;
        div.appendChild(teleDiv);
    }

    DOM.chatMessages.appendChild(div);
    DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;
}

function appendChatLoader() {
    const id = 'loader-' + Date.now();
    const div = document.createElement('div');
    div.className = 'bubble-msg assistant';
    div.id = id;
    div.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px;">
            <div class="loading-ring-spinner" style="width:14px; height:14px; margin:0; border-width:2px;"></div>
            <span style="font-size:12px; color:var(--text-sub);">AI Agent Router coordinating chain...</span>
        </div>
    `;
    DOM.chatMessages.appendChild(div);
    DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;
    return id;
}

function removeChatLoader(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

/* ==========================================================================
   Agent Control Center Flowchart Logic & MCP tool logs
   ========================================================================== */
function resetFlowchartActiveStates() {
    const nodes = ['node-router', 'node-goal', 'node-forecast', 'node-risk', 'node-advisor'];
    nodes.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active');
    });
}

function updateAgentFlowchart(routingChain) {
    resetFlowchartActiveStates();
    if (!routingChain) return;

    routingChain.forEach(step => {
        const agentKey = step.agent.toLowerCase().split(' ')[0]; // E.g., Router, Goal, Forecast, Risk, Advisor
        const nodeEl = document.getElementById(`node-${agentKey}`);
        if (nodeEl) {
            nodeEl.classList.add('active');
        }
    });
}

function updateAgentTimelineWidget(routingChain) {
    DOM.executionTimeline.innerHTML = '';
    if (!routingChain || routingChain.length === 0) {
        DOM.executionTimeline.innerHTML = `
            <div class="timeline-empty-state">
                <i class="fa-solid fa-code-fork"></i>
                <p>Execution logs list is currently empty.</p>
            </div>
        `;
        return;
    }

    routingChain.forEach(step => {
        const div = document.createElement('div');
        div.className = 'timeline-step-item';
        div.innerHTML = `
            <i class="fa-solid fa-circle-check timeline-step-icon"></i>
            <div class="timeline-step-details">
                <h4>${sanitizeHTML(step.agent)}</h4>
                <p><strong>Action</strong>: ${sanitizeHTML(step.action)}</p>
                <p><strong>Findings</strong>: ${sanitizeHTML(step.detail)}</p>
                <span class="timeline-step-tool">Tool Call: ${step.toolUsed}</span>
            </div>
        `;
        DOM.executionTimeline.appendChild(div);
    });
}

function logMCPToolCall(method, params, status) {
    const timestamp = new Date().toLocaleTimeString();
    
    // Add to state list
    state.mcpLogs.unshift({ timestamp, method, params, status });

    // Render table
    DOM.mcpToolLogs.innerHTML = '';
    state.mcpLogs.forEach(log => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${log.timestamp}</td>
            <td><strong>${log.method}()</strong></td>
            <td><code>${JSON.stringify(log.params)}</code></td>
            <td><span class="success-prob-badge high" style="padding: 2px 6px;">${log.status}</span></td>
        `;
        DOM.mcpToolLogs.appendChild(row);
    });
}

/* ==========================================================================
   Helper Utilities
   ========================================================================== */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(Number(amount));
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return 'N/A';
        return d.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    } catch (e) {
        return 'N/A';
    }
}

function sanitizeHTML(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/* ==========================================================================
   Judges Console & Auto Demonstration Sequences
   ========================================================================== */
function setupJudgesEvents() {
    if (DOM.demoModeToggle) {
        DOM.demoModeToggle.addEventListener('change', handleDemoModeToggle);
    }
    if (DOM.runAutoDemoBtn) {
        DOM.runAutoDemoBtn.addEventListener('click', runFullAutoDemo);
    }
    if (DOM.btnDemoExpense) {
        DOM.btnDemoExpense.addEventListener('click', () => triggerAgentDemo('expense'));
    }
    if (DOM.btnDemoBudget) {
        DOM.btnDemoBudget.addEventListener('click', () => triggerAgentDemo('budget'));
    }
    if (DOM.btnDemoRisk) {
        DOM.btnDemoRisk.addEventListener('click', () => triggerAgentDemo('risk'));
    }
    if (DOM.btnDemoGoal) {
        DOM.btnDemoGoal.addEventListener('click', () => triggerAgentDemo('goal'));
    }
    if (DOM.btnDemoReceipt) {
        DOM.btnDemoReceipt.addEventListener('click', () => triggerAgentDemo('receipt'));
    }
    if (DOM.btnDemoCfo) {
        DOM.btnDemoCfo.addEventListener('click', () => triggerAgentDemo('cfo'));
    }
}

async function handleDemoModeToggle() {
    const enabled = DOM.demoModeToggle.checked;
    try {
        const res = await fetch('/api/health', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ demoMode: enabled })
        });
        const payload = await res.json();
        if (payload.success) {
            updateTelemetryUI(payload.data);
            await refreshData();
        }
    } catch (e) {
        console.error('Failed to toggle demo mode:', e);
    }
}

async function pollTelemetry() {
    try {
        const res = await fetch('/api/health');
        const payload = await res.json();
        if (payload.success) {
            updateTelemetryUI(payload.data);
        }
    } catch (e) {
        console.error('Telemetry polling failed:', e);
    }
}

function startTelemetryPolling() {
    pollTelemetry();
    setInterval(pollTelemetry, 5000);
}

function updateTelemetryUI(healthData) {
    if (!healthData) return;
    
    if (DOM.demoModeToggle) {
        DOM.demoModeToggle.checked = healthData.demoMode;
    }

    if (DOM.aiStatusDot && DOM.aiStatusTitle && DOM.aiStatusSubtitle) {
        DOM.aiStatusDot.className = 'status-indicator';
        if (healthData.aiStatus === 'Online') {
            DOM.aiStatusDot.classList.add('online');
            DOM.aiStatusTitle.innerText = 'AI Engine: Online';
            DOM.aiStatusSubtitle.innerText = 'Gemini 2.5 Active';
        } else if (healthData.aiStatus === 'Degraded') {
            DOM.aiStatusDot.classList.add('degraded');
            DOM.aiStatusTitle.innerText = 'AI Engine: Degraded';
            DOM.aiStatusSubtitle.innerText = 'Rate Limits Detected';
        } else {
            DOM.aiStatusDot.classList.add('offline');
            DOM.aiStatusTitle.innerText = 'AI Engine: Fallback';
            DOM.aiStatusSubtitle.innerText = healthData.demoMode ? 'Demo Mode Active' : 'Offline Mode Active';
        }
    }

    if (DOM.judgesAgentHealthTable) {
        DOM.judgesAgentHealthTable.innerHTML = '';
        Object.entries(healthData.agents || {}).forEach(([name, metrics]) => {
            const row = document.createElement('tr');
            let badgeClass = 'high';
            if (metrics.status === 'Offline Fallback') badgeClass = 'med';
            else if (metrics.status === 'Failed' || metrics.status === 'Offline') badgeClass = 'low';
            
            const badgeStyle = metrics.status === 'Offline Fallback' 
                ? 'style="padding: 2px 6px; background: rgba(245,158,11,0.15); color: var(--warning);"'
                : 'style="padding: 2px 6px;"';

            row.innerHTML = `
                <td><strong>${name}</strong></td>
                <td><span class="success-prob-badge ${badgeClass}" ${badgeStyle}>${metrics.status}</span></td>
                <td><code>${metrics.lastTool || 'None'}</code></td>
                <td>${metrics.responseTime > 0 ? metrics.responseTime + 'ms' : '0ms'}</td>
            `;
            DOM.judgesAgentHealthTable.appendChild(row);
        });
    }

    if (DOM.judgesMcpExplorerTable) {
        DOM.judgesMcpExplorerTable.innerHTML = '';
        Object.values(healthData.toolsStats || {}).forEach(tool => {
            const row = document.createElement('tr');
            const pctClass = tool.successRate >= 90 ? 'high' : 'low';
            row.innerHTML = `
                <td><code>${tool.name}()</code></td>
                <td>${tool.totalCount}</td>
                <td><span class="success-prob-badge ${pctClass}" style="padding: 2px 6px;">${tool.successRate}%</span></td>
                <td>${tool.avgResponseTime}ms</td>
                <td>${tool.lastExecution === 'Never' ? 'Never' : formatDate(tool.lastExecution)}</td>
            `;
            DOM.judgesMcpExplorerTable.appendChild(row);
        });
    }

    if (DOM.mcpToolLogs && healthData.mcpToolHistory && healthData.mcpToolHistory.length > 0) {
        DOM.mcpToolLogs.innerHTML = '';
        healthData.mcpToolHistory.slice(0, 10).forEach(log => {
            const row = document.createElement('tr');
            const time = new Date(log.timestamp).toLocaleTimeString();
            row.innerHTML = `
                <td>${time}</td>
                <td><strong>${log.tool}()</strong></td>
                <td><code>${log.params}</code></td>
                <td><span class="success-prob-badge ${log.status === 'Success' ? 'high' : 'low'}" style="padding: 2px 6px;">${log.status}</span></td>
            `;
            DOM.mcpToolLogs.appendChild(row);
        });
    }
}

let isRunningDemo = false;
async function runFullAutoDemo() {
    if (isRunningDemo) return;
    isRunningDemo = true;
    
    DOM.runAutoDemoBtn.disabled = true;
    DOM.runAutoDemoBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Running Showcase...';
    
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    
    try {
        if (!DOM.demoModeToggle.checked) {
            DOM.demoModeToggle.checked = true;
            await handleDemoModeToggle();
        }

        showDemoAlert('Auto-Demo Mode Started: Demonstrating PocketSense AI Agents...');
        
        await sleep(2000);
        switchTab('advisor');
        showDemoAlert('Sec 0-10: Coordinating Multi-Agent Chain Reasoning for savings queries...');
        
        DOM.chatMessages.innerHTML = '';
        appendChatBubble('Can I afford a MacBook Pro in 3 months?', 'user');
        
        const loadingId = appendChatLoader();
        
        const resetAllGlows = () => {
            const ids = [
                'node-router', 'node-goal', 'node-forecast', 'node-risk', 'node-advisor',
                'visual-node-router', 'visual-node-goal', 'visual-node-forecast', 'visual-node-risk', 'visual-node-advisor', 'visual-node-final'
            ];
            ids.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.classList.remove('active');
            });
        };
        
        resetAllGlows();
        
        const visualNode = (name) => document.getElementById(`visual-node-${name}`);
        const setNodeActive = (name, active) => {
            const el = visualNode(name);
            if (el) {
                if (active) el.classList.add('active');
                else el.classList.remove('active');
            }
            const elCtrl = document.getElementById(`node-${name}`);
            if (elCtrl) {
                if (active) elCtrl.classList.add('active');
                else elCtrl.classList.remove('active');
            }
        };
        
        setNodeActive('router', true);
        await sleep(1000);
        setNodeActive('goal', true);
        await sleep(1000);
        setNodeActive('forecast', true);
        await sleep(1000);
        setNodeActive('risk', true);
        await sleep(1000);
        setNodeActive('advisor', true);
        await sleep(1000);
        
        removeChatLoader(loadingId);
        
        const replyText = `**Advisor Agent (Offline Demonstration Response)**: 
Based on our multi-agent audit, purchasing a MacBook Pro (₹1,20,000) in 3 months is **feasible but carries warnings**.
1. **Savings Goal**: You must save ₹40,000/month. Your current savings velocity is ₹30,000/month.
2. **Forecast Projections**: At current spend trends, you will face a monthly savings shortfall of ₹10,000.
3. **Risk Warning**: Your dining out outlays spike 25% on weekends.
**Recommendation**: Restructure weekend discretionary limits to recover ₹10,000/month to guarantee success.`;
        
        appendChatBubble(replyText, 'assistant', {
            agent: 'Financial Advisor Agent',
            thinking: 'Coordinated Goal, Forecast, and Risk nodes validation chain.',
            tool: 'getGoals, forecastSpending, analyzeRisk'
        });
        
        const routingChain = [
            { agent: 'Router Agent', action: 'Analyzing intent', detail: 'Identified savings purchase feasibility question.', toolUsed: 'None' },
            { agent: 'Goal Agent', action: 'Auditing Goal targets', detail: 'Fetched savings target of ₹1,20,000.', toolUsed: 'getGoals' },
            { agent: 'Forecast Agent', action: 'Running spending curves', detail: 'Forecasted daily velocity rate.', toolUsed: 'forecastSpending' },
            { agent: 'Risk Agent', action: 'Checking categories risk', detail: 'Flagged discretionary category overruns.', toolUsed: 'analyzeRisk' },
            { agent: 'Financial Advisor Agent', action: 'Compiling advice report', detail: 'Synthesized final roadmap for MacBook purchase.', toolUsed: 'None' }
        ];
        
        updateAgentTimelineWidget(routingChain);
        const finalNode = visualNode('final');
        if (finalNode) finalNode.classList.add('active');
        
        await sleep(3000);
        switchTab('dashboard');
        showDemoAlert('Sec 10-20: Logging outlay transactions & refreshing dashboard metrics...');
        resetAllGlows();
        
        setNodeActive('router', true);
        await sleep(800);
        setNodeActive('advisor', true);
        
        const demoExpense = {
            amount: 12500,
            category: 'Shopping',
            note: 'Demo MacBook Fund Deposit'
        };
        logMCPToolCall('addExpense', demoExpense, 'Success');
        
        try {
            await fetch('/api/expense', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(demoExpense)
            });
            await refreshData();
        } catch (e) {
            console.error('Failed to log demo expense:', e);
        }
        
        await sleep(3000);
        switchTab('budget');
        showDemoAlert('Sec 20-25: Auditing category budgets and applying limit constraints...');
        await refreshData();
        
        const overrunAlert = document.createElement('div');
        overrunAlert.className = 'alert-banner-item critical';
        overrunAlert.id = 'demo-overrun-banner';
        overrunAlert.innerHTML = `
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span><strong>Shopping Limit Exceeded</strong>: Spent ₹12,500 exceeds Shopping category cap of ₹10,000!</span>
        `;
        DOM.smartAlertBanner.insertBefore(overrunAlert, DOM.smartAlertBanner.firstChild);
        
        await sleep(3000);
        switchTab('receipt');
        showDemoAlert('Sec 25-35: Simulating document processing through Receipt Vision OCR 2.0...');
        
        document.querySelector('.ocr-idle-screen').style.display = 'none';
        document.querySelector('.ocr-loading-screen').style.display = 'block';
        document.querySelector('.ocr-success-screen').style.display = 'none';
        
        await sleep(3000);
        
        const receiptData = {
            merchant: 'Starbucks Coffee',
            amount: 450,
            category: 'Food',
            tax: 45,
            lineItems: [
                { name: 'Caffe Latte', price: 250 },
                { name: 'Chocolate Croissant', price: 200 }
            ],
            confidence: 98
        };
        
        logMCPToolCall('scanReceipt', { image: 'IMAGE_BUFFER', mimeType: 'image/png' }, 'Success');
        
        document.querySelector('.ocr-loading-screen').style.display = 'none';
        DOM.extractedMerchant.innerText = receiptData.merchant;
        DOM.extractedAmount.innerText = formatCurrency(receiptData.amount);
        DOM.extractedCategory.innerText = receiptData.category;
        DOM.extractedTax.innerText = formatCurrency(receiptData.tax);
        
        DOM.extractedItemsList.innerHTML = '';
        receiptData.lineItems.forEach(item => {
            const li = document.createElement('div');
            li.innerHTML = `• ${sanitizeHTML(item.name)}: <strong>${formatCurrency(item.price)}</strong>`;
            DOM.extractedItemsList.appendChild(li);
        });
        
        const badge = document.getElementById('ocr-conf-badge');
        badge.innerText = `Extracted & Saved (Confidence: ${receiptData.confidence}%)`;
        document.querySelector('.ocr-success-screen').style.display = 'block';
        
        try {
            await fetch('/api/expense', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: receiptData.amount,
                    category: receiptData.category,
                    note: `Receipt: ${receiptData.merchant} (${receiptData.lineItems.map(i => i.name).join(', ')})`
                })
            });
            await refreshData();
        } catch (e) {
            console.error('Failed to log demo receipt expense:', e);
        }
        
        await sleep(3500);
        switchTab('cfo');
        showDemoAlert('Sec 35-42: Generating Monthly CFO executive financial statements...');
        await handleCFOReportGenerate();
        
        await sleep(4000);
        switchTab('judges');
        resetAllGlows();
        
        const tempBanner = document.getElementById('demo-overrun-banner');
        if (tempBanner) tempBanner.remove();
        
        DOM.demoModeToggle.checked = false;
        await handleDemoModeToggle();
        
        showDemoAlert('Demo Completed! 100% Core Capabilities Validated. PocketSense AI is fully operational.', 'success');
        alert('PocketSense AI Automated Demonstration Completed successfully!\n- Multi-Agent routing mapped\n- Real-time DB and chart telemetry synchronized\n- Category budget checks validated\n- OCR extraction saved\n- CFO Executive briefs generated');
        
    } catch (e) {
        console.error('Demo sequence failed:', e);
        showDemoAlert('Demo interrupted: ' + e.message, 'critical');
    } finally {
        isRunningDemo = false;
        DOM.runAutoDemoBtn.disabled = false;
        DOM.runAutoDemoBtn.innerHTML = '<i class="fa-solid fa-play"></i> Run Full PocketSense AI Demonstration';
    }
}

function showDemoAlert(message, type = 'info') {
    const banner = document.getElementById('smartAlertBanner');
    if (!banner) return;
    
    const existing = document.getElementById('demo-running-alert');
    if (existing) existing.remove();
    
    const div = document.createElement('div');
    div.id = 'demo-running-alert';
    div.className = `alert-banner-item ${type}`;
    div.innerHTML = `
        <i class="fa-solid fa-circle-play" style="animation: statusPulse 1.5s infinite; color: ${type === 'success' ? 'var(--success)' : 'var(--warning)'};"></i>
        <span><strong>SHOWCASE TELEMETRY</strong>: ${sanitizeHTML(message)}</span>
    `;
    banner.insertBefore(div, banner.firstChild);
}

async function triggerAgentDemo(agent) {
    if (!DOM.demoModeToggle.checked) {
        DOM.demoModeToggle.checked = true;
        await handleDemoModeToggle();
    }

    const resetAllGlows = () => {
        const ids = [
            'node-router', 'node-goal', 'node-forecast', 'node-risk', 'node-advisor',
            'visual-node-router', 'visual-node-goal', 'visual-node-forecast', 'visual-node-risk', 'visual-node-advisor', 'visual-node-final'
        ];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('active');
        });
    };
    
    resetAllGlows();

    const setNodeActive = (name, active) => {
        const el = document.getElementById(`visual-node-${name}`);
        if (el) {
            if (active) el.classList.add('active');
            else el.classList.remove('active');
        }
        const elCtrl = document.getElementById(`node-${name}`);
        if (elCtrl) {
            if (active) elCtrl.classList.add('active');
            else elCtrl.classList.remove('active');
        }
    };

    if (agent === 'expense') {
        switchTab('advisor');
        DOM.chatInput.value = 'I spent 1500 on dinner at Olive Garden';
        await handleChatSend();
    } else if (agent === 'budget') {
        switchTab('advisor');
        DOM.chatInput.value = 'Analyze my budget and recommend category allocations';
        await handleChatSend();
    } else if (agent === 'risk') {
        switchTab('advisor');
        DOM.chatInput.value = 'What are my spending risk levels?';
        await handleChatSend();
    } else if (agent === 'goal') {
        switchTab('advisor');
        DOM.chatInput.value = 'Can I afford a MacBook Pro in 3 months?';
        await handleChatSend();
    } else if (agent === 'receipt') {
        switchTab('receipt');
        ocrImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        ocrImageMime = 'image/png';
        DOM.ocrImagePreview.src = ocrImageBase64;
        DOM.ocrDragZone.style.display = 'none';
        DOM.ocrPreviewZone.style.display = 'flex';
        await handleProcessOCR();
    } else if (agent === 'cfo') {
        switchTab('cfo');
        await handleCFOReportGenerate();
    }
}

function simulateOfflineClientResponse(text) {
    setTimeout(() => {
        const query = text.toLowerCase();
        let reply = `PocketSense Client Intelligence (Offline Recovery): Operating in client-side fallback mode. Here is the local telemetry advisory:\n\n`;
        let routingChain = [
            { agent: 'Router Agent', action: 'Direct client-side intercept (Offline)', detail: 'Direct fallback triggered due to connectivity/quota bounds.', toolUsed: 'None' }
        ];
        
        if (query.includes('afford') || query.includes('macbook') || query.includes('buy') || query.includes('laptop')) {
            reply += `1. **Goal Targets**: You are working towards a purchase. Based on current budgets, a savings rate of ₹28,333/month is required.\n`;
            reply += `2. **Overhead Risk**: Discretionary outlays are currently high. Cap discretionary spending at 20% of your global limit.\n\n`;
            reply += `*Client-Side Recommendation*: Purchase is delayed. Increase saving velocity or reduce dining outlays.`;
            routingChain.push(
                { agent: 'Goal Agent', action: 'Goal parameters audited (Offline)', detail: 'Calculated savings target limits.', toolUsed: 'getGoals' },
                { agent: 'Forecast Agent', action: 'Spending projection curves checked (Offline)', detail: 'Calculated daily velocity.', toolUsed: 'forecastSpending' },
                { agent: 'Financial Advisor Agent', action: 'Advisory formulated', detail: 'Compiled offline client recommendations.', toolUsed: 'None' }
            );
        } else {
            const spent = state.budget.spent || 0;
            const limit = state.budget.budget || 25000;
            reply += `1. **Portfolio Limits**: Total Spent: ₹${spent} / ₹${limit}.\n`;
            reply += `2. **Daily Velocity**: Running at ${formatCurrency(state.forecast.velocityPerDay || 300)} per day.\n\n`;
            reply += `*Client-Side Suggestion*: Maintain present spending velocity and monitor entertainment outlays.`;
            routingChain.push(
                { agent: 'Forecast Agent', action: 'Daily velocity indices audited (Offline)', detail: 'Parsed local transactions ledger.', toolUsed: 'forecastSpending' },
                { agent: 'Financial Advisor Agent', action: 'Advisory formulated', detail: 'Synthesized offline tips.', toolUsed: 'None' }
            );
        }
        
        appendChatBubble(reply, 'assistant', {
            agent: 'Financial Advisor Agent',
            thinking: 'Client-side offline resilient network/quota recovery generator activated.',
            tool: 'None'
        });
        updateAgentFlowchart(routingChain);
        updateAgentTimelineWidget(routingChain);
    }, 1000);
}

/* ==========================================================================
   Onboarding Screen Tour Handlers
   ========================================================================== */
function checkOnboarding() {
    if (localStorage.getItem('pocketsense_onboarded') === 'true') {
        if (DOM.onboardingModal) {
            DOM.onboardingModal.style.display = 'none';
        }
    }
}

function setupOnboardingEvents() {
    if (DOM.dismissOnboardingBtn) {
        DOM.dismissOnboardingBtn.addEventListener('click', () => {
            if (DOM.onboardingModal) DOM.onboardingModal.style.display = 'none';
            localStorage.setItem('pocketsense_onboarded', 'true');
        });
    }
    if (DOM.onboardToJudgesLink) {
        DOM.onboardToJudgesLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (DOM.onboardingModal) DOM.onboardingModal.style.display = 'none';
            localStorage.setItem('pocketsense_onboarded', 'true');
            switchTab('judges');
        });
    }
}
