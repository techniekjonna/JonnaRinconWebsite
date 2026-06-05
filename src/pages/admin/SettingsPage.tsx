import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Store, Bell, Shield, Save, Megaphone, Eye, EyeOff, Plus, Trash2, Music2, X, ChevronUp, ChevronDown, Image } from 'lucide-react';
import { settingsService, ShopSettings, GeneralSettings, NotificationSettings, SecuritySettings } from '../../lib/firebase/services/settingsService';
import { promoSectionService, PromoSectionData, PromoButton } from '../../lib/firebase/services/promoSectionService';
import { useTracks } from '../../hooks/useTracks';
import { fileUploadService } from '../../lib/firebase/services';

const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'shop' | 'notifications' | 'security' | 'promo'>('shop');
  const [loading, setLoading] = useState(true);
  const [shopSettings, setShopSettings] = useState<ShopSettings>({
    storeName: '',
    storeDescription: '',
    heroTitle: '',
    heroSubtitle: '',
    featuredEnabled: true,
    trendingEnabled: true,
    genres: [],
    currency: 'EUR',
    taxRate: 21,
    enableDownloads: true,
    watermarkPreviews: true,
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailOrderNotifications: true,
    emailCollaborationNotifications: true,
    emailAnalyticsReports: false,
    emailSecurityAlerts: true,
    emailNewFeatures: false,
    pushNotifications: true,
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    passwordMinLength: 12,
    sessionTimeout: 30,
    enableAutoBackup: true,
    backupFrequency: 'daily',
  });

  const [promoSettings, setPromoSettings] = useState<PromoSectionData>({
    enabled: false,
    upperTitle: '',
    title: '',
    subtitle: '',
    images: [],
    buttons: [],
    trackId: '',
    trackTitle: '',
    trackArtist: '',
    trackAudioUrl: '',
    trackArtworkUrl: '',
  });
  const [promoLoaded, setPromoLoaded] = useState(false);
  const [promoImageUrl, setPromoImageUrl] = useState('');
  const [promoImageUploading, setPromoImageUploading] = useState(false);
  const [trackSearch, setTrackSearch] = useState('');
  const [showTrackSearch, setShowTrackSearch] = useState(false);
  const { tracks: allTracks } = useTracks({ status: 'published' });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const [shopData, notificationData, securityData] = await Promise.all([
          settingsService.getShopSettings(),
          settingsService.getNotificationSettings(),
          settingsService.getSecuritySettings(),
        ]);

        if (shopData) setShopSettings(shopData);
        if (notificationData) setNotificationSettings(notificationData);
        if (securityData) setSecuritySettings(securityData);
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'promo' && !promoLoaded) {
      promoSectionService.get().then((data) => {
        setPromoSettings(data);
        setPromoLoaded(true);
      });
    }
  }, [activeTab, promoLoaded]);

  const handleSaveShopSettings = async () => {
    try {
      await settingsService.saveShopSettings(shopSettings);
      setMessage({ type: 'success', text: 'Shop settings saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save shop settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    }
  };

  const handleSaveNotificationSettings = async () => {
    try {
      await settingsService.saveNotificationSettings(notificationSettings);
      setMessage({ type: 'success', text: 'Notification settings saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    }
  };

  const handleSavePromoSettings = async () => {
    try {
      await promoSectionService.save(promoSettings);
      setMessage({ type: 'success', text: 'Promo section saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save promo settings:', error);
      setMessage({ type: 'error', text: 'Failed to save promo section. Please try again.' });
    }
  };

  const addPromoButton = () => {
    const newBtn: PromoButton = {
      id: Date.now().toString(),
      label: 'Button',
      url: '/',
      variant: 'primary',
    };
    setPromoSettings((p) => ({ ...p, buttons: [...(p.buttons ?? []), newBtn] }));
  };

  const updatePromoButton = (id: string, field: keyof PromoButton, value: string) => {
    setPromoSettings((p) => ({
      ...p,
      buttons: (p.buttons ?? []).map((b) => (b.id === id ? { ...b, [field]: value } : b)),
    }));
  };

  const removePromoButton = (id: string) => {
    setPromoSettings((p) => ({ ...p, buttons: (p.buttons ?? []).filter((b) => b.id !== id) }));
  };

  const movePromoButton = (id: string, dir: -1 | 1) => {
    setPromoSettings((p) => {
      const btns = [...(p.buttons ?? [])];
      const idx = btns.findIndex((b) => b.id === id);
      if (idx < 0) return p;
      const target = idx + dir;
      if (target < 0 || target >= btns.length) return p;
      [btns[idx], btns[target]] = [btns[target], btns[idx]];
      return { ...p, buttons: btns };
    });
  };

  const addPromoImageUrl = () => {
    const url = promoImageUrl.trim();
    if (!url) return;
    setPromoSettings((p) => ({ ...p, images: [...(p.images ?? []), url] }));
    setPromoImageUrl('');
  };

  const handlePromoImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPromoImageUploading(true);
    try {
      const res = await fileUploadService.uploadImage(file, 'promo');
      if (res.success && res.url) {
        setPromoSettings((p) => ({ ...p, images: [...(p.images ?? []), res.url!] }));
      } else {
        setMessage({ type: 'error', text: res.error || 'Image upload failed' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Image upload failed' });
    } finally {
      setPromoImageUploading(false);
      e.target.value = '';
    }
  };

  const removePromoImage = (idx: number) => {
    setPromoSettings((p) => ({ ...p, images: (p.images ?? []).filter((_, i) => i !== idx) }));
  };

  const movePromoImage = (idx: number, dir: -1 | 1) => {
    setPromoSettings((p) => {
      const imgs = [...(p.images ?? [])];
      const target = idx + dir;
      if (target < 0 || target >= imgs.length) return p;
      [imgs[idx], imgs[target]] = [imgs[target], imgs[idx]];
      return { ...p, images: imgs };
    });
  };

  const selectPromoTrack = (track: any) => {
    setPromoSettings((p) => ({
      ...p,
      trackId: track.id,
      trackTitle: track.title,
      trackArtist: track.artist || 'Jonna Rincon',
      trackAudioUrl: track.audioUrl || '',
      trackArtworkUrl: track.artworkUrl || '',
    }));
    setShowTrackSearch(false);
    setTrackSearch('');
  };

  const clearPromoTrack = () => {
    setPromoSettings((p) => ({
      ...p,
      trackId: '',
      trackTitle: '',
      trackArtist: '',
      trackAudioUrl: '',
      trackArtworkUrl: '',
    }));
  };

  const filteredTracks = allTracks.filter((t) =>
    t.title?.toLowerCase().includes(trackSearch.toLowerCase()) ||
    t.artist?.toLowerCase().includes(trackSearch.toLowerCase())
  );

  const handleSaveSecuritySettings = async () => {
    try {
      await settingsService.saveSecuritySettings(securitySettings);
      setMessage({ type: 'success', text: 'Security settings saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save security settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    }
  };

  const tabs = [
    { id: 'shop' as const, name: 'Shop Settings', icon: Store },
    { id: 'notifications' as const, name: 'Notifications', icon: Bell },
    { id: 'security' as const, name: 'Security', icon: Shield },
    { id: 'promo' as const, name: 'Promo Section', icon: Megaphone },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-white/40 mt-2">Manage your platform configuration and preferences</p>
        </div>

        {loading && (
          <div className="bg-blue-900/20 border border-blue-700 rounded-xl p-4">
            <p className="text-blue-300">Loading settings...</p>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-4">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'text-white/40 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  <span className="font-medium">{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`p-4 rounded-lg border ${
              message.type === 'success'
                ? 'bg-green-900/20 border-green-700 text-green-400'
                : 'bg-red-900/20 border-red-700 text-red-400'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Shop Settings Tab */}
        {activeTab === 'shop' && (
          <div className="space-y-6">
            {/* Shop Features */}
            <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Shop Features</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/[0.06] rounded-lg">
                  <div>
                    <p className="font-medium text-white">Featured Beats</p>
                    <p className="text-sm text-white/40">Show featured badge on selected beats</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shopSettings.featuredEnabled}
                      onChange={(e) =>
                        setShopSettings({ ...shopSettings, featuredEnabled: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/[0.08] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/20 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/[0.06] rounded-lg">
                  <div>
                    <p className="font-medium text-white">Trending Beats</p>
                    <p className="text-sm text-white/40">Show trending badge on popular beats</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shopSettings.trendingEnabled}
                      onChange={(e) =>
                        setShopSettings({ ...shopSettings, trendingEnabled: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/[0.08] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/20 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/[0.06] rounded-lg">
                  <div>
                    <p className="font-medium text-white">Enable Downloads</p>
                    <p className="text-sm text-white/40">Allow customers to download purchased beats</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shopSettings.enableDownloads}
                      onChange={(e) =>
                        setShopSettings({ ...shopSettings, enableDownloads: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/[0.08] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/20 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/[0.06] rounded-lg">
                  <div>
                    <p className="font-medium text-white">Watermark Previews</p>
                    <p className="text-sm text-white/40">Add watermark to preview audio files</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shopSettings.watermarkPreviews}
                      onChange={(e) =>
                        setShopSettings({ ...shopSettings, watermarkPreviews: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/[0.08] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/20 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Payment Settings */}
            <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Payment Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    Currency
                  </label>
                  <select
                    value={shopSettings.currency}
                    onChange={(e) =>
                      setShopSettings({ ...shopSettings, currency: e.target.value })
                    }
                    className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    value={shopSettings.taxRate}
                    onChange={(e) =>
                      setShopSettings({ ...shopSettings, taxRate: parseFloat(e.target.value) })
                    }
                    className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSaveShopSettings}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-6 py-3 rounded-lg text-white font-medium transition-all"
              >
                <Save size={20} />
                Save Shop Settings
              </button>
            </div>
          </div>
        )}

        {/* Notifications Settings Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Bell size={24} className="text-yellow-400" />
                Notification Settings
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/[0.06] rounded-lg">
                  <div>
                    <p className="font-medium text-white">Email on New Orders</p>
                    <p className="text-sm text-white/40">Get notified when customers place orders</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.emailOrderNotifications}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          emailOrderNotifications: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/[0.08] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/20 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/[0.06] rounded-lg">
                  <div>
                    <p className="font-medium text-white">Email on Collaborations</p>
                    <p className="text-sm text-white/40">Get notified about collaboration requests</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.emailCollaborationNotifications}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          emailCollaborationNotifications: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/[0.08] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/20 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/[0.06] rounded-lg">
                  <div>
                    <p className="font-medium text-white">Email Analytics Reports</p>
                    <p className="text-sm text-white/40">Receive weekly analytics reports</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.emailAnalyticsReports}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          emailAnalyticsReports: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/[0.08] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/20 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/[0.06] rounded-lg">
                  <div>
                    <p className="font-medium text-white">Email Security Alerts</p>
                    <p className="text-sm text-white/40">Important security notifications</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.emailSecurityAlerts}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          emailSecurityAlerts: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/[0.08] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/20 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/[0.06] rounded-lg">
                  <div>
                    <p className="font-medium text-white">Email New Features</p>
                    <p className="text-sm text-white/40">Learn about new features and updates</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.emailNewFeatures}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          emailNewFeatures: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/[0.08] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/20 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/[0.06] rounded-lg">
                  <div>
                    <p className="font-medium text-white">Push Notifications</p>
                    <p className="text-sm text-white/40">Receive browser push notifications</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.pushNotifications}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          pushNotifications: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/[0.08] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/20 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveNotificationSettings}
                className="flex items-center gap-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 px-6 py-3 rounded-lg text-white font-medium transition-all"
              >
                <Save size={20} />
                Save Notification Settings
              </button>
            </div>
          </div>
        )}

        {/* Security Settings Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Shield size={24} className="text-red-400" />
                Security Settings
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/[0.06] rounded-lg">
                  <div>
                    <p className="font-medium text-white">Two-Factor Authentication</p>
                    <p className="text-sm text-white/40">Require 2FA for admin accounts</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={securitySettings.twoFactorEnabled}
                      onChange={(e) =>
                        setSecuritySettings({
                          ...securitySettings,
                          twoFactorEnabled: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/[0.08] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/20 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    Minimum Password Length
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="8"
                      max="20"
                      value={securitySettings.passwordMinLength}
                      onChange={(e) =>
                        setSecuritySettings({
                          ...securitySettings,
                          passwordMinLength: parseInt(e.target.value),
                        })
                      }
                      className="flex-1 h-2 bg-white/[0.06] rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-white font-medium w-12 text-center">
                      {securitySettings.passwordMinLength}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    Session Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="480"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        sessionTimeout: parseInt(e.target.value),
                      })
                    }
                    className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500"
                  />
                  <p className="text-xs text-white/40 mt-1">
                    Users will be logged out after this period of inactivity
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/[0.06] rounded-lg">
                  <div>
                    <p className="font-medium text-white">Enable Auto Backup</p>
                    <p className="text-sm text-white/40">Automatically backup database daily</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={securitySettings.enableAutoBackup}
                      onChange={(e) =>
                        setSecuritySettings({
                          ...securitySettings,
                          enableAutoBackup: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/[0.08] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/20 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    Backup Frequency
                  </label>
                  <select
                    value={securitySettings.backupFrequency}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        backupFrequency: e.target.value,
                      })
                    }
                    className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-700 rounded-xl p-4">
              <p className="text-sm text-blue-300">
                💡 <strong>Tip:</strong> Strong security settings protect your platform and user data. We recommend enabling 2FA and auto-backups.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveSecuritySettings}
                className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 px-6 py-3 rounded-lg text-white font-medium transition-all"
              >
                <Save size={20} />
                Save Security Settings
              </button>
            </div>
          </div>
        )}

        {/* Promo Section Tab */}
        {activeTab === 'promo' && (
          <div className="space-y-6">

            {/* Enable/Disable toggle */}
            <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Megaphone size={20} className="text-red-400" />
                    Homepage Promo Section
                  </h2>
                  <p className="text-sm text-white/40 mt-1">
                    Show a promotional section on the homepage between the explore cards and the music preview.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-6 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={promoSettings.enabled}
                    onChange={(e) => setPromoSettings({ ...promoSettings, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-white/[0.08] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-7 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/20 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
              {promoSettings.enabled ? (
                <div className="mt-4 flex items-center gap-2 text-sm text-green-400">
                  <Eye size={14} /> Section is <strong>visible</strong> on the homepage
                </div>
              ) : (
                <div className="mt-4 flex items-center gap-2 text-sm text-white/30">
                  <EyeOff size={14} /> Section is <strong>hidden</strong> — toggle on to show it
                </div>
              )}
            </div>

            {/* Text Content */}
            <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-6 space-y-5">
              <h3 className="text-lg font-bold text-white">Text Content</h3>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Upper Label <span className="text-red-400 text-xs">(shown in red, uppercase)</span>
                </label>
                <input
                  type="text"
                  value={promoSettings.upperTitle}
                  onChange={(e) => setPromoSettings({ ...promoSettings, upperTitle: e.target.value })}
                  placeholder="e.g. New Release · Out Now"
                  maxLength={60}
                  className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Title</label>
                <input
                  type="text"
                  value={promoSettings.title}
                  onChange={(e) => setPromoSettings({ ...promoSettings, title: e.target.value })}
                  placeholder="e.g. New EP — Available Now"
                  maxLength={80}
                  className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Subtitle / Description</label>
                <textarea
                  value={promoSettings.subtitle}
                  onChange={(e) => setPromoSettings({ ...promoSettings, subtitle: e.target.value })}
                  placeholder="A short description or promo text..."
                  rows={3}
                  maxLength={300}
                  className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-red-500 resize-none transition-colors"
                />
                <p className="text-xs text-white/25 mt-1 text-right">{promoSettings.subtitle.length}/300</p>
              </div>
            </div>

            {/* Buttons */}
            <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Buttons / Links</h3>
                <button
                  onClick={addPromoButton}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Plus size={14} /> Add Button
                </button>
              </div>

              {(promoSettings.buttons ?? []).length === 0 && (
                <p className="text-white/30 text-sm italic">No buttons added yet.</p>
              )}

              <div className="space-y-3">
                {(promoSettings.buttons ?? []).map((btn, idx) => (
                  <div key={btn.id} className="flex items-center gap-2 p-3 bg-white/[0.04] border border-white/[0.06] rounded-lg">
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => movePromoButton(btn.id, -1)} disabled={idx === 0} className="text-white/30 hover:text-white disabled:opacity-20 transition-colors"><ChevronUp size={14} /></button>
                      <button onClick={() => movePromoButton(btn.id, 1)} disabled={idx === (promoSettings.buttons ?? []).length - 1} className="text-white/30 hover:text-white disabled:opacity-20 transition-colors"><ChevronDown size={14} /></button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.6fr_auto] gap-2 flex-1">
                      <input
                        type="text"
                        value={btn.label}
                        onChange={(e) => updatePromoButton(btn.id, 'label', e.target.value)}
                        placeholder="Label"
                        className="bg-white/[0.06] border border-white/[0.08] rounded px-3 py-1.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-500"
                      />
                      <input
                        type="text"
                        value={btn.url}
                        onChange={(e) => updatePromoButton(btn.id, 'url', e.target.value)}
                        placeholder="URL, e.g. /catalogue"
                        className="bg-white/[0.06] border border-white/[0.08] rounded px-3 py-1.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-500"
                      />
                      <select
                        value={btn.variant}
                        onChange={(e) => updatePromoButton(btn.id, 'variant', e.target.value)}
                        className="bg-white/[0.06] border border-white/[0.08] rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-red-500"
                      >
                        <option value="primary">Primary (red)</option>
                        <option value="secondary">Secondary (outline)</option>
                      </select>
                    </div>
                    <button onClick={() => removePromoButton(btn.id)} className="p-1.5 hover:bg-red-500/20 rounded text-red-400/60 hover:text-red-400 transition-colors flex-shrink-0">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Images */}
            <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Image size={18} className="text-white/50" />
                Images
                <span className="text-xs text-white/25 font-normal">— shown as carousel if multiple</span>
              </h3>

              {/* Existing images */}
              {(promoSettings.images ?? []).length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {(promoSettings.images ?? []).map((url, idx) => (
                    <div key={idx} className="relative group aspect-square bg-white/[0.04] border border-white/[0.06] rounded-lg overflow-hidden">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button onClick={() => movePromoImage(idx, -1)} disabled={idx === 0} className="w-7 h-7 bg-white/20 hover:bg-white/40 flex items-center justify-center rounded disabled:opacity-30 transition-colors">
                          <ChevronUp size={13} className="text-white" />
                        </button>
                        <button onClick={() => removePromoImage(idx)} className="w-7 h-7 bg-red-600/80 hover:bg-red-600 flex items-center justify-center rounded transition-colors">
                          <Trash2 size={12} className="text-white" />
                        </button>
                        <button onClick={() => movePromoImage(idx, 1)} disabled={idx === (promoSettings.images ?? []).length - 1} className="w-7 h-7 bg-white/20 hover:bg-white/40 flex items-center justify-center rounded disabled:opacity-30 transition-colors">
                          <ChevronDown size={13} className="text-white" />
                        </button>
                      </div>
                      {idx === 0 && (
                        <span className="absolute top-1.5 left-1.5 text-[9px] font-bold uppercase tracking-wider bg-red-600 text-white px-1.5 py-0.5 rounded">1st</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add by URL */}
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Add image by URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoImageUrl}
                    onChange={(e) => setPromoImageUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addPromoImageUrl()}
                    placeholder="https://..."
                    className="flex-1 bg-white/[0.06] border border-white/[0.08] rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-500"
                  />
                  <button
                    onClick={addPromoImageUrl}
                    disabled={!promoImageUrl.trim()}
                    className="px-4 py-2.5 bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-40"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Upload file */}
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Or upload a file</label>
                <label className="flex items-center gap-3 cursor-pointer px-4 py-3 bg-white/[0.04] border border-dashed border-white/[0.15] hover:border-white/30 rounded-lg transition-colors">
                  <Image size={16} className="text-white/40 flex-shrink-0" />
                  <span className="text-white/40 text-sm">
                    {promoImageUploading ? 'Uploading...' : 'Click to upload (PNG, JPG, WebP — max 10MB)'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePromoImageFileChange}
                    disabled={promoImageUploading}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Track */}
            <div className="bg-white/[0.08] border border-white/[0.06] rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Music2 size={18} className="text-white/50" />
                Featured Track
                <span className="text-xs text-white/25 font-normal">— optional, requires login to play</span>
              </h3>

              {promoSettings.trackId ? (
                <div className="flex items-center gap-3 p-3 bg-white/[0.04] border border-white/[0.08] rounded-lg">
                  {promoSettings.trackArtworkUrl && (
                    <img src={promoSettings.trackArtworkUrl} alt="" className="w-10 h-10 object-cover flex-shrink-0 rounded" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate">{promoSettings.trackTitle}</p>
                    <p className="text-white/40 text-xs truncate">{promoSettings.trackArtist}</p>
                  </div>
                  <button onClick={clearPromoTrack} className="flex-shrink-0 p-1.5 hover:bg-red-500/20 rounded text-red-400/60 hover:text-red-400 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <p className="text-white/30 text-sm italic">No track selected.</p>
              )}

              {/* Track search */}
              <div>
                <button
                  onClick={() => setShowTrackSearch((v) => !v)}
                  className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
                >
                  <Music2 size={14} />
                  {showTrackSearch ? 'Hide track search' : 'Search & select a track'}
                </button>
              </div>

              {showTrackSearch && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={trackSearch}
                    onChange={(e) => setTrackSearch(e.target.value)}
                    placeholder="Search by title or artist..."
                    className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-500"
                    autoFocus
                  />
                  <div className="max-h-56 overflow-y-auto space-y-1 rounded-lg border border-white/[0.06] bg-black/30">
                    {filteredTracks.length === 0 && (
                      <p className="text-white/30 text-sm p-4 text-center">No published tracks found.</p>
                    )}
                    {filteredTracks.map((track) => (
                      <button
                        key={track.id}
                        onClick={() => selectPromoTrack(track)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.07] transition-colors text-left"
                      >
                        {track.artworkUrl && (
                          <img src={track.artworkUrl} alt="" className="w-8 h-8 object-cover rounded flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{track.title}</p>
                          <p className="text-white/35 text-xs truncate">{track.artist}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Save */}
            <div className="flex justify-end">
              <button
                onClick={handleSavePromoSettings}
                className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 px-6 py-3 rounded-lg text-white font-medium transition-all"
              >
                <Save size={20} />
                Save Promo Section
              </button>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
