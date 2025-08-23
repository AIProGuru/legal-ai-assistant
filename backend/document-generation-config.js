// Configuration for Legal Document Generation
// This file contains settings to ensure longer, more comprehensive document outputs

const documentGenerationConfig = {
  // Minimum word count requirements for different document types
  wordCountRequirements: {
    default: {
      min: 3000,
      target: 4000,
      max: 5000
    },
    opposition: {
      min: 3500,
      target: 4500,
      max: 5500
    },
    response: {
      min: 3000,
      target: 4000,
      max: 5000
    },
    appeal: {
      min: 4000,
      target: 5000,
      max: 6000
    }
  },

  // Section-specific word count targets
  sectionTargets: {
    summary: { min: 200, target: 250 },
    appearance: { min: 150, target: 200 },
    background: { min: 400, target: 600 },
    facts: { min: 250, target: 300 }, // per fact
    legalBasis: { min: 800, target: 1200 },
    petition: { min: 300, target: 400 }
  },

  // Required sections for different document types
  requiredSections: {
    opposition: [
      'summary',
      'appearance', 
      'background',
      'facts',
      'legalBasis',
      'petition',
      'closing'
    ],
    response: [
      'summary',
      'appearance',
      'background', 
      'refutations',
      'legalBasis',
      'petition',
      'closing'
    ],
    appeal: [
      'summary',
      'appearance',
      'background',
      'impugnedAct',
      'arguments',
      'legalBasis', 
      'petition',
      'closing'
    ]
  },

  // Legal research requirements
  legalResearch: {
    mandatorySearches: [
      'confundibilidad',
      'similitud de signos',
      'artículo 84 LPI Honduras',
      'prohibiciones relativas',
      'notoriedad',
      'Manual Armonizado'
    ],
    internationalTreaties: [
      'Convenio de París',
      'ADPIC TRIPS',
      'Convenio de Berna'
    ]
  },

  // Content expansion strategies
  expansionStrategies: {
    facts: [
      'Add detailed analysis of similarity criteria',
      'Include consumer perspective analysis',
      'Expand on commercial channels',
      'Add coexistence considerations',
      'Include market analysis'
    ],
    legalBasis: [
      'Cite specific articles with text',
      'Add doctrinal analysis',
      'Include jurisprudential references',
      'Expand on international law',
      'Add comparative law analysis'
    ],
    background: [
      'Add procedural history',
      'Include relevant precedents',
      'Expand on legal context',
      'Add market context'
    ]
  },

  // Quality checks
  qualityChecks: [
    'Word count verification',
    'Section completeness',
    'Legal citations presence',
    'Argument development',
    'Formal language usage',
    'Structure compliance'
  ],

  // Agentic workflow steps
  workflowSteps: [
    {
      name: 'Research Phase',
      description: 'Legal research and analysis',
      duration: '2-3 minutes',
      required: true
    },
    {
      name: 'Drafting Phase', 
      description: 'Document composition',
      duration: '3-4 minutes',
      required: true
    },
    {
      name: 'Review Phase',
      description: 'Content expansion and verification',
      duration: '1-2 minutes',
      required: true
    }
  ]
};

module.exports = { documentGenerationConfig };
