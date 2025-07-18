import type { AnalysisResult } from '@/types/analysis';

export interface LISConfiguration {
  endpoint: string;
  apiKey: string;
  clientId: string;
  format: 'HL7' | 'JSON' | 'XML';
  version: string;
  testMode: boolean;
}

export interface LISResult {
  id: string;
  patientId: string;
  sampleId: string;
  testCode: string;
  testName: string;
  results: Record<string, any>;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  timestamp: Date;
  reportUrl?: string;
}

export interface HL7Message {
  messageType: 'ORU^R01' | 'ORM^O01' | 'ACK';
  sendingApplication: string;
  receivingApplication: string;
  messageControlId: string;
  patientInfo: {
    patientId: string;
    patientName: string;
    dateOfBirth: string;
    gender: string;
  };
  orderInfo: {
    orderNumber: string;
    testCode: string;
    sampleId: string;
    collectionDateTime: string;
  };
  results: Array<{
    testCode: string;
    testName: string;
    value: string | number;
    unit: string;
    referenceRange: string;
    abnormalFlag: string;
    resultStatus: string;
  }>;
}

export class LISIntegration {
  private config: LISConfiguration;
  private isConnected: boolean = false;

  constructor(config: LISConfiguration) {
    this.config = config;
  }

  /**
   * Test connection to LIS system
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.endpoint}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-Client-ID': this.config.clientId,
          'Content-Type': 'application/json'
        }
      });

      this.isConnected = response.ok;
      return this.isConnected;
    } catch (error) {
      console.error('LIS connection test failed:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Send sperm analysis results to LIS
   */
  async sendResults(analysis: AnalysisResult, patientInfo: any): Promise<LISResult> {
    if (!this.isConnected && !this.config.testMode) {
      throw new Error('LIS connection not established');
    }

    const lisResult: LISResult = {
      id: `lis_${Date.now()}`,
      patientId: patientInfo.patientId,
      sampleId: analysis.sampleId,
      testCode: 'SPERM_ANALYSIS',
      testName: 'Computer-Assisted Sperm Analysis (CASA)',
      results: this.formatCASAResults(analysis),
      status: 'pending',
      timestamp: new Date()
    };

    try {
      if (this.config.format === 'HL7') {
        const hl7Message = this.createHL7Message(analysis, patientInfo);
        const response = await this.sendHL7Message(hl7Message);
        lisResult.status = response.success ? 'completed' : 'failed';
      } else if (this.config.format === 'JSON') {
        const response = await this.sendJSONResults(lisResult);
        lisResult.status = response.success ? 'completed' : 'failed';
      } else if (this.config.format === 'XML') {
        const xmlResults = this.convertToXML(lisResult);
        const response = await this.sendXMLResults(xmlResults);
        lisResult.status = response.success ? 'completed' : 'failed';
      }

      console.log('LIS results sent successfully:', lisResult);
      return lisResult;

    } catch (error) {
      console.error('Failed to send LIS results:', error);
      lisResult.status = 'failed';
      throw error;
    }
  }

  /**
   * Format CASA results for LIS
   */
  private formatCASAResults(analysis: AnalysisResult): Record<string, any> {
    return {
      // Concentration and Count
      'SPERM_CONCENTRATION': {
        value: analysis.concentration || 0,
        unit: 'million/mL',
        referenceRange: '>15',
        abnormalFlag: (analysis.concentration || 0) < 15 ? 'L' : 'N'
      },
      'TOTAL_SPERM_COUNT': {
        value: analysis.totalCells || 0,
        unit: 'cells',
        referenceRange: '>39 million',
        abnormalFlag: (analysis.totalCells || 0) < 39000000 ? 'L' : 'N'
      },

      // Motility Parameters
      'PROGRESSIVE_MOTILITY': {
        value: analysis.progressiveMotility || 0,
        unit: '%',
        referenceRange: '>32%',
        abnormalFlag: (analysis.progressiveMotility || 0) < 32 ? 'L' : 'N'
      },
      'TOTAL_MOTILITY': {
        value: analysis.totalMotility || 0,
        unit: '%',
        referenceRange: '>40%',
        abnormalFlag: (analysis.totalMotility || 0) < 40 ? 'L' : 'N'
      },

      // Velocity Parameters
      'VAP': {
        value: analysis.vap || 0,
        unit: 'μm/s',
        referenceRange: '>25',
        abnormalFlag: (analysis.vap || 0) < 25 ? 'L' : 'N'
      },
      'VCL': {
        value: analysis.vcl || 0,
        unit: 'μm/s',
        referenceRange: '>45',
        abnormalFlag: (analysis.vcl || 0) < 45 ? 'L' : 'N'
      },
      'VSL': {
        value: analysis.vsl || 0,
        unit: 'μm/s',
        referenceRange: '>20',
        abnormalFlag: (analysis.vsl || 0) < 20 ? 'L' : 'N'
      },

      // Lateral Head Displacement and Beat Cross Frequency
      'ALH': {
        value: analysis.alh || 0,
        unit: 'μm',
        referenceRange: '2.0-7.0',
        abnormalFlag: (analysis.alh || 0) < 2.0 || (analysis.alh || 0) > 7.0 ? 'A' : 'N'
      },
      'BCF': {
        value: analysis.bcf || 0,
        unit: 'Hz',
        referenceRange: '10-30',
        abnormalFlag: (analysis.bcf || 0) < 10 || (analysis.bcf || 0) > 30 ? 'A' : 'N'
      },

      // Quality Metrics
      'MORPHOLOGY_SCORE': {
        value: analysis.morphologyScore || 0,
        unit: '%',
        referenceRange: '>4%',
        abnormalFlag: (analysis.morphologyScore || 0) < 4 ? 'L' : 'N'
      },
      'VITALITY_SCORE': {
        value: analysis.vitalityScore || 0,
        unit: '%',
        referenceRange: '>58%',
        abnormalFlag: (analysis.vitalityScore || 0) < 58 ? 'L' : 'N'
      },

      // Additional Metadata
      'PROCESSING_TIME': {
        value: analysis.processingTime || 0,
        unit: 'seconds',
        referenceRange: 'N/A',
        abnormalFlag: 'N'
      },
      'ANALYSIS_METHOD': {
        value: 'CASA - Computer Assisted Sperm Analysis',
        unit: 'text',
        referenceRange: 'N/A',
        abnormalFlag: 'N'
      }
    };
  }

  /**
   * Create HL7 message from analysis results
   */
  private createHL7Message(analysis: AnalysisResult, patientInfo: any): HL7Message {
    const results = this.formatCASAResults(analysis);
    
    return {
      messageType: 'ORU^R01',
      sendingApplication: 'CASA_SYSTEM',
      receivingApplication: 'LIS',
      messageControlId: `MSG_${Date.now()}`,
      patientInfo: {
        patientId: patientInfo.patientId,
        patientName: patientInfo.patientName,
        dateOfBirth: patientInfo.dateOfBirth,
        gender: patientInfo.gender
      },
      orderInfo: {
        orderNumber: patientInfo.orderNumber || analysis.sampleId,
        testCode: 'SPERM_ANALYSIS',
        sampleId: analysis.sampleId,
        collectionDateTime: new Date().toISOString()
      },
      results: Object.entries(results).map(([key, value]) => ({
        testCode: key,
        testName: this.getTestName(key),
        value: value.value.toString(),
        unit: value.unit,
        referenceRange: value.referenceRange,
        abnormalFlag: value.abnormalFlag,
        resultStatus: 'F' // Final
      }))
    };
  }

  /**
   * Send HL7 message to LIS
   */
  private async sendHL7Message(message: HL7Message): Promise<{ success: boolean; response?: any }> {
    try {
      const hl7String = this.convertToHL7String(message);
      
      const response = await fetch(`${this.config.endpoint}/hl7`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-Client-ID': this.config.clientId,
          'Content-Type': 'text/plain',
          'X-Message-Type': 'HL7v2.5'
        },
        body: hl7String
      });

      const result = await response.text();
      return { success: response.ok, response: result };

    } catch (error) {
      console.error('HL7 send failed:', error);
      return { success: false };
    }
  }

  /**
   * Send JSON results to LIS
   */
  private async sendJSONResults(result: LISResult): Promise<{ success: boolean; response?: any }> {
    try {
      const response = await fetch(`${this.config.endpoint}/results`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-Client-ID': this.config.clientId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(result)
      });

      const responseData = await response.json();
      return { success: response.ok, response: responseData };

    } catch (error) {
      console.error('JSON send failed:', error);
      return { success: false };
    }
  }

  /**
   * Convert to XML format
   */
  private convertToXML(result: LISResult): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<LabResult>
  <Header>
    <MessageId>${result.id}</MessageId>
    <Timestamp>${result.timestamp.toISOString()}</Timestamp>
    <PatientId>${result.patientId}</PatientId>
    <SampleId>${result.sampleId}</SampleId>
  </Header>
  <Test>
    <TestCode>${result.testCode}</TestCode>
    <TestName>${result.testName}</TestName>
    <Status>${result.status}</Status>
    <Results>
      ${Object.entries(result.results).map(([key, value]) => `
      <Result>
        <Parameter>${key}</Parameter>
        <Value>${value.value}</Value>
        <Unit>${value.unit}</Unit>
        <ReferenceRange>${value.referenceRange}</ReferenceRange>
        <Flag>${value.abnormalFlag}</Flag>
      </Result>`).join('')}
    </Results>
  </Test>
</LabResult>`;
  }

  /**
   * Send XML results to LIS
   */
  private async sendXMLResults(xmlData: string): Promise<{ success: boolean; response?: any }> {
    try {
      const response = await fetch(`${this.config.endpoint}/xml`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-Client-ID': this.config.clientId,
          'Content-Type': 'application/xml'
        },
        body: xmlData
      });

      const result = await response.text();
      return { success: response.ok, response: result };

    } catch (error) {
      console.error('XML send failed:', error);
      return { success: false };
    }
  }

  /**
   * Convert HL7 message to string format
   */
  private convertToHL7String(message: HL7Message): string {
    const separator = '|';
    const fieldSeparator = '^';
    const componentSeparator = '&';
    const repetitionSeparator = '~';
    const escapeCharacter = '\\';

    const msh = `MSH${separator}${fieldSeparator}${componentSeparator}${repetitionSeparator}${escapeCharacter}${separator}${message.sendingApplication}${separator}${separator}${message.receivingApplication}${separator}${separator}${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}${separator}${separator}${message.messageType}${separator}${message.messageControlId}${separator}P${separator}2.5`;
    
    const pid = `PID${separator}1${separator}${separator}${message.patientInfo.patientId}${separator}${separator}${message.patientInfo.patientName}${separator}${separator}${message.patientInfo.dateOfBirth}${separator}${message.patientInfo.gender}`;
    
    const obr = `OBR${separator}1${separator}${message.orderInfo.orderNumber}${separator}${separator}${message.orderInfo.testCode}${separator}${separator}${separator}${separator}${separator}${separator}${separator}${message.orderInfo.collectionDateTime}`;
    
    const obxSegments = message.results.map((result, index) => 
      `OBX${separator}${index + 1}${separator}NM${separator}${result.testCode}${separator}${result.testName}${separator}${result.value}${separator}${result.unit}${separator}${result.referenceRange}${separator}${result.abnormalFlag}${separator}${separator}${result.resultStatus}`
    ).join('\r');

    return `${msh}\r${pid}\r${obr}\r${obxSegments}\r`;
  }

  /**
   * Get human-readable test name for code
   */
  private getTestName(code: string): string {
    const names: Record<string, string> = {
      'SPERM_CONCENTRATION': 'Sperm Concentration',
      'TOTAL_SPERM_COUNT': 'Total Sperm Count',
      'PROGRESSIVE_MOTILITY': 'Progressive Motility',
      'TOTAL_MOTILITY': 'Total Motility',
      'VAP': 'Average Path Velocity',
      'VCL': 'Curvilinear Velocity',
      'VSL': 'Straight Line Velocity',
      'ALH': 'Amplitude of Lateral Head Displacement',
      'BCF': 'Beat Cross Frequency',
      'MORPHOLOGY_SCORE': 'Normal Morphology',
      'VITALITY_SCORE': 'Sperm Vitality',
      'PROCESSING_TIME': 'Analysis Processing Time',
      'ANALYSIS_METHOD': 'Analysis Method'
    };
    return names[code] || code;
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<LISConfiguration>): void {
    this.config = { ...this.config, ...config };
    this.isConnected = false; // Re-test connection with new config
  }
}

export default LISIntegration;