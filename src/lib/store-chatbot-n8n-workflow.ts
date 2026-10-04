export function buildStoreChatbotN8nWorkflow(input: {
  endpoint: string;
  apiKey: string;
  storeName?: string;
}) {
  return {
    name: `Educalizando - Consulta ${input.storeName || 'da loja'}`,
    nodes: [
      {
        parameters: {},
        id: 'educalizando-manual-trigger',
        name: 'Testar consulta',
        type: 'n8n-nodes-base.manualTrigger',
        typeVersion: 1,
        position: [-460, 100],
      },
      {
        parameters: {
          assignments: {
            assignments: [
              {
                id: 'educalizando-search-term',
                name: 'termo',
                value: 'alfabetização',
                type: 'string',
              },
            ],
          },
          options: {},
        },
        id: 'educalizando-search-input',
        name: 'Termo da busca',
        type: 'n8n-nodes-base.set',
        typeVersion: 3.4,
        position: [-240, 100],
      },
      {
        parameters: {
          url: input.endpoint,
          sendQuery: true,
          queryParameters: {
            parameters: [{ name: 'q', value: '={{ $json.termo }}' }],
          },
          sendHeaders: true,
          headerParameters: {
            parameters: [{ name: 'Authorization', value: `Bearer ${input.apiKey}` }],
          },
          options: {},
        },
        id: 'educalizando-catalog-request',
        name: 'Consultar loja Educalizando',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4.2,
        position: [0, 100],
      },
    ],
    pinData: {},
    connections: {
      'Testar consulta': {
        main: [[{ node: 'Termo da busca', type: 'main', index: 0 }]],
      },
      'Termo da busca': {
        main: [[{ node: 'Consultar loja Educalizando', type: 'main', index: 0 }]],
      },
    },
    active: false,
    settings: { executionOrder: 'v1' },
    versionId: '4f67e1bc-2106-4c30-bf2f-b8ea24f878b9',
    meta: { templateCredsSetupCompleted: true },
    tags: [],
  };
}

export function storeChatbotN8nFileName(storeName?: string) {
  const slug = String(storeName || 'minha-loja')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'minha-loja';
  return `educalizando-n8n-${slug}.json`;
}
