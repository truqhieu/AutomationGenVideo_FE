import { useMemo } from "react";
import {
    Activity,
    LayoutDashboard,
    LayoutGrid,
    Layout,
    User,
    FileText,
    ClipboardList,
    CheckSquare,
    Users,
    Search,
    BarChart3,
    Calendar,
    Crown,
} from "lucide-react";
import { NavMenu } from "./types";

export function useNavMenus(
    isManagerOrAdmin: boolean,
    isManagement: boolean,
    options?: { isAdmin?: boolean; isLeader?: boolean },
): NavMenu[] {
    const { isAdmin, isLeader } = options ?? {};
    return useMemo<NavMenu[]>(
        () => [
            {
                id: "vcb-portal",
                label: "VCB Portal",
                activePathPrefixes: [
                    "/dashboard/manager",
                    "/dashboard/editor-management",
                    "/dashboard/hieu-suat",
                    "/dashboard/admin",
                    "/dashboard/leader",
                ],
                sections: [
                    {
                        section: "TỔNG QUAN",
                        color: "blue",
                        items: [
                            ...(isAdmin
                                ? [
                                      {
                                          label: "Dashboard Admin",
                                          href: "/dashboard/admin",
                                          icon: BarChart3,
                                          description: "Biểu đồ tổng quan toàn hệ thống",
                                      },
                                  ]
                                : []),
                            ...(isLeader || isAdmin
                                ? [
                                      {
                                          label: "Dashboard Leader",
                                          href: "/dashboard/leader",
                                          icon: Crown,
                                          description: "Biểu đồ theo góc nhìn Leader",
                                      },
                                  ]
                                : []),
                            {
                                label: "Hiệu suất",
                                href: "/dashboard/manager/user-activity?tab=performance",
                                icon: Activity,
                                description: "Theo dõi KPI & hiệu suất cá nhân",
                            },
                            ...(isManagerOrAdmin
                                ? [
                                      {
                                          label: "Tổng quan nhóm",
                                          href: "/dashboard/manager/user-activity?tab=dashboard",
                                          icon: LayoutDashboard,
                                          description: "Dashboard analytics toàn nhóm",
                                      },
                                      {
                                          label: "Dashboard Tổng",
                                          href: "/dashboard/manager",
                                          icon: LayoutGrid,
                                          description: "Bảng điều khiển quản lý hệ thống",
                                      },
                                  ]
                                : []),
                            {
                                label: "Bảng xếp hạng",
                                href: "/dashboard/manager/user-activity?tab=ranking",
                                icon: Layout,
                                description: "Xếp hạng thành viên trong tháng",
                            },
                            {
                                label: "Tiến độ cá nhân",
                                href: "/dashboard/manager/user-activity?tab=personal",
                                icon: User,
                                description: "Lịch sử & biểu đồ tiến độ cá nhân",
                            },
                        ],
                    },
                    {
                        section: "BÁO CÁO HÀNG NGÀY",
                        color: "violet",
                        items: [
                            {
                                label: "Báo cáo",
                                href: "/dashboard/manager/user-activity?tab=daily_report&report=daily",
                                icon: FileText,
                                description: "Báo cáo ngày & tháng của Leader / Member",
                            },
                            {
                                label: "Checklist",
                                href: "/dashboard/manager/user-activity?tab=daily_checklist",
                                icon: CheckSquare,
                                description: "Danh sách công việc cần hoàn thành hôm nay",
                            },
                            {
                                label: "Vấn đề & Win",
                                href: "/dashboard/manager/user-activity?tab=daily_outstanding",
                                icon: ClipboardList,
                                description: "Ghi nhận vấn đề nổi bật & thành tích ngày",
                            },
                        ],
                    },
                    ...(isManagement
                        ? [
                              {
                                  section: "QUẢN LÝ",
                                  color: "slate" as const,
                                  items: [
                                      {
                                          label: "Quản lý Editors",
                                          href: "/dashboard/editor-management",
                                          icon: Users,
                                          description: "Quản lý danh sách Editor trong hệ thống",
                                      },
                                  ],
                              },
                          ]
                        : []),
                ],
            },
            {
                id: "social-discovery",
                label: "Khám phá Video",
                activePathPrefixes: [
                    "/dashboard/facebook",
                    "/dashboard/instagram",
                    "/dashboard/tiktok",
                    "/dashboard/douyin",
                    "/dashboard/xiaohongshu",
                    "/dashboard/ai",
                    "/dashboard/search-video",
                    "/dashboard/channel-analysis",
                ],
                sections: [
                    {
                        section: "PHÂN TÍCH",
                        color: "blue",
                        items: [
                            {
                                label: "Channels",
                                href: "/dashboard/facebook/channels",
                                icon: Users,
                                description: "Quản lý kênh mạng xã hội",
                            },
                            {
                                label: "Phân tích kênh",
                                href: "/dashboard/channel-analysis",
                                icon: BarChart3,
                                description: "Phân tích sâu dữ liệu kênh",
                            },
                        ],
                    },
                    {
                        section: "KHÁM PHÁ",
                        color: "slate",
                        items: [
                            {
                                label: "Tìm kiếm Video (Hub)",
                                href: "/dashboard/search-video",
                                icon: Search,
                                description: "Tìm kiếm video trên toàn nền tảng",
                            },
                        ],
                    },
                ],
            },
        ],
        [isManagerOrAdmin, isManagement, isAdmin, isLeader],
    );
}
