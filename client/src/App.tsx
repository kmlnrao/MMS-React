// Simple test app to verify the setup is working
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    console.log('App component mounted');
    
    // Test API endpoint
    fetch('/api/user')
      .then(response => {
        console.log('API response status:', response.status);
        return response.json().catch(() => null);
      })
      .then(data => {
        console.log('API response data:', data);
      })
      .catch(error => {
        console.error('API request error:', error);
      });
  }, []);

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Mortuary Management System</h1>
      <p>If you can see this, the frontend is loading correctly!</p>
      <p>This is a simplified app for testing.</p>
      <p>Check the browser console for diagnostic logs.</p>
    </div>
  );
}

export default App;
