export const MOCK_TRAFFIC_DATA = {
    fb: 1250,
    ig: 840,
    tiktok: 3200,
    yt: 0,
    thread: 150,
    lemon8: 0,
    zalo: 450,
    twitter: 0,
    total: 5890,
    details: [
        { id: "1", value: "1250", channel: "Facebook Ads", platform: "fb" },
        { id: "2", value: "840", channel: "Instagram Story", platform: "ig" },
        { id: "3", value: "3200", channel: "TikTok Organic", platform: "tiktok" },
    ],
};

export const MOCK_CHECKLIST_DATA = {
    fb: true,
    ig: true,
    tiktok: true,
    youtube: true,
    zalo: true,
    lark: true,
    captionHashtag: true,
    reportLink: true,
};

export const MOCK_LEADER_QUESTIONS = [
    {
        question: "ĐÃ KIỂM TRA CHẤT LƯỢNG VIDEO ĐẦU RA CỦA TEAM CHƯA?",
        answer: "Đã kiểm tra toàn bộ video của team, chất lượng đạt yêu cầu và đã duyệt đăng.",
    },
    {
        question: "TEAM BẠN HÔM QUA CÓ THÀNH VIÊN NÀO CÓ VIDEO WIN NHẤT?",
        answer: "Bạn Nguyễn Văn A có video đạt 100k view sau 2 giờ đăng tải.",
    },
    {
        question: "TEAM BẠN HÔM QUA CÓ GÌ ĐỔI MỚI ĐƯỢC ÁP DỤNG KHÔNG?",
        answer: "Team đã thử nghiệm quy trình edit mới giúp rút ngắn thời gian sản xuất xuống 15%.",
    },
];

export const MOCK_MEMBER_QUESTIONS = [
    {
        question: "NGÀY HÔM QUA CÔNG VIỆC BẠN CÓ CẢI GÌ KHIẾN BẠN TỰ HÀO VÀ THÍCH THÚ NHẤT?",
        answer: "Hoàn thành bộ video sáng tạo cho chiến dịch mới với tỉ lệ giữ chân người xem cao hơn 20%.",
    },
    {
        question: "HÔM QUA CÓ ĐỔI MỚI SÁNG TẠO GÌ ĐƯỢC ÁP DỤNG VÀO CÔNG VIỆC CỦA BẠN KHÔNG?",
        answer: "Áp dụng kỹ thuật chuyển cảnh mới giúp video mượt mà hơn và thu hút người xem từ những giây đầu.",
    },
    {
        question: "BẠN CÓ GẶP KHÓ KHĂN NÀO CẦN HỖ TRỢ KHÔNG?",
        answer: "Hiện tại công việc đang tiến triển tốt, không có khó khăn gì đáng kể.",
    },
];

export const MOCK_CHECKLIST_REPORTS = [
    {
        id: "m1",
        name: "ĐỐ THỊ NGA",
        team: "Team K8",
        position: "Leader",
        avatar: "",
        status: "ĐÚNG HẠN",
        time: "09:41 08-04",
        isMock: true,
        checklist: MOCK_CHECKLIST_DATA,
        trafficToday: MOCK_TRAFFIC_DATA,
        questions: MOCK_LEADER_QUESTIONS,
        videoCount: 0,
    },
    {
        id: "m2",
        name: "NGUYỄN LINH CHI",
        team: "Team K8",
        position: "Leader",
        avatar: "",
        status: "ĐÚNG HẠN",
        time: "09:42 08-04",
        isMock: true,
        checklist: MOCK_CHECKLIST_DATA,
        trafficToday: MOCK_TRAFFIC_DATA,
        questions: MOCK_LEADER_QUESTIONS,
        videoCount: 0,
    },
    {
        id: "m3",
        name: "NGUYỄN TOÀN",
        team: "Global JP1",
        position: "Member",
        avatar: "",
        status: "ĐÚNG HẠN",
        time: "09:43 08-04",
        isMock: true,
        checklist: MOCK_CHECKLIST_DATA,
        trafficToday: MOCK_TRAFFIC_DATA,
        questions: MOCK_MEMBER_QUESTIONS,
        videoCount: 3,
    },
    {
        id: "m4",
        name: "TUÂN NGUYỄN",
        team: "Global B.K",
        position: "Member",
        avatar: "",
        status: "ĐÚNG HẠN",
        time: "09:44 08-04",
        isMock: true,
        checklist: MOCK_CHECKLIST_DATA,
        trafficToday: MOCK_TRAFFIC_DATA,
        questions: MOCK_MEMBER_QUESTIONS,
        videoCount: 4,
    },
    {
        id: "m5",
        name: "VÂN NGUYỄN",
        team: "Team K2",
        position: "Leader",
        avatar: "",
        status: "ĐÚNG HẠN",
        time: "09:45 08-04",
        isMock: true,
        checklist: MOCK_CHECKLIST_DATA,
        trafficToday: MOCK_TRAFFIC_DATA,
        questions: MOCK_LEADER_QUESTIONS,
        videoCount: 0,
    },
    {
        id: "m6",
        name: "BÙI ĐOÀN",
        team: "Team K2",
        position: "Member",
        avatar: "",
        status: "ĐÚNG HẠN",
        time: "09:46 08-04",
        isMock: true,
        checklist: MOCK_CHECKLIST_DATA,
        trafficToday: MOCK_TRAFFIC_DATA,
        questions: MOCK_MEMBER_QUESTIONS,
        videoCount: 5,
    },
];

export const MOCK_REPORT_DATA = MOCK_CHECKLIST_REPORTS[2];
export const MOCK_LEADER_REPORT_DATA = MOCK_CHECKLIST_REPORTS[0];
