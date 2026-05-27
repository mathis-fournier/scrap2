import { useState } from 'react'
import './App.css'
import Panel from './components/Panel'
import { Toaster } from 'sonner';
function App() {
  return (
    <>
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          className: 'bg-neutral-900 border border-neutral-800 text-white rounded-xl shadow-2xl font-sans',
        }}
      />
      <Panel />
    </>
  )
}

export default App;