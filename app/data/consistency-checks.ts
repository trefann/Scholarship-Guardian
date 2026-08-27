import type { ConsistencyCheckDefinition } from '@/app/lib/types';

export const consistencyChecks: ConsistencyCheckDefinition[] = [
  {
    id: 'demo-name-mismatch',
    field: 'name',
    title: 'Name consistency',
    documentTypes: ['COMMUNITY_CERTIFICATE', 'INCOME_CERTIFICATE', 'ADMISSION_PROOF'],
    minimumDocuments: 2,
    requirement: 'The name format should be reviewed across application documents.',
    explanation: 'Different name formats may require clarification or correction during document verification.',
    recommendedAction: 'Check the name against authoritative identity and admission records before submitting.',
  },
];
