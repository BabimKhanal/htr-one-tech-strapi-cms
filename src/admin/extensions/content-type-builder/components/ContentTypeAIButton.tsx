import React, { useState } from "react";
import { Button, Box } from "@strapi/design-system";
import { Magic } from "@strapi/icons";
import AICmsBuilderPopup from "../../../pages/AiCMSBuilder";

export default function ContentTypeAIButton() {
    const [open, setOpen] = useState(false);

    return (
        <Box paddingTop={3}>
            <Button
                startIcon={<Magic />}
                variant="secondary"
                fullWidth
                onClick={() => setOpen(true)}
            >
                AI Builder
            </Button>

            {open && <AICmsBuilderPopup />}
        </Box>
    );
}