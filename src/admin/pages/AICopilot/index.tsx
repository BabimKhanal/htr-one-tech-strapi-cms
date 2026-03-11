import React, { useState, useRef, useEffect } from "react";
import styled, { keyframes, css } from "styled-components";
import {
  Box,
  Typography,
  Flex,
  Textarea,
  Button,
  Loader,
  Badge,
} from "@strapi/design-system";
import { Magic, PaperPlane, Plus, Information, Check } from "@strapi/icons";
import { useNotification } from "@strapi/strapi/admin";
import AIResponse from "../../components/AIResponse";

// --- Animations ---
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 0.8; }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

// --- Styled Components ---

const Container = styled(Box)`
  height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.neutral100};
  position: relative;
  overflow: hidden;

  /* Subtle background pattern */
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background-image: radial-gradient(${({ theme }) => theme.colors.neutral200} 1px, transparent 1px);
    background-size: 30px 30px;
    opacity: 0.4;
    pointer-events: none;
  }
`;

const Header = styled(Flex)`
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid ${({ theme }) => theme.colors.neutral150};
  z-index: 10;
  justify-content: space-between;
`;

const ChatArea = styled(Box)`
  flex: 1;
  overflow-y: auto;
  padding: 40px 0;
  scroll-behavior: smooth;
  
  /* Hide scrollbar but keep functionality */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.neutral200};
    border-radius: 10px;
  }
`;

const ContentWrapper = styled(Box)`
  max-width: 900px;
  margin: 0 auto;
  padding: 0 32px;
`;

const MessageRow = styled(Flex) <{ user?: boolean }>`
  gap: 16px;
  margin-bottom: 24px;
  justify-content: ${({ user }) => (user ? "flex-end" : "flex-start")};
  animation: ${fadeIn} 0.3s ease-out forwards;
`;

const Avatar = styled(Flex) <{ isAi?: boolean }>`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: ${({ theme, isAi }) =>
    isAi ? "linear-gradient(135deg, #4945FF 0%, #7B79FF 100%)" : theme.colors.neutral200};
  color: ${({ theme, isAi }) => isAi ? "white" : theme.colors.neutral600};
  flex-shrink: 0;
  justify-content: center;
  align-items: center;
  box-shadow: ${({ isAi }) => isAi ? "0 4px 12px rgba(73, 69, 255, 0.3)" : "none"};
`;

const Bubble = styled(Box) <{ user?: boolean }>`
  padding: 16px 20px;
  border-radius: 16px;
  max-width: 80%;
  position: relative;
  
  ${({ user, theme }) =>
    user ? css`
      background: ${theme.colors.primary600};
      color: white;
      border-bottom-right-radius: 4px;
      box-shadow: 0 4px 15px rgba(73, 69, 255, 0.2);
    ` : css`
      background: white;
      color: ${theme.colors.neutral800};
      border-bottom-left-radius: 4px;
      border: 1px solid ${theme.colors.neutral150};
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    `
  }

  code {
    background: rgba(0, 0, 0, 0.05);
    padding: 2px 4px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.9em;
  }

  pre {
    margin: 12px 0;
    padding: 12px;
    background: #1e1e1e;
    color: #d4d4d4;
    border-radius: 8px;
    white-space: pre-wrap;
    word-break: break-word;
    font-size: 13px;
    line-height: 1.5;
    overflow-x: auto;
  }
`;

const InputSection = styled(Box)`
  padding: 24px 32px 32px;
  background: transparent;
  z-index: 10;
`;

const InputGlassContainer = styled(Box)`
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(16px);
  border: 1px solid ${({ theme }) => theme.colors.neutral200};
  border-radius: 20px;
  padding: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  max-width: 900px;
  margin: 0 auto;
  transition: all 0.2s ease;

  &:focus-within {
    border-color: ${({ theme }) => theme.colors.primary500};
    box-shadow: 0 10px 40px rgba(73, 69, 255, 0.15);
  }
`;

const StyledTextarea = styled(Textarea)`
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
  min-height: 24px !important;
  
  & textarea {
    border: none !important;
    padding: 12px 16px !important;
    font-size: 15px !important;
    line-height: 1.5 !important;
    background: transparent !important;
    resize: none;
  }
`;

const ActionButton = styled(Button)`
  border-radius: 12px;
  padding: 0 16px;
  height: 44px;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(73, 69, 255, 0.3);
  }
`;

const SuggestionCard = styled(Box) <{ index: number }>`
  padding: 16px;
  background: white;
  border: 1px solid ${({ theme }) => theme.colors.neutral150};
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  animation: ${slideUp} 0.4s ease-out backwards;
  animation-delay: ${({ index }) => index * 0.1}s;
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary500};
    transform: translateY(-4px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
  }

  svg {
    color: ${({ theme }) => theme.colors.primary600};
  }
`;

const WelcomeState = styled(Box)`
  text-align: center;
  padding-top: 60px;
  animation: ${fadeIn} 0.8s ease-out;
`;

const GlowIcon = styled(Box)`
  display: inline-flex;
  padding: 20px;
  background: white;
  border-radius: 24px;
  box-shadow: 0 20px 40px rgba(73, 69, 255, 0.15);
  margin-bottom: 24px;
  animation: ${pulse} 3s infinite ease-in-out;

  svg {
    width: 48px;
    height: 48px;
    fill: #4945FF;
  }
`;

export default function AICopilot() {
  const { toggleNotification } = useNotification();
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async (custom?: string) => {
    const text = custom || prompt;
    if (!text.trim()) return;

    const userMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setPrompt("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      const aiMsg = {
        role: "assistant",
        content: typeof data === "string" ? data : JSON.stringify(data, null, 2),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      toggleNotification({
        type: "danger",
        message: "AI request failed. Please check your configuration.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: any) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestions = [
    { title: "Generate Blog Content Type", desc: "Create a full-featured blog schema with SEO", icon: <Plus /> },
    { title: "Product CMS Structure", desc: "Design a catalog with prices, images and categories", icon: <Magic /> },
    { title: "Seed Sample Data", desc: "Populate your content types with realistic dummy data", icon: <Information /> },
    { title: "Real Estate Listings", desc: "Build a property management system from scratch", icon: <Badge /> },
  ];

  return (
    <Container>
      <Header>
        <Flex gap={3}>
          <Box background="primary100" padding={2} borderRadius="8px">
            <Magic width="20px" height="20px" />
          </Box>
          <Box>
            <Typography variant="beta" fontWeight="bold">AI Copilot</Typography>
            <Typography variant="pi" textColor="neutral600">Advanced Agent Assistant</Typography>
          </Box>
        </Flex>
        <Badge variant="success" size="S">Online</Badge>
      </Header>

      <ChatArea ref={scrollRef}>
        <ContentWrapper>
          {messages.length === 0 && (
            <WelcomeState>
              <GlowIcon>
                <Magic />
              </GlowIcon>

              <Box marginBottom={10}>
                <Typography variant="alpha" fontWeight="bold">
                  How can I help you build today?
                </Typography>
                <Box marginTop={2}>
                  <Typography variant="omega" textColor="neutral600">
                    I can design schemas, generate content, and automate your Strapi workflow.
                  </Typography>
                </Box>
              </Box>

              <Flex gap={4} wrap="wrap">
                {suggestions.map((s, i) => (
                  <Box key={i} width="calc(50% - 16px)">
                    <SuggestionCard index={i} onClick={() => sendMessage(s.title)}>
                      <Flex justifyContent="space-between">
                        {s.icon}
                        <Check width="14px" height="14px" color="transparent" />
                      </Flex>
                      <Box textAlign="left">
                        <Typography variant="delta" fontWeight="bold">{s.title}</Typography>
                        <Box marginTop={1}>
                          <Typography variant="pi" textColor="neutral600">{s.desc}</Typography>
                        </Box>
                      </Box>
                    </SuggestionCard>
                  </Box>
                ))}
              </Flex>
            </WelcomeState>
          )}

          {messages.map((msg, i) => {
            let content = msg.content;
            let isJson = false;
            let jsonData: any = null;

            try {
              if (
                typeof content === "string" &&
                (content.startsWith("{") || content.startsWith("["))
              ) {
                jsonData = JSON.parse(content);
                isJson = true;
              }
            } catch (e) {
              // ignore parsing error
            }

            return (
              <MessageRow key={i} user={msg.role === "user"}>
                {msg.role !== "user" && (
                  <Avatar isAi>
                    <Magic width="18px" height="18px" />
                  </Avatar>
                )}

                <Bubble user={msg.role === "user"}>
                  {isJson ? (
                    <Box>
                      {jsonData.error && (
                        <Box
                          padding={3}
                          background="danger100"
                          borderRadius="8px"
                          marginBottom={3}
                        >
                          <Typography variant="pi" textColor="danger700" fontWeight="bold">
                            Error: {jsonData.error}
                          </Typography>
                        </Box>
                      )}

                      {/* Render structured AI response */}
                      <AIResponse data={jsonData} />
                    </Box>
                  ) : (
                    <Typography
                      variant="omega"
                      textColor="inherit"
                      style={{
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {content}
                    </Typography>
                  )}
                </Bubble>

                {msg.role === "user" && (
                  <Avatar>
                    <Typography variant="pi" fontWeight="bold">
                      U
                    </Typography>
                  </Avatar>
                )}
              </MessageRow>
            );
          })}
        </ContentWrapper>
      </ChatArea>

      <InputSection>
        <InputGlassContainer>
          <Flex gap={2} alignItems="center">
            <Box flex={1}>
              <StyledTextarea
                placeholder="Ask me to build a content type, generate data, or optimize your API..."
                value={prompt}
                onChange={(e: any) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </Box>
            <Box paddingRight={2}>
              <ActionButton
                variant="default"
                loading={loading}
                onClick={() => sendMessage()}
                startIcon={<PaperPlane />}
              >
                Send
              </ActionButton>
            </Box>
          </Flex>
          <Box paddingLeft={4} paddingBottom={2}>
            <Typography variant="pi" textColor="neutral500">
              Shift + Enter for newline
            </Typography>
          </Box>
        </InputGlassContainer>
      </InputSection>
    </Container>
  );
}
