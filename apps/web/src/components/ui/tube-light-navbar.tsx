"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// Since this is a Vite/React project and not Next.js, we use a standard anchor tag for the Link component
const Link = ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
  <a href={href} {...props}>{children}</a>
)

interface NavItem {
    name: string
    url: string
    icon: LucideIcon
    logoUrl?: string
    onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
}

interface NavBarProps {
    items: NavItem[]
    className?: string
}

export function NavBar({ items, className }: NavBarProps) {
    const [activeTab, setActiveTab] = useState(items[0].name)
    const [isMobile, setIsMobile] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768)
        }

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20)

            // Scroll spy logic
            let currentActive = items[0].name;
            for (const item of items) {
                if (item.url.startsWith('#') && item.url.length > 1) {
                    const el = document.getElementById(item.url.substring(1));
                    if (el) {
                        const rect = el.getBoundingClientRect();
                        if (rect.top <= window.innerHeight / 2) {
                            currentActive = item.name;
                        }
                    }
                }
            }
            setActiveTab(currentActive);
        }

        handleResize()
        handleScroll()
        window.addEventListener("resize", handleResize)
        window.addEventListener("scroll", handleScroll)
        
        return () => {
            window.removeEventListener("resize", handleResize)
            window.removeEventListener("scroll", handleScroll)
        }
    }, [])

    return (
        <div
            className={cn(
                "fixed top-0 left-1/2 -translate-x-1/2 z-[200] transition-all duration-500 ease-in-out flex justify-center",
                isScrolled 
                    ? "top-4 w-[95%] md:w-[750px]" 
                    : "top-0 w-full"
            )}
        >
            <div className={cn(
                "flex items-center bg-background/90 border-border backdrop-blur-lg shadow-lg transition-all duration-500 ease-in-out w-full",
                isScrolled 
                    ? "rounded-full border py-2 px-2 justify-center gap-3" 
                    : "rounded-none border-b border-x-0 border-t-0 py-4 px-6 md:px-12 justify-between"
            )}>
                {items.length > 0 && (() => {
                    const item = items[0]
                    const Icon = item.icon
                    const isActive = activeTab === item.name

                    return (
                        <Link
                            key={item.name}
                            href={item.url}
                            onClick={(e) => {
                                setActiveTab(item.name)
                                if (item.onClick) {
                                    item.onClick(e)
                                }
                            }}
                            className={cn(
                                "relative cursor-pointer font-bold px-6 py-2 rounded-full transition-colors flex items-center gap-2",
                                "text-foreground hover:text-primary",
                                isScrolled ? "text-lg" : "text-xl",
                                isActive && "text-primary",
                            )}
                        >
                            {item.logoUrl ? (
                                <img src={item.logoUrl} alt={item.name} className={cn("object-contain transition-all duration-300", isScrolled ? "w-6 h-6" : "w-8 h-8")} />
                            ) : (
                                <span className="md:hidden">
                                    <Icon size={18} strokeWidth={2.5} />
                                </span>
                            )}
                            <span className={cn(item.logoUrl ? "inline" : "hidden md:inline")}>{item.name}</span>
                            {isActive && (
                                <motion.div
                                    layoutId="lamp"
                                    className="absolute inset-0 w-full bg-primary/5 rounded-full -z-10"
                                    initial={false}
                                    transition={{
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 30,
                                    }}
                                >
                                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full">
                                        <div className="absolute w-12 h-6 bg-primary/20 rounded-full blur-md -top-2 -left-2" />
                                        <div className="absolute w-8 h-6 bg-primary/20 rounded-full blur-md -top-1" />
                                        <div className="absolute w-4 h-4 bg-primary/20 rounded-full blur-sm top-0 left-2" />
                                    </div>
                                </motion.div>
                            )}
                        </Link>
                    )
                })()}
                
                <div className="flex items-center gap-3">
                    {items.slice(1).map((item) => {
                        const Icon = item.icon
                        const isActive = activeTab === item.name

                        return (
                            <Link
                                key={item.name}
                                href={item.url}
                                onClick={(e) => {
                                    setActiveTab(item.name)
                                    if (item.onClick) {
                                        item.onClick(e)
                                    }
                                }}
                                className={cn(
                                    "relative cursor-pointer text-sm font-semibold px-6 py-2 rounded-full transition-colors flex items-center gap-2",
                                    "text-foreground/80 hover:text-primary",
                                    isActive && "text-primary",
                                )}
                            >
                                {item.logoUrl ? (
                                    <img src={item.logoUrl} alt={item.name} className="w-5 h-5 object-contain" />
                                ) : (
                                    <span className="md:hidden">
                                        <Icon size={18} strokeWidth={2.5} />
                                    </span>
                                )}
                                <span className={cn(item.logoUrl ? "inline" : "hidden md:inline")}>{item.name}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="lamp"
                                        className="absolute inset-0 w-full bg-primary/5 rounded-full -z-10"
                                        initial={false}
                                        transition={{
                                            type: "spring",
                                            stiffness: 300,
                                            damping: 30,
                                        }}
                                    >
                                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full">
                                            <div className="absolute w-12 h-6 bg-primary/20 rounded-full blur-md -top-2 -left-2" />
                                            <div className="absolute w-8 h-6 bg-primary/20 rounded-full blur-md -top-1" />
                                            <div className="absolute w-4 h-4 bg-primary/20 rounded-full blur-sm top-0 left-2" />
                                        </div>
                                    </motion.div>
                                )}
                            </Link>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
