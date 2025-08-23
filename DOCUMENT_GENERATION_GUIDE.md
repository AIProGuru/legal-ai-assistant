# Legal Document Generation Guide

## Problem Solved

Your legal assistant was generating documents that were too short (1 page instead of 5+ pages). This guide provides solutions to ensure longer, more comprehensive legal documents.

## Solutions Implemented

### 1. **Agentic Multi-Step Document Generation**

The new `/api/generate-legal-document` endpoint breaks down document creation into three phases:

#### Phase 1: Research and Analysis
- Performs comprehensive legal research using `searchLegalBasis`
- Analyzes the case from multiple legal perspectives
- Identifies all applicable legal foundations
- Suggests additional arguments and evidence

#### Phase 2: Document Drafting
- Creates the complete document structure
- Ensures minimum word count requirements (3000-5000 words)
- Integrates all legal research findings
- Develops extensive arguments for each section

#### Phase 3: Review and Enhancement
- Verifies document length and completeness
- Expands sections that need more detail
- Adds additional legal arguments
- Ensures quality and compliance

### 2. **Enhanced System Prompt**

The system prompt now includes:
- **Explicit word count requirements** (3000-5000 words minimum)
- **Section-specific length targets**
- **Mandatory expansion rules**
- **Quality verification steps**

### 3. **Frontend Component**

A new `DocumentGenerator` component provides:
- User-friendly interface for document generation
- Progress tracking during generation
- Document preview and download options
- Word count verification

## How to Use

### Backend Setup

1. **Update your existing assistant** with the enhanced system prompt:
   ```javascript
   // Use the enhanced system prompt from enhanced-system-prompt.js
   const { enhancedSystemPrompt } = require('./enhanced-system-prompt');
   ```

2. **The new endpoint is already added** to your `app.js`:
   ```javascript
   POST /api/generate-legal-document
   ```

3. **Configuration file** provides settings for consistent outputs:
   ```javascript
   const { documentGenerationConfig } = require('./document-generation-config');
   ```

### Frontend Integration

1. **Import the DocumentGenerator component**:
   ```javascript
   import DocumentGenerator from './components/DocumentGenerator';
   ```

2. **Use in your app**:
   ```javascript
   <DocumentGenerator 
     onDocumentGenerated={(document, threadId) => {
       // Handle the generated document
       console.log('Document generated:', document.length, 'characters');
     }}
   />
   ```

## Key Features

### Word Count Enforcement
- **Minimum**: 3000 words
- **Target**: 4000-5000 words
- **Maximum**: 6000 words
- **Automatic expansion** if document is too short

### Section Requirements
- **Summary**: 200-250 words
- **Background**: 400-600 words
- **Facts/Arguments**: 250-300 words each
- **Legal Basis**: 800-1200 words
- **Petition**: 300-400 words

### Legal Research Integration
- **Mandatory searches** for relevant legal texts
- **International treaties** (Paris Convention, TRIPS, etc.)
- **Doctrinal analysis** and jurisprudence
- **Comparative law** considerations

### Quality Assurance
- **Multi-phase verification**
- **Content completeness checks**
- **Legal citation verification**
- **Structure compliance**

## Usage Examples

### Basic Document Generation
```javascript
const response = await fetch('/api/generate-legal-document', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'Oposición a marca "TECHNO" vs "TECHNOLOGY"',
    documentType: 'Oposición a registro de marca',
    country: 'Honduras',
    userID: 'user-123'
  })
});
```

### Expected Output
The system will generate a document with:
- **6-10 pages** equivalent
- **3000-5000 words**
- **Complete legal structure**
- **Extensive legal arguments**
- **Proper citations and references**

## Troubleshooting

### Document Still Too Short
1. **Check the system prompt** - ensure it includes the extension rules
2. **Verify tool calls** - make sure `searchLegalBasis` is being used
3. **Review the three-phase process** - ensure all phases complete
4. **Check word count verification** - the system should expand if too short

### Generation Takes Too Long
1. **Monitor the progress bar** - the process has 3 phases
2. **Check network connectivity** - tool calls require internet
3. **Verify API keys** - ensure all services are accessible

### Quality Issues
1. **Review the quality checks** in the configuration
2. **Verify legal research** - ensure proper citations
3. **Check structure compliance** - all sections should be present

## Advanced Configuration

### Customizing Word Counts
Edit `document-generation-config.js`:
```javascript
wordCountRequirements: {
  opposition: {
    min: 4000,  // Increase minimum
    target: 5000,
    max: 6000
  }
}
```

### Adding New Document Types
```javascript
requiredSections: {
  newType: [
    'summary',
    'appearance',
    'customSection',
    'legalBasis',
    'petition'
  ]
}
```

### Custom Expansion Strategies
```javascript
expansionStrategies: {
  customSection: [
    'Add detailed analysis',
    'Include specific examples',
    'Expand legal reasoning'
  ]
}
```

## Best Practices

1. **Always use the agentic endpoint** for important documents
2. **Provide detailed case descriptions** for better results
3. **Monitor word count** in the generated output
4. **Review legal citations** for accuracy
5. **Use the configuration file** for consistency

## Monitoring and Analytics

The system provides:
- **Progress tracking** during generation
- **Word count verification**
- **Generation method identification**
- **Thread ID tracking** for conversation history

## Conclusion

This agentic approach ensures that your legal assistant generates comprehensive, professional-quality documents that meet the length requirements of legal practice. The multi-step process, enhanced prompts, and quality controls work together to produce documents that are both extensive and legally sound.
