import { User } from "@/types/auth";

export type SectionColor = "blue" | "violet" | "slate";

export interface SubPanelCard {
    label: string;
    href: string;
    icon: React.ElementType;
    description: string;
    cta: string;
    accentColor: "blue" | "indigo";
}

export interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
    description?: string;
    subPanel?: SubPanelCard[];
}

export interface NavSection {
    section: string;
    color?: SectionColor;
    items: NavItem[];
}

export interface NavMenu {
    id: string;
    label: string;
    sections: NavSection[];
    activePathPrefixes: string[];
}

export interface HeaderProps {
    user: User;
    onLogout: () => void;
    allowedMenuIds: string[];
}
