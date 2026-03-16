const platformMap = {
    'fb': ['fb', 'facebook', 'fanpage'],
    'ig': ['ig', 'instagram', 'ins'],
    'tiktok': ['tiktok', 'tt'],
    'yt': ['yt', 'youtube'],
    'thread': ['thread', 'threads'],
    'lemon8': ['lemon8', 'lemon 8'],
    'zalo': ['zalo', 'zalo oa', 'zalo video'],
    'twitter': ['twitter', 'twitter x', 'x']
};

const isPlatformMatch = (platformId, channelPlatform) => {
    if (!channelPlatform) return false;
    const p = channelPlatform.toLowerCase().trim();
    
    const targets = platformMap[platformId] || [platformId.toLowerCase()];
    
    return targets.some(target => {
        if (p === target) return true;
        if (target.length > 3 && p.includes(target)) return true;
        const words = p.split(/[\s_-]+/);
        if (words.includes(target)) return true;
        return false;
    });
};

const testCases = [
    { pid: 'fb', cp: 'Facebook', expected: true },
    { pid: 'fb', cp: 'Tiktok', expected: false },
    { pid: 'tiktok', cp: 'Tiktok', expected: true },
    { pid: 'tiktok', cp: 'Tiktok - Shop', expected: true },
    { pid: 'fb', cp: 'FB-HuyK', expected: true },
    { pid: 'fb', cp: 'Fanpage - HuyK', expected: true },
    { pid: 'yt', cp: 'Youtube', expected: true },
    { pid: 'yt', cp: 'YT', expected: true },
];

testCases.forEach(tc => {
    const result = isPlatformMatch(tc.pid, tc.cp);
    console.log(`PlatformID: ${tc.pid}, ChannelPlatform: ${tc.cp} -> Got: ${result}, Expected: ${tc.expected} [${result === tc.expected ? 'PASS' : 'FAIL'}]`);
});
