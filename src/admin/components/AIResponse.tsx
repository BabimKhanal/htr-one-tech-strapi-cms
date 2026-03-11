// components/AIResponse.tsx

import React from "react";
import { Box, Typography, Flex, Badge } from "@strapi/design-system";
import { Check, WarningCircle } from "@strapi/icons";

const toolIcons: Record<string, string> = {
    create_content_type: "🧱",
    update_content_type: "✏️",
    create_relation: "🔗",
    generate_entry: "✨",
    insert_entry: "📦",
    bulk_insert_entries: "📚",
    list_content_types: "📋",
    get_schema: "📄",
    get_all_schemas: "📑",
};

export default function AIResponse({ data }: { data: any }) {
    const hasTimeline = data.timeline?.length > 0;
    const hasActions = data.actions?.length > 0;
    const hasResults = data.results?.length > 0;

    return (
        <Box>

            {/* Status */}
            <Flex gap={2} alignItems="center" marginBottom={3}>
                <Badge variant={data.success ? "success" : "warning"}>
                    {data.success ? "Success" : "Failed"}
                </Badge>

                {data.notify?.message && (
                    <Typography variant="pi">
                        {data.notify.message}
                    </Typography>
                )}
            </Flex>

            {/* Timeline */}
            {hasTimeline && (
                <Box marginBottom={4}>
                    <Typography variant="delta" fontWeight="bold">
                        Execution Timeline
                    </Typography>

                    <Box marginTop={2}>
                        {data.timeline.map((step: string, i: number) => (
                            <Flex key={i} gap={2} alignItems="center" marginBottom={1}>
                                <Check width="12px" />
                                <Typography variant="pi">{step}</Typography>
                            </Flex>
                        ))}
                    </Box>
                </Box>
            )}

            {/* Actions */}
            {hasActions && (
                <Box marginBottom={4}>
                    <Typography variant="delta" fontWeight="bold">
                        Actions Executed
                    </Typography>

                    <Box marginTop={2}>
                        {data.actions.map((a: any, i: number) => (
                            <Box
                                key={i}
                                padding={3}
                                background="neutral100"
                                borderRadius="8px"
                                marginBottom={2}
                            >
                                <Typography variant="pi" fontWeight="bold">
                                    {toolIcons[a.tool] || "⚙"} {a.tool}
                                </Typography>

                                {a.args && (
                                    <Box
                                        marginTop={2}
                                        padding={2}
                                        background="neutral0"
                                        borderRadius="6px"
                                        style={{ maxHeight: 150, overflow: "auto" }}
                                    >
                                        <pre style={{ fontSize: 12 }}>
                                            {JSON.stringify(a.args, null, 2)}
                                        </pre>
                                    </Box>
                                )}
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}

            {/* Results */}
            {hasResults && (
                <Box>
                    <Typography variant="delta" fontWeight="bold">
                        Results
                    </Typography>

                    <Box marginTop={2}>
                        {data.results.map((r: any, i: number) => (
                            <Box
                                key={i}
                                padding={3}
                                background="neutral0"
                                borderRadius="8px"
                                marginBottom={2}
                            >
                                <Flex gap={2} alignItems="center">
                                    {r.success ? (
                                        <Check width="14px" />
                                    ) : (
                                        <WarningCircle width="14px" />
                                    )}

                                    <Typography variant="pi">{r.tool}</Typography>

                                    <Badge variant={r.success ? "success" : "warning"}>
                                        {r.success ? "Completed" : "Failed"}
                                    </Badge>
                                </Flex>

                                {(r.data || r.entry || r.schema || r.plan) && (
                                    <Box
                                        marginTop={2}
                                        padding={2}
                                        background="neutral100"
                                        borderRadius="6px"
                                        style={{ maxHeight: 200, overflow: "auto" }}
                                    >
                                        <pre style={{ fontSize: 12 }}>
                                            {JSON.stringify(
                                                r.data || r.entry || r.schema || r.plan,
                                                null,
                                                2
                                            )}
                                        </pre>
                                    </Box>
                                )}
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}

            {/* Empty fallback */}
            {!hasTimeline && !hasActions && !hasResults && (
                <Typography variant="pi" textColor="neutral600">
                    Operation completed. No additional details were returned.
                </Typography>
            )}
        </Box>
    );
}