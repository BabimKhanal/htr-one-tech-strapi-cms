import React, { useEffect, useState } from "react";
import { Box, Button, TextInput, Typography, Flex } from "@strapi/design-system";
import { useNotification } from "@strapi/strapi/admin";

const AiSettings = () => {
    const [apiKey, setApiKey] = useState("");
    const { toggleNotification } = useNotification();

    const fetchSettings = async () => {
        const res = await fetch("/api/ai/settings");
        const data = await res.json();
        setApiKey(data.apiKey || "");
    };

    const save = async () => {
        await fetch("/api/ai/settings", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ apiKey }),
        });

        toggleNotification({
            type: "success",
            message: "AI Settings saved",
        });
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    return (
        <Box padding={8}>
            <Flex direction="column" gap={6} alignItems="start">
                <Typography variant="alpha">AI Settings</Typography>

                <Box width="400px">
                    <TextInput
                        name="apiKey"
                        value={apiKey}
                        onChange={(e: any) => setApiKey(e.target.value)}
                    />
                </Box>

                <Button onClick={save}>Save</Button>
            </Flex>
        </Box>
    );
};

export default AiSettings;