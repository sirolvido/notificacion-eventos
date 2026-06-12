import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Register from './pages/Register'
import Admin from './pages/Admin'
import Verify from './pages/Verify'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/verify" element={<Verify />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
