import React from "react";
import { Box } from "@strapi/design-system";
import ContentTypeAIButton from "../ContentTypeAIButton";

const ExtendedSidebar = ({ children }: any) => {
    return (
        <>
            {children}

            <Box paddingTop={3}>
                <ContentTypeAIButton />
            </Box>
        </>
    );
};

export default ExtendedSidebar;