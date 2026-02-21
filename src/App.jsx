import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import DashboardSemanal from './pages/DashboardSemanal'
import MotorSimulador from './pages/MotorSimulador'
import ResultadosFeedback from './pages/ResultadosFeedback'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardSemanal />} />
        <Route path="/simulador" element={<MotorSimulador />} />
        <Route path="/resultados" element={<ResultadosFeedback />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
