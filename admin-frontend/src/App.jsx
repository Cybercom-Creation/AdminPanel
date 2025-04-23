


import React from 'react';
import ExportButton from './ExportButton';
import DownloadButton from './DownloadButton'; // Import the new component

import '../public/App.css';

function App() {
  return (
    <div>
     
      <main style={{ padding: '0 20px' }}>
        {/* Render both components */}
        <ExportButton />
        <DownloadButton />
      </main>
      
    </div>
  );
}

export default App;
