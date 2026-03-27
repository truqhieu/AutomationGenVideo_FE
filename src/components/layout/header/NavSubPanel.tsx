import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { NavItem } from "./types";

interface NavSubPanelProps {
    item: NavItem;
    onMouseEnter: () => void;
}

export default function NavSubPanel({ item, onMouseEnter }: NavSubPanelProps) {
    if (!item.subPanel) return null;

    return (
        <div
            className="border-l border-white/[0.06] bg-[#0d1424] flex flex-col"
            style={{ width: "400px" }}
            onMouseEnter={onMouseEnter}
        >
            <div className="px-5 pt-4 pb-3 border-b border-white/[0.05]">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-400">
                    Chọn loại báo cáo
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Báo cáo hiệu suất cho Leader & Member</p>
            </div>

            <div className="flex flex-col gap-3 p-4 flex-1">
                {item.subPanel.map((card) => {
                    const isBlue = card.accentColor === "blue";
                    return (
                        <Link
                            key={card.label}
                            href={card.href}
                            className={`
                                group/card relative bg-slate-950 p-5 rounded-2xl border overflow-hidden
                                flex flex-col gap-3 transition-all duration-300
                                ${
                                    isBlue
                                        ? "border-slate-800 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10"
                                        : "border-slate-800 hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/10"
                                }
                            `}
                        >
                            <div
                                className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover/card:opacity-30 transition-opacity duration-500 -mr-10 -mt-10 ${isBlue ? "bg-blue-600" : "bg-indigo-600"}`}
                            />

                            <div
                                className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border transition-colors duration-300 ${
                                    isBlue
                                        ? "bg-slate-900 border-slate-800 text-blue-400 group-hover/card:bg-blue-600 group-hover/card:border-blue-500 group-hover/card:text-white"
                                        : "bg-slate-900 border-slate-800 text-indigo-400 group-hover/card:bg-indigo-600 group-hover/card:border-indigo-500 group-hover/card:text-white"
                                }`}
                            >
                                <card.icon className="w-6 h-6" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-black text-white uppercase tracking-tight leading-tight">
                                    {card.label}
                                </h4>
                                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{card.description}</p>
                            </div>

                            <div
                                className={`flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest transition-colors duration-200 ${
                                    isBlue
                                        ? "text-blue-500 group-hover/card:text-blue-400"
                                        : "text-indigo-500 group-hover/card:text-indigo-400"
                                }`}
                            >
                                {card.cta}
                                <ChevronRight className="w-3 h-3 stroke-[3] transition-transform duration-200 group-hover/card:translate-x-0.5" />
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
