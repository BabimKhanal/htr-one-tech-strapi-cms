import React, { useState, useRef, useEffect } from "react";
import {
    Box,
    Typography,
    Flex,
    Textarea,
    Button,
} from "@strapi/design-system";
import { Magic, User, Earth } from "@strapi/icons";
import { useNotification } from "@strapi/strapi/admin";
import styled from "styled-components";

const ChatContainer = styled(Box)`
    display: flex;
    flex-direction: column;
    height: calc(100vh - 150px);
    max-width: 800px;
    margin: 0 auto;
    background: ${({ theme }) => theme.colors.neutral0};
    border-radius: ${({ theme }) => theme.borderRadius};
    box-shadow: ${({ theme }) => theme.shadows.tableShadow};
    overflow: hidden;
`;

const MessageList = styled(Flex)`
    flex: 1;
    overflow-y: auto;
    padding: ${({ theme }) => theme.spaces[4]};
    background: ${({ theme }) => theme.colors.neutral100};
`;

const MessageWrapper = styled(Flex)<{ isUser?: boolean }>`
    width: 100%;
    margin-bottom: ${({ theme }) => theme.spaces[4]};
    flex-direction: ${({ isUser }) => (isUser ? "row-reverse" : "row")};
    align-items: flex-start;
    gap: ${({ theme }) => theme.spaces[3]};
`;

const Bubble = styled(Box)<{ isUser?: boolean }>`
    max-width: 80%;
    padding: ${({ theme }) => `${theme.spaces[3]} ${theme.spaces[4]}`};
    background: ${({ isUser, theme }) => (isUser ? theme.colors.primary600 : theme.colors.neutral0)};
    color: ${({ isUser, theme }) => (isUser ? theme.colors.neutral0 : theme.colors.neutral800)};
    border-radius: 18px;
    border-bottom-${({ isUser }) => (isUser ? "right" : "left")}-radius: 4px;
    box-shadow: ${({ theme }) => theme.shadows.filterShadow};
`;

const InputArea = styled(Box)`
    padding: ${({ theme }) => theme.spaces[4]};
    background: ${({ theme }) => theme.colors.neutral0};
    border-top: 1px solid ${({ theme }) => theme.colors.neutral150};
`;

const StyledPre = styled.pre`
    white-space: pre-wrap;
    word-break: break-all;
    font-family: monospace;
    font-size: 0.875rem;
    margin: 0;
`;

const AvatarContainer = styled(Box)<{ isUser?: boolean }>`
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: ${({ isUser, theme }) => (isUser ? theme.colors.primary200 : theme.colors.neutral200)};
    color: ${({ isUser, theme }) => (isUser ? theme.colors.primary600 : theme.colors.neutral600)};
`;

export default function AICmsBuilder() {
    const { toggleNotification } = useNotification();
    const [prompt, setPrompt] = useState("");
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const sendPrompt = async () => {
        if (!prompt.trim()) return;

        const userMessage = { role: "user", content: prompt };
        setMessages((prev) => [...prev, userMessage]);
        setPrompt("");
        setLoading(true);

        try {
            const res = await fetch("/api/ai/generate-schema", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topic: userMessage.content }),
            });

            const data = await res.json();
            const aiMessage = {
                role: "assistant",
                content: JSON.stringify(data, null, 2),
                schema: data
            };
            setMessages((prev) => [...prev, aiMessage]);
        } catch {
            toggleNotification({
                type: "danger",
                message: "AI generation failed",
            });
        } finally {
            setLoading(false);
        }
    };

    const approveSchema = async (schema: any) => {
        try {
            const res = await fetch("/api/ai/create-content-type", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(schema),
            });
            if (!res.ok) throw new Error();
            toggleNotification({
                type: "success",
                message: "Content type created. Restart Strapi.",
            });
        } catch {
            toggleNotification({
                type: "danger",
                message: "Failed to create content type",
            });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendPrompt();
        }
    };

    return (
        <Box padding={6} background="neutral100" minHeight="100vh">
            <Box marginBottom={4}>
                <Flex justifyContent="space-between" alignItems="center">
                    <Typography variant="alpha">AI Content-Type Builder</Typography>
                    <Box background="primary100" padding={2} hasRadius>
                        <Flex gap={2}>
                            <Magic width="1rem" height="1rem" />
                            <Typography variant="sigma" textColor="primary600">Powered by AI</Typography>
                        </Flex>
                    </Box>
                </Flex>
            </Box>

            <ChatContainer>
                <MessageList direction="column" gap={4} ref={scrollRef}>
                    {messages.length === 0 && (
                        <Flex direction="column" alignItems="center" justifyContent="center" height="100%" gap={4} padding={8}>
                            <Box background="primary100" padding={6} hasRadius style={{ borderRadius: "50%" }}>
                                <Magic width="4rem" height="4rem" color="#4945ff" />
                            </Box>
                            <Typography variant="beta" textColor="neutral500">How can I help you build your CMS today?</Typography>
                            <Typography textColor="neutral400" textAlign="center">Describe a content type (e.g., "A blog post with title, body, and featured image"), and I'll generate the schema for you.</Typography>
                        </Flex>
                    )}
                    {messages.map((msg, i) => (
                        <MessageWrapper key={i} isUser={msg.role === "user"}>
                            <AvatarContainer isUser={msg.role === "user"}>
                                {msg.role === "user" ? <User width="1rem" height="1rem" /> : <Earth width="1rem" height="1rem" />}
                            </AvatarContainer>
                            <Bubble isUser={msg.role === "user"}>
                                <Typography variant="pi" textColor="inherit">
                                    <StyledPre>{msg.content}</StyledPre>
                                </Typography>

                                {msg.schema && (
                                    <Box marginTop={3}>
                                        <Button
                                            variant="secondary"
                                            size="S"
                                            startIcon={<Magic />}
                                            onClick={() => approveSchema(msg.schema)}
                                        >
                                            Approve & Create Content-Type
                                        </Button>
                                    </Box>
                                )}
                            </Bubble>
                        </MessageWrapper>
                    ))}
                    {loading && (
                        <MessageWrapper>
                            <AvatarContainer>
                                <Earth width="1rem" height="1rem" />
                            </AvatarContainer>
                            <Bubble>
                                <Typography variant="pi">
                                    <i>AI is thinking...</i>
                                </Typography>
                            </Bubble>
                        </MessageWrapper>
                    )}
                </MessageList>

                <InputArea>
                    <Flex gap={2} alignItems="flex-end">
                        <Box flex="1">
                            <Textarea
                                placeholder="e.g., Create a Blog Post with title, content, and author..."
                                value={prompt}
                                onChange={(e: any) => setPrompt(e.target.value)}
                                onKeyDown={handleKeyDown}
                                minHeight="80px"
                            />
                        </Box>
                        <Button
                            startIcon={<Magic />}
                            loading={loading}
                            onClick={sendPrompt}
                            size="L"
                        >
                            Generate
                        </Button>
                    </Flex>
                    <Box marginTop={2}>
                        <Typography variant="pi" textColor="neutral500">
                            Press <strong>Enter</strong> to send, <strong>Shift+Enter</strong> for new line.
                        </Typography>
                    </Box>
                </InputArea>
            </ChatContainer>
        </Box>
    );
}