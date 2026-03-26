import {
    Box,
    Typography,
    Flex,
    Table,
    Thead,
    Tbody,
    Tr,
    Td,
    Th,
} from "@strapi/design-system";
import { WarningCircle } from "@strapi/icons";
import React from "react";

/**
 * Smart Data Renderer
 * Automatically chooses the best visualization based on data type.
 */
function SmartDataRenderer({ data }: { data: any }) {
    if (!data) return null;

    // 1. Array of Objects -> Render as Table
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
        const keys = Object.keys(data[0]).filter(k => typeof data[0][k] !== 'object' || data[0][k] === null);

        return (
            <Box marginTop={3} marginBottom={4} style={{ border: '1px solid #eaeaef', borderRadius: '8px' }}>
                <Table colCount={keys.length} rowCount={data.length}>
                    <Thead>
                        <Tr>
                            {keys.map(key => (
                                <Th key={key}>
                                    <Typography variant="sigma" textColor="neutral600">{key.toUpperCase()}</Typography>
                                </Th>
                            ))}
                        </Tr>
                    </Thead>
                    <Tbody>
                        {data.map((row, i) => (
                            <Tr key={i}>
                                {keys.map(key => (
                                    <Td key={key}>
                                        <Typography textColor="neutral800">
                                            {row[key] === null ? 'null' : String(row[key])}
                                        </Typography>
                                    </Td>
                                ))}
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </Box>
        );
    }

    // 2. Simple String -> Render as friendly text
    if (typeof data === 'string') {
        return (
            <Box marginTop={2} padding={3} background="neutral100" hasRadius>
                <Typography variant="omega" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                    {data}
                </Typography>
            </Box>
        );
    }

    // 3. Fallback to JSON for complex objects
    return (
        <Box marginTop={2} padding={2} background="neutral100" hasRadius maxHeight="250px" overflow="auto">
            <pre style={{ fontSize: '11px', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {JSON.stringify(data, null, 2)}
            </pre>
        </Box>
    );
}

export default function AIResponse({ data }: { data: any }) {
    if (!data) return null;

    return (
        <Box>
            {/* The primary AI message */}
            {data.message && (
                <Box marginBottom={data.results?.length > 0 ? 4 : 0}>
                    <Typography
                        variant="omega"
                        textColor="neutral800"
                        style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap' }}
                    >
                        {data.message}
                    </Typography>
                </Box>
            )}

            {/* Tool Results integrated seamlessly */}
            {data.results?.map((res: any, i: number) => {
                if (!res.data && !res.error) return null;

                return (
                    <Box key={i} marginTop={2}>
                        {/* Result Data Summary (e.g. Tables) */}
                        {res.data && (
                            <SmartDataRenderer data={res.data} />
                        )}

                        {/* Error Indicator (Subtle) */}
                        {!res.success && res.error && (
                            <Box marginTop={2} padding={2} background="danger100" hasRadius>
                                <Flex gap={2} alignItems="center">
                                    <WarningCircle color="danger600" width="12px" />
                                    <Typography variant="pi" textColor="danger700" fontWeight="bold">
                                        Error: {res.tool}
                                    </Typography>
                                    <Typography variant="pi" textColor="danger700">
                                        {res.error}
                                    </Typography>
                                </Flex>
                            </Box>
                        )}
                    </Box>
                );
            })}
        </Box>
    );
}
