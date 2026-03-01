import { Link } from '@inertiajs/react';
import React, { useMemo, useState } from 'react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();
    const [openKeys, setOpenKeys] = useState<Record<string, boolean>>(() => {
        const map: Record<string, boolean> = {};
        items.forEach((it) => {
            if (Array.isArray(it.children) && it.children.length > 0) {
                const activeChild = it.children!.some((c) => isCurrentUrl(c.href));
                if (activeChild) map[it.title] = true;
            }
        });
        return map;
    });

    const toggle = (key: string) => {
        setOpenKeys(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const resolvedItems = useMemo(() => {
        return items.map((it) => {
            const hasChildren = Array.isArray(it.children) && it.children.length > 0;
            const activeSelf = it.href ? isCurrentUrl(it.href) : false;
            const activeChild = hasChildren && it.children!.some((c) => isCurrentUrl(c.href));
            return { ...it, hasChildren, active: activeSelf || Boolean(activeChild) };
        });
    }, [items, isCurrentUrl]);

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {resolvedItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        {item.hasChildren ? (
                            <>
                                <SidebarMenuButton
                                    asChild
                                    isActive={Boolean(item.active)}
                                    tooltip={{ children: item.title }}
                                    aria-expanded={!!openKeys[item.title]}
                                    onClick={() => toggle(item.title)}
                                >
                                    <button className="w-full text-left flex items-center gap-2">
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                    </button>
                                </SidebarMenuButton>

                                {openKeys[item.title] && (
                                    <SidebarMenuSub>
                                        {item.children!.map((child) => (
                                            <SidebarMenuSubItem key={child.title}>
                                                <SidebarMenuSubButton asChild isActive={isCurrentUrl(child.href)}>
                                                    <Link href={child.href}>
                                                        {child.icon && <child.icon />}
                                                        <span>{child.title}</span>
                                                    </Link>
                                                </SidebarMenuSubButton>
                                            </SidebarMenuSubItem>
                                        ))}
                                    </SidebarMenuSub>
                                )}
                            </>
                        ) : (
                            <SidebarMenuButton
                                asChild
                                isActive={isCurrentUrl(item.href)}
                                tooltip={{ children: item.title }}
                            >
                                <Link href={item.href}>
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        )}
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
