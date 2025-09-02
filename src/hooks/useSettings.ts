import { useState, useEffect } from "react";

interface Settings {
  company_name?: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  company_website?: string;
  tax_rate?: string;
  currency?: string;
  receipt_footer?: string;
  low_stock_threshold?: string;
  enable_notifications?: boolean;
  auto_backup?: boolean;
  theme_color?: string;
  enable_tax?: boolean;
}

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        const settingsObj: Settings = {};
        data.forEach((setting: any) => {
          if (setting.key === 'enable_notifications' || setting.key === 'auto_backup' || setting.key === 'enable_tax') {
            (settingsObj as any)[setting.key] = setting.value === 'true';
          } else {
            (settingsObj as any)[setting.key] = setting.value;
          }
        });
        setSettings(settingsObj);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSetting = (key: keyof Settings, defaultValue: any = null) => {
    return settings[key] ?? defaultValue;
  };

  const updateSetting = async (key: string, value: string) => {
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, value }),
      });

      if (response.ok) {
        await fetchSettings(); // Refresh settings
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du paramètre:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    getSetting,
    updateSetting,
    refetch: fetchSettings,
  };
};
