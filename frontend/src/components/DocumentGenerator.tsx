import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Loader2, FileText, Download, Copy } from 'lucide-react';

interface DocumentGeneratorProps {
  onDocumentGenerated?: (document: string, threadId: string) => void;
}

const DocumentGenerator: React.FC<DocumentGeneratorProps> = ({ onDocumentGenerated }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [caseDescription, setCaseDescription] = useState('');
  const [country, setCountry] = useState('Honduras');
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');

  const documentTypes = [
    'Oposición a registro de marca',
    'Contestación a oposición',
    'Contestación a objeciones',
    'Recurso de reposición',
    'Recurso de apelación',
    'Cancelación',
    'Nulidad',
    'Otro trámite de PI'
  ];

  const countries = [
    'Honduras',
    'El Salvador',
    'Costa Rica',
    'Nicaragua',
    'Panama',
    'Paraguay',
    'Dominica'
  ];

  const generateDocument = async () => {
    if (!documentType || !caseDescription.trim()) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setCurrentStep('Iniciando generación...');

    try {
      // Simulate progress updates for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 2000);

      const response = await fetch('/api/generate-legal-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `Tipo de documento: ${documentType}\n\nDescripción del caso: ${caseDescription}`,
          documentType,
          country,
          userID: 'current-user-id', // This should come from your auth context
        }),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error('Error en la generación del documento');
      }

      const data = await response.json();
      setGeneratedDocument(data.response);
      setProgress(100);
      setCurrentStep('Documento generado exitosamente');

      if (onDocumentGenerated) {
        onDocumentGenerated(data.response, data.threadID);
      }

    } catch (error) {
      console.error('Error generating document:', error);
      setCurrentStep('Error en la generación');
      alert('Error al generar el documento. Por favor intenta de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedDocument);
    alert('Documento copiado al portapapeles');
  };

  const downloadDocument = () => {
    const blob = new Blob([generatedDocument], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `documento-legal-${documentType.toLowerCase().replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const wordCount = generatedDocument.split(/\s+/).filter(word => word.length > 0).length;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generador de Documentos Legales
          </CardTitle>
          <CardDescription>
            Genera documentos legales extensos y completos usando un enfoque agéntico
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Documento *</label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo de documento" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">País</label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Descripción del Caso *</label>
            <Textarea
              placeholder="Describe detalladamente el caso, incluyendo las marcas involucradas, hechos relevantes, y cualquier información adicional que consideres importante..."
              value={caseDescription}
              onChange={(e) => setCaseDescription(e.target.value)}
              rows={6}
              className="resize-none"
            />
          </div>

          <Button 
            onClick={generateDocument} 
            disabled={isGenerating || !documentType || !caseDescription.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando Documento...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Generar Documento Legal
              </>
            )}
          </Button>

          {isGenerating && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{currentStep}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {generatedDocument && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Documento Generado</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {wordCount} palabras
                </Badge>
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copiar
                </Button>
                <Button variant="outline" size="sm" onClick={downloadDocument}>
                  <Download className="h-4 w-4 mr-1" />
                  Descargar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm font-mono">
                {generatedDocument}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DocumentGenerator;
