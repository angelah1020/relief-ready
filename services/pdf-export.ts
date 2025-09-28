import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { captureRef } from 'react-native-view-shot';

export interface HouseholdData {
  name: string;
  country: string;
  postalCode: string;
  memberCount: number;
  petCount: number;
  riskProfile: string[];
  members: Array<{
    firstName: string;
    lastName: string;
    ageBand: string;
    medicalNote?: string;
    hasAccount: boolean;
  }>;
  pets: Array<{
    type: string;
    count: number;
    note?: string;
  }>;
  rallyPoint?: string;
  outOfAreaContact?: {
    name: string;
    phone: string;
  };
  iceContacts: Array<{
    name: string;
    phone: string;
    relationship: string;
  }>;
}

export interface InventoryData {
  category: string;
  items: Array<{
    description: string;
    quantity: number;
    unit: string;
    aiConfidence?: number;
  }>;
}

export interface ChecklistData {
  hazard: string;
  readinessPercentage: number;
  items: Array<{
    category: string;
    name: string;
    needed: number;
    unit: string;
    have: number;
    status: 'full' | 'partial' | 'none';
  }>;
}

export interface MapData {
  center: {
    latitude: number;
    longitude: number;
  };
  activeAlerts: Array<{
    type: string;
    severity: string;
    description: string;
    endTime: string;
  }>;
  nearbyResources: Array<{
    type: string;
    name: string;
    distance: string;
    phone?: string;
  }>;
  mapImageUri?: string; // Base64 encoded image of the map
}

export interface PDFData {
  householdData: HouseholdData;
  inventoryData: InventoryData[];
  checklistData: ChecklistData[];
  mapData?: MapData;
  logoBase64?: string;
}

export class PDFExportService {
  private generateHTML(householdData: HouseholdData, inventoryData: InventoryData[], checklistData: ChecklistData[], mapData?: MapData): string {
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();

    // Debug logging
    console.log('PDF HTML Generation:');
    console.log('Inventory data length:', inventoryData.length);
    console.log('Checklist data length:', checklistData.length);
    console.log('Map data available:', !!mapData);
    console.log('Map image URI available:', !!mapData?.mapImageUri);
    console.log('Map image URI length:', mapData?.mapImageUri?.length || 0);

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Relief Ready - Emergency Preparedness Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.5;
            color: #1f2937;
            max-width: 800px;
            margin: 0 auto;
            padding: 0;
            background: #ffffff;
        }
        
        .header {
            background: linear-gradient(135deg, #354eab 0%, #a8bafe 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
            margin-bottom: 0;
        }
        
        .logo-container {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
        }
        
        .logo-image {
            height: 60px;
            width: auto;
            max-width: 200px;
            object-fit: contain;
            background: transparent;
        }
        
        .logo {
            font-size: 36px;
            font-weight: 700;
            color: #354eab;
            margin: 0;
            letter-spacing: -0.5px;
        }
        
        .subtitle {
            color: rgba(255, 255, 255, 0.9);
            font-size: 18px;
            font-weight: 400;
            margin: 0;
        }
        
        .report-meta {
            color: rgba(255, 255, 255, 0.8);
            font-size: 14px;
            margin-top: 15px;
            font-weight: 300;
        }
        
        .content {
            padding: 30px 20px;
        }
        
        .section {
            margin-bottom: 40px;
            page-break-inside: avoid;
        }
        
        .section-title {
            font-size: 22px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 20px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e5e7eb;
            position: relative;
        }
        
        .section-title::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0;
            width: 60px;
            height: 2px;
            background: #354eab;
        }
        
        .household-info {
            background: #f8fafc;
            padding: 24px;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .info-item {
            display: flex;
            flex-direction: column;
        }
        
        .info-label {
            font-weight: 600;
            color: #374151;
            font-size: 14px;
            margin-bottom: 4px;
        }
        
        .info-value {
            color: #1f2937;
            font-size: 16px;
        }
        
        .members-list, .pets-list {
            margin-top: 15px;
        }
        
        .member-item, .pet-item {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        
        .member-name, .pet-name {
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 4px;
        }
        
        .member-details, .pet-details {
            font-size: 14px;
            color: #6b7280;
        }
        
        .inventory-category {
            margin-bottom: 24px;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .category-header {
            background: linear-gradient(135deg, #354eab 0%, #4f46e5 100%);
            color: white;
            padding: 16px 20px;
            font-weight: 600;
            font-size: 16px;
            letter-spacing: 0.3px;
        }
        
        .category-items {
            padding: 20px;
            background: #ffffff;
        }
        
        .inventory-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #f3f4f6;
        }
        
        .inventory-item:last-child {
            border-bottom: none;
        }
        
        .item-description {
            font-weight: 500;
            color: #1f2937;
        }
        
        .item-quantity {
            color: #6b7280;
            font-size: 14px;
        }
        
        .checklist-hazard {
            margin-bottom: 32px;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .hazard-header {
            background: linear-gradient(135deg, #a8bafe 0%, #c7d2fe 100%);
            color: #1f2937;
            padding: 16px 20px;
            font-weight: 600;
            font-size: 18px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            letter-spacing: 0.3px;
        }
        
        .readiness-percentage {
            background: #354eab;
            color: white;
            padding: 6px 16px;
            border-radius: 24px;
            font-size: 14px;
            font-weight: 600;
        }
        
        .checklist-items {
            padding: 16px;
        }
        
        .checklist-category {
            margin-bottom: 15px;
        }
        
        .category-title {
            font-weight: 600;
            color: #374151;
            margin-bottom: 8px;
            font-size: 14px;
        }
        
        .checklist-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 0;
            font-size: 14px;
        }
        
        .item-name {
            color: #1f2937;
        }
        
        .item-status {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .status-full {
            color: #059669;
            font-weight: 600;
        }
        
        .status-partial {
            color: #d97706;
            font-weight: 600;
        }
        
        .status-none {
            color: #dc2626;
            font-weight: 600;
        }
        
        .status-icon {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            display: inline-block;
        }
        
        .status-icon.full {
            background: #059669;
        }
        
        .status-icon.partial {
            background: #d97706;
        }
        
        .status-icon.none {
            background: #dc2626;
        }
        
        .map-section {
            background: #f8fafc;
            padding: 24px;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .map-image {
            width: 100%;
            max-width: 600px;
            height: 300px;
            border-radius: 8px;
            margin: 16px 0;
            object-fit: cover;
            border: 1px solid #e5e7eb;
        }
        
        .alert-item {
            background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        
        .alert-severity {
            font-weight: 600;
            color: #dc2626;
            margin-bottom: 6px;
            font-size: 15px;
        }
        
        .alert-description {
            color: #1f2937;
            font-size: 14px;
            line-height: 1.5;
        }
        
        .resource-item {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border: 1px solid #bae6fd;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        
        .resource-type {
            font-weight: 600;
            color: #0369a1;
            margin-bottom: 6px;
            font-size: 15px;
        }
        
        .resource-details {
            color: #1f2937;
            font-size: 14px;
            line-height: 1.5;
        }
        
        .footer {
            background: #f8fafc;
            margin-top: 0;
            padding: 30px 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            line-height: 1.6;
        }
        
        .footer p {
            margin: 8px 0;
        }
        
        .emergency-contacts {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border: 1px solid #f59e0b;
            border-radius: 12px;
            padding: 20px;
            margin-top: 20px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .emergency-title {
            font-weight: 600;
            color: #92400e;
            margin-bottom: 16px;
            font-size: 18px;
            letter-spacing: 0.3px;
        }
        
        .contact-item {
            margin-bottom: 8px;
            font-size: 14px;
        }
        
        .contact-name {
            font-weight: 600;
            color: #1f2937;
        }
        
        .contact-phone {
            color: #6b7280;
            margin-left: 8px;
        }
        
        @media print {
            body {
                margin: 0;
                padding: 15px;
            }
            
            .section {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo-container">
            <div class="logo">Relief Ready</div>
        </div>
        <div class="subtitle">Emergency Preparedness Report</div>
        <div class="report-meta">
            Generated on ${currentDate} at ${currentTime}
        </div>
    </div>

    <div class="content">
    <div class="section">
        <div class="section-title">Household Information</div>
        <div class="household-info">
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Household Name</div>
                    <div class="info-value">${householdData.name}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Household Location</div>
                    <div class="info-value">${householdData.country} ${householdData.postalCode}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Members</div>
                    <div class="info-value">${householdData.memberCount} people</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Pets</div>
                    <div class="info-value">${householdData.petCount} pets</div>
                </div>
            </div>
            
            <div class="info-item">
                <div class="info-label">Risk Profile</div>
                <div class="info-value">${householdData.riskProfile.join(', ')}</div>
            </div>
            
            ${householdData.rallyPoint ? `
            <div class="info-item" style="margin-top: 15px;">
                <div class="info-label">Rally Point</div>
                <div class="info-value">${householdData.rallyPoint}</div>
            </div>
            ` : ''}
            
            ${householdData.outOfAreaContact ? `
            <div class="info-item" style="margin-top: 15px;">
                <div class="info-label">Out-of-Area Contact</div>
                <div class="info-value">${householdData.outOfAreaContact.name} - ${householdData.outOfAreaContact.phone}</div>
            </div>
            ` : ''}
        </div>
    </div>

    <div class="section">
        <div class="section-title">Family Members</div>
        <div class="members-list">
            ${householdData.members.map(member => `
                <div class="member-item">
                    <div class="member-name">${member.firstName} ${member.lastName}</div>
                    <div class="member-details">
                        Age: ${member.ageBand} • 
                        ${member.hasAccount ? 'Has Account' : 'Dependent'} • 
                        ${member.medicalNote ? `Medical: ${member.medicalNote}` : 'No medical notes'}
                    </div>
                </div>
            `).join('')}
        </div>
        
        ${householdData.pets.length > 0 ? `
        <div class="section-title" style="margin-top: 25px;">Pets</div>
        <div class="pets-list">
            ${householdData.pets.map(pet => `
                <div class="pet-item">
                    <div class="pet-name">${pet.type} (${pet.count} ${pet.count === 1 ? 'pet' : 'pets'})</div>
                    ${pet.note ? `<div class="pet-details">Note: ${pet.note}</div>` : ''}
                </div>
            `).join('')}
        </div>
        ` : ''}
    </div>

    ${householdData.iceContacts.length > 0 ? `
    <div class="section">
        <div class="section-title">Emergency Contacts</div>
        <div class="emergency-contacts">
            ${householdData.iceContacts.map(contact => `
                <div class="contact-item">
                    <span class="contact-name">${contact.name}</span>
                    <span class="contact-phone">${contact.phone}</span>
                    <div style="color: #6b7280; font-size: 12px; margin-top: 2px;">${contact.relationship}</div>
                </div>
            `).join('')}
        </div>
    </div>
    ` : ''}

    <div class="section">
        <div class="section-title">Emergency Inventory</div>
        ${inventoryData.length > 0 ? inventoryData.map(category => `
            <div class="inventory-category">
                <div class="category-header">${category.category}</div>
                <div class="category-items">
                    ${category.items.map(item => `
                        <div class="inventory-item">
                            <div class="item-description">${item.description}</div>
                            <div class="item-quantity">${item.quantity} ${item.unit}${item.aiConfidence ? ` (${Math.round(item.aiConfidence * 100)}% confidence)` : ''}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('') : '<div style="text-align: center; color: #6b7280; padding: 40px; font-style: italic;">No inventory items found. Add items in the Inventory tab to see them here.</div>'}
    </div>

    <div class="section">
        <div class="section-title">Disaster Readiness Checklists</div>
        ${checklistData.length > 0 ? checklistData.map(checklist => `
            <div class="checklist-hazard">
                <div class="hazard-header">
                    <span>${checklist.hazard}</span>
                    <span class="readiness-percentage">${checklist.readinessPercentage}% Ready</span>
                </div>
                <div class="checklist-items">
                    ${Object.entries(
                        checklist.items.reduce((acc, item) => {
                            if (!acc[item.category]) acc[item.category] = [];
                            acc[item.category].push(item);
                            return acc;
                        }, {} as Record<string, typeof checklist.items>)
                    ).map(([category, items]) => `
                        <div class="checklist-category">
                            <div class="category-title">${category}</div>
                            ${items.map(item => `
                                <div class="checklist-item">
                                    <span class="item-name">${item.name}</span>
                                    <div class="item-status">
                                        <span class="status-icon ${item.status}"></span>
                                        <span class="status-${item.status}">${item.have}/${item.needed} ${item.unit}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('') : '<div style="text-align: center; color: #6b7280; padding: 40px; font-style: italic;">No checklist data available. Checklists will be generated based on your household profile.</div>'}
    </div>

    ${mapData ? `
    <div class="section">
        <div class="section-title">Current Situation & Resources</div>
        <div class="map-section">
            <div class="info-item" style="margin-bottom: 20px;">
                <div class="info-label">Household Location</div>
                <div class="info-value">${mapData.center.latitude.toFixed(4)}, ${mapData.center.longitude.toFixed(4)}</div>
            </div>
            
            ${mapData.mapImageUri ? `
                <div style="text-align: center; margin: 20px 0;">
                    <div class="info-label" style="margin-bottom: 12px;">Household Location Map</div>
                    <img src="data:image/png;base64,${mapData.mapImageUri}" alt="Household Location Map" class="map-image" />
                    <div style="font-size: 12px; color: #666; margin-top: 8px;">
                        Map image length: ${mapData.mapImageUri.length} characters
                    </div>
                </div>
            ` : `
                <div style="text-align: center; margin: 20px 0; padding: 20px; background: #f3f4f6; border-radius: 8px;">
                    <div class="info-label" style="margin-bottom: 12px;">Household Location Map</div>
                    <div style="color: #666;">Map screenshot not available</div>
                </div>
            `}
            
            ${mapData.activeAlerts.length > 0 ? `
                <div style="margin-bottom: 20px;">
                    <div class="section-title" style="font-size: 16px; margin-bottom: 12px;">Active Alerts</div>
                    ${mapData.activeAlerts.map(alert => `
                        <div class="alert-item">
                            <div class="alert-severity">${alert.severity.toUpperCase()}: ${alert.type}</div>
                            <div class="alert-description">${alert.description}</div>
                            <div style="color: #6b7280; font-size: 12px; margin-top: 4px;">Until: ${alert.endTime}</div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            ${mapData.nearbyResources.length > 0 ? `
                <div>
                    <div class="section-title" style="font-size: 16px; margin-bottom: 12px;">Nearby Resources</div>
                    ${mapData.nearbyResources.map(resource => `
                        <div class="resource-item">
                            <div class="resource-type">${resource.type}</div>
                            <div class="resource-details">${resource.name} • ${resource.distance}${resource.phone ? ` • ${resource.phone}` : ''}</div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    </div>
    ` : ''}
    </div>

    <div class="footer">
        <p>This report was generated by Relief Ready - Your Emergency Preparedness Companion</p>
        <p>Keep this document in a safe, accessible place and update it regularly</p>
        <p>For the most current information, use the Relief Ready mobile app</p>
    </div>
</body>
</html>
    `;
  }

  async generatePDF(
    householdData: HouseholdData,
    inventoryData: InventoryData[],
    checklistData: ChecklistData[],
    mapData?: MapData
  ): Promise<string> {
    try {
      const html = this.generateHTML(householdData, inventoryData, checklistData, mapData);
      
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      return uri;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF report');
    }
  }

  async sharePDF(pdfUri: string): Promise<void> {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Emergency Preparedness Report',
        });
      } else {
        throw new Error('Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error sharing PDF:', error);
      throw new Error('Failed to share PDF report');
    }
  }

  async savePDF(pdfUri: string, filename?: string): Promise<string> {
    try {
      const fileName = filename || `relief-ready-report-${new Date().toISOString().split('T')[0]}.pdf`;
      const fileUri = `file:///tmp/${fileName}`;
      
      await FileSystem.copyAsync({
        from: pdfUri,
        to: fileUri,
      });

      return fileUri;
    } catch (error) {
      console.error('Error saving PDF:', error);
      throw new Error('Failed to save PDF report');
    }
  }
}

export const pdfExportService = new PDFExportService();
