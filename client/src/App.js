import React from 'react';

const App = () => {
  const error = null; //if socket fails, throw
  if (error) return (
    <div>error.message</div>
  );
  
  return (
    <div>Testing! Is this thing on?</div>
  )
}

export default App;
