import React, { useState } from "react";
import {
  Button,
  Box,
  Typography,
  Flex,
  Field,
  Modal,
  Textarea, // Standard Strapi Textarea
} from "@strapi/design-system";
import { Magic, Information } from "@strapi/icons";
import {
  unstable_useContentManagerContext as useContentManagerContext,
  useNotification
} from "@strapi/strapi/admin";

export default function GenerateContent() {
  const { form, model } = useContentManagerContext() as any;



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

    } catch (error) {
      console.error(error);
      console.log({
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
      <Box padding={4} width="100%" background="neutral0" hasRadius shadow="tableShadow" borderColor="neutral150" borderStyle="solid" borderWidth="1px">
        <Flex direction="column" gap={3}>
          <Typography variant="pi" fontWeight="bold" textColor="neutral600">
            AI ASSISTANT
          </Typography>
          <Button
            fullWidth
            variant="secondary"
            startIcon={<Magic />}
            onClick={() => setIsOpen(true)}
          >
            Open Generator
          </Button>
        </Flex>
      </Box>

      {/* Modal Popup */}
      {isOpen && (
        <Modal.Root open={isOpen} onOpenChange={setIsOpen}>
          <Modal.Content>
            <Modal.Header>
              <Flex gap={2}>
                <Magic color="secondary600" />
                <Typography fontWeight="bold" textColor="neutral800">
                  Generate {model.split('.').pop()} with AI
                </Typography>
              </Flex>
            </Modal.Header>

            <Modal.Body>
              <Flex direction="column" alignItems="stretch" gap={4}>
                <Typography>
                  Describe what you want to generate. Be specific about tone and key points.
                </Typography>

                <Field.Root name="prompt">
                  <Field.Label>Prompt / Topic Description</Field.Label>
                  <Textarea
                    placeholder="e.g. A blog post about AI performance optimization for technical readers..."
                    value={prompt}
                    onChange={(e: any) => setPrompt(e.target.value)}
                    rows={6} // Increased height
                  />
                </Field.Root>

                <Box padding={3} background="neutral100" hasRadius>
                  <Flex gap={2}>
                    <Information width="14px" color="neutral600" />
                    <Typography variant="pi" textColor="neutral600">
                      The AI will populate: <strong>{fields.join(", ")}</strong>
                    </Typography>
                  </Flex>
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
              >
                Generate & Sync
              </Button>
            </Modal.Footer>
          </Modal.Content>
        </Modal.Root>
      )}
    </>
  );
}