export type MemberStatus = "approved" | "pending" | "editing";

export interface MemberRow {
  n: string;
  r: string;
  g: string;
  c: string;
  i: string;
  a: [number, number, number, number, number];
  t: number;
  p: number;
  /** Nhãn trạng thái (không kèm ký tự trang trí) */
  s: string;
  st: MemberStatus;
  sc: string;
}

export const LEADER_MEMBERS: MemberRow[] = [
  {
    n: "Nguyễn Văn A",
    r: "Trưởng nhóm",
    g: "VN",
    c: "#F59E0B",
    i: "NA",
    a: [20, 15, 10, 8, 5],
    t: 58,
    p: 83,
    s: "Đã duyệt",
    st: "approved",
    sc: "text-emerald-600",
  },
  {
    n: "Trần Thị B",
    r: "Thành viên",
    g: "VN",
    c: "#F43F5E",
    i: "TB",
    a: [15, 12, 8, 5, 3],
    t: 43,
    p: 70,
    s: "Chờ duyệt",
    st: "pending",
    sc: "text-amber-500",
  },
  {
    n: "Nguyễn Văn C",
    r: "Thành viên",
    g: "VN",
    c: "#14B8A6",
    i: "VC",
    a: [12, 13, 7, 6, 4],
    t: 42,
    p: 75,
    s: "Đã duyệt",
    st: "approved",
    sc: "text-emerald-600",
  },
  {
    n: "Mai G",
    r: "Thành viên",
    g: "VN",
    c: "#22C55E",
    i: "MG",
    a: [14, 11, 8, 5, 3],
    t: 41,
    p: 72,
    s: "Đã duyệt",
    st: "approved",
    sc: "text-emerald-600",
  },
  {
    n: "Lê F",
    r: "Thành viên",
    g: "VN",
    c: "#8B5CF6",
    i: "LF",
    a: [11, 6, 4, 2, 1],
    t: 24,
    p: 60,
    s: "Đang sửa",
    st: "editing",
    sc: "text-orange-500",
  },
];

export interface PerfBarRow {
  n: string;
  c: string;
  i: string;
  a: [number, number, number, number, number];
  p: number;
}

export const LEADER_PERF_BARS: PerfBarRow[] = [
  { n: "Nguyễn A", c: "#F59E0B", i: "NA", a: [20, 15, 10, 8, 5], p: 83 },
  { n: "Phạm D", c: "#92400E", i: "PD", a: [18, 14, 9, 7, 4], p: 78 },
  { n: "Văn C", c: "#14B8A6", i: "VC", a: [12, 13, 7, 6, 4], p: 75 },
  { n: "Mai G", c: "#22C55E", i: "MG", a: [14, 11, 8, 5, 3], p: 72 },
  { n: "Trần B", c: "#F43F5E", i: "TB", a: [15, 12, 8, 5, 3], p: 70 },
  { n: "Hoàng E", c: "#EF4444", i: "HE", a: [10, 9, 6, 4, 2], p: 65 },
  { n: "Trần H", c: "#EC4899", i: "TH", a: [9, 7, 5, 3, 2], p: 58 },
  { n: "Lê F", c: "#8B5CF6", i: "LF", a: [11, 6, 4, 2, 1], p: 60 },
];
