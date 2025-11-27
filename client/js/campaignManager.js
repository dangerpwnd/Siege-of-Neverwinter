/**
 * Campaign Manager Module
 * Handles campaign switching, save/load, and export/import functionality
 */

class CampaignManager {
  constructor() {
    this.currentCampaignId = null;
    this.autoSaveInterval = null;
    this.autoSaveDelay = 30000; // 30 seconds
    this.lastModification = null;
  }

  /**
   * Initialize campaign manager
   */
  async initialize() {
    try {
      // Load last active campaign from localStorage
      const lastCampaignId = localStorage.getItem('lastActiveCampaign');
      
      if (lastCampaignId) {
        await this.loadCampaign(parseInt(lastCampaignId));
      } else {
        // Load default campaign or create new one
        const campaigns = await this.getAllCampaigns();
        if (campaigns.length > 0) {
          await this.loadCampaign(campaigns[0].id);
        } else {
          await this.createCampaign('Default Campaign');
        }
      }

      // Start auto-save
      this.startAutoSave();
      
      return this.currentCampaignId;
    } catch (error) {
      console.error('Error initializing campaign manager:', error);
      throw error;
    }
  }

  /**
   * Get all campaigns
   */
  async getAllCampaigns() {
    try {
      const response = await fetch('/api/campaigns');
      if (!response.ok) {
        throw new Error(`Failed to fetch campaigns: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      throw error;
    }
  }

  /**
   * Create a new campaign
   */
  async createCampaign(name) {
    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create campaign');
      }

      const campaign = await response.json();
      this.currentCampaignId = campaign.id;
      localStorage.setItem('lastActiveCampaign', campaign.id);
      
      // Dispatch event for UI update
      window.dispatchEvent(new CustomEvent('campaignChanged', { 
        detail: { campaignId: campaign.id, campaign } 
      }));

      return campaign;
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  }

  /**
   * Load campaign (switch to different campaign)
   */
  async loadCampaign(campaignId) {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`);
      if (!response.ok) {
        throw new Error(`Failed to load campaign: ${response.statusText}`);
      }

      const campaign = await response.json();
      this.currentCampaignId = campaign.id;
      localStorage.setItem('lastActiveCampaign', campaign.id);

      // Dispatch event for UI update
      window.dispatchEvent(new CustomEvent('campaignChanged', { 
        detail: { campaignId: campaign.id, campaign } 
      }));

      return campaign;
    } catch (error) {
      console.error('Error loading campaign:', error);
      throw error;
    }
  }

  /**
   * Delete campaign
   */
  async deleteCampaign(campaignId) {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Failed to delete campaign: ${response.statusText}`);
      }

      // If we deleted the current campaign, switch to another
      if (campaignId === this.currentCampaignId) {
        const campaigns = await this.getAllCampaigns();
        if (campaigns.length > 0) {
          await this.loadCampaign(campaigns[0].id);
        } else {
          // Create a new default campaign
          await this.createCampaign('Default Campaign');
        }
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      throw error;
    }
  }

  /**
   * Export campaign to JSON
   */
  async exportCampaign(campaignId = null) {
    try {
      const id = campaignId || this.currentCampaignId;
      const response = await fetch(`/api/campaigns/${id}/state`);
      
      if (!response.ok) {
        throw new Error(`Failed to export campaign: ${response.statusText}`);
      }

      const state = await response.json();
      
      // Create downloadable JSON file
      const dataStr = JSON.stringify(state, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `siege-campaign-${state.campaign.name}-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return state;
    } catch (error) {
      console.error('Error exporting campaign:', error);
      throw error;
    }
  }

  /**
   * Import campaign from JSON
   */
  async importCampaign(fileOrData) {
    try {
      let stateData;

      if (typeof fileOrData === 'string') {
        stateData = JSON.parse(fileOrData);
      } else if (fileOrData instanceof File) {
        const text = await fileOrData.text();
        stateData = JSON.parse(text);
      } else {
        stateData = fileOrData;
      }

      const response = await fetch('/api/campaigns/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stateData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to import campaign');
      }

      const campaign = await response.json();
      
      // Switch to imported campaign
      await this.loadCampaign(campaign.id);

      return campaign;
    } catch (error) {
      console.error('Error importing campaign:', error);
      throw error;
    }
  }

  /**
   * Manual save (touch campaign to update timestamp)
   */
  async save() {
    try {
      if (!this.currentCampaignId) {
        console.warn('No active campaign to save');
        return;
      }

      const response = await fetch(`/api/campaigns/${this.currentCampaignId}/touch`, {
        method: 'PUT'
      });

      if (!response.ok) {
        throw new Error(`Failed to save campaign: ${response.statusText}`);
      }

      const campaign = await response.json();
      
      // Dispatch event for UI feedback
      window.dispatchEvent(new CustomEvent('campaignSaved', { 
        detail: { campaignId: campaign.id, campaign } 
      }));

      return campaign;
    } catch (error) {
      console.error('Error saving campaign:', error);
      throw error;
    }
  }

  /**
   * Mark that data has been modified (triggers auto-save)
   */
  markModified() {
    this.lastModification = Date.now();
  }

  /**
   * Start auto-save interval
   */
  startAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    this.autoSaveInterval = setInterval(async () => {
      if (this.lastModification && Date.now() - this.lastModification >= this.autoSaveDelay) {
        try {
          await this.save();
          this.lastModification = null;
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }
    }, 5000); // Check every 5 seconds
  }

  /**
   * Stop auto-save
   */
  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  /**
   * Reset/create new campaign
   */
  async resetCampaign() {
    try {
      const name = prompt('Enter name for new campaign:', 'New Campaign');
      if (!name) return null;

      return await this.createCampaign(name);
    } catch (error) {
      console.error('Error resetting campaign:', error);
      throw error;
    }
  }

  /**
   * Get current campaign ID
   */
  getCurrentCampaignId() {
    return this.currentCampaignId;
  }
}

// Export singleton instance
const campaignManager = new CampaignManager();
window.campaignManager = campaignManager;
