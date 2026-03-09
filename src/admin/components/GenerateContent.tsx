import React, { useState } from "react";
import {
  Button,
  Box,
  Typography,
  Flex,
  Field,
  Modal,
  Textarea,
  Badge,
  Divider,
} from "@strapi/design-system";
import { Magic, Information } from "@strapi/icons";
import {
  unstable_useContentManagerContext as useContentManagerContext,
  useNotification
} from "@strapi/strapi/admin";

export default function GenerateContent() {
  const { form, model } = useContentManagerContext() as any;
  const { toggleNotification } = useNotification();

  const ALLOWED_UIDS = ["api::blog.blog", "api::faq.faq", "api::service.service"];

  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const fields = Object.keys(form.values).filter(
    (key) => !["documentId", "is_active", "images", "createdAt", "updatedAt", "publishedAt"].includes(key)
  );

  if (!ALLOWED_UIDS.includes(model)) {
    return null;
  }

  const modelNameString = model.split('.').pop();
  const titleFormatted = modelNameString ? modelNameString.charAt(0).toUpperCase() + modelNameString.slice(1) : "Content";

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);

    try {
      const baseUrl = window.location.origin;
      const res = await fetch(`${baseUrl}/api/ai/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ topic: prompt, fields }),
      });

      if (!res.ok) throw new Error("API error");

      const data = await res.json();
      const newValues = { ...form.values };

      Object.keys(data).forEach((key) => {
        if (key in newValues) newValues[key] = data[key];
      });

      form.setValues(newValues);
      setIsOpen(false);
      toggleNotification({
        type: "success",
        message: "Content Generated Successfully",
      });
      setPrompt(""); // Clear prompt after success
    } catch (error) {
      console.error(error);
      toggleNotification({
        type: "danger",
        message: "Failed to generate content. Check the server logs.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Sidebar Widget */}
      <Box padding={4} width="100%" background="neutral0" hasRadius shadow="tableShadow" borderColor="primary200" borderStyle="solid" borderWidth="1px">
        <Flex direction="column" alignItems="stretch" gap={4}>
          <Flex gap={2} alignItems="center">
            <Box background="primary100" padding={2} hasRadius borderColor="primary200" borderStyle="solid" borderWidth="1px" display="flex" justifyContent="center" alignItems="center">
              <Magic color="primary600" />
            </Box>
            <Typography variant="omega" fontWeight="bold" textColor="neutral800">
              AI Agent
            </Typography>
          </Flex>
          <Typography variant="pi" textColor="neutral600">
            Automate content creation instantly. Describe what you need, and the AI will craft structured content for your {titleFormatted.toLowerCase()}.
          </Typography>
          <Button
            fullWidth
            variant="default"
            startIcon={<Magic />}
            onClick={() => setIsOpen(true)}
            size="S"
          >
            Generate Content
          </Button>
        </Flex>
      </Box>

      {/* Modal Popup */}
      {isOpen && (
        <Modal.Root open={isOpen} onOpenChange={setIsOpen}>
          <Modal.Content>
            <Modal.Header>
              <Flex gap={2} alignItems="center">
                <Box background="primary100" padding={1} hasRadius borderColor="primary200" borderStyle="solid" borderWidth="1px" display="flex" justifyContent="center" alignItems="center">
                  <Magic color="primary600" />
                </Box>
                <Typography fontWeight="bold" textColor="neutral800" variant="beta">
                  Generate {titleFormatted} With AI
                </Typography>
              </Flex>
            </Modal.Header>

            <Modal.Body>
              <Flex direction="column" alignItems="stretch" gap={5}>
                {/* Info Banner */}
                <Box padding={4} background="primary100" hasRadius borderColor="primary200" borderStyle="solid" borderWidth="1px">
                   <Flex gap={3} alignItems="flex-start">
                     <Box paddingTop={1}>
                       <Information color="primary600" />
                     </Box>
                     <Flex direction="column" alignItems="start" gap={1}>
                       <Typography textColor="primary700" fontWeight="bold" variant="pi">AI Assistance</Typography>
                       <Typography textColor="primary600" variant="pi">
                         Our AI agent will read your prompt and automatically populate the fields below with high-quality content tailored to your model structure.
                       </Typography>
                     </Flex>
                   </Flex>
                </Box>

                <Field.Root name="prompt" required>
                  <Field.Label>What would you like to write about?</Field.Label>
                  <Box paddingTop={1}>
                    <Textarea
                      placeholder={`e.g. A comprehensive guide on AI performance optimization focusing on practical tips for ${titleFormatted.toLowerCase()} readers...`}
                      value={prompt}
                      onChange={(e: any) => setPrompt(e.target.value)}
                      rows={5}
                    />
                  </Box>
                  <Box paddingTop={1}>
                    <Field.Hint>Be as detailed as possible about tone, target audience, and key points to cover.</Field.Hint>
                  </Box>
                </Field.Root>

                <Divider />

                <Box>
                  <Typography variant="sigma" textColor="neutral600" textTransform="uppercase">
                    Target Fields ({fields.length})
                  </Typography>
                  <Box paddingTop={3}>
                    <Flex wrap="wrap" gap={2}>
                      {fields.map((field) => (
                        <Badge key={field} active>
                          {field}
                        </Badge>
                      ))}
                    </Flex>
                  </Box>
                </Box>
              </Flex>
            </Modal.Body>

            <Modal.Footer>
              <Button variant="tertiary" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button
                startIcon={<Magic />}
                loading={loading}
                onClick={generate}
                size="L"
              >
                {loading ? "Generating..." : "Generate AI Content"}
              </Button>
            </Modal.Footer>
          </Modal.Content>
        </Modal.Root>
      )}
    </>
  );
}