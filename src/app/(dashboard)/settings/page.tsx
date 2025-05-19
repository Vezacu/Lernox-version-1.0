"use client";
import { useTheme } from '@/lib/ThemeContext';
import Image from 'next/image';

const Settings = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="p-6 h-full">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Appearance</h2>
        
        <div className="flex items-center justify-between py-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-3">
            {theme === 'light' ? (
              <Image src="/light-mode-icon.png" alt="Light Mode" width={24} height={24} />
            ) : (
              <Image src="/dark-mode-icon.png" alt="Dark Mode" width={24} height={24} />
            )}
            <span className="font-medium">Dark Mode</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={theme === 'dark'}
              onChange={toggleTheme}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>
        
        {/* Placeholder for additional settings */}
        <div className="flex items-center justify-between py-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Image src="/collaboration-icon.png" alt="Collaboration" width={24} height={24} />
            <span className="font-medium">Notifications</span>
          </div>
          <span className="text-gray-500 dark:text-gray-400">Configure in Notifications tab</span>
        </div>
        
        <div className="flex items-center justify-between py-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Image src="/innovation-icon.png" alt="Innovation" width={24} height={24} />
            <span className="font-medium">Language</span>
          </div>
          <select className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white">
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
          </select>
        </div>
        
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Image src="/sustainability-icon.png" alt="Sustainability" width={24} height={24} />
            <span className="font-medium">Accessibility</span>
          </div>
          <div className="flex items-center">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;