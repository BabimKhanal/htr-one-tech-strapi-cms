import React, { useEffect, useState } from "react";
import { Button } from "@strapi/design-system";
import { Magic } from "@strapi/icons";
import AICmsBuilderPopup from "../pages/AiCMSBuilder";

export default function CTBuilderAIHeader() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            const header = document.querySelector('[data-strapi-header="true"]');

            if (header && !document.getElementById("ai-ct-builder-btn")) {
                const btn = document.createElement("div");
                btn.id = "ai-ct-builder-btn";
                header.appendChild(btn);
            }
        }, 500);

        return () => clearInterval(interval);
    }, []);

    return (
        <>
            <Button
                startIcon={<Magic />}
                variant="secondary"
                onClick={() => setOpen(true)}
                style={{
                    position: "fixed",
                    top: "90px",
                    right: "60px",
                    zIndex: 999,
                }}
            >
                AI
            </Button>

            {open && <AICmsBuilderPopup />}
        </>
    );
}