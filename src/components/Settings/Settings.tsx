import React from 'react';
import ParentalControlSettings from '../ParentalControls/ParentalControlSettings';

const Settings: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>
      
      {/* Parental Controls Section */}
      <section className="mb-8">
        <ParentalControlSettings />
      </section>

      {/* Other settings sections can be added here */}
    </div>
  );
};

export default Settings; 