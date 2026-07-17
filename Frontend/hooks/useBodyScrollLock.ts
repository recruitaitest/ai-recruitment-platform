import { useEffect } from "react";

/**
 * Locks scroll on both document.body AND the nearest scrollable ancestor
 * while `isOpen` is true. This app uses an overflow-y-auto <main> element
 * as the scroll container (inside AppLayout), so locking only the body is
 * insufficient — we must also lock that inner scroll container.
 */
export function useBodyScrollLock(isOpen: boolean) {
    useEffect(() => {
        if (!isOpen) return;

        // Lock body
        const prevBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        // Lock the AppLayout <main> scroll container
        // It's the first element with overflow-y scroll/auto that we can find
        const scrollableMain = document.querySelector("main") as HTMLElement | null;
        const prevMainOverflow = scrollableMain?.style.overflow ?? "";
        if (scrollableMain) {
            scrollableMain.style.overflow = "hidden";
        }

        return () => {
            document.body.style.overflow = prevBodyOverflow;
            if (scrollableMain) {
                scrollableMain.style.overflow = prevMainOverflow;
            }
        };
    }, [isOpen]);
}
