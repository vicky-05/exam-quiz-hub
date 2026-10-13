
import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X, ArrowRight, Megaphone } from "lucide-react";
import { supabase } from "../services/supabase";

const DISMISS_KEY = "exam-quiz-hub-ad-dismissed";

const AdvertisementPopup = () => {
    const [advertisement, setAdvertisement] = useState(null);
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(true);

    const location = useLocation();
    const navigate = useNavigate();

    const dismissAdvertisement = useCallback(() => {
        if (
            advertisement?.id &&
            advertisement.display_frequency !== "every_visit"
        ) {
            try {
                sessionStorage.setItem(
                    `${DISMISS_KEY}-${advertisement.id}`,
                    "true"
                );
            } catch {
                // Continue even if sessionStorage is unavailable.
            }
        }

        setVisible(false);
    }, [advertisement]);

    useEffect(() => {
        let cancelled = false;

        const loadAdvertisement = async () => {
            setLoading(true);

            try {
                const { data, error } = await supabase
                    .from("advertisements")
                    .select(
                        "id, title, description, image_url, cta_text, target_url, display_frequency"
                    )
                    .eq("is_active", true)
                    .order("updated_at", { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (cancelled) return;

                if (error) {
                    console.error(
                        "Unable to load advertisement:",
                        error.message
                    );
                    setAdvertisement(null);
                    setVisible(false);
                    return;
                }

                if (!data) {
                    console.info("No active advertisement found.");
                    setAdvertisement(null);
                    setVisible(false);
                    return;
                }

                console.info("Active advertisement loaded:", data.id);
                setAdvertisement(data);

                let dismissed = false;

                if (data.display_frequency !== "every_visit") {
                    try {
                        dismissed = Boolean(
                            sessionStorage.getItem(`${DISMISS_KEY}-${data.id}`)
                        );
                    } catch {
                        dismissed = false;
                    }
                }

                setVisible(!dismissed);
            } catch (error) {
                if (!cancelled) {
                    console.error("Advertisement loading failed:", error);
                    setAdvertisement(null);
                    setVisible(false);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadAdvertisement();

        return () => {
            cancelled = true;
        };
    }, [
        location.pathname,
        location.search,
        location.hash,
    ]);

    useEffect(() => {
        if (!visible) return undefined;

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                dismissAdvertisement();
            }
        };

        const previousOverflow = document.body.style.overflow;

        document.addEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [visible, dismissAdvertisement]);

    const handleCTA = () => {
        const target = advertisement?.target_url?.trim();

        if (!target) return;

        dismissAdvertisement();

        // External destination.
        if (/^https?:\/\//i.test(target)) {
            window.location.assign(target);
            return;
        }

        // Internal React Router destination.
        if (target.startsWith("/") && !target.startsWith("//")) {
            navigate(target);
            return;
        }

        console.error("Invalid advertisement destination:", target);
    };

    if (loading || !advertisement || !visible) {
        return null;
    }


    if (loading || !advertisement || !visible) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-md sm:p-6"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    dismissAdvertisement();
                }
            }}
        >
            <div className="relative w-full max-w-4xl">
                {/* Close button */}
                <button
                    type="button"
                    onClick={dismissAdvertisement}
                    aria-label="Close advertisement"
                    className="absolute -right-2 -top-2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-800 shadow-lg transition hover:scale-105 sm:-right-3 sm:-top-3"
                >
                    <X size={21} />
                </button>

                {/* Advertisement image only */}
                <img
                    src={advertisement.image_url}
                    alt={advertisement.title || "Exam Quiz Hub advertisement"}
                    onClick={handleCTA}
                    onError={() =>
                        console.error("Advertisement image failed to load.")
                    }
                    className="block max-h-[90vh] w-full cursor-pointer rounded-xl object-contain shadow-2xl"
                />
            </div>
        </div>
    );

};

export default AdvertisementPopup;
