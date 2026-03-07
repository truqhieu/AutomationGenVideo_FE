/**
 * ============================================================
 * LOAD TEST: 30 Concurrent Users - VietChiBao Platform
 * ============================================================
 * Mô phỏng 30 người dùng đồng thời truy cập các trang/API chính.
 *
 * Chạy: node tests/load-test-30users.mjs
 *
 * Endpoints được test:
 *   - FE pages  : Dashboard, Search Video, Generate
 *   - AI API    : Douyin search, Instagram search
 *   - BE API    : Health check, Auth check
 * ============================================================
 */

// ─── CONFIG ───────────────────────────────────────────────
const CONFIG = {
    CONCURRENT_USERS: 30,
    TIMEOUT_MS: 15_000,           // Timeout mỗi request
    BASE_FE_URL: 'http://localhost:3001',
    BASE_AI_URL: 'http://localhost:8001/api',  // AI Django server
    BASE_PROXY_URL: 'http://localhost:3000/api', // Next.js proxy (NEXT_PUBLIC_API_URL)

    // Dùng token thật nếu cần auth
    AUTH_TOKEN: process.env.TEST_AUTH_TOKEN || '',

    // Keyword test cho search endpoints
    TEST_KEYWORD: 'trang suc',
};

// ─── COLORS ───────────────────────────────────────────────
const C = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m',
    blue: '\x1b[34m',
};

// ─── SCENARIOS ────────────────────────────────────────────
/**
 * Mỗi scenario = 1 hành động của user.
 * 30 users sẽ được phân đều vào các scenario (round-robin).
 */
const SCENARIOS = [
    // ---------- FE Pages ----------
    {
        name: 'FE: Dashboard',
        type: 'GET',
        url: () => `${CONFIG.BASE_FE_URL}/dashboard`,
        weight: 4,
    },
    {
        name: 'FE: Search Video Page',
        type: 'GET',
        url: () => `${CONFIG.BASE_FE_URL}/dashboard/search-video`,
        weight: 5,
    },
    {
        name: 'FE: Login Page',
        type: 'GET',
        url: () => `${CONFIG.BASE_FE_URL}/login`,
        weight: 2,
    },
    {
        name: 'FE: Mix Video Page',
        type: 'GET',
        url: () => `${CONFIG.BASE_FE_URL}/dashboard/mix-video`,
        weight: 3,
    },

    // ---------- AI API (port 8001) ----------
    {
        name: 'AI: Health Check',
        type: 'GET',
        url: () => `${CONFIG.BASE_AI_URL}/health/`,
        weight: 2,
    },
    {
        name: 'AI: Douyin Search',
        type: 'POST',
        url: () => `${CONFIG.BASE_AI_URL}/douyin/search/`,
        body: {
            searchTerm: CONFIG.TEST_KEYWORD,
            searchType: 'keyword',
            maxPosts: 5,
            batchIndex: 0,
            seenIds: [],
        },
        weight: 4,
        warnSlowMs: 8000,
    },
    {
        name: 'AI: Instagram Search',
        type: 'POST',
        url: () => `${CONFIG.BASE_AI_URL}/search/`,
        body: {
            platform: 'instagram',
            keyword: CONFIG.TEST_KEYWORD,
            max_results: 5,
            search_type: 'posts',
            search_mode: 'hashtag',
            page: 1,
        },
        weight: 3,
        warnSlowMs: 8000,
    },
    {
        name: 'AI: TikTok Search',
        type: 'POST',
        url: () => `${CONFIG.BASE_AI_URL}/search/`,
        body: {
            platform: 'tiktok',
            keyword: CONFIG.TEST_KEYWORD,
            max_results: 5,
            search_type: 'posts',
            search_mode: 'keyword',
            page: 1,
        },
        weight: 3,
        warnSlowMs: 8000,
    },
    {
        name: 'AI: Search Suggestions',
        type: 'GET',
        url: () => `${CONFIG.BASE_AI_URL}/search/suggestions/?platform=tiktok&q=${encodeURIComponent(CONFIG.TEST_KEYWORD)}`,
        weight: 2,
    },

    // ---------- Proxy API (Next.js → BE, port 3000) ----------
    {
        name: 'PROXY: Voices List',
        type: 'GET',
        url: () => `${CONFIG.BASE_PROXY_URL}/videos/voices/`,
        weight: 2,
    },
];

// ─── HELPERS ──────────────────────────────────────────────
function expandByWeight(scenarios) {
    const pool = [];
    for (const s of scenarios) {
        for (let i = 0; i < (s.weight || 1); i++) pool.push(s);
    }
    return pool;
}

function pickScenarios(n) {
    const pool = expandByWeight(SCENARIOS);
    const result = [];
    for (let i = 0; i < n; i++) result.push(pool[i % pool.length]);
    return result;
}

async function runRequest(scenario, userId) {
    const start = Date.now();
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': `LoadTest-User${userId}`,
        ...(CONFIG.AUTH_TOKEN ? { 'Authorization': `Bearer ${CONFIG.AUTH_TOKEN}` } : {}),
    };

    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);

        const options = {
            method: scenario.type,
            headers,
            signal: controller.signal,
        };
        if (scenario.type === 'POST' && scenario.body) {
            options.body = JSON.stringify(scenario.body);
        }

        const response = await fetch(scenario.url(), options);
        clearTimeout(timer);

        const ms = Date.now() - start;
        return {
            userId,
            name: scenario.name,
            status: response.status,
            ok: response.ok,
            ms,
            slow: ms > (scenario.warnSlowMs || 3000),
        };
    } catch (err) {
        const ms = Date.now() - start;
        const isTimeout = err.name === 'AbortError';
        return {
            userId,
            name: scenario.name,
            status: isTimeout ? 408 : 0,
            ok: false,
            ms,
            error: isTimeout ? 'TIMEOUT' : err.message,
            slow: true,
        };
    }
}

function percentile(sortedArr, p) {
    if (!sortedArr.length) return 0;
    const idx = Math.ceil((p / 100) * sortedArr.length) - 1;
    return sortedArr[Math.max(0, idx)];
}

function printBar(value, max, width = 30) {
    const filled = Math.round((value / max) * width);
    return '█'.repeat(filled) + '░'.repeat(width - filled);
}

// ─── MAIN ─────────────────────────────────────────────────
async function main() {
    console.log(`\n${C.bold}${C.cyan}╔════════════════════════════════════════════════╗`);
    console.log(`║   🚀 LOAD TEST: ${CONFIG.CONCURRENT_USERS} Concurrent Users          ║`);
    console.log(`╚════════════════════════════════════════════════╝${C.reset}\n`);

    console.log(`${C.gray}FE  : ${CONFIG.BASE_FE_URL}`);
    console.log(`AI  : ${CONFIG.BASE_AI_URL}`);
    console.log(`BE  : ${CONFIG.BASE_BE_URL}${C.reset}\n`);

    const assigned = pickScenarios(CONFIG.CONCURRENT_USERS);
    console.log(`${C.bold}Phân bố ${CONFIG.CONCURRENT_USERS} users vào các scenario:${C.reset}`);
    const dist = {};
    assigned.forEach(s => { dist[s.name] = (dist[s.name] || 0) + 1; });
    Object.entries(dist).forEach(([name, count]) => {
        console.log(`  ${C.gray}${String(count).padStart(2)} users${C.reset} → ${name}`);
    });

    console.log(`\n${C.bold}▶ Khởi động ${CONFIG.CONCURRENT_USERS} requests đồng thời...${C.reset}\n`);

    const startAll = Date.now();
    const promises = assigned.map((scenario, i) => runRequest(scenario, i + 1));
    const results = await Promise.all(promises);
    const totalMs = Date.now() - startAll;

    // ─── RESULTS ──────────────────────────────────────────
    console.log(`${C.bold}═══════════════ KẾT QUẢ CHI TIẾT ═══════════════${C.reset}`);
    const byScenario = {};
    results.forEach(r => {
        if (!byScenario[r.name]) byScenario[r.name] = [];
        byScenario[r.name].push(r);
    });

    for (const [name, rs] of Object.entries(byScenario)) {
        const ok = rs.filter(r => r.ok).length;
        const fail = rs.length - ok;
        const times = rs.map(r => r.ms).sort((a, b) => a - b);
        const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
        const p50 = percentile(times, 50);
        const p95 = percentile(times, 95);
        const max = times[times.length - 1];

        const statusIcon = fail === 0 ? `${C.green}✓` : fail < rs.length ? `${C.yellow}⚠` : `${C.red}✗`;
        console.log(`\n  ${statusIcon} ${C.bold}${name}${C.reset}`);
        console.log(`     Users  : ${rs.length}  (OK: ${C.green}${ok}${C.reset}  Fail: ${fail > 0 ? C.red : C.gray}${fail}${C.reset})`);
        console.log(`     avg    : ${avg}ms   p50: ${p50}ms   p95: ${p95}ms   max: ${max}ms`);

        // Hiển thị từng user nếu có lỗi
        rs.filter(r => !r.ok || r.slow).forEach(r => {
            const icon = !r.ok ? `${C.red}✗` : `${C.yellow}⚡`;
            const extra = r.error ? ` [${r.error}]` : ` [HTTP ${r.status}]`;
            console.log(`     ${icon} User${String(r.userId).padStart(2)}${C.reset}: ${r.ms}ms${C.gray}${extra}${C.reset}`);
        });
    }

    // ─── SUMMARY ──────────────────────────────────────────
    const totalOk = results.filter(r => r.ok).length;
    const totalFail = results.length - totalOk;
    const allTimes = results.map(r => r.ms).sort((a, b) => a - b);
    const avgAll = Math.round(allTimes.reduce((a, b) => a + b, 0) / allTimes.length);
    const p50All = percentile(allTimes, 50);
    const p95All = percentile(allTimes, 95);
    const p99All = percentile(allTimes, 99);
    const maxAll = allTimes[allTimes.length - 1];
    const slowCount = results.filter(r => r.slow).length;

    const successRate = ((totalOk / results.length) * 100).toFixed(1);
    const rateColor = successRate >= 95 ? C.green : successRate >= 80 ? C.yellow : C.red;

    console.log(`\n${C.bold}${C.blue}═══════════════ TỔNG HỢP ═══════════════${C.reset}`);
    console.log(`  Tổng thời gian   : ${C.bold}${totalMs}ms${C.reset} (${(totalMs / 1000).toFixed(2)}s)`);
    console.log(`  Tổng requests    : ${results.length}`);
    console.log(`  ✓ Thành công     : ${C.green}${totalOk}${C.reset}`);
    console.log(`  ✗ Thất bại       : ${totalFail > 0 ? C.red : C.gray}${totalFail}${C.reset}`);
    console.log(`  ⚡ Slow (>${CONFIG.CONCURRENT_USERS > 10 ? 3 : 2}s)    : ${slowCount > 0 ? C.yellow : C.gray}${slowCount}${C.reset}`);
    console.log(`  Success rate     : ${rateColor}${C.bold}${successRate}%${C.reset}`);

    console.log(`\n  ${C.bold}Latency Distribution:${C.reset}`);
    console.log(`  avg : ${avgAll.toString().padStart(6)}ms  ${printBar(avgAll, maxAll)}`);
    console.log(`  p50 : ${p50All.toString().padStart(6)}ms  ${printBar(p50All, maxAll)}`);
    console.log(`  p95 : ${p95All.toString().padStart(6)}ms  ${printBar(p95All, maxAll)}`);
    console.log(`  p99 : ${p99All.toString().padStart(6)}ms  ${printBar(p99All, maxAll)}`);
    console.log(`  max : ${maxAll.toString().padStart(6)}ms  ${printBar(maxAll, maxAll)}`);

    // ─── VERDICT ──────────────────────────────────────────
    console.log(`\n${C.bold}═══════════════ ĐÁNH GIÁ ═══════════════${C.reset}`);
    const verdict = [];

    if (parseFloat(successRate) >= 98)
        verdict.push(`${C.green}✅ Success rate ${successRate}% — Xuất sắc${C.reset}`);
    else if (parseFloat(successRate) >= 90)
        verdict.push(`${C.yellow}⚠️  Success rate ${successRate}% — Chấp nhận được, cần tối ưu${C.reset}`);
    else
        verdict.push(`${C.red}❌ Success rate ${successRate}% — Có vấn đề nghiêm trọng${C.reset}`);

    if (p95All <= 1000)
        verdict.push(`${C.green}✅ P95 ${p95All}ms ≤ 1s — Nhanh${C.reset}`);
    else if (p95All <= 3000)
        verdict.push(`${C.yellow}⚠️  P95 ${p95All}ms — Chấp nhận được${C.reset}`);
    else
        verdict.push(`${C.red}❌ P95 ${p95All}ms > 3s — Quá chậm${C.reset}`);

    if (totalFail === 0)
        verdict.push(`${C.green}✅ Không có lỗi${C.reset}`);
    else
        verdict.push(`${C.red}❌ ${totalFail} requests thất bại — Kiểm tra log server${C.reset}`);

    verdict.forEach(v => console.log(`  ${v}`));

    console.log(`\n${C.gray}Tip: Các endpoint Douyin/Instagram gọi Apify từ bên ngoài nên`);
    console.log(`sẽ luôn chậm hơn FE/BE thuần. Focus vào FE + BE metrics.${C.reset}\n`);

    // Exit code
    process.exit(parseFloat(successRate) >= 80 ? 0 : 1);
}

main().catch(err => {
    console.error(`${C.red}Fatal error:${C.reset}`, err);
    process.exit(1);
});
