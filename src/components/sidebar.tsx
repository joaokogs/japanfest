"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type TouchEvent } from "react";

type NavItem = {
  href: string;
  label: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard" },
  { href: "/create-orders", label: "Criar Pedidos" },
  { href: "/create-products", label: "Criar Produtos" },
  { href: "/orders", label: "Pedidos" },
  { href: "/delivered", label: "Entregues" },
  { href: "/queue", label: "Fila" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const swipeRef = useRef({ startX: 0, startY: 0, tracking: false });

  const currentPath = useMemo(() => pathname ?? "/", [pathname]);
  const swipeEdge = 32;
  const swipeMinDistance = 70;
  const swipeMaxVerticalDrift = 80;

  const handleEdgeTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (isOpen) return;

    const touch = event.touches[0];
    swipeRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      tracking: touch.clientX <= swipeEdge,
    };
  };

  const handleEdgeTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    if (!swipeRef.current.tracking || isOpen) return;

    const touch = event.touches[0];
    const deltaX = touch.clientX - swipeRef.current.startX;
    const deltaY = Math.abs(touch.clientY - swipeRef.current.startY);

    if (deltaX > swipeMinDistance && deltaY < swipeMaxVerticalDrift) {
      setIsOpen(true);
      swipeRef.current.tracking = false;
    }
  };

  const handleEdgeTouchEnd = () => {
    swipeRef.current.tracking = false;
  };

  useEffect(() => {
    setIsOpen(false);
  }, [currentPath]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", onKeyDown);
    }

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  return (
    <>
      <div
        aria-hidden="true"
        className={`fixed left-0 top-0 z-[19995] h-full w-7 ${isOpen ? "pointer-events-none" : "pointer-events-auto"}`}
        style={{ touchAction: "pan-y" }}
        onTouchStart={handleEdgeTouchStart}
        onTouchMove={handleEdgeTouchMove}
        onTouchEnd={handleEdgeTouchEnd}
        onTouchCancel={handleEdgeTouchEnd}
      />

      <div className="fixed left-0 top-0 z-[20000] h-20 w-20 group/menu-trigger">
        <button
          type="button"
          aria-label="Abrir menu"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((prev) => !prev)}
          className={`absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-md border border-black/10 bg-white text-black shadow-md transition-all duration-300 ease-out hover:bg-gray-50 ${
            isOpen
              ? "translate-x-0 opacity-100 pointer-events-auto"
              : "-translate-x-6 opacity-0 pointer-events-none group-hover/menu-trigger:translate-x-0 group-hover/menu-trigger:opacity-100 group-hover/menu-trigger:pointer-events-auto group-focus-within/menu-trigger:translate-x-0 group-focus-within/menu-trigger:opacity-100 group-focus-within/menu-trigger:pointer-events-auto"
          }`}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path
              d="M4 6h16M4 12h16M4 18h16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <div
        className={`fixed inset-0 z-[19990] bg-black/35 transition-opacity ${
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsOpen(false)}
      />

      <aside
        className={`fixed left-0 top-0 z-[20000] h-screen w-72 bg-white p-6 shadow-2xl transition-transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!isOpen}
      >
        <h2 className="mb-6 mt-12 text-lg font-semibold text-black">Menu</h2>
        <nav className="flex flex-col gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive = currentPath === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-orange-100 text-orange-700"
                    : "text-gray-700 hover:bg-gray-100 hover:text-black"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
