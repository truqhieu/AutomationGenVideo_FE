import { SectionColor } from "./types";

export interface SectionClasses {
    badgeClass: string;
    activeIconClass: string;
    activeDotClass: string;
    activeRowClass: string;
}

export function getSectionClasses(color: SectionColor): SectionClasses {
    if (color === "violet") {
        return {
            badgeClass: "text-violet-400 bg-violet-500/10 border border-violet-500/20",
            activeIconClass: "bg-violet-500/20 text-violet-400",
            activeDotClass: "bg-violet-400",
            activeRowClass: "bg-violet-500/10 text-white",
        };
    }
    if (color === "slate") {
        return {
            badgeClass: "text-slate-400 bg-slate-700/40 border border-slate-600/30",
            activeIconClass: "bg-slate-600/30 text-slate-300",
            activeDotClass: "bg-slate-400",
            activeRowClass: "bg-slate-600/20 text-white",
        };
    }
    return {
        badgeClass: "text-blue-400 bg-blue-500/10 border border-blue-500/20",
        activeIconClass: "bg-blue-500/20 text-blue-400",
        activeDotClass: "bg-blue-400",
        activeRowClass: "bg-blue-500/10 text-white",
    };
}
